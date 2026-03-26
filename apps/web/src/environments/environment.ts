export const environment = {
  production: true,
  apiUrl: '/api',  // relativo — Vercel faz proxy para o Render
  supabaseUrl: (typeof process !== 'undefined'
    && process.env['NEXT_PUBLIC_SUPABASE_URL']) || '',
  supabaseAnonKey: (typeof process !== 'undefined'
    && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']) || '',
};
