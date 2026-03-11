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
    const envKey = formData.get('env_key')?.toString()?.trim();
    const envValue = formData.get('env_value')?.toString()?.trim();

    const targetEnv = formData.get('target_env')?.toString();

    if (!projectId || !integrationId || !envKey || !envValue) {
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
        // Envia POST p/ Vercel pra injetar a variável
        const vRes = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${integration.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify([{
                type: "encrypted",
                key: envKey,
                value: envValue,
                target: targets
            }])
        });

        if (!vRes.ok) {
            const errorData = await vRes.json();
            const msg = errorData.error?.message || 'Erro ao salvar Variável de Ambiente.';

            let translatedMsg = msg;
            if (msg.toLowerCase().includes('invalid characters')) translatedMsg = 'A CHAVE contém caracteres inválidos. Apenas letras, números e _ são permitidos. Não inicie com números.';
            if (msg.toLowerCase().includes('already exists')) translatedMsg = 'Já existe uma variável salva com esta CHAVE.';
            if (msg.toLowerCase().includes('system environment')) translatedMsg = 'Variáveis de sistema não podem ser sobreescritas ou criadas.';
            if (msg.toLowerCase().includes('too long')) translatedMsg = 'O valor informado excede o limite permitido.';

            throw new Error(translatedMsg);
        }

        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&success=env_added&tab=envs#tab-envs`);

    } catch (err: any) {
        return context.redirect(`/dashboard/sites/${projectId}?integration=${integrationId}&error=${encodeURIComponent(err.message)}&tab=envs#tab-envs`);
    }
};
