import React, { useState, useEffect } from 'react';
import { Save, Loader2, ArrowLeft, LayoutTemplate, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { triggerToast } from './CmsToaster';

interface LegalSection {
    title: string;
    text: string;
}

interface TermosEditorProps {
    siteId: string;
    repoName: string;
    siteUrl: string;
}

export default function TermosEditor({ siteId, repoName, siteUrl }: TermosEditorProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [fileSha, setFileSha] = useState<string>('');
    const formattedUrl = siteUrl?.startsWith('http') ? siteUrl : `https://${siteUrl}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/terms.json' })
                });
                if (!res.ok) throw new Error('Erro ao buscar terms.json.');
                const json = await res.json();
                setData(JSON.parse(json.content));
                setFileSha(json.sha);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [repoName]);

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Salvando Termos de Uso...', 'progress', 20);

        try {
            const updatedData = {
                ...data,
                lastUpdated: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
            };

            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write', repo: repoName, path: 'src/data/terms.json',
                    content: JSON.stringify(updatedData, null, 2), sha: fileSha,
                    message: 'CMS: Atualização dos Termos de Uso'
                })
            });

            if (!res.ok) throw new Error('Falha ao salvar o arquivo.');
            const json = await res.json();
            setFileSha(json.sha);
            setData(updatedData);

            triggerToast('Termos atualizados! Processando build...', 'progress', 60);
            let prog = 60;
            const interval = setInterval(() => {
                prog += 4;
                if (prog >= 95) clearInterval(interval);
                else triggerToast('Reconstruindo site na Vercel...', 'progress', prog);
            }, 1000);
            setTimeout(() => {
                clearInterval(interval);
                triggerToast('Página publicada com sucesso!', 'success', 100, formattedUrl + '/termos');
                setSaving(false);
            }, 12000);

        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
            setSaving(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setData({ ...data, [key]: value });
    };

    const updateSeo = (key: string, value: string) => {
        setData({ ...data, seo: { ...(data.seo || {}), [key]: value } });
    };

    const addSection = () => {
        setData({ ...data, content: [...(data.content || []), { title: 'Nova Seção', text: 'Conteúdo aqui...' }] });
    };

    const updateSection = (index: number, field: keyof LegalSection, value: string) => {
        const newContent = [...(data.content || [])];
        newContent[index] = { ...newContent[index], [field]: value };
        setData({ ...data, content: newContent });
    };

    const removeSection = (index: number) => {
        if (!confirm('Excluir esta seção?')) return;
        const newContent = (data.content || []).filter((_: any, i: number) => i !== index);
        setData({ ...data, content: newContent });
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newContent = [...(data.content || [])];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newContent.length) return;
        [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
        setData({ ...data, content: newContent });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white">
            <LayoutTemplate className="w-10 h-10 animate-pulse mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando terms.json...</p>
        </div>
    );

    const cardClass = "bg-white p-5 rounded-sm border border-slate-200";
    const inputClass = "w-full bg-white border border-[#8c8f94] rounded-sm px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] transition-colors";
    const labelClass = "block text-xs font-semibold text-slate-700 mb-1";
    const headerTitleClass = "text-sm font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200";

    return (
        <div className="w-full max-w-[1300px] mx-auto isolate relative pt-20 pb-12 px-6 flex flex-col xl:flex-row gap-8 items-start">

            {/* Header Fixo */}
            <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <a href={`/dashboard/cms/${siteId}/pages`} className="text-slate-600 hover:text-violet-600 transition-colors" title="Sair do Editor">
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                    <span className="font-semibold text-slate-800 text-sm">Editar Página: Termos de Uso</span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={handleSave} disabled={saving} className="bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
            </div>

            {/* Editor Principal */}
            <div className="flex-1 min-w-0 w-full space-y-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium">{error}</div>}

                    {/* Título e Data */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>1. Informações da Página</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Título Principal (H1)</label>
                                <input type="text" value={data?.title || ''} onChange={e => updateField('title', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Última Atualização</label>
                                <input type="text" value={data?.lastUpdated || ''} onChange={e => updateField('lastUpdated', e.target.value)} className={inputClass} placeholder="Será preenchido automaticamente ao salvar" />
                            </div>
                        </div>
                    </div>

                    {/* Blocos de Conteúdo */}
                    <div className={cardClass}>
                        <h3 className={headerTitleClass}>2. Seções de Conteúdo</h3>
                        <div className="space-y-4">
                            {(data?.content || []).map((section: LegalSection, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-sm group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={e => updateSection(idx, 'title', e.target.value)}
                                                className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 flex-1"
                                                placeholder="Título da Seção"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => moveSection(idx, 'up')} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-[#2271b1] rounded"><ChevronUp className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => moveSection(idx, 'down')} disabled={idx === (data?.content?.length || 0) - 1} className="p-1.5 text-slate-400 hover:text-[#2271b1] rounded"><ChevronDown className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => removeSection(idx)} className="p-1.5 text-slate-400 hover:text-red-600 rounded ml-1"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={section.text}
                                        onChange={e => updateSection(idx, 'text', e.target.value)}
                                        rows={5}
                                        className={`${inputClass} resize-y`}
                                        placeholder="Texto jurídico da seção..."
                                    />
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addSection}
                                className="w-full py-6 border-2 border-dashed border-slate-200 rounded-sm text-slate-500 hover:text-[#2271b1] hover:border-[#2271b1] hover:bg-violet-50/20 transition-all font-bold flex items-center justify-center gap-2 text-xs uppercase"
                            >
                                <Plus className="w-5 h-5" />
                                Adicionar Nova Seção
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Sidebar SEO */}
            <div className="w-full xl:w-[320px] shrink-0 sticky top-20 space-y-6 z-10">
                <div className="bg-white p-5 rounded-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-3 mb-5">Configurações globais da Página</h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Título Otimizado (SEO)</label>
                            <input type="text" value={data?.seo?.title || ''} onChange={e => updateSeo('title', e.target.value)} className={inputClass} placeholder="Termos de Uso | SEO" />
                        </div>
                        <div>
                            <label className={labelClass}>Meta Descrição</label>
                            <textarea rows={4} value={data?.seo?.description || ''} onChange={e => updateSeo('description', e.target.value)} className={`${inputClass} resize-y text-xs`} placeholder="Resumo de 160 caracteres..." />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
