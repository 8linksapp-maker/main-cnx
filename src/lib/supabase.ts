import { createBrowserClient } from '@supabase/ssr';

// Verifique se as variáveis de ambiente existem. No ambiente de build local as envs podem estar vindo do import.meta.env
// dependendo de como o Astro as carrega. Acessando primariamente as variáveis estáticas do Vite/Astro.
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
