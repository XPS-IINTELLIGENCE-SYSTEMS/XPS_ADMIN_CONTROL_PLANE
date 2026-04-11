import { createClient } from '@supabase/supabase-js';
import { getConnectionPrefs } from './connectionPrefs.js';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

let cachedClient = null;
let cachedSignature = '';
let warnedMissingConfig = false;

function getEnvVar(key) {
  return import.meta.env[`VITE_${key}`] || import.meta.env[key] || '';
}

export function getSupabaseConfig() {
  const connectionPrefs = typeof window !== 'undefined' ? getConnectionPrefs() : {};
  return {
    url: getEnvVar('SUPABASE_URL') || connectionPrefs.supabaseUrl || '',
    anonKey: getEnvVar('SUPABASE_ANON_KEY') || connectionPrefs.supabaseAnonKey || '',
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return !!(url && anonKey);
}

export function getSupabaseClient() {
  const { url, anonKey } = getSupabaseConfig();
  const signature = `${url}::${anonKey}`;

  if (cachedClient && cachedSignature === signature) {
    return cachedClient;
  }

  if (!url || !anonKey) {
    if (!warnedMissingConfig) {
      console.warn('[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY not set – auth/data disabled.');
      warnedMissingConfig = true;
    }
  }

  cachedClient = createClient(
    url || FALLBACK_SUPABASE_URL,
    anonKey || FALLBACK_SUPABASE_ANON_KEY,
  );
  cachedSignature = signature;
  return cachedClient;
}

export async function signUp(email, password) {
  const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithProvider(provider, redirectTo) {
  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    provider,
    options: redirectTo ? { redirectTo } : undefined,
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, redirectTo) {
  const { data, error } = await getSupabaseClient().auth.signInWithOtp({
    email,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}
