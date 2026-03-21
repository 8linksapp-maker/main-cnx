import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Loader2, ArrowLeft, Image as ImageIcon, Calendar, Eye, Edit3 } from 'lucide-react';
import { marked } from 'marked';
import { triggerToast } from './CmsToaster';

interface PostEditorProps {
    siteId: string;
    repoName: string;
    filePath: string | null;
}

export default function PostEditor({ siteId, repoName, filePath }: PostEditorProps) {
    const isEditing = !!filePath;

    // States
    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [authors, setAuthors] = useState<any[]>([]);
    const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

    const [fileSha, setFileSha] = useState<string>('');

    // Função utilitária para converter TUDO para o formato YYYY-MM-DD nativo do Calendário HTML
    const formatDateForInput = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            return d.toISOString().split('T')[0];
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    };

    const [post, setPost] = useState({
        title: '',
        slug: '',
        description: '',
        pubDate: new Date().toISOString().split('T')[0],
        heroImage: '',
        category: '',
        author: '',
        draft: false,
        content: ''
    });

    const formattedUrl = `https://${repoName.split('/')[1]}.vercel.app`;

    const getFullImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
        // fallback legacy public/ image string
        let cleanPath = path.startsWith('public/') ? path.replace('public/', '/') : path;
        cleanPath = cleanPath.trim().startsWith('/') ? cleanPath.trim() : `/${cleanPath.trim()}`;
        const cleanSiteUrl = formattedUrl.trim().endsWith('/') ? formattedUrl.trim().slice(0, -1) : formattedUrl.trim();
        const cacheBuster = `?cb=${new Date().getTime()}`;
        return `${cleanSiteUrl}${cleanPath}${cacheBuster}`;
    };

    const [pendingUploads, setPendingUploads] = useState<Record<string, File>>({});
    const [isPreview, setIsPreview] = useState(false);

    // Quill Editor Dynamic Load
    const [QuillEditor, setQuillEditor] = useState<any>(null);

    useEffect(() => {
        import('react-quill-new').then(mod => {
            setQuillEditor(() => mod.default);
        });
        import('react-quill-new/dist/quill.snow.css');
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Fetch Authors (Independente da Home)
                try {
                    const authRes = await fetch('/api/cms/github', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/authors.json' })
                    });
                    if (authRes.ok) {
                        const data = await authRes.json();
                        const parsed = JSON.parse(data.content);
                        if (Array.isArray(parsed)) setAuthors(parsed);
                    }
                } catch (e) {
                    console.error("Erro ao buscar autores:", e);
                    triggerToast('Aviso: Não foi possível carregar a lista de autores do GitHub.', 'error');
                }

                // 2. Fetch de Categorias (Gerenciador Central)
                let allPossibleCategories = new Set<string>();
                try {
                    const catRes = await fetch('/api/cms/github', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/categories.json' })
                    });
                    if (catRes.ok) {
                        const catData = await catRes.json();
                        const parsedCats = JSON.parse(catData.content);
                        if (Array.isArray(parsedCats)) {
                            parsedCats.forEach((cat: string) => allPossibleCategories.add(cat));
                        }
                    }
                    if (allPossibleCategories.size > 0) {
                        setDynamicCategories(Array.from(allPossibleCategories));
                    }
                } catch (e) { console.error("Erro ao carregar categorias:", e); }

                if (isEditing && filePath) {
                    const fileRes = await fetch('/api/cms/github', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'read', repo: repoName, path: filePath })
                    });

                    if (!fileRes.ok) throw new Error('Não foi possível carregar o arquivo. Talvez tenha sido renomeado ou excluído da nuvem.');
                    const fileData = await fileRes.json();
                    setFileSha(fileData.sha);

                    const text = fileData.content;
                    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

                    if (match) {
                        const fm = match[1];
                        const body = match[2].trim();

                        const extract = (key: string) => {
                            const reg = new RegExp(`${key}:\\s*(?:"([^"]*)"|'([^']*)'|(.*))`);
                            const m = fm.match(reg);
                            if (m) return (m[1] || m[2] || m[3] || '').trim();
                            return '';
                        };

                        const parsedHtml = await marked.parse(body);

                        setPost({
                            title: extract('title'),
                            slug: filePath.split('/').pop()?.replace('.md', '') || '',
                            description: extract('description'),
                            pubDate: extract('pubDate') ? formatDateForInput(extract('pubDate')) : new Date().toISOString().split('T')[0],
                            heroImage: extract('heroImage'),
                            category: extract('category') || 'Geral',
                            author: extract('author'),
                            draft: extract('draft') === 'true',
                            content: parsedHtml
                        });
                    } else {
                        const parsedHtml = await marked.parse(text);
                        setPost(p => ({ ...p, content: parsedHtml, slug: filePath.split('/').pop()?.replace('.md', '') || '' }));
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [repoName, filePath, isEditing]);

    const handleTitleChange = (val: string) => {
        setPost(p => ({
            ...p,
            title: val,
            slug: isEditing ? p.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        }));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, uiKey: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPendingUploads(prev => ({ ...prev, [uiKey]: file }));
        const previewUrl = URL.createObjectURL(file);

        if (uiKey === 'heroImage') setPost(p => ({ ...p, heroImage: previewUrl }));
        e.target.value = '';
    };

    const extractAndUploadInlineImages = async (html: string) => {
        const imgRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g;
        let modifiedHtml = html;
        const matches = [...html.matchAll(imgRegex)];

        for (const m of matches) {
            const ext = m[1];
            const base64Content = m[2];

            const ghPath = `public/uploads/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
            const uploadRes = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write', repo: repoName, path: ghPath, content: base64Content, isBase64: true, message: `Upload imagem inline ${ghPath}`
                })
            });

            if (!uploadRes.ok) throw new Error('Falha na rede ao subir a imagem anexada ao post.');
            const publicUrlPath = ghPath.replace('public', '');

            modifiedHtml = modifiedHtml.replace(`data:image/${ext};base64,${base64Content}`, publicUrlPath);
        }
        return modifiedHtml;
    };


    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!post.title || !post.slug) {
            setError('Título e Slug (URL) são obrigatórios.');
            return;
        }

        setSaving(true); setError('');

        triggerToast('Processando e salvando artigo no GitHub...', 'progress', 20);

        try {
            let finalHeroImage = post.heroImage;
            if (pendingUploads['heroImage']) {
                const fileObj = pendingUploads['heroImage'];
                const base64Content = await fileToBase64(fileObj);
                const fileExt = fileObj.name.split('.').pop() || 'jpg';
                const ghPath = `public/uploads/${Date.now()}-blog-cover.${fileExt}`;

                const uploadRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'write', repo: repoName, path: ghPath, content: base64Content, isBase64: true, message: `Upload capa blog ${ghPath}`
                    })
                });

                if (!uploadRes.ok) throw new Error(`Falha ao subir a imagem principal de capa.`);
                finalHeroImage = ghPath.replace('public', '');
            }

            const finalHtmlContent = await extractAndUploadInlineImages(post.content);

            const markdown = `---
title: "${post.title.replace(/"/g, '\\"')}"
description: "${post.description.replace(/"/g, '\\"')}"
pubDate: "${post.pubDate}"
heroImage: "${finalHeroImage}"
category: "${post.category}"
author: "${post.author}"
draft: ${post.draft}
---
${finalHtmlContent}`;

            const targetPath = `src/content/blog/${post.slug}.md`;

            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write',
                    repo: repoName,
                    path: targetPath,
                    content: markdown,
                    sha: fileSha || undefined,
                    message: `CMS: ${isEditing ? 'Edição' : 'Criação'} do artigo ${post.slug}`
                })
            });

            if (!res.ok) {
                const errPayload = await res.json();
                throw new Error(errPayload.error || 'Erro ao publicar arquivo na nuvem.');
            }

            const data = await res.json();
            setFileSha(data.sha);
            setPost(p => ({ ...p, heroImage: finalHeroImage, content: finalHtmlContent }));
            setPendingUploads({});

            triggerToast('Artigo integrado! Engatilhando Deploy na Vercel...', 'progress', 60);

            let prog = 60;
            const interval = setInterval(() => {
                prog += 4;
                if (prog >= 95) clearInterval(interval);
                else triggerToast('Reconstruindo site na nuvem da Vercel...', 'progress', prog);
            }, 1000);

            setTimeout(() => {
                clearInterval(interval);
                triggerToast('Artigo publicado e online com sucesso!', 'success', 100, `https://${repoName.split('/')[1]}.vercel.app/blog/${post.slug}`);
                setSaving(false);
                if (!isEditing) {
                    setTimeout(() => { window.location.href = `/dashboard/cms/${siteId}/posts`; }, 1000);
                }
            }, 12000);

        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
            setSaving(false);
        }
    };

    if (loading || !QuillEditor) return (
        <div className="flex flex-col items-center justify-center p-32 text-slate-400 bg-white">
            <Loader2 className="w-10 h-10 animate-spin mb-6 text-slate-300" />
            <p className="font-semibold text-sm animate-pulse text-slate-500">Montando os Módulos Visuais e Conteúdos...</p>
        </div>
    );

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const selectClass = `${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em] pr-10`;
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean']
        ]
    };

    return (
        <div className="w-full max-w-[1300px] mx-auto isolate relative pt-20 pb-12 px-6 flex flex-col xl:flex-row gap-8 items-start">

            <style>{`
                /* Barra de ferramentas flutuante atrelada ao foco na área Zen */
                .quill-zen .ql-toolbar {
                    border: 1px solid #e2e8f0; border-radius: 8px;
                    background: #ffffff;
                    padding: 8px 16px;
                    position: sticky;
                    top: 66px;
                    z-index: 40;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(-5px);
                    transition: all 0.2s ease-in-out;
                    margin-bottom: 1rem;
                }

                .quill-zen:focus-within .ql-toolbar {
                    opacity: 1;
                    pointer-events: auto;
                    transform: translateY(0);
                }

                .quill-zen .ql-container {
                    border: none !important;
                    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                    font-size: 1.125rem;
                    line-height: 1.8;
                }
                .quill-zen .ql-editor {
                    min-height: 600px;
                    padding: 16px 0;
                }
                .quill-zen .ql-editor p {
                    margin-bottom: 1.5em;
                }

                /* --- Personalização do Dropdown de Cabeçalhos (H1-H6) --- */
                .quill-zen .ql-toolbar .ql-picker.ql-header {
                    width: 150px;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0; border-radius: 8px;
                    border-radius: 0.75rem; /* rounded-xl */
                    padding: 0 12px;
                    height: 38px;
                    display: inline-flex;
                    align-items: center;
                    transition: all 0.2s;
                    margin-right: 12px;
                }
                .quill-zen .ql-toolbar .ql-picker.ql-header:hover {
                    background-color: #ffffff;
                    border-color: #cbd5e1;
                }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label {
                    border: none;
                    font-size: 14px;
                    font-weight: 500;
                    color: #334155;
                    padding-left: 0;
                    outline: none;
                    display: flex;
                    align-items: center;
                }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label::before {
                    line-height: normal;
                    content: 'Parágrafo' !important;
                }
                
                /* Traduções do Dropdown fechado */
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="1"]::before { content: 'Título 1 (H1)' !important; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="2"]::before { content: 'Título 2 (H2)' !important; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="3"]::before { content: 'Título 3 (H3)' !important; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="4"]::before { content: 'Título 4 (H4)' !important; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="5"]::before { content: 'Título 5 (H5)' !important; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-label[data-value="6"]::before { content: 'Título 6 (H6)' !important; }

                /* Caixa do menu em si */
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-options {
                    margin-top: 8px;
                    border: 1px solid #e2e8f0; border-radius: 8px;
                    border-radius: 0.75rem; /* rounded-xl */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    padding: 8px;
                    background-color: #ffffff;
                }

                /* Opções do Menu (Itens) */
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item {
                    border-radius: 0.5rem;
                    padding: 8px 12px !important;
                    color: #475569;
                    font-size: 14px;
                    transition: all 0.15s;
                    margin-bottom: 2px;
                }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item:hover {
                    background-color: #f1f5f9;
                    color: #0f172a;
                }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item::before { content: 'Parágrafo' !important; }
                
                /* Diferenciação Visual Inteligente dos Itens Abertos */
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="1"]::before { content: 'Título 1 (H1)' !important; font-size: 1.4em; font-weight: 800; color: #0f172a; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="2"]::before { content: 'Título 2 (H2)' !important; font-size: 1.25em; font-weight: 700; color: #1e293b; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="3"]::before { content: 'Título 3 (H3)' !important; font-size: 1.1em; font-weight: 600; color: #334155; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="4"]::before { content: 'Título 4 (H4)' !important; font-weight: 600; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="5"]::before { content: 'Título 5 (H5)' !important; font-weight: 600; }
                .quill-zen .ql-toolbar .ql-picker.ql-header .ql-picker-item[data-value="6"]::before { content: 'Título 6 (H6)' !important; font-weight: 600; }

                /* Arredondamento dos outros botões de ícone (Negrito/Link/Foto) */
                .quill-zen .ql-toolbar button {
                    border-radius: 0.375rem;
                    transition: background 0.15s;
                }
                .quill-zen .ql-toolbar button:hover {
                    background: #f1f5f9;
                }
            `}</style>


            <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <a href={`/dashboard/cms/${siteId}/posts`} className="text-slate-600 hover:text-violet-600 transition-colors" title="Voltar para os Posts">
                        <ArrowLeft className="w-5 h-5" />
                    </a>
                    <span className="font-semibold text-slate-800 text-sm">{isEditing ? 'Editar Post' : 'Novo Post'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setIsPreview(!isPreview)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-1.5 rounded-sm text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                        {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isPreview ? 'Continuar Editando' : 'Pré-visualizar'}
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-violet-600/20">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'Atualizando...' : 'Atualizar Publicação'}
                    </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 w-full space-y-6">
                {error && <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 text-sm font-medium flex gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                <div className="flex flex-col p-8 md:p-12 quill-zen min-h-[700px] bg-white rounded-2xl border border-slate-200 shadow-sm">
                    {isPreview ? (
                        <div className="prose pred-slate pred-lg max-w-none w-full break-words overflow-hidden pb-10">
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-8 border-b border-slate-100 pb-8 break-words">{post.title || 'Artigo sem título'}</h1>
                            {post.heroImage && (
                                <img src={post.heroImage} alt="Capa" className="w-full h-auto rounded-xl mb-10 shadow-sm border border-slate-100" />
                            )}
                            <div className="quill-zen-content w-full max-w-full" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: post.content }} />
                        </div>
                    ) : (
                        <>
                            <textarea
                                rows={1}
                                placeholder="Adicionar título"
                                value={post.title}
                                onChange={e => handleTitleChange(e.target.value)}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                                className="w-full text-4xl lg:text-5xl font-black text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 tracking-tight leading-tight mb-8 resize-none overflow-hidden [overflow-wrap:anywhere]"
                            />

                            <QuillEditor
                                theme="snow"
                                value={post.content}
                                onChange={(val: string) => setPost({ ...post, content: val })}
                                modules={quillModules}
                                placeholder="Escreva seu artigo riquíssimo aqui... O salvamento das imagens no texto ocorrerá no momento que você Publicar."
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Sidebar Persistente: SEO e Metadados */}
            <div className="w-full xl:w-[320px] shrink-0 sticky top-20 space-y-6 z-10">
                <div className="p-6 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-3 mb-5">Resumo (SEO)</h3>
                    <div>
                        <label className={labelClass}>Resumo do Post (Descrição)</label>
                        <textarea
                            rows={3}
                            value={post.description}
                            onChange={e => setPost({ ...post, description: e.target.value })}
                            className={`${inputClass} resize-none focus:h-24 transition-all`}
                            placeholder="Aparecerá nos cards da Home e na busca..."
                        />
                    </div>
                </div>

                <div className="p-6 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-3 mb-5">Status e Visibilidade</h3>

                    <div>
                        <label className={labelClass}>Status da Publicação</label>
                        <select
                            value={post.draft ? "draft" : "published"}
                            onChange={e => setPost({ ...post, draft: e.target.value === "draft" })}
                            className={`${selectClass} font-bold`}
                        >
                            <option value="published">Publicado (Visível no Site)</option>
                            <option value="draft">Rascunho (Oculto)</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>URL da Página (Slug)</label>
                        <input
                            type="text"
                            value={post.slug}
                            onChange={e => setPost({ ...post, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                            className={`${inputClass} font-mono hover:bg-white`}
                            title="Se você editar e salvar, criará um NOVO post com esse slug!"
                        />
                        {isEditing && <span className="text-[10px] text-slate-600 mt-1 block font-medium">Aviso: Se alterar o slug, você criará um novo post ao invés de atualizar o antigo.</span>}
                    </div>

                    <div>
                        <label className={labelClass}>Data de Publicação</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={post.pubDate}
                                onChange={e => setPost({ ...post, pubDate: e.target.value })}
                                className={`${inputClass}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
                    <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-3 mb-5">Autor e Categoria</h3>
                    <div>
                        <label className={labelClass}>Autor do Artigo</label>
                        <select value={post.author} onChange={e => setPost({ ...post, author: e.target.value })} className={selectClass}>
                            <option value="">-- Assinatura --</option>
                            {authors.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelClass}>Categoria Base</label>
                        <select
                            value={post.category === '' && dynamicCategories.length > 0 ? dynamicCategories[0] : post.category}
                            onChange={e => {
                                if (e.target.value === '__NEW__') {
                                    const newCat = window.prompt('Digite o nome da nova categoria:');
                                    if (newCat && newCat.trim() !== '') {
                                        const cleanCat = newCat.trim();
                                        if (!dynamicCategories.includes(cleanCat)) {
                                            setDynamicCategories(prev => [...prev, cleanCat]);
                                        }
                                        setPost({ ...post, category: cleanCat });
                                    }
                                } else {
                                    setPost({ ...post, category: e.target.value });
                                }
                            }}
                            className={selectClass}
                        >
                            <option value="">-- Selecionar --</option>
                            {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            <option disabled>──────────</option>
                            <option value="__NEW__">➕ Criar Nova Categoria...</option>
                        </select>
                    </div>
                </div>

                <div className="p-6 mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5">
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center justify-between">
                        <span>Imagem de Capa Frontal</span>
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                    </h3>

                    <div>
                        <label className="group relative border border-dashed border-slate-300 hover:border-violet-500 bg-white rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-all mb-4 text-center">
                            <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'heroImage')} className="hidden" />
                            <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-violet-500 mb-2 transition-colors" />
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-violet-700">Clique para Enviar a Capa</span>
                            <span className="text-xs text-slate-500 mt-1">Recomendado 16:9 (JPG/PNG/WEBP)</span>
                        </label>

                        {post.heroImage && (
                            <div className="w-full aspect-[16/9] rounded-md overflow-hidden border border-slate-200 relative group shadow-sm bg-slate-100">
                                <img src={getFullImageUrl(post.heroImage)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-xl">Capa Atual</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
