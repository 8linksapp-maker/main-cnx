import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Loader2, Trash2, Edit3, AlertCircle, Eye, X, Save, Zap, MessageSquare, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { triggerToast } from './CmsToaster';

interface PostsManagerProps {
    siteId: string;
    repoName: string;
}

export default function PostsManager({ siteId, repoName }: PostsManagerProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Core data for dropdowns
    const [authors, setAuthors] = useState<any[]>([]);
    const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

    // Quick Edit State
    const [editingSha, setEditingSha] = useState<string | null>(null);
    const [quickEditData, setQuickEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filters & Sorting 
    const [statusFilter, setStatusFilter] = useState<string>('all'); // all, published, draft
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<'title' | 'pubDate'>('title');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Bulk Actions
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<string>('');

    useEffect(() => {
        fetchInitialData();
    }, [repoName]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, categoryFilter, dateFilter, sortField, sortOrder]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Authors 
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
                } else if (authRes.status !== 404) {
                    const err = await authRes.json();
                    console.error("Erro ao carregar autores:", err.error);
                }
            } catch (e) { console.error("Falha na requisição de autores:", e); }

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
            } catch (e) { console.error("Erro ao carregar categorias no manager:", e); }

            // 2. Fetch Posts List
            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'list', repo: repoName, path: 'src/content/blog' })
            });

            if (!res.ok) {
                if (res.status === 404) { setPosts([]); return; }
                const errPayload = await res.json();
                throw new Error(errPayload.error || 'Erro ao listar artigos.');
            }

            const data = await res.json();
            const mdFiles = Array.isArray(data.data) ? data.data.filter((f: any) => f.name.endsWith('.md')) : [];

            // 3. Crawler to get Frontmatter and Categories
            let foundCategories = new Set<string>();
            const enrichedPosts: any[] = [];

            await Promise.all(mdFiles.map(async (f: any) => {
                const fileRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: f.path })
                });

                if (fileRes.ok) {
                    const fileData = await fileRes.json();
                    const text = fileData.content || '';
                    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

                    let title = f.name;
                    let category = 'Geral';
                    let author = '';
                    let pubDate = '';
                    let draft = false;
                    let description = '';
                    let heroImage = '';

                    const slug = f.name.replace('.md', '');

                    if (match) {
                        const fm = match[1];
                        const extract = (key: string) => {
                            const reg = new RegExp(`${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n\\r]+))`);
                            const m = fm.match(reg);
                            return m ? (m[1] || m[2] || m[3] || '').trim() : '';
                        };
                        title = extract('title') || f.name;
                        category = extract('category') || 'Geral';
                        author = extract('author');
                        pubDate = extract('pubDate');
                        draft = extract('draft') === 'true';
                        description = extract('description');
                        heroImage = extract('heroImage');

                        if (category) {
                            foundCategories.add(category);
                            allPossibleCategories.add(category);
                        }
                    }

                    enrichedPosts.push({
                        ...f,
                        title, category, author, pubDate, draft, description, heroImage, slug,
                        rawBody: match ? match[2] : text
                    });
                }
            }));

            setPosts(enrichedPosts);
            if (allPossibleCategories.size > 0) {
                setDynamicCategories(Array.from(allPossibleCategories));
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (path: string, sha: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o post ${name}?`)) return;

        try {
            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', repo: repoName, path, sha, message: `CMS: Excluindo post ${name}` })
            });

            if (!res.ok) throw new Error('Erro ao excluir no servidor.');
            setPosts(posts.filter(f => f.sha !== sha));
            triggerToast(`Artigo "${name}" movido para a lixeira!`, 'success');
        } catch (err: any) {
            triggerToast(`Erro: ${err.message}`, 'error');
        }
    };

    const handleQuickAction = (post: any) => {
        setEditingSha(post.sha);
        setQuickEditData({
            title: post.title,
            slug: post.slug,
            pubDate: post.pubDate ? new Date(post.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            author: post.author,
            category: post.category,
            draft: post.draft,
            // Guardando os velhos intactos para salvar
            _oldSlug: post.slug,
            _oldPath: post.path,
            _sha: post.sha,
            description: post.description,
            heroImage: post.heroImage,
            rawBody: post.rawBody
        });
    };

    const saveQuickEdit = async () => {
        if (!quickEditData.title || !quickEditData.slug) return alert('Título e Slug (URL) não podem ser vazios.');
        setSaving(true);
        try {
            const targetPath = `src/content/blog/${quickEditData.slug}.md`;

            // Build Frontmatter
            const markdown = `---
title: "${quickEditData.title.replace(/"/g, '\\"')}"
description: "${quickEditData.description.replace(/"/g, '\\"')}"
pubDate: "${quickEditData.pubDate}"
heroImage: "${quickEditData.heroImage}"
category: "${quickEditData.category}"
author: "${quickEditData.author}"
draft: ${quickEditData.draft}
---
${quickEditData.rawBody}`;

            if (quickEditData.slug !== quickEditData._oldSlug) {
                const resWrite = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'write', repo: repoName, path: targetPath, content: markdown, message: `CMS: Renomeando/Editando rápido ${quickEditData.slug}` })
                });
                if (!resWrite.ok) throw new Error('Erro ao salvar o novo arquivo do post.');

                await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', repo: repoName, path: quickEditData._oldPath, sha: quickEditData._sha, message: 'CMS: Apagando antigo slug após edição rápida' })
                });
            } else {
                const res = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'write', repo: repoName, path: targetPath, content: markdown, sha: quickEditData._sha, message: `CMS: Edição Rápida ${quickEditData.slug}` })
                });
                if (!res.ok) throw new Error('Erro ao salvar edição.');
            }

            triggerToast('Sincronizando... Aguardando a nuvem da Vercel', 'progress', 62);

            const saveTimestamp = Date.now();
            let attempt = 0;
            let prog = 62;
            let successDeploy = false;

            // Aguarda 15s p/ GitHub notificar Vercel
            await new Promise(r => setTimeout(r, 15000));

            while (attempt < 40 && !successDeploy) {
                attempt++;
                try {
                    const statusRes = await fetch(
                        `/api/cms/vercel-deploy-status?repo=${encodeURIComponent(repoName)}&after=${saveTimestamp}`
                    );
                    const statusData = await statusRes.json();
                    const state = statusData?.status || 'UNKNOWN';

                    if (state === 'READY') {
                        successDeploy = true;
                        triggerToast('Edição rápida concluída e online!', 'success');
                        break;
                    } else if (state === 'ERROR' || state === 'CANCELED') {
                        triggerToast(`Deploy falhou (${state}).`, 'error');
                        break;
                    } else {
                        prog = Math.min(prog + 1, 95);
                        triggerToast(state === 'BUILDING' ? 'Construindo site...' : 'Aguardando construtor...', 'progress', prog);
                    }
                } catch {
                    // ignorar erro de rede
                }
                if (!successDeploy) await new Promise(r => setTimeout(r, 5000));
            }

            if (!successDeploy && attempt >= 40) {
                triggerToast('Tempo esgotado, mas o site logo ficará pronto.', 'error');
            }

            setEditingSha(null);
            fetchInitialData();
        } catch (e: any) {
            triggerToast(`Erro: ${e.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkAction = () => {
        if (bulkAction === 'delete' && selectedPosts.length > 0) {
            triggerToast('Ação em massa de exclusão será enviada item por item.', 'info');
        } else {
            triggerToast('Nenhuma ação válida selecionada.', 'error');
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-100 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-3 text-violet-400" />
            <p className="text-sm font-medium">Carregando artigos do repositório...</p>
        </div>
    );

    // Helpers WP Style
    const allCount = posts.length;
    const pubCount = posts.filter(p => !p.draft).length;
    const draftCount = posts.filter(p => p.draft).length;

    const availableDates = Array.from(new Set(posts.map(p => p.pubDate ? p.pubDate.substring(0, 7) : ''))).filter(Boolean).sort().reverse();

    // Filter Logic
    const filteredPosts = posts.filter(f => {
        const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase()) || f.slug.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'draft' ? f.draft : !f.draft;
        const matchesCat = categoryFilter === 'all' ? true : f.category === categoryFilter;
        const matchesDate = dateFilter === 'all' ? true : f.pubDate && f.pubDate.startsWith(dateFilter);
        return matchesSearch && matchesStatus && matchesCat && matchesDate;
    }).sort((a, b) => {
        let valA = (a[sortField] || '').toLowerCase();
        let valB = (b[sortField] || '').toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field: 'title' | 'pubDate') => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    }

    const totalItems = filteredPosts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedPosts = filteredPosts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const renderPagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="text-slate-500">{totalItems} itens</span>
                <div className="flex bg-white border border-[#c3c4c7] rounded-sm shadow-sm">
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 rounded-md text-[var(--tw-colors-violet-600)] font-bold hover:bg-slate-100 hover:text-[var(--tw-colors-violet-800)] disabled:opacity-50 disabled:text-slate-400 disabled:hover:bg-white transition-colors"
                        title="Primeira página"
                    >«</button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1 text-[var(--tw-colors-violet-600)] font-bold hover:bg-slate-100 hover:text-[var(--tw-colors-violet-800)] disabled:opacity-50 disabled:text-slate-400 disabled:hover:bg-white transition-colors"
                        title="Página anterior"
                    >‹</button>
                    <div className="px-3 py-1 flex items-center bg-slate-100 rounded-md mx-1 text-slate-600 font-medium whitespace-nowrap">
                        {currentPage} de {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 text-[var(--tw-colors-violet-600)] font-bold hover:bg-slate-100 hover:text-[var(--tw-colors-violet-800)] disabled:opacity-50 disabled:text-slate-400 disabled:hover:bg-white transition-colors"
                        title="Próxima página"
                    >›</button>
                    <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1 rounded-md text-[var(--tw-colors-violet-600)] font-bold hover:bg-slate-100 hover:text-[var(--tw-colors-violet-800)] disabled:opacity-50 disabled:text-slate-400 disabled:hover:bg-white transition-colors"
                        title="Última página"
                    >»</button>
                </div>
            </div>
        );
    };

    const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-500 uppercase tracking-wider mb-1.5";

    const siteUrl = `https://${repoName.split('/')[1]}.vercel.app`;

    return (
        <div className="space-y-5 pb-20">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}</div>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-slate-800">Posts</p>
                    <a href={`/dashboard/cms/${siteId}/posts/editor`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Novo Artigo
                    </a>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar artigos"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-violet-400 transition-all font-medium text-slate-700"
                    />
                </div>
            </div>

            {!loading && posts.length === 0 && search === '' && (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-12 flex flex-col items-center justify-center text-center">
                    <FileText className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum post encontrado</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Nenhum artigo publicado no diretório de blog deste repositório.</p>
                </div>
            )}

            {posts.length > 0 && (
                <div className="space-y-4">

                    {/* Status Sub-nav (WP Style) */}
                    <div className="flex items-center gap-2 text-sm">
                        <button onClick={() => setStatusFilter('all')} className={`${statusFilter === 'all' ? 'font-bold text-slate-800' : 'text-violet-600 hover:text-violet-800'} transition-colors`}>
                            Todos <span className="text-slate-400 font-normal">({allCount})</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => setStatusFilter('published')} className={`${statusFilter === 'published' ? 'font-bold text-slate-800' : 'text-violet-600 hover:text-violet-800'} transition-colors`}>
                            Publicados <span className="text-slate-400 font-normal">({pubCount})</span>
                        </button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => setStatusFilter('draft')} className={`${statusFilter === 'draft' ? 'font-bold text-slate-800' : 'text-violet-600 hover:text-violet-800'} transition-colors`}>
                            Rascunhos <span className="text-slate-400 font-normal">({draftCount})</span>
                        </button>
                    </div>

                    {/* Actions, Filters & Pagination Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Bulk Action */}
                            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="border border-slate-400 rounded-sm text-sm px-2 py-1 text-slate-700 bg-white hover:border-slate-500 outline-none">
                                <option value="">Ações em massa</option>
                                <option value="delete">Mover para a lixeira</option>
                            </select>
                            <button onClick={handleBulkAction} className="border border-violet-600 text-violet-600 hover:bg-violet-50 px-3 py-1 rounded-sm text-sm font-medium transition-colors">Aplicar</button>

                            {/* Filters */}
                            <div className="flex items-center gap-1 sm:ml-4">
                                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border border-slate-400 rounded-sm text-sm px-2 py-1 text-slate-700 bg-white hover:border-slate-500 outline-none">
                                    <option value="all">Todas as datas</option>
                                    {availableDates.map(d => {
                                        const [y, m] = d.split('-');
                                        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                                        return <option key={d} value={d}>{monthNames[parseInt(m) - 1]} de {y}</option>
                                    })}
                                </select>

                                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-slate-400 rounded-sm text-sm px-2 py-1 text-slate-700 bg-white hover:border-slate-500 outline-none">
                                    <option value="all">Todas as categorias</option>
                                    {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <button className="border border-slate-400 text-slate-700 hover:bg-slate-50 px-3 py-1 ml-1 rounded-sm text-sm font-medium transition-colors">Filtrar</button>
                            </div>
                        </div>

                        {/* Top Pagination */}
                        {renderPagination()}
                    </div>

                    {/* Table (WP Style) */}
                    <div className="border border-slate-200 rounded-sm bg-white overflow-hidden shadow-sm">
                        <div className="w-full relative">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                                        <th className="px-3 py-2 text-center w-12">
                                            <input type="checkbox" className="w-4 h-4 rounded border-slate-400 text-violet-600 focus:ring-transparent"
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedPosts(filteredPosts.map(p => p.sha));
                                                    else setSelectedPosts([]);
                                                }}
                                                checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                                            />
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-slate-800 text-sm  w-[40%] hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => handleSort('title')}>
                                            <div className="flex items-center gap-1">
                                                <span className="text-violet-600">Título</span>
                                                {sortField === 'title' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />)}
                                            </div>
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-slate-800 text-sm ">
                                            Autor
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-slate-800 text-sm ">
                                            Categorias
                                        </th>
                                        <th className="px-4 py-2 font-semibold text-slate-800 text-sm hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => handleSort('pubDate')}>
                                            <div className="flex items-center gap-1">
                                                <span className="text-violet-600">Data</span>
                                                {sortField === 'pubDate' && (sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />)}
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {paginatedPosts.map((post, idx) => (
                                        <React.Fragment key={post.sha}>
                                            <tr className={`${idx % 2 === 0 ? 'bg-white' : 'bg-white'} hover:bg-slate-50 transition-colors group`}>
                                                <td className="px-3 py-3 text-center">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-400 text-violet-600 focus:ring-transparent"
                                                        checked={selectedPosts.includes(post.sha)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedPosts([...selectedPosts, post.sha]);
                                                            else setSelectedPosts(selectedPosts.filter(id => id !== post.sha));
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 pb-8 relative">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {post.draft && <span className="font-bold text-slate-800 text-[14px]">Rascunho — </span>}
                                                        <a href={`/dashboard/cms/${siteId}/posts/editor?path=${encodeURIComponent(post.path)}`} className="font-semibold text-violet-600 hover:text-violet-800 text-[14px]">
                                                            {post.title}
                                                        </a>
                                                    </div>

                                                    {/* Row Actions WP Style (visible on hover) */}
                                                    <div className="flex items-center gap-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-4">
                                                        <a href={`/dashboard/cms/${siteId}/posts/editor?path=${encodeURIComponent(post.path)}`} className="text-violet-600 hover:underline">Editar</a>
                                                        <span className="text-slate-300">|</span>
                                                        <button onClick={() => handleQuickAction(post)} className="text-violet-600 hover:underline">Edição Rápida</button>
                                                        <span className="text-slate-300">|</span>
                                                        <button onClick={() => handleDelete(post.path, post.sha, post.title)} className="text-red-600 hover:underline">Lixeira</button>
                                                        <span className="text-slate-300">|</span>
                                                        <a href={`${siteUrl}/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">Ver</a>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-violet-600 hover:underline cursor-pointer">
                                                    {post.author || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-violet-600 hover:underline cursor-pointer">
                                                    {post.category || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {post.draft ? 'Última modificação' : 'Publicado'} <br />
                                                    {post.pubDate ? (() => {
                                                        const [y, m, d] = post.pubDate.split('-');
                                                        return `${d}/${m}/${y}`;
                                                    })() : 'Sem data'}
                                                </td>
                                            </tr>

                                            {/* Edição Rápida (Inline Editor) */}
                                            {editingSha === post.sha && (
                                                <tr className="bg-[#f0f0f1] border-y border-slate-200 shadow-inner">
                                                    <td colSpan={5} className="p-0">
                                                        <div className="p-4 border-l-4 border-l-violet-500">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Edição Rápida</h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                                {/* Coluna 1 */}
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <label className={labelClass}>Título</label>
                                                                        <input type="text" value={quickEditData.title} onChange={e => setQuickEditData({ ...quickEditData, title: e.target.value })} className={inputClass} />
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelClass}>Slug</label>
                                                                        <input type="text" value={quickEditData.slug} onChange={e => setQuickEditData({ ...quickEditData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className={inputClass} />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className={labelClass}>Data</label>
                                                                            <input type="date" value={quickEditData.pubDate} onChange={e => setQuickEditData({ ...quickEditData, pubDate: e.target.value })} className={inputClass} />
                                                                        </div>
                                                                        <div>
                                                                            <label className={labelClass}>Autor</label>
                                                                            <select value={quickEditData.author} onChange={e => setQuickEditData({ ...quickEditData, author: e.target.value })} className={inputClass}>
                                                                                <option value="">- Selecione -</option>
                                                                                {authors.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Coluna 2 */}
                                                                <div className="space-y-3">
                                                                    <label className={labelClass}>Categorias</label>
                                                                    <div className="bg-white border border-[#8c8f94] rounded-sm p-3 h-[140px] overflow-y-auto space-y-2">
                                                                        {dynamicCategories.map(cat => (
                                                                            <label key={cat} className="flex items-center gap-2 cursor-pointer p-0.5 rounded transition-colors text-sm">
                                                                                <input
                                                                                    type="radio"
                                                                                    name="quickEditCategory"
                                                                                    checked={quickEditData.category === cat}
                                                                                    onChange={() => setQuickEditData({ ...quickEditData, category: cat })}
                                                                                    className="w-4 h-4 text-violet-600 focus:ring-violet-500 border-slate-200 cursor-pointer"
                                                                                />
                                                                                <span className="text-slate-800">{cat}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Nova categoria..."
                                                                            className={`${inputClass} text-xs py-1`}
                                                                            onKeyDown={(e: any) => {
                                                                                if (e.key === 'Enter') {
                                                                                    const v = e.target.value.trim();
                                                                                    if (v && !dynamicCategories.includes(v)) {
                                                                                        setDynamicCategories(prev => [...prev, v]);
                                                                                        setQuickEditData({ ...quickEditData, category: v });
                                                                                        e.target.value = '';
                                                                                    }
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Coluna 3 */}
                                                                <div className="space-y-3 border-l border-slate-200 pl-4 h-full">
                                                                    <div>
                                                                        <label className={labelClass}>Status</label>
                                                                        <select
                                                                            value={quickEditData.draft ? "draft" : "published"}
                                                                            onChange={e => setQuickEditData({ ...quickEditData, draft: e.target.value === "draft" })}
                                                                            className={inputClass}
                                                                        >
                                                                            <option value="published">Publicado</option>
                                                                            <option value="draft">Rascunho</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200">
                                                                <button disabled={saving} onClick={() => setEditingSha(null)} className="border border-violet-600 text-violet-600 hover:bg-violet-50 bg-white font-medium px-4 py-1.5 rounded-sm text-sm transition-colors">
                                                                    Cancelar
                                                                </button>
                                                                <button disabled={saving} onClick={saveQuickEdit} className="bg-[var(--tw-colors-violet-600)] hover:bg-[var(--tw-colors-violet-700)] text-white font-medium px-4 py-1.5 rounded-sm text-sm flex items-center gap-2 transition-colors">
                                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {paginatedPosts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">Nenhum post encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Pagination */}
                    <div className="flex justify-end pt-2">
                        {renderPagination()}
                    </div>
                </div>
            )}
        </div>
    );
}
