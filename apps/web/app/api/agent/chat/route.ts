import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { readFileSync } from 'fs';
import path from 'path';

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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_job',
    description: 'Create a media processing job for the user',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['audio_master', 'stem_sep', 'audio_analyze', 'music_gen', 'video_gen'],
          description: 'Job type to create',
        },
        projectId: { type: 'string', description: 'Project ID (use "default" if unknown)' },
        params: { type: 'object', description: 'Optional job parameters (style, mood, etc.)' },
      },
      required: ['type', 'projectId'],
    },
  },
  {
    name: 'list_recent_jobs',
    description: 'List the user\'s recent jobs and their status',
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
];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, history = [] } = await request.json();

  // Get user language preference
  const { data: profile } = await supabase
    .from('mol_profiles')
    .select('language, monthly_spend_usd, budget_usd')
    .eq('id', user.id)
    .single();

  const systemPrompt = `${HART_CONTENT}

User language: ${profile?.language ?? 'en'}. Always reply in the user's language.
Monthly spend: $${profile?.monthly_spend_usd ?? 0} of $${profile?.budget_usd ?? 5} budget.
Always be concise (1-3 sentences). When triggering a job, confirm what you're doing.`;

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    tools: AGENT_TOOLS,
    messages,
  });

  let reply = '';
  let toolResult = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      reply += block.text;
    } else if (block.type === 'tool_use') {
      toolResult = await executeAgentTool(block.name, block.input as Record<string, unknown>, user.id, supabase);
    }
  }

  if (!reply && toolResult) {
    reply = toolResult.message ?? 'Done.';
  }

  return NextResponse.json({ reply, toolResult });
}

async function executeAgentTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  supabase: ReturnType<typeof createClient>
) {
  if (toolName === 'create_job') {
    const { data: job } = await supabase
      .from('mol_jobs')
      .insert({
        user_id: userId,
        project_id: (input.projectId as string) ?? 'default',
        type: input.type as string,
        params: (input.params as Record<string, unknown>) ?? {},
        status: 'pending',
        progress: 0,
      })
      .select('id')
      .single();

    // Dispatch to worker
    const workerUrl = process.env.ACESTEP_API_URL;
    if (workerUrl && job) {
      fetch(`${workerUrl}/mol/jobs/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.WORKER_API_KEY ?? '' },
        body: JSON.stringify({ jobId: job.id, ...input }),
      }).catch(() => {});
    }

    return {
      type: 'job_created',
      jobId: job?.id,
      message: `Started ${input.type} job. Check the job list for progress.`,
    };
  }

  if (toolName === 'list_recent_jobs') {
    const { data: jobs } = await supabase
      .from('mol_jobs')
      .select('id, type, status, progress, cost_usd')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit((input.limit as number) ?? 5);

    return { type: 'job_list', jobs, message: `Found ${jobs?.length ?? 0} recent jobs.` };
  }

  if (toolName === 'list_characters') {
    const { data: chars } = await supabase
      .from('mol_characters')
      .select('id, name, appearance')
      .eq('user_id', userId);

    return { type: 'character_list', characters: chars, message: `You have ${chars?.length ?? 0} characters.` };
  }

  return null;
}
