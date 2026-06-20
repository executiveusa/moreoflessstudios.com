export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      mol_profiles: {
        Row: {
          id: string;
          email: string | null;
          language: string;
          budget_usd: number;
          monthly_spend_usd: number;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mol_profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['mol_profiles']['Insert']>;
      };
      mol_projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          language: string;
          metadata: Json;
          total_cost_usd: number;
          status: 'active' | 'archived' | 'deleted';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mol_projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['mol_projects']['Insert']>;
      };
      mol_assets: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: 'audio' | 'video' | 'image' | 'character' | 'stem';
          r2_key: string;
          filename: string;
          mime_type: string | null;
          size_bytes: number | null;
          duration_sec: number | null;
          metadata: Json;
          consent: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mol_assets']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['mol_assets']['Insert']>;
      };
      mol_jobs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: 'audio_master' | 'stem_sep' | 'audio_analyze' | 'music_gen' | 'video_gen' | 'image_gen' | 'clip_extract' | 'caption_gen';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          input_asset_id: string | null;
          output_asset_id: string | null;
          params: Json;
          result: Json | null;
          cost_usd: number;
          provider: string | null;
          progress: number;
          error: string | null;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['mol_jobs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['mol_jobs']['Insert']>;
      };
      mol_characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          appearance: string | null;
          style_lora: string | null;
          seed: number | null;
          voice_id: string | null;
          continuity_rules: Json;
          sample_asset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mol_characters']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['mol_characters']['Insert']>;
      };
      mol_agent_memory: {
        Row: {
          id: string;
          user_id: string;
          type: 'preference' | 'style' | 'project_insight' | 'recommendation';
          key: string;
          value: Json;
          confidence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['mol_agent_memory']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['mol_agent_memory']['Insert']>;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['mol_profiles']['Row'];
export type Project = Database['public']['Tables']['mol_projects']['Row'];
export type Asset = Database['public']['Tables']['mol_assets']['Row'];
export type Job = Database['public']['Tables']['mol_jobs']['Row'];
export type Character = Database['public']['Tables']['mol_characters']['Row'];
