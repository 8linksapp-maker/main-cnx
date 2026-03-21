import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Plus, Trash2, FileText, X, ArrowLeft, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { triggerToast } from './CmsToaster';

interface LegalSection {
    title: string;
    text: string;
}

interface LegalData {
    title: string;
    lastUpdated: string;
    content: LegalSection[];
}

interface LegalEditorProps {
    siteId: string;
    repoName: string;
    siteUrl: string;
    initialTab?: 'privacy' | 'terms';
}

export default function LegalEditor({ siteId, repoName, siteUrl, initialTab = 'privacy' }: LegalEditorProps) {
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);
    const [previewMode, setPreviewMode] = useState(false);
    const formattedUrl = siteUrl?.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    const previewUrl = `${formattedUrl}/${activeTab === 'privacy' ? 'privacidade' : 'termos'}`;

    const [privacyData, setPrivacyData] = useState<LegalData | null>(null);
    const [termsData, setTermsData] = useState<LegalData | null>(null);
    const [privacySha, setPrivacySha] = useState<string>('');
    const [termsSha, setTermsSha] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLegal = async () => {
            setLoading(true);
            try {
                // Fetch Privacy
                const privRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/privacy.json' })
                });
                if (privRes.ok) {
                    const data = await privRes.json();
                    setPrivacyData(JSON.parse(data.content));
                    setPrivacySha(data.sha);
                }

                // Fetch Terms
                const termsRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/terms.json' })
                });
                if (termsRes.ok) {
                    const data = await termsRes.json();
                    setTermsData(JSON.parse(data.content));
                    setTermsSha(data.sha);
                }
            } catch (err: any) {
                setError('Erro ao carregar dados jurídicos. Verifique se os arquivos existem no repositório.');
            } finally {
                setLoading(false);
            }
        };
        fetchLegal();
    }, [repoName]);

    const handleSave = async (type: 'privacy' | 'terms') => {
        setSaving(true);
        const data = type === 'privacy' ? privacyData : termsData;
        const sha = type === 'privacy' ? privacySha : termsSha;
        const path = type === 'privacy' ? 'src/data/privacy.json' : 'src/data/terms.json';

        if (!data) return;

        // Atualiza a data de última atualização
        const updatedData = {
            ...data,
            lastUpdated: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        };

        triggerToast(`Salvando ${type === 'privacy' ? 'Privacidade' : 'Termos'}...`, 'progress', 30);

        try {
            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write',
                    repo: repoName,
                    path: path,
                    content: JSON.stringify(updatedData, null, 2),
                    sha: sha || undefined,
                    message: `CMS: Update ${path}`
                })
            });

            if (!res.ok) throw new Error('Falha ao salvar no GitHub.');

            const resData = await res.json();
            if (type === 'privacy') {
                setPrivacySha(resData.sha);
                setPrivacyData(updatedData);
            } else {
                setTermsSha(resData.sha);
                setTermsData(updatedData);
            }
            triggerToast('Alterações salvas com sucesso!', 'success', 100);
        } catch (err: any) {
            triggerToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const addSection = (type: 'privacy' | 'terms') => {
        const setData = type === 'privacy' ? setPrivacyData : setTermsData;
        const currentData = type === 'privacy' ? privacyData : termsData;
        if (!currentData) return;

        setData({
            ...currentData,
            content: [...currentData.content, { title: 'Nova Seção', text: 'Conteúdo aqui...' }]
        });
    };

    const updateSection = (type: 'privacy' | 'terms', index: number, field: keyof LegalSection, value: string) => {
        const setData = type === 'privacy' ? setPrivacyData : setTermsData;
        const currentData = type === 'privacy' ? privacyData : termsData;
        if (!currentData) return;

        const newContent = [...currentData.content];
        newContent[index] = { ...newContent[index], [field]: value };
        setData({ ...currentData, content: newContent });
    };

    const removeSection = (type: 'privacy' | 'terms', index: number) => {
        if (!confirm('Excluir esta seção?')) return;
        const setData = type === 'privacy' ? setPrivacyData : setTermsData;
        const currentData = type === 'privacy' ? privacyData : termsData;
        if (!currentData) return;

        const newContent = currentData.content.filter((_: any, i: number) => i !== index);
        setData({ ...currentData, content: newContent });
    };

    const moveSection = (type: 'privacy' | 'terms', index: number, direction: 'up' | 'down') => {
        const setData = type === 'privacy' ? setPrivacyData : setTermsData;
        const currentData = type === 'privacy' ? privacyData : termsData;
        if (!currentData) return;

        const newContent = [...currentData.content];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newContent.length) return;

        [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
        setData({ ...currentData, content: newContent });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white rounded-md border border-slate-200">
            <FileText className="w-10 h-10 animate-pulse mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Buscando página do repositório Git...</p>
        </div>
    );

    const currentData = activeTab === 'privacy' ? privacyData : termsData;

    return (
        <div className="w-full max-w-[1300px] mx-auto isolate relative pt-20 pb-12 px-6 flex flex-col xl:flex-row gap-8 items-start">

            {/* Header Fixo WordPress-Style */}
            <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <a href={`/dashboard/cms/${siteId}/pages`} className="text-slate-600 hover:text-violet-600 transition-colors" title="Sair do Editor">
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                    <span className="font-semibold text-slate-800 text-sm">Editar Página: {activeTab === 'privacy' ? 'Privacidade' : 'Termos de Uso'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setPreviewMode(!previewMode)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-sm border border-slate-300 text-sm font-medium transition-colors hidden sm:block">
                        {previewMode ? "Fechar Visor" : "Visualizar Parte A Parte ◨"}
                    </button>

                    <button type="button" onClick={() => handleSave(activeTab)} disabled={saving} className="bg-[#2271b1] hover:bg-[#135e96] disabled:opacity-50 text-white px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 w-full space-y-6">
                {/* Tabs de Seleção */}
                <div className="flex p-1 bg-slate-100 rounded-sm w-fit border border-slate-200">
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-all ${activeTab === 'privacy' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Política de Privacidade
                    </button>
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-all ${activeTab === 'terms' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Termos de Uso
                    </button>
                </div>

                {/* Editor Area */}
                {currentData ? (
                    <div className="space-y-6">
                        <div className="bg-white p-5 px-8 rounded-sm border border-slate-200 shadow-sm sticky top-14 z-40">
                            <h2 className="text-sm font-bold text-slate-800">{currentData.title}</h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                Última atualização: {currentData.lastUpdated}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {currentData.content.map((section: LegalSection, idx: number) => (
                                <div key={idx} className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm group">
                                    <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                #{idx + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={section.title}
                                                onChange={(e) => updateSection(activeTab, idx, 'title', e.target.value)}
                                                className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 w-full md:w-96"
                                                placeholder="Título da Seção"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveSection(activeTab, idx, 'up')} disabled={idx === 0} className="p-2 text-slate-400 hover:text-[#2271b1] hover:bg-violet-50 focus:outline-none transition-colors"><ChevronUp className="w-4 h-4" /></button>
                                            <button onClick={() => moveSection(activeTab, idx, 'down')} disabled={idx === currentData.content.length - 1} className="p-2 text-slate-400 hover:text-[#2271b1] hover:bg-violet-50 focus:outline-none transition-colors"><ChevronDown className="w-4 h-4" /></button>
                                            <button onClick={() => removeSection(activeTab, idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 focus:outline-none transition-colors ml-2"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={section.text}
                                        onChange={(e) => updateSection(activeTab, idx, 'text', e.target.value)}
                                        rows={6}
                                        className="w-full bg-white border border-[#8c8f94] rounded-sm px-4 py-3 text-slate-800 text-sm leading-relaxed focus:outline-none focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] transition-colors resize-none"
                                        placeholder="Escreva o texto jurídico aqui..."
                                    />
                                </div>
                            ))}

                            <button
                                onClick={() => addSection(activeTab)}
                                className="w-full py-8 border-2 border-dashed border-slate-200 rounded-sm text-slate-500 hover:text-[#2271b1] hover:border-[#2271b1] hover:bg-violet-50/20 transition-all font-bold flex flex-col items-center justify-center gap-2 text-xs uppercase"
                            >
                                <Plus className="w-6 h-6" />
                                Adicionar Nova Seção / Bloco de Texto
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 bg-red-50 border border-red-100 rounded-sm text-red-700 flex items-center gap-4">
                        <AlertCircle className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">Arquivo não encontrado</p>
                            <p className="text-sm opacity-80">Não foi possível localizar o arquivo JSON correspondente no repositório.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* SPLIT SCREEN PREVIEW INJECTED (Identico ao HomeEditor) */}
            {previewMode && (
                <div className="fixed inset-y-0 right-0 w-[45%] lg:w-1/2 min-w-[400px] z-[60] bg-white border-l border-slate-300 shadow-2xl flex flex-col">
                    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-700 text-sm">Visualização Estática Vercel</span>
                        </div>
                        <button onClick={() => setPreviewMode(false)} className="text-slate-500 hover:text-slate-800 font-medium text-xs border border-transparent hover:border-slate-300 px-2 py-1 rounded transition-colors">Fechar (✕)</button>
                    </div>
                    <div className="flex-1 relative bg-slate-100">
                        <iframe key={`${activeTab}-${privacySha}-${termsSha}`} src={previewUrl} className="absolute inset-0 w-full h-full border-0 shadow-inner" title="Preview Frame" />
                        {saving && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#2271b1] text-white px-4 py-1.5 rounded shadow-lg text-xs font-semibold animate-pulse">
                                Reconstruindo Artefatos Git...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
