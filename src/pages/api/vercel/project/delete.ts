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

    if (!projectId || !integrationId) {
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
        const vRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                "Authorization": `Bearer ${integration.token}`
            }
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            throw new Error(errorData.error?.message || 'Erro ao deletar projeto na Vercel');
        }

        // Se deletou, manda o cliente embora de volta pra lista de sites (afinal o site não existe mais)
        return context.redirect(`/dashboard/sites?success=project_deleted`);

    } catch (err: any) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=${encodeURIComponent(err.message)}`);
    }
};
