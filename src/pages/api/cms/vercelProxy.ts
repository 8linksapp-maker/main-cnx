import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../lib/supabaseSSR';

/**
 * /api/cms/vercel-proxy
 * Proxy seguro para buscar dados da Vercel sem expor o token no client.
 * Query params: siteId, action (deploys | domains | project | redeploy | domain_add | domain_remove)
 */
export const GET: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = context.url;
    const siteId = searchParams.get('siteId');
    const action = searchParams.get('action') || 'project';

    if (!siteId) return new Response(JSON.stringify({ error: 'siteId required' }), { status: 400 });

    // Busca o site e a integração vinculada
    const { data: site } = await supabase
        .from('sites_cms')
        .select('*, integrations(*)')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single();

    if (!site) return new Response(JSON.stringify({ error: 'Site não encontrado' }), { status: 404 });

    // Tenta achar a integração via FK direta ou match por user
    let vercelToken: string | null = null;
    let vercelProjectId: string | null = null;

    if (site.integrations?.token) {
        vercelToken = site.integrations.token;
    } else {
        // Fallback: pega a primeira integração do usuário com serviço Vercel
        const { data: intg } = await supabase
            .from('integrations')
            .select('token')
            .eq('user_id', user.id)
            .eq('service', 'vercel')
            .limit(1)
            .single();
        vercelToken = intg?.token || null;
    }

    if (!vercelToken) return new Response(JSON.stringify({ error: 'Token Vercel não encontrado' }), { status: 404 });

    // Descobre o vercel_project_id: usa repo_name para encontrar o projeto
    const repoName = site.repo_name as string;
    const projectSlug = repoName?.split('/')[1] || site.id;

    try {
        if (action === 'project') {
            const res = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, {
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            const data = await res.json();
            vercelProjectId = data.id;
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'deploys') {
            // Primeiro resolve o ID do projeto
            const projRes = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, {
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            const projData = await projRes.json();
            const pid = projData.id || projectSlug;

            const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${pid}&limit=15`, {
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            const data = await res.json();
            return new Response(JSON.stringify(data.deployments || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'domains') {
            const projRes = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, {
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            const projData = await projRes.json();
            const pid = projData.id || projectSlug;

            const res = await fetch(`https://api.vercel.com/v9/projects/${pid}/domains`, {
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            const data = await res.json();
            return new Response(JSON.stringify({ domains: data.domains || [], projectId: pid }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400 });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await context.request.json();
    const { siteId, action, projectId, deploymentId, domainName, domainTarget } = body;

    if (!siteId || !action) {
        return new Response(JSON.stringify({ error: 'Parâmetros insuficientes: siteId e action são obrigatórios' }), { status: 400 });
    }

    // Busca token Vercel
    const { data: intg } = await supabase
        .from('integrations')
        .select('token')
        .eq('user_id', user.id)
        .eq('service', 'vercel')
        .limit(1)
        .single();

    const vercelToken = intg?.token;
    if (!vercelToken) return new Response(JSON.stringify({ error: 'Token Vercel não encontrado' }), { status: 404 });

    // Resolve projectId: usa o fornecido, ou busca pelo slug do repo
    let resolvedProjectId = projectId as string | null;
    if (!resolvedProjectId) {
        const { data: site } = await supabase
            .from('sites_cms')
            .select('repo_name')
            .eq('id', siteId)
            .eq('user_id', user.id)
            .single();
        const slug = (site?.repo_name as string)?.split('/')[1] || siteId;
        const projRes = await fetch(`https://api.vercel.com/v9/projects/${slug}`, {
            headers: { Authorization: `Bearer ${vercelToken}` }
        });
        if (projRes.ok) {
            const pd = await projRes.json();
            resolvedProjectId = pd.id || slug;
        } else {
            resolvedProjectId = slug;
        }
    }

    try {
        if (action === 'redeploy' && deploymentId) {
            const res = await fetch(`https://api.vercel.com/v13/deployments`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ deploymentId, target: 'production', name: resolvedProjectId })
            });
            const data = await res.json();
            return new Response(JSON.stringify(data), { status: res.ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'domain_add' && domainName) {
            const res = await fetch(`https://api.vercel.com/v9/projects/${resolvedProjectId}/domains`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: domainName, gitBranch: domainTarget === 'preview' ? 'main' : null, redirect: null, redirectStatusCode: null })
            });
            const data = await res.json();
            return new Response(JSON.stringify(data), { status: res.ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'domain_remove' && domainName) {
            const res = await fetch(`https://api.vercel.com/v9/projects/${resolvedProjectId}/domains/${domainName}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${vercelToken}` }
            });
            return new Response(JSON.stringify({ ok: res.ok }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
