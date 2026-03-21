import type { APIRoute } from 'astro';
import { supabaseSSR } from '../../../lib/supabaseSSR';
import fs from 'node:fs';
import path from 'node:path';

// ─── Helpers de arquivo local ───────────────────────────────────────────────

function getTemplateFiles(dir: string, baseDir: string): { path: string; content: string }[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files: { path: string; content: string }[] = [];

    for (const entry of entries) {
        const fullPath = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', '.astro', '.git'].includes(entry.name)) continue;
            files = [...files, ...getTemplateFiles(fullPath, baseDir)];
        } else {
            files.push({
                path: path.relative(baseDir, fullPath),
                content: fs.readFileSync(fullPath, 'utf8'),
            });
        }
    }
    return files;
}

// ─── GitHub API ──────────────────────────────────────────────────────────────

async function createOrGetRepo(ghToken: string, slug: string): Promise<{ repoId: number; fullName: string }> {
    const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${ghToken}` },
    });
    if (!userRes.ok) throw new Error('Token do GitHub inválido.');
    const { login } = await userRes.json();
    const fullName = `${login}/${slug}`;

    const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: slug, private: true, auto_init: true }),
    });

    if (createRes.ok) {
        const data = await createRes.json();
        return { repoId: data.id, fullName };
    }

    const getRes = await fetch(`https://api.github.com/repos/${fullName}`, {
        headers: { Authorization: `Bearer ${ghToken}` },
    });
    if (!getRes.ok) throw new Error(`Não foi possível criar o repositório: ${fullName}`);
    const data = await getRes.json();
    return { repoId: data.id, fullName };
}

async function pushFile(fullName: string, filePath: string, content: string, ghToken: string, message: string) {
    let sha: string | undefined;
    const checkRes = await fetch(`https://api.github.com/repos/${fullName}/contents/${filePath}`, {
        headers: { Authorization: `Bearer ${ghToken}` },
    });
    if (checkRes.ok) {
        const existing = await checkRes.json();
        sha = existing.sha;
    }

    const res = await fetch(`https://api.github.com/repos/${fullName}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            content: Buffer.from(content).toString('base64'),
            ...(sha && { sha }),
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Erro ao fazer push de ${filePath}: ${err.message}`);
    }
}

// ─── Vercel Deploy ───────────────────────────────────────────────────────────

async function deployToVercel(vercelToken: string, fullName: string, slug: string, repoId: number): Promise<{ url: string, projectId: string }> {
    const projectRes = await fetch('https://api.vercel.com/v10/projects', {
        method: 'POST',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: slug,
            framework: 'astro',
            gitRepository: { repo: fullName, type: 'github' },
        }),
    });

    if (!projectRes.ok) {
        const err = await projectRes.json();
        const code = err.error?.code;
        if (code !== 'project_already_exists' && code !== 'already_exists') {
            throw new Error(`Falha ao criar projeto na Vercel: ${err.error?.message}`);
        }
    }

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: slug,
            gitSource: { type: 'github', repoId, ref: 'main' },
            projectSettings: { framework: 'astro' },
        }),
    });

    if (!deployRes.ok) {
        const err = await deployRes.json();
        throw new Error(`Falha ao acionar deploy na Vercel: ${err.error?.message}`);
    }

    const deploy = await deployRes.json();
    let url = `https://${slug}.vercel.app`;
    let state = deploy.readyState;
    let attempts = 0;

    while (!['READY', 'ERROR', 'CANCELED'].includes(state) && attempts < 36) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploy.id}`, {
            headers: { Authorization: `Bearer ${vercelToken}` },
        });
        if (statusRes.ok) {
            const s = await statusRes.json();
            state = s.readyState;
            if (s.url) url = `https://${s.url}`;
        }
        attempts++;
    }

    if (state === 'ERROR' || state === 'CANCELED') throw new Error(`Deploy falhou (${state}). Verifique os logs na Vercel.`);
    if (state !== 'READY') throw new Error('Deploy demorou demais (timeout). O site pode estar online em breve.');

    return { url, projectId: deploy.projectId };
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

function extractJson(text: string): any {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end >= start) return JSON.parse(clean.substring(start, end + 1));
    throw new Error('JSON não encontrado na resposta do Gemini');
}

async function callGemini(key: string, prompt: string): Promise<any> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7 },
            }),
        }
    );
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Gemini: ${err.error?.message}`);
    }
    const data = await res.json();
    return extractJson(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
}

// ─── Prompt Gemini ───────────────────────────────────────────────────────────

function buildPrompt(blogName: string, niche: string, categories: string[], seo: any): string {
    return `Você é um copywriter e editor de sites focado em otimização de conversão. 
Retorne SOMENTE um JSON válido em português brasileiro contendo a estrutura abaixo, sem explicações.
Os conteúdos devem ser criados especificamente para o blog: ${blogName}. Nicho: ${niche}.

