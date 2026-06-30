import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouter, selectModel, estimateModelCost } from '@/lib/openrouter';
import { estimateCost, getSubscription, canAffordJob } from '@/lib/billing';

// Load HART.md as the system prompt
let HART_CONTENT = '';
try {
  HART_CONTENT = readFileSync(
    path.join(process.cwd(), '../../.skills/more-of-less-core/HART.md'),
    'utf-8'
  );
} catch {
  HART_CONTENT = 'You are the More-of-Less agent, a personal AI studio for creators.';
}

type ToolInput = Record<string, unknown>;

// Tool definitions
const AGENT_TOOLS = [
  {
    name: 'create_job',
    description: 'Create a media processing job (audio mastering, stem separation, video generation, etc.)',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['audio_master', 'stem_sep', 'audio_analyze', 'music_gen', 'video_gen', 'image_gen', 'clip_extract', 'caption_gen'],
          description: 'Type of job to create',
        },
        projectId: { type: 'string', description: 'Project ID (use "default" if unknown)' },
        inputAssetId: { type: 'string', description: 'Optional ID of asset to process' },
        params: { type: 'object', description: 'Job-specific parameters' },
      },
      required: ['type', 'projectId'],
    },
  },
  {
    name: 'list_recent_jobs',
    description: 'List user\'s recent jobs and their status',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max jobs to return (default 5)' },
      },
    },
  },
  {
    name: 'list_characters',
    description: 'List user\'s character passports',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_character',
    description: 'Create a new character passport for consistent AI character generation',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Character name' },
        appearance: { type: 'string', description: 'Character appearance description' },
        voiceId: { type: 'string', description: 'Optional 11Labs voice ID' },
      },
      required: ['name', 'appearance'],
    },
  },
  {
    name: 'get_character',
    description: 'Get detailed character data for use in video generation',
    input_schema: {
      type: 'object' as const,
      properties: {
        characterId: { type: 'string', description: 'Character ID' },
      },
      required: ['characterId'],
    },
  },
  {
    name: 'analyze_audio',
    description: 'Analyze audio file: BPM, key, energy, structure',
    input_schema: {
      type: 'object' as const,
      properties: {
        assetId: { type: 'string', description: 'Audio asset ID to analyze' },
      },
      required: ['assetId'],
    },
  },
  {
    name: 'get_credits',
    description: 'Check current usage and credits remaining',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'get_projects',
    description: 'List user\'s projects',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max projects to return (default 10)' },
      },
    },
  },
];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, history = [] } = await request.json();

  try {
    // Get user's subscription and language
    const subscription = await getSubscription(supabase, user.id);
    const userLanguage = (
      await supabase.from('mol_profiles').select('language').eq('id', user.id).single()
    ).data?.language || 'en';

    // Select optimal model based on user tier
    const userTier = subscription.plan.name as 'free' | 'creator' | 'studio' | 'professional';
    const selectedModel = selectModel(userTier, true);

    const systemPrompt = `${HART_CONTENT}

User language: ${userLanguage}. Always reply in the user's language.
User tier: ${userTier}
Credits remaining: $${subscription.credits_remaining.toFixed(2)}
Monthly spend: $${subscription.monthly_usage_usd.toFixed(2)} of $${subscription.plan.credits_monthly}

Always be concise (1-3 sentences). When creating a job, confirm what you're doing and the estimated cost.
If user is out of credits, suggest an upgrade.`;

    const messages = [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Call OpenRouter with tool support
    const response = await callOpenRouter(selectedModel, messages, systemPrompt, AGENT_TOOLS);

    // Parse response and execute tools if needed
    let reply = response.content;
    let toolResult = null;

    // Simple tool detection (for open-source models without native tool support)
    if (reply.includes('[create_job]') || reply.includes('create_job')) {
      const match = reply.match(/type:\s*(\w+)|type":\s*"(\w+)"/);
      if (match) {
        const jobType = match[1] || match[2];
        toolResult = await executeToolSafely(
          'create_job',
          { type: jobType, projectId: 'default' },
          user.id,
          supabase,
          subscription
        );
        reply = `Created ${jobType} job. ${toolResult?.message || ''}`;
      }
    }

    // Log usage
    await supabase.from('mol_events').insert({
      user_id: user.id,
      event_type: 'agent_message',
      provider: selectedModel,
      cost_usd: response.costUsd,
      metadata: { tokens: 100 }, // Approximate
    });

    return NextResponse.json({
      reply,
      toolResult,
      model: selectedModel,
      costUsd: response.costUsd,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function executeToolSafely(
  toolName: string,
  input: ToolInput,
  userId: string,
  supabase: ReturnType<typeof createClient>,
  subscription: any
) {
  try {
    switch (toolName) {
      case 'create_job': {
        const { type, projectId, inputAssetId, params = {} } = input as any;
        if (!type || !projectId) throw new Error('type and projectId required');

        const estimatedCost = estimateCost(type, params);
        if (!canAffordJob(subscription, estimatedCost)) {
          return { error: 'Insufficient credits', costUsd: estimatedCost };
        }

        const { data: job } = await supabase
          .from('mol_jobs')
          .insert({
            user_id: userId,
            project_id: projectId,
            type,
            input_asset_id: inputAssetId ?? null,
            params,
            status: 'pending',
            progress: 0,
            cost_usd: estimatedCost,
          })
          .select()
          .single();

        // Dispatch to worker
        const workerUrl = process.env.ACESTEP_API_URL;
        if (workerUrl) {
          fetch(`${workerUrl}/mol/jobs/dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.WORKER_API_KEY ?? '' },
            body: JSON.stringify({ jobId: job.id, type, inputAssetId, params }),
          }).catch(() => {});
        }

        return { jobId: job.id, message: `Started ${type} job ($${estimatedCost.toFixed(2)})` };
      }

      case 'list_recent_jobs': {
        const { data: jobs } = await supabase
          .from('mol_jobs')
          .select('id, type, status, progress, cost_usd, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        return { jobs, message: `Found ${jobs?.length || 0} recent jobs.` };
      }

      case 'get_credits': {
        return {
          creditsRemaining: subscription.credits_remaining,
          monthlyUsage: subscription.monthly_usage_usd,
          planCredits: subscription.plan.credits_monthly,
        };
      }

      case 'list_characters': {
        const { data: chars } = await supabase
          .from('mol_characters')
          .select('id, name, appearance')
          .eq('user_id', userId)
          .limit(10);
        return { characters: chars, message: `You have ${chars?.length || 0} characters.` };
      }

      case 'get_projects': {
        const { data: projects } = await supabase
          .from('mol_projects')
          .select('id, name, total_cost_usd')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        return { projects, message: `Retrieved ${projects?.length || 0} projects.` };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Tool execution error';
    return { error: message };
  }
}
