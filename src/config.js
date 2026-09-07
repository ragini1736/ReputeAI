import 'dotenv/config';

export const PORT = process.env.PORT || 3000;

export const SUPABASE_URL =
  process.env.SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY;

export const JWT_SECRET =
  process.env.JWT_SECRET;

if (
  !SUPABASE_URL ||
  !SUPABASE_ANON_KEY ||
  !JWT_SECRET
) {
  console.warn(
    'Missing environment variables'
  );
}