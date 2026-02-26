/**
 * theme-prompt-generator.ts
 *
 * Gera o prompt único e completo que o aluno cola no Cursor Agent para criar
 * um tema CNX customizado do zero. O prompt inclui: setup do ambiente,
 * regras absolutas do projeto, identidade da marca, dados de SEO/NAP,
 * estrutura do site e todos os arquivos a serem criados, finalizando com
 * o comando de deploy via git push.
 */

import type { WizardData } from '../components/admin/wizard/types';
import { slugify } from '../components/admin/wizard/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSocialsList(data: WizardData): string {
    const list: string[] = [];
    if (data.socialInstagram) list.push(`Instagram: @${data.socialInstagram}`);
    if (data.socialYoutube)   list.push(`YouTube: ${data.socialYoutube}`);
    if (data.socialLinkedin)  list.push(`LinkedIn: ${data.socialLinkedin}`);
    if (data.socialPinterest) list.push(`Pinterest: @${data.socialPinterest}`);
    if (data.socialTiktok)    list.push(`TikTok: @${data.socialTiktok}`);
    if (data.socialTwitter)   list.push(`X/Twitter: @${data.socialTwitter}`);
    return list.length > 0 ? list.join(', ') : 'Nenhuma rede social configurada';
}

function buildAddressString(data: WizardData): string {
    const parts: string[] = [];
    if (data.addressStreet && data.addressNumber)
        parts.push(`${data.addressStreet}, ${data.addressNumber}${data.addressComplement ? ` ${data.addressComplement}` : ''}`);
    if (data.addressCity)  parts.push(data.addressCity);
    if (data.addressState) parts.push(data.addressState);
    if (data.addressZip)   parts.push(`CEP ${data.addressZip}`);
    return parts.length > 0 ? parts.join(' — ') : 'Não fornecido';
}

function buildHomeSectionsList(sections: string[]): string {
    const labels: Record<string, string> = {
        'hero':           'Hero com headline impactante e botão CTA principal',
        'featured-posts': 'Posts em destaque — últimas publicações do blog',
        'about-bio':      'Seção Sobre/Bio do criador com foto e texto',
        'categories':     'Categorias em destaque com ícones ou imagens',
        'newsletter-cta': 'CTA para newsletter ou produto principal',
        'testimonials':   'Depoimentos e prova social de leitores/clientes',
        'faq':            'FAQ — perguntas frequentes',
    };
    return sections.map((id, i) => `  ${i + 1}. ${labels[id] ?? id}`).join('\n');
}

function getSchemaType(t: WizardData['businessType']): string {
    return { person: 'Person', local: 'LocalBusiness', organization: 'Organization', ecommerce: 'Store' }[t];
}

function getVisualStyleDescription(s: WizardData['visualStyle']): string {
    return {
        minimal:  'Minimalista — espaço generoso, tipografia limpa, sem excesso de elementos decorativos',
        bold:     'Bold/Impactante — contrastes fortes, tipografia expressiva grande, elementos visuais marcantes',
        elegant:  'Elegante/Luxo — refinado, paleta sóbria, detalhes sutis, sensação premium',
        tech:     'Moderno/Tech — linhas retas, elementos geométricos, estética de produto digital',
        organic:  'Orgânico/Natural — curvas suaves, texturas orgânicas, sensação acolhedora e humana',
    }[s];
}

function getFontDescription(f: WizardData['fontStyle']): string {
    return {
        sans:    'Sans-serif moderna — Inter, Plus Jakarta Sans ou DM Sans',
        serif:   'Serifada elegante — Playfair Display, Lora ou Merriweather',
        display: 'Display/Expressiva — Outfit, Syne ou Space Grotesk',
    }[f];
}

function getBlogStyleDescription(s: WizardData['blogStyle']): string {
    return {
        magazine: 'Magazine — 1 post principal em destaque grande + grid de posts menores abaixo (estilo portal/news)',
        grid:     'Grid — cards iguais em 3 colunas (desktop), 2 (tablet), 1 (mobile)',
        list:     'Lista — cada post em linha completa com imagem à esquerda e texto à direita (estilo Medium)',
    }[s];
}

