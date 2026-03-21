import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Loader2, GripVertical, Image as ImageIcon, UploadCloud, Eye, EyeOff, LayoutTemplate, ArrowLeft, Settings, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { triggerToast } from './CmsToaster';

interface HomeEditorProps {
    siteId: string;
    repoName: string;
    siteUrl: string;
}

// Utilitários P/ UI Dinâmica
const POPULAR_ICONS = [
    // Essenciais & Direcionais
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'ChevronDown',
    'Home', 'Menu', 'X', 'Search', 'Settings', 'Check', 'Plus', 'Minus', 'AlertCircle', 'Info', 'HelpCircle',
    // UI Geral
    'LayoutTemplate', 'LayoutGrid', 'LayoutIcon', 'List', 'Grid', 'Hash', 'MoreHorizontal', 'MoreVertical',
    'Eye', 'EyeOff', 'Lock', 'Unlock', 'Edit', 'Edit2', 'Edit3', 'Trash', 'Trash2', 'Copy', 'Save', 'File', 'FileText',
    'Folder', 'FolderOpen', 'Download', 'Upload', 'Share', 'Share2', 'ExternalLink', 'Link', 'Link2',
    // Comunicação & Social
    'Mail', 'MessageCircle', 'MessageSquare', 'Phone', 'PhoneCall', 'Video', 'Camera', 'Mic', 'MicOff',
    'ThumbsUp', 'ThumbsDown', 'Heart', 'Star', 'Bookmark', 'Share2', 'Users', 'User', 'UserPlus', 'UserMinus', 'UserCheck',
    // Negócios & Finanças
    'Briefcase', 'Building', 'Building2', 'PiggyBank', 'Wallet', 'CreditCard', 'DollarSign', 'Percent', 'TrendingUp', 'TrendingDown',
    'PieChart', 'BarChart', 'BarChart2', 'BarChart3', 'TrendingUp', 'Activity', 'Target', 'Award', 'Medal',
    // Tecnologia & Web
    'Globe', 'Globe2', 'Smartphone', 'Monitor', 'Laptop', 'Tablet', 'Tv', 'Server', 'Database', 'HardDrive',
    'Cloud', 'CloudLightning', 'CloudRain', 'CloudSnow', 'CloudDrizzle', 'Wifi', 'Battery', 'Bluetooth',
    'Cpu', 'Codepen', 'Code', 'Code2', 'Terminal', 'TerminalSquare', 'MousePointer', 'MousePointer2', 'Cursor',
    // Ciência & Saúde
    'Activity', 'Microscope', 'Stethoscope', 'Thermometer', 'Beaker', 'FlaskConical', 'Dna', 'TestTube', 'HeartPulse',
    // E-commerce & Logística
    'ShoppingBag', 'ShoppingCart', 'Tags', 'Tag', 'Ticket', 'Truck', 'Box', 'Package', 'Archive', 'Map', 'MapPin', 'Navigation',
    // Ferramentas & Objetos
    'Wrench', 'Hammer', 'PenTool', 'Scissors', 'Key', 'Umbrella', 'Clock', 'Watch', 'Timer', 'Calendar',
    'Coffee', 'CupSoda', 'Pizza', 'Music', 'Headphones', 'Speaker', 'Volume1', 'Volume2', 'VolumeX',
    // Natureza & Espaço
    'Sun', 'Moon', 'Star', 'Cloud', 'Wind', 'Zap', 'Flame', 'Droplet', 'Leaf', 'Mountain', 'Compass',
    // Mídia
    'Play', 'Pause', 'Square', 'Circle', 'Triangle', 'Image', 'ImagePlus', 'Music', 'Film', 'Clapperboard'
];

const DynamicIcon = ({ name, className = "w-5 h-5" }: { name: string, className?: string }) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <IconComponent className={className} />;
};

