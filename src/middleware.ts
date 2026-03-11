import { defineMiddleware } from 'astro:middleware';
import { verifySession, SESSION_COOKIE } from './utils/auth-utils';

const ADMIN_ONLY_PATHS = [
    '/admin/pixels',
    '/admin/analytics',
    '/admin/import',
    '/api/admin/singletons/pixels',
    '/api/admin/analytics',
    '/api/admin/import',
];

export const onRequest = defineMiddleware(async (context, next) => {
    const { pathname } = context.url;

    // O SaaS bloqueia o CMS. Redirecionar todas as rotas visuais de `/admin/*` para o contexto SaaS
    const isAdminUI = pathname.startsWith('/admin');
    const isAdminAPI = pathname.startsWith('/api/admin');

    // SaaS Auth Routes
    const isDashboard = pathname.startsWith('/dashboard');

    // Se for rota visual do Admin, bloqueia jogando pra home do SaaS
    if (isAdminUI) {
        return context.redirect('/');
    }

    // Se não for rota da CMS API e nem do Dashboard do SaaS, segue viagem
    if (!isAdminAPI && !isDashboard) return next();

    // Rotas públicas — nunca precisam de login
    if (
        pathname === '/admin/login' ||
        pathname === '/admin/setup' ||
        pathname.startsWith('/admin/login/') ||
        pathname.startsWith('/admin/setup/') ||
        pathname.startsWith('/api/admin/auth/')   // login, logout, setup
    ) {
        return next();
    }

    // --- 1. BLOQUEIOS SAAS (Rotas /dashboard) ---
    if (isDashboard) {
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
    }

    // --- 2. BLOQUEIOS CMS LOCAL (Rotas /api/admin e antigas /admin/) ---
    // Verificar cookie local (antigo) do CMS
    const token = context.cookies.get(SESSION_COOKIE)?.value ?? '';
    const user = token ? verifySession(token) : null;

    if (!user) {
        // Limpar cookie inválido
        if (token) context.cookies.delete(SESSION_COOKIE, { path: '/' });
        return isAdminAPI
            ? new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), {
                status: 401, headers: { 'Content-Type': 'application/json' },
            })
            : context.redirect('/admin/login');
    }

    // Controle por role (usando o role gravado na sessão)
    const isAdminOnly = ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p));
    if (isAdminOnly && user.adminRole !== 'admin') {
        return isAdminAPI
            ? new Response(JSON.stringify({ success: false, error: 'Permissão insuficiente' }), {
                status: 403, headers: { 'Content-Type': 'application/json' },
            })
            : context.redirect('/admin?error=permission');
    }

    // Expor usuário para as páginas/componentes
    context.locals.user = {
        slug: user.slug,
        name: user.name,
        adminRole: user.adminRole,
    };

    return next();
});
