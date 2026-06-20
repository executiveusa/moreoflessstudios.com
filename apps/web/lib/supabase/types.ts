export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
        Insert: {
          id: string;
          email?: string | null;
          language?: string;
          budget_usd?: number;
          monthly_spend_usd?: number;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          language?: string;
          budget_usd?: number;
          monthly_spend_usd?: number;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mol_projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          language: string;
          metadata: Json;
          total_cost_usd: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          language?: string;
          metadata?: Json;
          total_cost_usd?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          language?: string;
          metadata?: Json;
          total_cost_usd?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mol_assets: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: string;
          r2_key: string;
          filename: string;
          mime_type: string | null;
          size_bytes: number | null;
          duration_sec: number | null;
          metadata: Json;
          consent: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: string;
          r2_key: string;
          filename: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          duration_sec?: number | null;
          metadata?: Json;
          consent?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: string;
          r2_key?: string;
          filename?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          duration_sec?: number | null;
          metadata?: Json;
          consent?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      mol_jobs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          type: string;
          status: string;
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
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          type: string;
          status?: string;
          input_asset_id?: string | null;
          output_asset_id?: string | null;
          params?: Json;
          result?: Json | null;
          cost_usd?: number;
          provider?: string | null;
          progress?: number;
          error?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          type?: string;
          status?: string;
          input_asset_id?: string | null;
          output_asset_id?: string | null;
          params?: Json;
          result?: Json | null;
          cost_usd?: number;
          provider?: string | null;
          progress?: number;
          error?: string | null;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
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
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          appearance?: string | null;
          style_lora?: string | null;
          seed?: number | null;
          voice_id?: string | null;
          continuity_rules?: Json;
          sample_asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          appearance?: string | null;
          style_lora?: string | null;
          seed?: number | null;
          voice_id?: string | null;
          continuity_rules?: Json;
          sample_asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mol_agent_memory: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          key: string;
          value: Json;
          confidence: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          key: string;
          value: Json;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          key?: string;
          value?: Json;
          confidence?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database['public']['Tables']['mol_profiles']['Row'];
export type Project = Database['public']['Tables']['mol_projects']['Row'];
export type Asset = Database['public']['Tables']['mol_assets']['Row'];
export type Job = Database['public']['Tables']['mol_jobs']['Row'];
export type Character = Database['public']['Tables']['mol_characters']['Row'];
