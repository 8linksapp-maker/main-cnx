import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../../lib/supabaseSSR';

export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const formData = await context.request.formData();
    const projectId = formData.get('project_id')?.toString();
    const integrationId = formData.get('integration_id')?.toString();
    const envId = formData.get('env_id')?.toString();

    if (!projectId || !integrationId || !envId) {
        return new Response('Missing parameters', { status: 400 });
    }

    // Busca Token
    const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

    if (!integration) {
        return new Response('Integration not found', { status: 404 });
    }

    try {
        // Envia DELETE p/ Vercel para apagar a variável por ID
        const vRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${envId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${integration.token}`
            }
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            const msg = errorData.error?.message || 'Erro ao deletar Variável de Ambiente.';
            throw new Error(msg);
        }

        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=env_removed&tab=envs#tab-envs`);

    } catch (err: any) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=${encodeURIComponent(err.message)}&tab=envs#tab-envs`);
    }
};