export default function HomeEditor({ siteId, repoName, siteUrl }: HomeEditorProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [home, setHome] = useState<any>(null);
    const [fileSha, setFileSha] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);

    let formattedUrl = siteUrl ? (siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`) : '';

    // Garante a URL de Produção para que o Preview Iframe funcione e reflita as alterações
    if (formattedUrl.includes('teste-final-hoqj55qos')) {
        formattedUrl = 'https://teste-final-brown.vercel.app/';
    } else if (formattedUrl.includes('-projects.vercel.app')) {
        const cleanedSlug = formattedUrl.replace('https://', '').split('-projects.vercel.app')[0].split('-').slice(0, -2).join('-');
        if (cleanedSlug) {
            formattedUrl = `https://${cleanedSlug}.vercel.app/`;
        }
    }

    // Dispara atualizações em tempo real para o Iframe injetável
    useEffect(() => {
        if (previewMode && home && iframeRef.current && iframeRef.current.contentWindow) {
            // O Iframe com o script proxy ouvirá isso
            iframeRef.current.contentWindow.postMessage({ type: 'LIVE_PREVIEW', data: home }, '*');
        }
    }, [home, previewMode]);

    const getFullImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;

        // Remove legado "public/" do path se salvo antigamente no banco
        let cleanPath = path.startsWith('public/') ? path.replace('public/', '/') : path;
        cleanPath = cleanPath.trim().startsWith('/') ? cleanPath.trim() : `/${cleanPath.trim()}`;

        const cleanSiteUrl = formattedUrl.trim().endsWith('/') ? formattedUrl.trim().slice(0, -1) : formattedUrl.trim();
        // Adiciona um cache-buster forte garantindo que o 404 antigo preso no Chrome seja perfurado!
        const cacheBuster = `?cb=${new Date().getTime()}`;
        return `${cleanSiteUrl}${cleanPath}${cacheBuster}`;
    };

    // Arquivos em memória aguardando Upload no Github pelo Save Global
    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});

    // Rastreamento de alterações para mensagem de commit dinâmica
    const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

    const addChange = (label: string) => {
        setPendingChanges(prev => new Set(prev).add(label));
    };

    // Icon Modal State
    const [iconModalFor, setIconModalFor] = useState<{ section: 'benefits' | 'categories', idx: number } | null>(null);

    useEffect(() => {
        const fetchHome = async () => {
            try {
                const res = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/home.json' })
                });

                if (!res.ok) throw new Error('Erro ao buscar o conteúdo nativo da página inicial no GitHub.');
                const data = await res.json();
                setHome(JSON.parse(data.content));
                setFileSha(data.sha);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHome();
    }, [repoName]);

    // File to Base64 (Sem o cabecalho URI mime)
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true);
        setError('');

        triggerToast('Sincronizando banco de imagens visuais e textos...', 'progress', 20);

        try {
            // Copiar o estado completo atual da Home
            let finalHomeJson = { ...home };

            const changesArr = Array.from(pendingChanges);
            const commitMessage = changesArr.length > 0
                ? `CMS: Alterou ${changesArr.join(', ')}`
                : 'CMS: Customização Completa da Página Home e Imagens';

            // Fluxo de Upload: 
            // 1. Array com todas keys em pendingUploads iterada
            // 2. Transforma em Base64 p/ API Write Customizada (isBase64: true)
            // 3. Recebe a URL limpa do public dir
            // 4. Injeta a nova string URL no JSON antes de comitá-lo.
            for (const [keyPath, fileObj] of Object.entries(pendingUploads)) {
                const base64Content = await fileToBase64(fileObj);

                // Ex: "heroImg" -> public/uploads/{timestamp}-heroImg.jpg
                const fileExt = fileObj.name.split('.').pop() || 'jpg';
                const ghPath = `public/uploads/${Date.now()}-${keyPath}.${fileExt}`;

                const uploadRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'write',
                        repo: repoName,
                        path: ghPath,
                        content: base64Content,
                        isBase64: true,
                        message: commitMessage
                    })
                });

                if (!uploadRes.ok) throw new Error(`Falha ao subir a imagem ${keyPath} para o repositório.`);

                // O caminho final é estático do server, removemos "public"
                const publicUrlPath = ghPath.replace('public', '');

                // Mapeamento Direto Pro JSON Final:
                if (keyPath === 'heroImg') finalHomeJson.hero.bgImage = publicUrlPath;
                if (keyPath === 'diffImg') finalHomeJson.differentiators.image = publicUrlPath;
                if (keyPath === 'aboutImg') finalHomeJson.about.image = publicUrlPath;
                if (keyPath === 'seoImg') {
                    if (!finalHomeJson.seo) finalHomeJson.seo = {};
                    finalHomeJson.seo.image = publicUrlPath;
                }
            }

            // Depois das imagens na nuvem, comita as novas strings visuais do arquivo principal
            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write',
                    repo: repoName,
                    path: 'src/data/home.json',
                    content: JSON.stringify(finalHomeJson, null, 2),
                    sha: fileSha,
                    message: commitMessage
                })
            });

            if (!res.ok) throw new Error('O GitHub recusou a gravação do arquivo. Tente novamente.');
            const data = await res.json();

            // Sucesso Total
            setFileSha(data.sha);
            setHome(finalHomeJson);
            setPendingUploads({});
            setPendingChanges(new Set());

            triggerToast('Textos sincronizados. Aguardando Vercel enfileirar o build...', 'progress', 62);

            // Marca o momento exato do commit para ignorar deploys anteriores
            const saveTimestamp = Date.now();

            // Polling real do status do deploy na Vercel
            const pollDeploy = async () => {
                const MAX_ATTEMPTS = 60; // máx ~5 minutos (5s * 60)
                let attempt = 0;
                let prog = 62;

                const tick = setInterval(async () => {
                    attempt++;
                    try {
                        // Passa o timestamp p/ API filtrar apenas deploys NOVOS (criados após o save)
                        const statusRes = await fetch(
                            `/api/cms/vercel-deploy-status?repo=${encodeURIComponent(repoName)}&after=${saveTimestamp}`
                        );
                        const statusData = await statusRes.json();
                        const state: string = statusData?.status || 'UNKNOWN';

                        if (state === 'READY') {
                            clearInterval(tick);
                            triggerToast('Site publicado com sucesso!', 'success', 100, formattedUrl);
                            setSaving(false);
                            return;
                        }

                        if (state === 'ERROR' || state === 'CANCELED') {
                            clearInterval(tick);
                            triggerToast(`Deploy falhou (${state}). Verifique os logs na Vercel.`, 'error');
                            setSaving(false);
                            return;
                        }

                        if (attempt >= MAX_ATTEMPTS) {
                            clearInterval(tick);
                            triggerToast('Deploy demorou muito. Verifique seu painel da Vercel.', 'error');
                            setSaving(false);
                            return;
                        }

                        // Ainda em curso (QUEUED, INITIALIZING, BUILDING, UNKNOWN = novo deploy ainda não registrado)
                        prog = Math.min(prog + 0.5, 95);
                        const label = state === 'BUILDING'
                            ? 'Construindo site na Vercel...'
                            : 'Aguardando Vercel iniciar o build...';
                        triggerToast(label, 'progress', Math.round(prog));

                    } catch {
                        // Erro de rede: continua tentando
                    }
                }, 5000); // checa a cada 5 segundos
            };

            // Aguarda 15s para o GitHub notificar a Vercel e ela registrar o novo deploy
            setTimeout(pollDeploy, 15000);

        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
            setSaving(false);
        }
    };

    // Helper p/ Armazenar Arquivo Bruto em Memória e Gerar Blob P/ Preview
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, uiKey: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Armazena pro Save Batch Final
        setPendingUploads(prev => ({ ...prev, [uiKey]: file }));

        // Aplica o Blob Visualmente para Feedback Imediato
        const previewUrl = URL.createObjectURL(file);

        if (uiKey === 'heroImg') { updateSectionInfo('hero', 'bgImage', previewUrl); addChange('Imagem do Hero'); }
        if (uiKey === 'diffImg') { updateSectionInfo('differentiators', 'image', previewUrl); addChange('Imagem dos Diferenciais'); }
        if (uiKey === 'aboutImg') { updateSectionInfo('about', 'image', previewUrl); addChange('Imagem do Sobre Nós'); }
        if (uiKey === 'seoImg') { updateSectionInfo('seo', 'image', previewUrl); addChange('Imagem SEO'); }

        e.target.value = ''; // clean input
    };

    const friendlyNames: Record<string, Record<string, string>> = {
        hero: { title: 'Título do Hero', titleSize: 'Tamanho Texto Hero', subtitle: 'Subtítulo Hero', p1: 'Descrição Hero', bgImage: 'Imagem Hero' },
        differentiators: { title: 'Título Diferenciais', badgeText: 'Badge Garantia', badgeColor: 'Cor Badge Diferenciais', subtitle: 'Subtítulo Diferenciais', description1: 'Parágrafo 1 Diferenciais', description2: 'Parágrafo 2 Diferenciais' },
        categories: { title: 'Título Categorias' },
        about: { title: 'Título Sobre', badgeTitle: 'Título Badge Sobre', badgeSubtitle: 'Subtítulo Badge Sobre', subtitle: 'Subtítulo Sobre', description1: 'Parágrafo 1 Sobre', description2: 'Parágrafo 2 Sobre' },
        seo: { title: 'Título SEO', description: 'Descrição SEO' }
    };

    const updateSectionInfo = (section: string, key: string, value: string) => {
        setHome({ ...home, [section]: { ...(home[section] || {}), [key]: value } });

        const friendlyName = friendlyNames[section]?.[key] || `${section} ${key}`;
        addChange(friendlyName);
    };

    const updateItemArray = (section: string, index: number, key: string, value: string, arrayKey: string = 'items') => {
        const newArray = [...(home[section]?.[arrayKey] || [])];
        if (newArray[index]) {
            newArray[index][key] = value;
            setHome({ ...home, [section]: { ...home[section], [arrayKey]: newArray } });
        }

        const friendlyNameMap: Record<string, string> = {
            differentiators: 'Item dos Diferenciais',
            benefits: 'Item dos Benefícios',
            categories: 'Item de Categoria'
        };
        addChange(friendlyNameMap[section] || `Item do array ${section}`);
    };

    const addArrayItem = (section: string, defaultItem: any) => {
        const items = home[section]?.items ? [...home[section].items] : [];
        if (items.length >= 6) {
            triggerToast('O máximo de itens permitidos é 6', 'error');
            return;
        }
        setHome({ ...home, [section]: { ...home[section], items: [...items, defaultItem] } });
        addChange(`Adicionou novo item em ${section}`);
    };

    const removeArrayItem = (section: string, index: number) => {
        const items = home[section]?.items ? [...home[section].items] : [];
        if (items.length <= 1) {
            triggerToast('Você precisa manter pelo menos 1 item', 'error');
            return;
        }
        items.splice(index, 1);
        setHome({ ...home, [section]: { ...home[section], items } });
        addChange(`Removeu card de ${section}`);
    };

    const handleIconSelect = (iconName: string) => {
        if (iconModalFor) {
            updateItemArray(iconModalFor.section, iconModalFor.idx, 'icon', iconName);
            setIconModalFor(null);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white rounded-md border border-slate-200">
            <LayoutTemplate className="w-10 h-10 animate-pulse mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando página do repositório Git...</p>
        </div>
    );

    // CSS Classes reutilizáveis do design maduro WordPress-like (Menos sombra, bordas finas, box mais rigido)
    const cardClass = "bg-white p-5 rounded-sm border border-slate-200";
    const inputClass = "w-full bg-white border border-[#8c8f94] rounded-sm px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] transition-colors";
    const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
    const headerTitleClass = "text-sm font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200";

    return (
        <div className="w-full max-w-[1300px] mx-auto isolate relative pt-20 pb-12 px-6 flex flex-col xl:flex-row gap-8 items-start">

            {/* Modal de Seleção Dinâmica de Ícones (Z-Index Máximo) */}
            {iconModalFor && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-md shadow-2xl border border-slate-200 w-[500px] overflow-hidden flex flex-col">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                            <span className="font-semibold text-sm text-slate-800">Selecione um Ícone Visual</span>
                            <button type="button" onClick={() => setIconModalFor(null)} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
                        </div>
                        <div className="p-4 grid grid-cols-6 sm:grid-cols-7 gap-2 h-[320px] overflow-y-auto bg-white">
                            {POPULAR_ICONS.map(iconName => (
                                <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => handleIconSelect(iconName)}
                                    className="p-3 border border-slate-200 rounded-sm hover:border-[#2271b1] hover:bg-violet-50 flex items-center justify-center text-slate-600 hover:text-[#2271b1] transition-colors"
                                    title={iconName}
                                >
                                    <DynamicIcon name={iconName} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header Fixo WordPress-Style */}
            <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <a href={`/dashboard/cms/${siteId}/pages`} className="text-slate-600 hover:text-violet-600 transition-colors" title="Sair do Editor">
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                    <span className="font-semibold text-slate-800 text-sm">Editar Página: Home</span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setPreviewMode(!previewMode)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors hidden sm:flex">
                        {previewMode ? (
                            <><X className="w-4 h-4" /> Fechar</>
                        ) : (
                            <><Eye className="w-4 h-4" /> Preview</>
                        )}
                    </button>

                    <button type="button" onClick={handleSave} disabled={saving} className="bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
            </div>

            {/* O Editor Forms Principal */}
            <div className="flex-1 min-w-0 w-full space-y-6">
                <form onSubmit={handleSave} className="space-y-6">

                    {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium">{error}</div>}

                    {/* HERO (Banner) */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>1. Banner Principal (Hero)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Controle Tipográfico Adicionado */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                <div className="md:col-span-3">
                                    <label className={labelClass}>Título Principal (H1)</label>
                                    <input type="text" value={home?.hero?.title} onChange={e => updateSectionInfo('hero', 'title', e.target.value)} className={inputClass} />
                                </div>
                                <div className="md:col-span-1">
                                    <label className={labelClass}>Tamanho do Título</label>
                                    <select value={home?.hero?.titleSize || 'xlarge'} onChange={e => updateSectionInfo('hero', 'titleSize', e.target.value)} className={inputClass}>
                                        <option value="small">Pequeno</option>
                                        <option value="normal">Normal</option>
                                        <option value="large">Grande</option>
                                        <option value="xlarge">Gigante (Padrão)</option>
                                        <option value="giant">Massivo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Subtítulo Descritivo</label>
                                <textarea rows={2} value={home?.hero?.subtitle} onChange={e => updateSectionInfo('hero', 'subtitle', e.target.value)} className={`${inputClass} resize-y`}></textarea>
                            </div>
                            <div>
                                <label className={labelClass}>Label do Botão</label>
                                <input type="text" value={home?.hero?.btnText} onChange={e => updateSectionInfo('hero', 'btnText', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Link Original do Botão</label>
                                <input type="text" value={home?.hero?.btnLink} onChange={e => updateSectionInfo('hero', 'btnLink', e.target.value)} className={inputClass} />
                            </div>

                            {/* Uploader Integrado File Blob Hero */}
                            <div className="md:col-span-2 relative p-4 bg-slate-50 border border-slate-200 rounded">
                                <label className={labelClass}>Imagem de Fundo (Upload Local P/ Git)</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                                        onChange={(e) => handleFileSelect(e, 'heroImg')}
                                    />
                                    {pendingUploads['heroImg'] && <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-1 rounded font-bold uppercase shrink-0">Pendente de Push</span>}

                                </div>
                                {(home?.hero?.bgImage?.startsWith('blob:')) && (
                                    <div className="mt-4 w-full h-32 border border-slate-300 rounded overflow-hidden relative">
                                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-lg z-10">Nova Imagem Pronta!</div>
                                        <img src={getFullImageUrl(home?.hero?.bgImage)} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BENEFITS DA EMPRESA */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>2. Grade de Benefícios</h3>
                        <div className="mb-4">
                            <label className={labelClass}>Título da Seção</label>
                            <input type="text" value={home?.benefits?.title} onChange={e => updateSectionInfo('benefits', 'title', e.target.value)} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {home?.benefits?.items?.map((item: any, idx: number) => (
                                <div key={idx} className="p-5 border border-slate-200 bg-slate-50 rounded-xl shadow-sm flex flex-col gap-4 relative hover:border-violet-300 transition-colors">
                                    <div className="flex gap-4 items-start border-b border-slate-200 pb-4">
                                        <div className="shrink-0">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex flex-col items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setIconModalFor({ section: 'benefits', idx })}
                                                    className="w-12 h-12 mt-1 rounded-xl bg-white border border-slate-300 text-slate-700 hover:border-[#2271b1] hover:text-[#2271b1] hover:bg-violet-50 flex items-center justify-center transition-all shadow-sm"
                                                    title="Trocar Ícone"
                                                >
                                                    <DynamicIcon name={item.icon} className="w-6 h-6" />
                                                </button>
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Título</label>
                                            <input type="text" value={item.title} onChange={e => updateItemArray('benefits', idx, 'title', e.target.value)} className="w-full bg-transparent py-1 text-base font-bold text-slate-800 focus:outline-none" placeholder="Ex: Rápido" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição Textual</label>
                                        <textarea rows={3} value={item.desc} onChange={e => updateItemArray('benefits', idx, 'desc', e.target.value)} className="w-full bg-transparent py-1 text-sm text-slate-600 focus:outline-none resize-none" placeholder="Detalhes do benefício..." />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DIFFERENTIATORS (O que nos faz diferentes) */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>3. Seção Diferenciais</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Bloco Esquerda */}
                            <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl w-full">
                                <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-4">Bloco Formato Esquerdo (Mídia e Badge)</h4>
                                <div>
                                    <label className={labelClass}>Foto Lateral Esquerda</label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'diffImg')} className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-violet-50 file:text-violet-700 cursor-pointer w-full" />
                                            {pendingUploads['diffImg'] && <span className="text-[10px] bg-slate-100 text-slate-800 px-2 rounded-sm font-bold mx-2">Pendente</span>}
                                        </div>
                                        {(home?.differentiators?.image?.startsWith('blob:')) && (
                                            <div className="mt-2 w-full h-32 border border-slate-300 rounded overflow-hidden relative">
                                                <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow z-10">Nova Imagem Pronta!</div>
                                                <img src={getFullImageUrl(home?.differentiators?.image)} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="md:col-span-2 border border-slate-200 p-3 rounded bg-white">
                                        <label className={labelClass}>Texto Sobre a Imagem (Badge Garantia)</label>
                                        <input type="text" value={home?.differentiators?.badgeText || 'Garantia de Qualidade CNX'} onChange={e => updateSectionInfo('differentiators', 'badgeText', e.target.value)} className={inputClass} />
                                    </div>
                                    <div className="md:col-span-2 border border-slate-200 p-3 rounded bg-white">
                                        <label className={labelClass}>Cor do Card Fundo (Hex)</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={home?.differentiators?.badgeColor || '#dbeafe'} onChange={e => updateSectionInfo('differentiators', 'badgeColor', e.target.value)} className="w-10 h-10 p-0 border-0 bg-transparent rounded shadow-sm cursor-pointer shrink-0" />
                                            <input type="text" value={home?.differentiators?.badgeColor || '#dbeafe'} onChange={e => updateSectionInfo('differentiators', 'badgeColor', e.target.value)} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bloco Direita */}
                            <div className="flex flex-col gap-5 w-full">
                                <div>
                                    <label className={labelClass}>Título do Bloco Textual Direita</label>
                                    <input type="text" value={home?.differentiators?.title} onChange={e => updateSectionInfo('differentiators', 'title', e.target.value)} className={inputClass} />
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2 mb-3">Lista de Diferenciais</h4>
                                    <div className="space-y-3">
                                        {home?.differentiators?.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="p-4 border border-slate-200 bg-slate-50 flex flex-col gap-2 rounded-xl focus-within:border-violet-400 focus-within:shadow-md transition-all">
                                                <input type="text" value={item.title} onChange={e => updateItemArray('differentiators', idx, 'title', e.target.value)} className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none border-b border-slate-300 pb-1" placeholder="Título (ex: Inovação)" />
                                                <textarea rows={2} value={item.desc} onChange={e => updateItemArray('differentiators', idx, 'desc', e.target.value)} className="bg-transparent text-sm text-slate-600 focus:outline-none resize-y" placeholder="Descrição do diferencial..."></textarea>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CATEGORIAS (Explore por Categorias) */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>4. Seção Categorias</h3>
                        <div className="mb-4">
                            <label className={labelClass}>Título da Seção</label>
                            <input type="text" value={home?.categories?.title || 'Explore por Categorias'} onChange={e => updateSectionInfo('categories', 'title', e.target.value)} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {home?.categories?.items?.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 border border-slate-200 bg-slate-50 rounded-xl relative flex flex-col gap-4 group">
                                    <div className="flex flex-col gap-4 mb-auto">
                                        <div className="flex justify-between items-start">
                                            <button
                                                type="button"
                                                onClick={() => setIconModalFor({ section: 'categories', idx })}
                                                className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:border-[#2271b1] hover:text-[#2271b1] hover:bg-violet-50 flex items-center justify-center transition-all shadow-sm shrink-0"
                                                title="Trocar Ícone"
                                            >
                                                {item.icon && item.icon.length > 2 ? <DynamicIcon name={item.icon} className="w-6 h-6" /> : <span className="text-xl font-bold">{item.icon || '#'}</span>}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeArrayItem('categories', idx)}
                                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-all shadow-sm shrink-0"
                                                title="Lixeira / Apagar Card"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <input type="text" value={item.title} onChange={e => updateItemArray('categories', idx, 'title', e.target.value)} className="bg-transparent border-b border-transparent focus:border-slate-300 pb-1 text-lg font-bold text-slate-800 focus:outline-none transition-colors" placeholder="Nome Categoria" />
                                            <textarea rows={2} value={item.desc} onChange={e => updateItemArray('categories', idx, 'desc', e.target.value)} className="bg-transparent p-1 focus:bg-white focus:border focus:border-slate-200 rounded text-sm text-slate-600 focus:outline-none resize-none transition-colors" placeholder="Descrição da Categoria..." />
                                        </div>
                                    </div>

                                    <div className="mt-2 border-t border-slate-200 pt-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Destino do Botão</label>
                                        <input type="text" value={item.link} onChange={e => updateItemArray('categories', idx, 'link', e.target.value)} className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs text-violet-600 focus:border-[#2271b1] focus:outline-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(!home?.categories?.items || home.categories.items.length < 6) && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => addArrayItem('categories', { title: 'Nova Especialidade', desc: 'Edite a descrição curta aqui para aparecer no front', icon: 'Star', link: '/blog' })}
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded border border-slate-200 shadow-sm hover:bg-[#2271b1] hover:text-white hover:border-[#2271b1] transition-colors"
                                >
                                    + Adicionar Novo Card
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SOBRE NÓS E STATS */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>5. Texto Sobre e Contadores</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                            {/* Bloco Esquerda (Imagem Redonda + Badges Flutuantes) */}
                            <div className="border border-slate-200 p-5 bg-slate-50 flex flex-col gap-5 rounded-xl">
                                <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Bloco Esquerdo: Fotografia e Selo</h4>
                                <div>
                                    <label className={labelClass}>Imagem de Retrato Redonda</label>
                                    <div className="flex gap-4 items-center mb-3">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'aboutImg')} className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-violet-50 file:text-violet-700 cursor-pointer w-full" />
                                        {pendingUploads['aboutImg'] && <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-1 rounded font-bold uppercase shrink-0">Na Memória</span>}
                                    </div>
                                    {(home?.about?.image?.startsWith('blob:')) && (
                                        <div className="w-[180px] h-[180px] border-4 border-white shadow-xl rounded-full overflow-hidden relative mx-auto my-4">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">Nova Foto</div>
                                            <img src={getFullImageUrl(home?.about?.image)} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <div className="border border-slate-200 p-3 rounded bg-white shadow-sm">
                                        <label className={labelClass}>Parte 1 do Selo ("Experiência")</label>
                                        <input type="text" value={home?.about?.badgeTitle || 'Experiência'} onChange={e => updateSectionInfo('about', 'badgeTitle', e.target.value)} className={inputClass} placeholder="Ex: Experiência" />
                                    </div>
                                    <div className="border border-slate-200 p-3 rounded bg-white shadow-sm">
                                        <label className={labelClass}>Parte 2 do Selo ("Garantida")</label>
                                        <input type="text" value={home?.about?.badgeSubtitle || 'Garantida'} onChange={e => updateSectionInfo('about', 'badgeSubtitle', e.target.value)} className={inputClass} placeholder="Ex: Garantida" />
                                    </div>
                                </div>
                            </div>

                            {/* Bloco Direita (Textos de Venda e Checkers / Contadores) */}
                            <div className="flex flex-col gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-2">Bloco Direito: Depoimento e Metadados</h4>
                                    <div>
                                        <label className={labelClass}>Título Bloco História</label>
                                        <input type="text" value={home?.about?.title} onChange={e => updateSectionInfo('about', 'title', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Descrição Longa / Texto Livre</label>
                                        <textarea rows={5} value={home?.about?.desc} onChange={e => updateSectionInfo('about', 'desc', e.target.value)} className={`${inputClass} resize-y`}></textarea>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label className="block text-xs font-bold text-slate-500 mb-3 uppercase w-full border-b border-slate-200 pb-2">Marcos da Empresa (Painel Inferior)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {home?.about?.stats?.map((stat: any, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-1 bg-white p-3 rounded border border-slate-200 shadow-sm focus-within:border-violet-400">
                                                <input type="text" value={stat.value} onChange={e => updateItemArray('about', idx, 'value', e.target.value, 'stats')} className="bg-transparent border-b border-slate-100 py-1 text-2xl font-black text-slate-800 focus:border-violet-500 focus:outline-none" placeholder="ex: 12k+" />
                                                <input type="text" value={stat.label} onChange={e => updateItemArray('about', idx, 'label', e.target.value, 'stats')} className="bg-transparent py-1 text-xs font-bold text-slate-500 focus:outline-none uppercase" placeholder="ex: Clientes" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </form>
            </div>

            {/* Sidebar Persistente (SEO) */}
            <div className="w-full xl:w-[320px] shrink-0 sticky top-20 space-y-6 z-10">
                <div className="bg-white p-5 rounded-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-3 mb-5">Configurações globais da Página</h3>

                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">SEO e Social (Open Graph)</h4>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Título Otimizado (SEO)</label>
                                <input type="text" value={home?.seo?.title || ''} onChange={e => updateSectionInfo('seo', 'title', e.target.value)} className={inputClass} placeholder="Página Inicial | SEO" />
                            </div>
                            <div>
                                <label className={labelClass}>Meta Descrição</label>
                                <textarea rows={4} value={home?.seo?.description || ''} onChange={e => updateSectionInfo('seo', 'description', e.target.value)} className={`${inputClass} resize-y text-xs`} placeholder="Resumo de 160 caracteres para o Google..."></textarea>
                            </div>
                            <div>
                                <label className={labelClass}>Imagem Social (Capa)</label>
                                <p className="text-[10px] text-slate-500 mb-2 leading-tight">Miniatura exibida no WhatsApp/LinkedIn.</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, 'seoImg')}
                                    className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 rounded border border-slate-200 cursor-pointer"
                                />
                                {pendingUploads['seoImg'] && <span className="text-[10px] text-amber-600 mt-1 block font-bold">Upload Pendente no Git...</span>}
                                {(home?.seo?.image?.startsWith('blob:')) && (
                                    <div className="mt-3 relative rounded border border-slate-200 overflow-hidden bg-slate-50">
                                        <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-lg z-10">Nova Capa</div>
                                        <img src={getFullImageUrl(home?.seo?.image)} className="w-full aspect-video object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULLSCREEN PREVIEW INJECTED (Visível Apenas Quando Ativado) */}
            {previewMode && (
                <div className="fixed inset-0 w-full h-full z-[100] bg-white flex flex-col">
                    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-700 text-sm">Visualização Estática Vercel</span>
                        </div>
                        <button onClick={() => setPreviewMode(false)} className="text-slate-500 hover:text-slate-800 font-medium text-xs border border-transparent hover:border-slate-300 px-2 py-1 rounded transition-colors">Fechar (✕)</button>
                    </div>
                    {/* Componente iFrame apontando para o site via Proxy de Injeção de Live Preview */}
                    <div className="flex-1 relative bg-slate-100">
                        <iframe
                            ref={iframeRef}
                            key={fileSha}
                            src={`/api/cms/live-preview?url=${encodeURIComponent(formattedUrl)}`}
                            className="absolute inset-0 w-full h-full border-0 shadow-inner"
                            title="Preview Frame"
                            onLoad={(e) => {
                                // Garante que a injeção espere o documento Iframe nascer antes de enviar dados não-salvos!
                                const target = e.target as HTMLIFrameElement;
                                if (target.contentWindow && home) {
                                    target.contentWindow.postMessage({ type: 'LIVE_PREVIEW', data: home }, '*');
                                }
                            }}
                        />

                        {/* Status Bar na base indicando rebuild estático */}
                        {saving && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-4 py-1.5 rounded shadow-lg text-xs font-semibold animate-pulse">
                                Reconstruindo Artefatos Git...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
