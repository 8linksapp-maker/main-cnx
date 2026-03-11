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
    const domainName = formData.get('domain_name')?.toString();

    if (!projectId || !integrationId || !domainName) {
        return new Response('Missing parameters', { status: 400 });
    }

    // Busca o Token Real na Base
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

        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=domain_removed#tab-domains`);

    } catch (err: any) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=${encodeURIComponent(err.message)}#tab-domains`);
    }
};
