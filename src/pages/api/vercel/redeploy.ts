import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../lib/supabaseSSR';

export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const formData = await context.request.formData();
    const projectId = formData.get('project_id')?.toString()?.trim();
    const integrationId = formData.get('integration_id')?.toString()?.trim();
    const deploymentId = formData.get('deployment_id')?.toString()?.trim();
    const redirectToRaw = formData.get('redirect_to')?.toString()?.trim();

    const getRedirectUrl = (params: Record<string, string>) => {
        let base = redirectToRaw || `/dashboard/sites/${projectId || ''}`;
        try {
            const url = new URL(base, 'http://localhost');
            if (!redirectToRaw) {
                if (integrationId) url.searchParams.set('integration', integrationId);
                url.hash = 'tab-deploys';
                url.searchParams.set('tab', 'deploys');
            }
            Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
            return url.pathname + url.search + url.hash;
        } catch {
            return base;
        }
    };

    if (!projectId || !integrationId || !deploymentId) {
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
        // Envia requisição POST p/ Vercel para forçar o redeploy
        // Endpoint Vercel API: POST /v13/deployments (com base num deploy antigo)
        const vRes = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${integration.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: formData.get('project_name')?.toString() || 'my-project',
                deploymentId: deploymentId, // Reutiliza código fonte do deploy anterior
                meta: {
                    action: 'redeploy_from_saas_dashboard'
                }
            })
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            throw new Error(errorData.error?.message || 'Erro na Vercel');
        }

        // Deu tudo certo, manda de volta pra pagina do projeto
        return context.redirect(getRedirectUrl({ success: 'redeploy_started' }));

    } catch (err: any) {
        return context.redirect(getRedirectUrl({ error: err.message }));
    }
};
