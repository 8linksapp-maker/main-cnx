import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

    const isDashboard = pathname.startsWith('/dashboard');

    // Se não for rota do Dashboard, segue viagem
    if (!isDashboard) return next();

    // --- BLOQUEIOS SAAS (Rotas /dashboard) ---
    // Inicializa client SSR pra ler Cookies do header atual e validar JWT
    const { supabaseSSR } = await import('./lib/supabaseSSR');
    const supabase = supabaseSSR(context);

    const { data: { user: saasUser } } = await supabase.auth.getUser();

    if (!saasUser) {
        return context.redirect('/login');
    }

    // Passa adiante pras views
    context.locals.saasUser = saasUser;
    return next();
});
