import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../../lib/supabaseSSR';

export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
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

    // Busca o Token Real na Base
    const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

    if (!integration) {
        return context.redirect(getRedirectUrl({ error: 'Integration not found' }));
    }

    try {
        // Envia requisição DELETE p/ Vercel
        const vRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domainName}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${integration.token}`
            }
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            throw new Error(errorData.error?.message || 'Erro ao remover domínio na Vercel');
        }

        return context.redirect(getRedirectUrl({ success: 'domain_removed' }));

    } catch (err: any) {
        return context.redirect(getRedirectUrl({ error: err.message }));
    }
};
