/**
 * wizard/types.ts
 *
 * Tipos TypeScript e constantes compartilhadas pelo wizard de criação de temas.
 * Define a estrutura completa dos dados coletados em todas as 6 etapas.
 */

export interface WizardData {
    // Etapa 1 — Repositório
    repoUrl: string;
    branch: string;

    // Etapa 2 — Identidade da Marca
    brandName: string;
    niche: string;
    customNiche: string;
    slogan: string;
    sloganAI: boolean;

    // Etapa 3 — NAP & Contato
    businessName: string;
    businessType: 'person' | 'local' | 'organization' | 'ecommerce';
    addressStreet: string;
    addressNumber: string;
    addressComplement: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
    phone: string;
    email: string;
    canonicalUrl: string;
    socialInstagram: string;
    socialYoutube: string;
    socialLinkedin: string;
    socialPinterest: string;
    socialTiktok: string;
    socialTwitter: string;

    // Etapa 4 — SEO & Open Graph
    titleSeparator: '|' | '—' | '•';
    ogTitle: string;
    ogTitleAI: boolean;
    ogDescription: string;
    ogDescriptionAI: boolean;
    ogImage: string;
    twitterHandle: string;
    gscCode: string;
    generateSchema: boolean;
    generateSitemap: boolean;
    generateRobots: boolean;

    // Etapa 5 — Conteúdo Inicial
    aboutText: string;
    aboutAI: boolean;
    contactPageType: 'none' | 'nap-only' | 'with-form';
    authorBio: string;
    authorBioSameAsAbout: boolean;

    // Etapa 6 — Design & Estrutura
    visualStyle: 'minimal' | 'bold' | 'elegant' | 'tech' | 'organic';
    colorMode: 'dark' | 'light';
    fontStyle: 'sans' | 'serif' | 'display';
    primaryColor: string;
    secondaryColor: string;
    blogStyle: 'magazine' | 'grid' | 'list';
    postSidebar: boolean;
    homeSections: string[];
    themeSlug: string;
}

export const NICHE_OPTIONS = [
    { id: 'financas',       label: 'Finanças',             emoji: '💰' },
    { id: 'saude',          label: 'Saúde & Bem-estar',    emoji: '💪' },
    { id: 'marketing',      label: 'Marketing & Negócios', emoji: '📈' },
    { id: 'tecnologia',     label: 'Tecnologia',           emoji: '💻' },
    { id: 'gastronomia',    label: 'Gastronomia',          emoji: '🍕' },
    { id: 'lifestyle',      label: 'Lifestyle',            emoji: '✨' },
    { id: 'educacao',       label: 'Educação',             emoji: '🎓' },
    { id: 'moda',           label: 'Moda & Beleza',        emoji: '👗' },
    { id: 'espiritualidade',label: 'Espiritualidade',      emoji: '🧘' },
    { id: 'esportes',       label: 'Esportes & Fitness',   emoji: '🏋️' },
    { id: 'viagem',         label: 'Viagem & Turismo',     emoji: '✈️' },
    { id: 'outro',          label: 'Outro',                emoji: '📝' },
] as const;

export const COLOR_PALETTE = [
    { name: 'Roxo Criativo',  hex: '#a855f7' },
    { name: 'Azul Confiança', hex: '#3b82f6' },
    { name: 'Verde Natureza', hex: '#22c55e' },
    { name: 'Laranja Energia',hex: '#f97316' },
    { name: 'Rosa Feminino',  hex: '#ec4899' },
    { name: 'Vermelho Impacto',hex:'#ef4444' },
    { name: 'Ciano Tech',     hex: '#06b6d4' },
    { name: 'Âmbar Premium',  hex: '#f59e0b' },
    { name: 'Índigo Elegante',hex: '#6366f1' },
    { name: 'Esmeralda',      hex: '#10b981' },
] as const;

export const HOME_SECTION_OPTIONS = [
    { id: 'hero',           label: 'Hero com headline + CTA',         emoji: '🎯' },
    { id: 'featured-posts', label: 'Posts em destaque',               emoji: '📰' },
    { id: 'about-bio',      label: 'Sobre / Bio do criador',          emoji: '👤' },
    { id: 'categories',     label: 'Categorias em destaque',          emoji: '🏷️' },
    { id: 'newsletter-cta', label: 'CTA para newsletter / produto',   emoji: '📧' },
    { id: 'testimonials',   label: 'Depoimentos / prova social',      emoji: '⭐' },
    { id: 'faq',            label: 'FAQ',                              emoji: '❓' },
] as const;

export const SITE_TYPES = [
    { id: 'blog',        label: 'Blog / Conteúdo',    emoji: '📝', locked: false },
    { id: 'imobiliaria', label: 'Imobiliária',        emoji: '🏠', locked: true  },
    { id: 'restaurante', label: 'Restaurante',        emoji: '🍕', locked: true  },
    { id: 'portfolio',   label: 'Portfólio',          emoji: '💼', locked: true  },
    { id: 'clinica',     label: 'Clínica / Saúde',   emoji: '👩‍⚕️', locked: true  },
    { id: 'curso',       label: 'Curso / Mentoria',  emoji: '🎓', locked: true  },
] as const;

export const STEP_LABELS = [
    'Repositório',
    'Marca',
    'NAP & Contato',
    'SEO & Open Graph',
    'Conteúdo',
    'Design',
] as const;

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const DEFAULT_WIZARD_DATA: WizardData = {
    repoUrl:             '',
    branch:              'main',
    brandName:           '',
    niche:               '',
    customNiche:         '',
    slogan:              '',
    sloganAI:            true,
    businessName:        '',
    businessType:        'person',
    addressStreet:       '',
    addressNumber:       '',
    addressComplement:   '',
    addressCity:         '',
    addressState:        '',
    addressZip:          '',
    phone:               '',
    email:               '',
    canonicalUrl:        '',
    socialInstagram:     '',
    socialYoutube:       '',
    socialLinkedin:      '',
    socialPinterest:     '',
    socialTiktok:        '',
    socialTwitter:       '',
    titleSeparator:      '|',
    ogTitle:             '',
    ogTitleAI:           true,
    ogDescription:       '',
    ogDescriptionAI:     true,
    ogImage:             '',
    twitterHandle:       '',
    gscCode:             '',
    generateSchema:      true,
    generateSitemap:     true,
    generateRobots:      true,
    aboutText:           '',
    aboutAI:             true,
    contactPageType:     'with-form',
    authorBio:           '',
    authorBioSameAsAbout:false,
    visualStyle:         'minimal',
    colorMode:           'dark',
    fontStyle:           'sans',
    primaryColor:        '#a855f7',
    secondaryColor:      '#06b6d4',
    blogStyle:           'grid',
    postSidebar:         true,
    homeSections:        ['hero', 'featured-posts'],
    themeSlug:           '',
};
