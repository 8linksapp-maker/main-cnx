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
    const envKey = formData.get('env_key')?.toString()?.trim();
    const envValue = formData.get('env_value')?.toString()?.trim();
    const targetEnv = formData.get('target_env')?.toString();

    if (!projectId || !integrationId || !envId || !envKey) {
        return new Response('Missing parameters', { status: 400 });
    }

    let targets: string[] = ["production", "preview", "development"];
    if (targetEnv === 'production') targets = ["production"];
    else if (targetEnv === 'preview') targets = ["preview"];
    else if (targetEnv === 'development') targets = ["development"];

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
        const payload: any = {
            key: envKey,
            target: targets
        };

        // Envia o Value (senha/segredo) apenas se o usuário preencheu o campo Editar
        if (envValue) {
            payload.value = envValue;
            payload.type = "encrypted";
        }

        // Envia PATCH p/ Vercel pra atualizar a variável
        const vRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${envId}`, {
            method: 'PATCH',
            headers: {
                "Authorization": `Bearer ${integration.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            const msg = errorData.error?.message || 'Erro ao atualizar Variável de Ambiente.';

            let translatedMsg = msg;
            if (msg.toLowerCase().includes('too long')) translatedMsg = 'O valor informado excede o limite permitido.';

            throw new Error(translatedMsg);
        }

        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=Variável+Atualizada+com+Sucesso&tab=envs#tab-envs`);

    } catch (err: any) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=${encodeURIComponent(err.message)}&tab=envs#tab-envs`);
    }
};