const SEP = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

// ─── Gerador principal ────────────────────────────────────────────────────────

export function generatePrompt(data: WizardData): string {
    const slug      = data.themeSlug || slugify(data.brandName);
    const niche     = data.niche === 'outro' ? data.customNiche : data.niche;
    const slogan    = data.sloganAI   ? 'Crie um slogan adequado ao nicho e à marca' : data.slogan;
    const ogTitle   = data.ogTitleAI  ? 'Gere um OG title para o site (máx 60 caracteres)' : data.ogTitle;
    const ogDesc    = data.ogDescriptionAI ? 'Gere uma meta description para o site (máx 160 caracteres)' : data.ogDescription;
    const aboutText = data.aboutAI    ? 'Escreva um texto "Sobre" adequado ao nicho e nome (3-4 parágrafos)' : data.aboutText;
    const authorBio = data.authorBioSameAsAbout
        ? 'Resumo do texto "Sobre" em 2-3 frases'
        : (data.authorBio || 'Bio curta baseada no nicho da marca');

    const socialsStr     = buildSocialsList(data);
    const addressStr     = buildAddressString(data);
    const homeSectionsStr = buildHomeSectionsList(data.homeSections);

    // ── Bloco de tarefas (etapa 6) ──────────────────────────────────────────
    const tasks: string[] = [];
    let t = 1;

    tasks.push(`6.${t++}  tailwind.config.mjs
     → Encontre a chave "primary" em theme.extend.colors e modifique para: '${data.primaryColor}'
     → Se existir "secondary", modifique para: '${data.secondaryColor}'`);

    tasks.push(`6.${t++}  src/themes/${slug}/components/Header.astro
     → Logo/nome "${data.brandName}" no lado esquerdo
     → Navegação responsiva com menu hambúrguer no mobile
     → Links: Home (/), Blog (/blog), Sobre (/sobre), Contato (/contato)
     → Use APENAS CSS variables para cores (--blog-nav-bg, --blog-text, --blog-border etc.)`);

    tasks.push(`6.${t++}  src/themes/${slug}/components/Footer.astro
     → Copyright "© {new Date().getFullYear()} ${data.brandName}"
     → Links de navegação
     ${socialsStr !== 'Nenhuma rede social configurada' ? `→ Links/ícones das redes sociais: ${socialsStr}` : ''}`);

    tasks.push(`6.${t++}  src/themes/${slug}/Home.astro
     → Importe posts: const posts = await getCollection('posts')
     → Use os 5 posts mais recentes na seção de destaques
     → Crie as seções nesta ordem exata:
${homeSectionsStr}
     → Use APENAS CSS variables para cores`);

    tasks.push(`6.${t++}  src/themes/${slug}/BlogList.astro
     → Estilo: ${getBlogStyleDescription(data.blogStyle)}
     → Importe: const posts = await getCollection('posts')
     → Ordene por publishedDate (mais recente primeiro)
     → Exiba em cada item: thumbnail, título, categoria, data e resumo`);

    tasks.push(`6.${t++}  src/themes/${slug}/BlogPost.astro
     → Modelo: ${data.postSidebar
        ? 'COM sidebar lateral sticky — exiba: avatar/nome do autor, bio, data de publicação, categoria e botão "← Voltar ao Blog"'
        : 'SEM sidebar — layout de leitura centrado com largura máxima de ~720px'}
     → Exiba: thumbnail, título, data, nome do autor, conteúdo, categoria
     → Para buscar o autor: import { getEntry } from 'astro:content'`);

    tasks.push(`6.${t++}  src/content/singletons/settings.yaml
     → Adicione ou modifique os campos:
       activeTheme: '${slug}'
       colorScheme: '${data.colorMode}'
       titleSeparator: '${data.titleSeparator}'
       ${data.canonicalUrl ? `canonicalUrl: '${data.canonicalUrl}'` : ''}
       ${data.generateSchema ? `schemaType: '${getSchemaType(data.businessType)}'` : ''}
       ogTitle: '${ogTitle}'
       ogDescription: '${ogDesc}'
       ${data.ogImage ? `ogImage: '${data.ogImage}'` : ''}`);

    tasks.push(`6.${t++}  src/content/singletons/contact.yaml (crie se não existir)
     name: "${data.businessName || data.brandName}"
     phone: "${data.phone}"
     email: "${data.email}"
     address: "${data.addressStreet ? `${data.addressStreet}, ${data.addressNumber}` : ''}"
     city: "${data.addressCity}"
     state: "${data.addressState}"
     zip: "${data.addressZip}"
     instagram: "${data.socialInstagram}"
     youtube: "${data.socialYoutube}"
     linkedin: "${data.socialLinkedin}"
     twitter: "${data.socialTwitter}"`);

    tasks.push(`6.${t++}  src/content/singletons/about.yaml (crie se não existir)
     title: "Sobre"
     content: "${aboutText}"
     authorBio: "${authorBio}"`);

    if (data.generateRobots) {
        tasks.push(`6.${t++}  public/robots.txt (crie se não existir)
     User-agent: *
     Allow: /
     Disallow: /admin
     ${data.canonicalUrl ? `Sitemap: ${data.canonicalUrl}/sitemap.xml` : 'Sitemap: https://seusite.com/sitemap.xml'}`);
    }

    if (data.generateSitemap) {
        tasks.push(`6.${t++}  astro.config.mjs — adicione a integração de sitemap:
     import sitemap from '@astrojs/sitemap';
     → No array integrations: adicione sitemap({ ... })
     → Se o pacote @astrojs/sitemap não estiver instalado, rode: bun add @astrojs/sitemap`);
    }

    if (data.contactPageType !== 'none') {
        tasks.push(`6.${t++}  src/pages/contato.astro (crie se não existir)
     → Importe e exiba os dados do contact.yaml (nome, telefone, email, endereço)
     ${data.contactPageType === 'with-form'
        ? '→ Inclua formulário de contato simples (nome, email, mensagem) com validação básica'
        : '→ Exiba apenas o NAP — sem formulário'}`);
    }

    tasks.push(`6.${t++}  VALIDAÇÃO OBRIGATÓRIA — rode o servidor e verifique:
     bun dev
     ✓ localhost:4321 carrega sem erros no terminal
     ✓ Sem erros TypeScript ou Astro no console
     ✓ /blog lista os posts corretamente
     ✓ /blog/[slug] abre um post sem erros
     ✓ Menu mobile funciona em tela estreita
     ✓ Cores e fontes aplicadas conforme a identidade`);

    // ── Montagem final ───────────────────────────────────────────────────────
    return `Você é um desenvolvedor sênior especializado em Astro 5 + Tailwind CSS. Leia TODO este documento antes de executar qualquer ação. Siga as etapas na ordem exata indicada. Não pule nenhuma etapa.

${SEP}
ETAPA 1 — PREPARAR AMBIENTE
${SEP}
Execute estes comandos no terminal integrado do Cursor:

  gh auth login
  git clone ${data.repoUrl} .
  bun install

${SEP}
ETAPA 2 — REGRAS ABSOLUTAS DO PROJETO CNX
${SEP}
NUNCA modifique os seguintes arquivos/pastas — são o núcleo do sistema:
  • src/pages/admin/           → painel administrativo
  • src/utils/                 → utilitários críticos
  • src/pages/api/             → rotas de API existentes
  • src/layouts/AdminLayout.astro
  • src/content/config.ts
  • astro.config.mjs / package.json / tsconfig.json / bun.lock

O tema fica EXCLUSIVAMENTE em: src/themes/${slug}/
  Arquivos obrigatórios:
  - Home.astro
  - BlogList.astro
  - BlogPost.astro
  - components/Header.astro
  - components/Footer.astro

Como as rotas funcionam (NÃO altere estes arquivos de página):
  src/pages/index.astro       → importa Home.astro do tema ativo
  src/pages/blog/index.astro  → importa BlogList.astro
  src/pages/blog/[slug].astro → importa BlogPost.astro

SEMPRE use CSS variables para cores — NUNCA hardcode valores hex diretamente:
  --blog-bg, --blog-section-alt, --blog-section-dark
  --blog-surface, --blog-surface-hover, --blog-border
  --blog-text, --blog-text-muted, --blog-text-subtle
  --blog-hero-grad, --blog-nav-bg, --blog-nav-border

Cor de destaque (primary):
  → Configure em tailwind.config.mjs: primary: '${data.primaryColor}'
  → Use text-primary / bg-primary / border-primary no Tailwind

Imports corretos a usar nos templates:
  import { getCollection } from 'astro:content';
  import MainLayout from '@/layouts/MainLayout.astro';
  import type { CollectionEntry } from 'astro:content';

${SEP}
ETAPA 3 — IDENTIDADE DA MARCA
${SEP}
Nome da marca:    ${data.brandName}
Nicho:            ${niche}
Slogan:           ${slogan}
Cor primária:     ${data.primaryColor}
Cor secundária:   ${data.secondaryColor}
Estilo visual:    ${getVisualStyleDescription(data.visualStyle)}
Modo padrão:      ${data.colorMode === 'dark' ? 'Escuro (dark)' : 'Claro (light)'}
Fonte:            ${getFontDescription(data.fontStyle)}
Slug do tema:     ${slug}

${SEP}
ETAPA 4 — DADOS DE NEGÓCIO & SEO
${SEP}
Nome oficial:     ${data.businessName || data.brandName}
Schema.org type:  ${data.generateSchema ? getSchemaType(data.businessType) : 'Não gerar Schema.org'}
Telefone:         ${data.phone || 'Não fornecido'}
E-mail:           ${data.email || 'Não fornecido'}
Endereço:         ${addressStr}
URL canônica:     ${data.canonicalUrl || 'Não fornecida'}
Redes sociais:    ${socialsStr}

Open Graph:
  OG Title:        ${ogTitle}
  OG Description:  ${ogDesc}
  OG Image:        ${data.ogImage || 'Não fornecida (use a thumbnail do post quando disponível)'}
  Separador:       ${data.titleSeparator}  (ex: "Nome do Post ${data.titleSeparator} ${data.brandName}")
  Twitter handle:  ${data.twitterHandle || 'Não fornecido'}
  ${data.gscCode ? `GSC Verification: ${data.gscCode}` : ''}

Gerar sitemap.xml:   ${data.generateSitemap ? 'Sim — use @astrojs/sitemap' : 'Não'}
Gerar robots.txt:    ${data.generateRobots  ? 'Sim' : 'Não'}
Gerar Schema.org:    ${data.generateSchema  ? `Sim — JSON-LD tipo ${getSchemaType(data.businessType)} no <head>` : 'Não'}

${SEP}
ETAPA 5 — ESTRUTURA DO SITE
${SEP}
Seções da Home (nesta ordem exata):
${homeSectionsStr}

Estilo do blog:   ${getBlogStyleDescription(data.blogStyle)}

Modelo do post:   ${data.postSidebar
    ? 'COM sidebar lateral sticky (autor, data, categoria, botão voltar ao blog)'
    : 'SEM sidebar — layout de leitura centrado, foco no conteúdo'}

${SEP}
ETAPA 6 — CRIAR OS ARQUIVOS (execute nesta ordem exata)
${SEP}
${tasks.join('\n\n')}

${SEP}
ETAPA 7 — PUBLICAR NA VERCEL
${SEP}
Após confirmar que tudo funciona em localhost sem erros:

  git add .
  git commit -m "feat: tema ${slug} criado — ${niche}"
  git push origin ${data.branch}

A Vercel detecta o push e faz rebuild automático em aproximadamente 2 minutos.
Acesse o site no ar e valide o resultado final.

${SEP}
FIM DO PROMPT — BOA SORTE! 🚀
${SEP}`;
}
