import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerClient<Database, 'public', Database['public']>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — cookies will be set by middleware
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}

export function createAdminClient(): SupabaseClient<Database> {
  const cookieStore = cookies();
  return createServerClient<Database, 'public', Database['public']>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
