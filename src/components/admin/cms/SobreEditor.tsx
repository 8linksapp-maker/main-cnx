import React, { useState, useEffect } from 'react';
import { Save, Loader2, ArrowLeft, Settings, X, LayoutTemplate } from 'lucide-react';
import { triggerToast } from './CmsToaster';

interface SobreEditorProps {
    siteId: string;
    repoName: string;
    siteUrl: string;
}

export default function SobreEditor({ siteId, repoName, siteUrl }: SobreEditorProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const formattedUrl = siteUrl?.startsWith('http') ? siteUrl : `https://${siteUrl}`;

    const getFullImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
        let cleanPath = path.startsWith('public/') ? path.replace('public/', '/') : path;
        cleanPath = cleanPath.trim().startsWith('/') ? cleanPath.trim() : `/${cleanPath.trim()}`;
        const cleanSiteUrl = formattedUrl.trim().endsWith('/') ? formattedUrl.trim().slice(0, -1) : formattedUrl.trim();
        const cacheBuster = `?cb=${new Date().getTime()}`;
        return `${cleanSiteUrl}${cleanPath}${cacheBuster}`;
    };

    const [sobre, setSobre] = useState<any>(null);
    const [fileSha, setFileSha] = useState<string>('');
    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});

    useEffect(() => {
        const fetchSobre = async () => {
            try {
                const res = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/sobre.json' })
                });

                if (!res.ok) throw new Error('Erro ao buscar sobre.json.');
                const data = await res.json();
                setSobre(JSON.parse(data.content));
                setFileSha(data.sha);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSobre();
    }, [repoName]);

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
        setSaving(true); setError('');

        triggerToast('Sincronizando conteúdo da Página Sobre...', 'progress', 20);

        try {
            let finalJson = { ...sobre };

            for (const [keyPath, fileObj] of Object.entries(pendingUploads)) {
                const base64Content = await fileToBase64(fileObj);
                const fileExt = fileObj.name.split('.').pop() || 'jpg';
                const ghPath = `public/uploads/${Date.now()}-${keyPath}.${fileExt}`;

                const uploadRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'write', repo: repoName, path: ghPath, content: base64Content, isBase64: true, message: `Upload imagem ${ghPath}`
                    })
                });

                if (!uploadRes.ok) throw new Error(`Falha ao subir a imagem ${keyPath}.`);

                const publicUrlPath = ghPath.replace('public', '');

                if (keyPath === 'heroImg') finalJson.hero.image = publicUrlPath;
                if (keyPath === 'seoImg') {
                    if (!finalJson.seo) finalJson.seo = {};
                    finalJson.seo.image = publicUrlPath;
                }
            }

            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write', repo: repoName, path: 'src/data/sobre.json', content: JSON.stringify(finalJson, null, 2), sha: fileSha, message: 'CMS: Customização da Página Sobre'
                })
            });

            if (!res.ok) throw new Error('Falha ao salvar o arquivo json.');
            const data = await res.json();

            setFileSha(data.sha);
            setSobre(finalJson);
            setPendingUploads({});

            triggerToast('História sincronizada! Processando build do layout...', 'progress', 60);

            let prog = 60;
            const interval = setInterval(() => {
                prog += 4;
                if (prog >= 95) clearInterval(interval);
                else triggerToast('Reconstruindo site na nuvem da Vercel...', 'progress', prog);
            }, 1000);

            setTimeout(() => {
                clearInterval(interval);
                triggerToast('Página atualizada com sucesso!', 'success', 100, formattedUrl);
                setSaving(false);
            }, 12000);

        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
            setSaving(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, uiKey: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPendingUploads(prev => ({ ...prev, [uiKey]: file }));
        const previewUrl = URL.createObjectURL(file);

        if (uiKey === 'heroImg') updateSectionInfo('hero', 'image', previewUrl);
        if (uiKey === 'seoImg') updateSectionInfo('seo', 'image', previewUrl);

        e.target.value = '';
    };

    const updateSectionInfo = (section: string, key: string, value: string) => {
        setSobre({ ...sobre, [section]: { ...(sobre[section] || {}), [key]: value } });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white">
            <LayoutTemplate className="w-10 h-10 animate-pulse mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando sobre.json...</p>
        </div>
    );

    const cardClass = "p-8 mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm";
    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
    const headerTitleClass = "text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-4 flex items-center gap-2";

    return (
        <div className="w-full max-w-[1300px] mx-auto isolate relative pt-20 pb-12 px-6 flex flex-col xl:flex-row gap-8 items-start">

            <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <a href={`/dashboard/cms/${siteId}/pages`} className="text-slate-600 hover:text-violet-600 transition-colors" title="Sair do Editor">
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                    <span className="font-semibold text-slate-800 text-sm">Editar Página: Sobre Nós</span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-violet-600/20">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 w-full space-y-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium">{error}</div>}

                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>1. Banner da História (Hero)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Título Principal (H1)</label>
                                <input type="text" value={sobre?.hero?.title} onChange={e => updateSectionInfo('hero', 'title', e.target.value)} className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Parágrafo Descritivo de Abertura</label>
                                <textarea rows={4} value={sobre?.hero?.desc} onChange={e => updateSectionInfo('hero', 'desc', e.target.value)} className={`${inputClass} resize-y`}></textarea>
                            </div>
                            <div className="md:col-span-2 bg-slate-50 p-4 border border-slate-200 rounded">
                                <label className={labelClass}>Foto Histórica da Empresa</label>
                                <input type="file" accept="image/*" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer" onChange={(e) => handleFileSelect(e, 'heroImg')} />
                                {pendingUploads['heroImg'] && <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-1 rounded font-bold uppercase shrink-0">Upload Pendente</span>}
                                {sobre?.hero?.image && (
                                    <div className="mt-4 w-full h-[250px] border border-slate-300 rounded overflow-hidden">
                                        <img src={getFullImageUrl(sobre?.hero?.image)} className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>2. Conteúdo da História</h3>
                        <div className="space-y-6">
                            <div>
                                <label className={labelClass}>Título Bloco 1 (Missão)</label>
                                <input type="text" value={sobre?.content?.missionTitle} onChange={e => updateSectionInfo('content', 'missionTitle', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Texto da Missão</label>
                                <textarea rows={4} value={sobre?.content?.missionText} onChange={e => updateSectionInfo('content', 'missionText', e.target.value)} className={`${inputClass} resize-y`}></textarea>
                            </div>

                            <hr className="border-slate-200" />

                            <div>
                                <label className={labelClass}>Título Bloco 2 (Equipe)</label>
                                <input type="text" value={sobre?.content?.teamTitle} onChange={e => updateSectionInfo('content', 'teamTitle', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Texto da Equipe</label>
                                <textarea rows={4} value={sobre?.content?.teamText} onChange={e => updateSectionInfo('content', 'teamText', e.target.value)} className={`${inputClass} resize-y`}></textarea>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Sidebar Persistente (SEO) */}
            <div className="w-full xl:w-[320px] shrink-0 sticky top-20 space-y-6 z-10">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-3 mb-5">Configurações globais</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Título Otimizado (SEO)</label>
                            <input type="text" value={sobre?.seo?.title || ''} onChange={e => updateSectionInfo('seo', 'title', e.target.value)} className={inputClass} placeholder="Sobre Nós | SEO" />
                        </div>
                        <div>
                            <label className={labelClass}>Meta Descrição</label>
                            <textarea rows={4} value={sobre?.seo?.description || ''} onChange={e => updateSectionInfo('seo', 'description', e.target.value)} className={`${inputClass} resize-y text-xs`}></textarea>
                        </div>
                        <div>
                            <label className={labelClass}>Imagem Social (Open Graph)</label>
                            <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'seoImg')} className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-violet-50 file:text-violet-700" />
                            {pendingUploads['seoImg'] && <span className="text-[10px] text-amber-600 block font-bold">Pendente...</span>}
                            {sobre?.seo?.image && <img src={getFullImageUrl(sobre?.seo?.image)} className="w-full aspect-video object-cover mt-3 rounded" />}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
