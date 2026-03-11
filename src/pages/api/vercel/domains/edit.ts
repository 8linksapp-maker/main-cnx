import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../../lib/supabaseSSR';

export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return context.redirect('/login');
    }

    const formData = await context.request.formData();
    const projectId = formData.get('project_id')?.toString();
    const integrationId = formData.get('integration_id')?.toString();
    const domainName = formData.get('domain_name')?.toString();
    const target = formData.get('target')?.toString(); // 'production' ou 'preview'

    if (!projectId || !integrationId || !domainName || !target) {
        return context.redirect(`/dashboard?error=Dados+ausentes`);
    }

    // 1. Obter a chave da Vercel
    const { data: integration } = await supabase
        .from('integrations')
        .select('token')
        .eq('id', integrationId)
        .eq('user_id', user.id)
        .single();

    if (!integration || !integration.token) {
        return context.redirect(`/dashboard?error=Integracao+Invalida`);
    }

    // 2. Acionar PATCH /v9/projects/{id}/domains/{domain} na Vercel
    try {
        const patchResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domainName}`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${integration.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                target: target
            })
        });

        if (!patchResponse.ok) {
            const err = await patchResponse.json();
            return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=Falha+edicao:+${err.error?.message || 'Erro+Vercel'}&tab=domains#tab-domains`);
        }

        // Se deu certo (Status 200 OK)
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=Dominio+Editado+com+Sucesso&tab=domains#tab-domains`);
    } catch (e) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=Servidor+Vercel+Inacessivel&tab=domains#tab-domains`);
    }
};
