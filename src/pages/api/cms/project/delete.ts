import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../../lib/supabaseSSR';

/**
 * /api/cms/project/delete
 * Apaga o projeto da Vercel, o repositório no GitHub e o registro no Supabase.
 * Body: { siteId, repoName }
 */
export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await context.request.json();
    const { siteId, repoName } = body;

    if (!siteId || !repoName) {
        return new Response(JSON.stringify({ error: 'siteId e repoName obrigatórios' }), { status: 400 });
    }

    // Busca as integrações do usuário (Vercel e GitHub)
    const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

    const vercelIntg = integrations?.find((i: any) => i.service === 'vercel' || i.provider === 'vercel');
    const ghIntg = integrations?.find((i: any) => i.service === 'github' || i.provider === 'github');

    const vercelToken = vercelIntg?.token;
    const ghToken = ghIntg?.token?.trim();

    const errors: string[] = [];

    // ── 1. Deletar na Vercel ──────────────────────────────────────────────────
    if (vercelToken) {
        const projectSlug = repoName.split('/')[1];
        try {
            const vRes = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            if (!vRes.ok && vRes.status !== 404) {
                const data = await vRes.json();
                errors.push(`Vercel: ${data.error?.message || 'Falha ao deletar'}`);
            }
        } catch (e: any) {
            errors.push(`Vercel: ${e.message}`);
        }
    }

    // ── 2. Deletar Repositório no GitHub ─────────────────────────────────────
    if (ghToken) {
        try {
            const ghRes = await fetch(`https://api.github.com/repos/${repoName}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${ghToken}`,
                    Accept: 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            // 204 = sucesso, 404 = já não existe (ok)
            if (!ghRes.ok && ghRes.status !== 404 && ghRes.status !== 204) {
                const data = await ghRes.json();
                errors.push(`GitHub: ${data.message || 'Falha ao deletar repositório'}`);
            }
        } catch (e: any) {
            errors.push(`GitHub: ${e.message}`);
        }
    }

    // ── 3. Remover do Supabase ────────────────────────────────────────────────
    try {
        await supabase
            .from('sites_cms')
            .delete()
            .eq('id', siteId)
            .eq('user_id', user.id);
    } catch (e: any) {
        errors.push(`Supabase: ${e.message}`);
    }

    // Se houve erros graves, retorna 500 com log
    if (errors.length > 0) {
        return new Response(JSON.stringify({ error: errors.join(' | ') }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
