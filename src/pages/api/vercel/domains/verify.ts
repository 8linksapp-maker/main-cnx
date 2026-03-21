import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../../lib/supabaseSSR';

export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return context.redirect('/login');
    }

    const formData = await context.request.formData();
    const projectId = formData.get('project_id')?.toString()?.trim();
    const integrationId = formData.get('integration_id')?.toString()?.trim();
    const domainName = formData.get('domain_name')?.toString()?.trim().toLowerCase();
    const redirectToRaw = formData.get('redirect_to')?.toString()?.trim();

    const getRedirectUrl = (params: Record<string, string>) => {
        let base = redirectToRaw || `/dashboard/sites/${projectId || ''}`;
        try {
            const url = new URL(base, 'http://localhost');
            if (!redirectToRaw) {
                if (integrationId) url.searchParams.set('integration', integrationId);
                url.hash = 'tab-domains';
                url.searchParams.set('tab', 'domains');
            }
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
            return url.pathname + url.search + url.hash;
        } catch {
            return base;
        }
    };

    if (!projectId || !integrationId || !domainName) {
        return context.redirect(getRedirectUrl({ error: 'Missing parameters' }));
    }

    // 1. Obter a chave da Vercel
    const { data: integration } = await supabase
        .from('integrations')
        .select('token')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

    if (!integration || !integration.token) {
        return context.redirect(getRedirectUrl({ error: 'Integracao Invalida' }));
    }

    // 2. Acionar Força de Verificação na API da Vercel
    try {
        const verifyResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domainName}/verify`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${integration.token}`,
                "Content-Type": "application/json"
            }
        });

        if (!verifyResponse.ok) {
            const err = await verifyResponse.json();
            return context.redirect(getRedirectUrl({ error: `Falha verificacao: ${err.error?.message || 'Erro Vercel'}` }));
        }

        // Se deu certo (Status 200 OK)
        return context.redirect(getRedirectUrl({ success: 'Domínio checado. Pode levar algumas horas para propagar globalmente.' }));
    } catch (e) {
        return context.redirect(getRedirectUrl({ error: 'Servidor Vercel Inacessivel' }));
    }
};
