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

    if (!projectId || !integrationId || !domainName) {
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
            return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=Falha+verificacao:+${err.error?.message || 'Erro+Vercel'}&tab=domains#tab-domains`);
        }

        // Se deu certo (Status 200 OK)
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=Domínio+checado.+Pode+levar+algumas+horas+para+propagar+globalmente.&tab=domains#tab-domains`);
    } catch (e) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=Servidor+Vercel+Inacessivel&tab=domains#tab-domains`);
    }
};
