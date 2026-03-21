import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../lib/supabaseSSR';

/**
 * GET /api/vercel/data?siteId=...&action=project|deploys|domains
 * Usado pelo ConfigEditor (CMS) para buscar dados da Vercel via siteId.
 */
export const GET: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = context.url;
    const siteId = searchParams.get('siteId');
    const action = searchParams.get('action') || 'project';

    if (!siteId) return new Response(JSON.stringify({ error: 'siteId required' }), { status: 400 });

    // Buscar site
    const { data: site } = await supabase
        .from('sites_cms')
        .select('repo_name, integration_id')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single();

    if (!site) return new Response(JSON.stringify({ error: 'Site não encontrado' }), { status: 404 });

    // Buscar token Vercel
    let vercelToken: string | null = null;

    if (site.integration_id) {
        const { data: intg } = await supabase
            .from('integrations')
            .select('token')
            .eq('id', site.integration_id)
            .eq('user_id', user.id)
            .single();
        vercelToken = intg?.token || null;
    }

    if (!vercelToken) {
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

    const projectSlug = (site.repo_name as string)?.split('/')[1] || siteId;

    try {
        const headers = { Authorization: `Bearer ${vercelToken}` };

        if (action === 'project') {
            const res = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, { headers });
            const data = await res.json();
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'deploys') {
            const projRes = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, { headers });
            const proj = await projRes.json();
            const pid = proj.id || projectSlug;
            const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${pid}&limit=15`, { headers });
            const data = await res.json();
            return new Response(JSON.stringify(data.deployments || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'domains') {
            const projRes = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, { headers });
            const proj = await projRes.json();
            const pid = proj.id || projectSlug;
            const res = await fetch(`https://api.vercel.com/v9/projects/${pid}/domains`, { headers });
            const data = await res.json();
            return new Response(JSON.stringify({ domains: data.domains || [], projectId: pid }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'action inválida' }), { status: 400 });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

/**
 * POST /api/vercel/data
 * body JSON: { siteId, action, deploymentId?, domainName?, domainTarget? }
 */
export const POST: APIRoute = async (context) => {
    const supabase = supabaseSSR(context);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    const body = await context.request.json();
    const { siteId, action, deploymentId, domainName, domainTarget } = body;

    if (!siteId || !action) {
        return new Response(JSON.stringify({ error: 'siteId e action são obrigatórios' }), { status: 400 });
    }

    // Buscar site
    const { data: site } = await supabase
        .from('sites_cms')
        .select('repo_name, integration_id')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single();

    if (!site) return new Response(JSON.stringify({ error: 'Site não encontrado' }), { status: 404 });

    // Buscar token Vercel
    let vercelToken: string | null = null;

    if (site.integration_id) {
        const { data: intg } = await supabase
            .from('integrations')
            .select('token')
            .eq('id', site.integration_id)
            .eq('user_id', user.id)
            .single();
        vercelToken = intg?.token || null;
    }

    if (!vercelToken) {
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

    // Resolver projectId
    const projectSlug = (site.repo_name as string)?.split('/')[1] || siteId;
    const headers = { Authorization: `Bearer ${vercelToken}` };

    let projectId = projectSlug;
    try {
        const projRes = await fetch(`https://api.vercel.com/v9/projects/${projectSlug}`, { headers });
        if (projRes.ok) {
            const pd = await projRes.json();
            projectId = pd.id || projectSlug;
        }
    } catch (_) { }

    try {
        if (action === 'redeploy' && deploymentId) {
            const res = await fetch('https://api.vercel.com/v13/deployments', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ deploymentId, target: 'production', name: projectId })
            });
            const data = await res.json();
            return new Response(JSON.stringify(data), { status: res.ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'domain_add' && domainName) {
            const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: domainName, target: domainTarget || null })
            });
            const data = await res.json();
            return new Response(JSON.stringify(data), { status: res.ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'domain_remove' && domainName) {
            const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domainName}`, {
                method: 'DELETE',
                headers
            });
            return new Response(JSON.stringify({ ok: res.ok }), { status: 200 });
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
