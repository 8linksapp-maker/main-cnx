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
    const domainName = formData.get('domain_name')?.toString()?.trim().toLowerCase();
    const targetVal = formData.get('target')?.toString()?.trim() || null;

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
        // Objeto body para add domains na Vercel (Pode incluir gitBranch no futuro se quiser)
        let payload: any = { name: domainName };
        if (targetVal) {
            payload.target = targetVal;
        }

        // Envia requisição POST p/ Vercel para adicionar o dominio
        const vRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${integration.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            const msg = errorData.error?.message || 'Erro ao adicionar domínio na Vercel';

            let translatedMsg = msg;
            if (msg.toLowerCase().includes('already in use')) translatedMsg = 'Este domínio já está sendo usado por outro projeto ou conta na Vercel.';
            if (msg.toLowerCase().includes('invalid domain') || msg.toLowerCase().includes('not a valid')) translatedMsg = 'O formato do domínio inserido é inválido.';
            if (msg.toLowerCase().includes('already registered')) translatedMsg = 'Este domínio já está registrado neste projeto.';

            throw new Error(translatedMsg);
        }

        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=domain_added&tab=domains#tab-domains`);

    } catch (err: any) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=${encodeURIComponent(err.message)}&tab=domains#tab-domains`);
    }
};