Estrutura JSON esperada:
{
  "siteConfig": {
    "name": "${blogName}",
    "description": "${seo?.metaDescription ? seo.metaDescription : `O melhor conteúdo de ${niche}`}",
    "author": "Equipe do Blog",
    "contact": {
      "email": "hello@dominio.com"
    }
  },
  "home": {
    "hero": {
      "title": "Título H1 persuasivo e de alto impacto para a hero section",
      "subtitle": "Subtítulo chamativo que explique o valor do ${niche}",
      "btnText": "Ex: Explorar Artigos",
      "bgImage": "URL de uma imagem legal do Unsplash relevante para ${niche}"
    },
    "benefits": {
      "title": "Título com os benefícios ou promessas principais",
      "items": [
        {"icon": "CheckCircle2", "title": "...", "desc": "..."},
        {"icon": "Zap", "title": "...", "desc": "..."},
        {"icon": "ShieldCheck", "title": "...", "desc": "..."}
      ]
    },
    "differentiators": {
      "title": "Por que nos acompanhar? (ou similar)",
      "image": "URL do Unsplash",
      "items": [
        {"title": "...", "desc": "..."},
        {"title": "...", "desc": "..."},
        {"title": "...", "desc": "..."}
      ]
    },
    "categories": {
      "title": "Seção Exibir Categorias",
      "items": ${JSON.stringify(categories.map(c => ({ title: c, desc: `1 breve frase criativa sobre artigos de ${c}`, link: `/categoria/${c.toLowerCase().replace(/[^a-z0-9]/g, '-')}` })))}
    },
    "about": {
      "title": "Título da seção Sobre Nós (ex: Conheça nossa missão)",
      "desc": "2 parágrafos de história ou resumo sobre porque o blog existe focando em ${niche}.",
      "image": "URL do Unsplash de escritórios ou pessoas felizes",
      "btnText": "Saiba Mais",
      "stats": [
        {"value": "Ex: 10K+", "label": "Leitores/mês"},
        {"value": "Ex: 500+", "label": "Textos Inéditos"}
      ]
    },
    "latestPosts": {
      "title": "Artigos Mais Recentes",
      "btnText": "Visualizar Blog"
    }
  }
}`;
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export const POST: APIRoute = async (context) => {
    try {
        const body = await context.request.json();
        const { companyName, mainKeyword, services, design, seo } = body;

        if (!companyName) return new Response(JSON.stringify({ error: 'Nome do blog é obrigatório.' }), { status: 400 });

        // Auth
        const supabase = supabaseSSR(context);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return new Response(JSON.stringify({ error: 'Não autorizado.' }), { status: 401 });

        // Tokens das integrações
        const { data: integrations } = await supabase.from('integrations').select('*').eq('user_id', user.id);
        const ghToken = integrations?.find((i: any) => i.provider === 'github')?.token?.trim();
        const vercelIntegration = integrations?.find((i: any) => i.provider === 'vercel');
        const vercelToken = vercelIntegration?.token?.trim();
        const vercelIntegrationId = vercelIntegration?.id;
        const geminiKey = integrations?.find((i: any) => i.provider === 'gemini')?.token?.trim();

        if (!ghToken) throw new Error('Conecte sua conta do GitHub nas Configurações da plataforma.');
        if (!vercelToken) throw new Error('Conecte sua conta da Vercel nas Configurações da plataforma.');

        // Slug do projeto: apenas letras minúsculas, números e hifens (evitando múltiplos travessões '--')
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);

        // Categorias extraídas do input "services" do wizard (1 por linha)
        const categories = (services || '')
            .split('\n')
            .map((s: string) => s.trim())
            .filter(Boolean);

        // Prepara os arquivos base (vamos ler o template)
        const templateDir = path.join(process.cwd(), 'templates', 'blog-minimalist');
        const templateFiles = getTemplateFiles(templateDir, templateDir);

        const originalConfig = templateFiles.find(f => f.path === 'src/data/siteConfig.json');
        const baseConfig = originalConfig ? JSON.parse(originalConfig.content) : {};

        const originalHome = templateFiles.find(f => f.path === 'src/data/home.json');
        const baseHome = originalHome ? JSON.parse(originalHome.content) : {};

        // IA Injection
        let aiData: any = null;
        if (geminiKey) {
            try {
                aiData = await callGemini(geminiKey, buildPrompt(companyName, mainKeyword, categories, seo));
            } catch (e) {
                console.error('Gemini falhou, usando fallback direto do template original:', e);
            }
        }

        // --- MERGE DOS DADOS (SITE CONFIG) ---
        const finalConfig = {
            ...baseConfig,
            name: aiData?.siteConfig?.name || companyName,
            description: aiData?.siteConfig?.description || seo?.metaDescription || baseConfig.description,
            url: `https://${slug}.vercel.app`,
            author: aiData?.siteConfig?.author || companyName,
            theme: {
                ...baseConfig.theme,
                primary: design?.primaryColor || baseConfig.theme?.primary,
                primaryDark: design?.primaryColor || baseConfig.theme?.primary,
                accent: design?.secondaryColor || baseConfig.theme?.accent,
                font: design?.fontPairing || 'outfit',
            },
            social: {
                instagram: seo?.instagram ? `https://instagram.com/${seo.instagram.replace('@', '')}` : baseConfig.social?.instagram,
                facebook: seo?.facebook || baseConfig.social?.facebook,
            },
            contact: {
                ...baseConfig.contact,
                email: aiData?.siteConfig?.contact?.email || baseConfig.contact?.email || `contato@${slug}.com.br`,
            },
        };

        // --- MERGE DOS DADOS (HOME JSON) ---
        // Se a IA der erro, mantemos o baseHome intacto + atualizamos apenas o que o usuário preencheu no design/seo se aplicável
        const finalHome = {
            hero: { ...baseHome.hero, ...(aiData?.home?.hero || {}) },
            benefits: { ...baseHome.benefits, ...(aiData?.home?.benefits || {}) },
            differentiators: { ...baseHome.differentiators, ...(aiData?.home?.differentiators || {}) },
            // Forçamos o map baseando estritamente no array "categories" gerado pelo usuário, 
            // evitando que a IA crie categorias que não foram pedidas, apenas "pescando" a descrição da IA.
            categories: {
                title: aiData?.home?.categories?.title || baseHome.categories?.title || 'Categorias',
                items: categories.length > 0
                    ? categories.map((c: string) => {
                        const existAI = aiData?.home?.categories?.items?.find((aiCat: any) => aiCat.title === c);
                        return { title: c, desc: existAI?.desc || c, link: `/categoria/${c.toLowerCase().replace(/[^a-z0-9]/g, '-')}` };
                    })
                    : baseHome.categories?.items
            },
            about: { ...baseHome.about, ...(aiData?.home?.about || {}) },
            latestPosts: { ...baseHome.latestPosts, ...(aiData?.home?.latestPosts || {}) },
        };

        // --- GitHub: Criar repo ---
        const { repoId, fullName } = await createOrGetRepo(ghToken, slug);

        // --- Push de todos os arquivos do template ---
        const skipPaths = new Set(['src/data/siteConfig.json', 'src/data/home.json', 'src/data/categories.json']);

        for (const file of templateFiles) {
            // Pulamos os "dados mastigados" para substituir no próximo passo
            if (skipPaths.has(file.path)) continue;

            // O usuário instruiu a *não criar posts de exemplo via IA*. O template tem um `primeiro-post.md` (Lorem/Astro starter) que vai junto. Tudo certo, não vamos barrar os posts já embutidos no template, nem criar novos. O CMS do usuário irá editá-los e criar mais.
            await pushFile(fullName, file.path, file.content, ghToken, 'feat: upload inicial do template v2');
        }

        // Push da Config e Home JSON com a fusão IA + Wizard
        await pushFile(fullName, 'src/data/siteConfig.json', JSON.stringify(finalConfig, null, 2), ghToken, 'feat: injecao de configs siteConfig.json');
        await pushFile(fullName, 'src/data/home.json', JSON.stringify(finalHome, null, 2), ghToken, 'feat: injecao generativa home.json');
        if (categories.length > 0) {
            await pushFile(fullName, 'src/data/categories.json', JSON.stringify(categories, null, 2), ghToken, 'feat: injecao generativa de categorias');
        } else {
            const originalCategories = templateFiles.find(f => f.path === 'src/data/categories.json');
            if (originalCategories) {
                await pushFile(fullName, 'src/data/categories.json', originalCategories.content, ghToken, 'feat: injecao template categories.json');
            }
        }

        // --- Deploy na Vercel ---
        let finalUrl = `https://${slug}.vercel.app`;
        let finalProjectId = null;
        try {
            const vercelResult = await deployToVercel(vercelToken, fullName, slug, repoId);
            finalUrl = vercelResult.url;
            finalProjectId = vercelResult.projectId;
        } catch (deployErr: any) {
            // Em caso de falha no deploy, salva no Supabase com error explicit warning pra debugar
            await supabase.from('sites_cms').insert({
                user_id: user.id,
                company_name: companyName,
                repo_name: fullName,
                site_type: 'blog',
                status: 'deployment_failed',
                url: '',
                data: { design, seo, categories },
                error: deployErr.message,
                integration_id: vercelIntegrationId,
                vercel_project_id: finalProjectId
            });
            throw deployErr; // joga pro catch root responder 500
        }

        // --- Supabase Success DB Sync ---
        const { error: sbError } = await supabase.from('sites_cms').insert({
            user_id: user.id,
            company_name: companyName,
            repo_name: fullName,
            site_type: 'blog',
            status: 'published',
            url: finalUrl,
            data: { design, seo, categories },
            integration_id: vercelIntegrationId,
            vercel_project_id: finalProjectId
        });

        if (sbError) {
            console.error("Supabase Error ao salvar site:", sbError);
        }

        // Retorna pro Frontend 200 OK
        return new Response(
            JSON.stringify({ success: true, url: finalUrl, repo: fullName }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message || 'Erro interno.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
