export const prerender = false;
import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../../lib/supabaseSSR';

export const GET: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const projectId = context.url.searchParams.get('project_id');
    const integrationId = context.url.searchParams.get('integration_id');
    const envId = context.url.searchParams.get('env_id');

    if (!projectId || !integrationId || !envId) {
        return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    // Busca Token Vercel
    const { data: integration } = await supabase
        .from('integrations')
        .select('token')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

    if (!integration || !integration.token) {
        return new Response(JSON.stringify({ error: 'Integration not found' }), { status: 404 });
    }

    try {
        // Envia GET p/ Vercel pra obter a variável DESCRIPTOGRAFADA (v1 endpoint)
        const vRes = await fetch(`https://api.vercel.com/v1/projects/${projectId}/env/${envId}`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${integration.token}`
            }
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            throw new Error(errorData.error?.message || 'Erro do Vercel.');
        }

        const envData = await vRes.json();

        return new Response(JSON.stringify({
            success: true,
            value: envData.value
        }), { status: 200 });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
