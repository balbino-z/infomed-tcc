import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// true quando o .env está preenchido; senão o app usa os repositórios Mock
export const hasSupabase = Boolean(url && key);

// A chave "publishable" pode ficar no front-end: quem protege os dados é o RLS.
export const supabase = hasSupabase ? createClient(url!, key!) : null;
