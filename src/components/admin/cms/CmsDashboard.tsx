import React, { useState, useEffect } from 'react';
import { Loader2, FileText, CheckCircle, FileEdit, Users } from 'lucide-react';

interface CmsDashboardProps {
    siteId: string;
    repoName: string;
}

export default function CmsDashboard({ siteId, repoName }: CmsDashboardProps) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalAuthors: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Posts
                const postsRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'list', repo: repoName, path: 'src/content/blog' })
                });

                let tPosts = 0;
                let pubPosts = 0;
                let drfPosts = 0;

                if (postsRes.ok) {
                    const postData = await postsRes.json();
                    if (Array.isArray(postData.data)) {
                        const mds = postData.data.filter((f: any) => f.name.endsWith('.md'));
                        tPosts = mds.length;

                        await Promise.all(mds.map(async (f: any) => {
                            try {
                                const fileRes = await fetch('/api/cms/github', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'read', repo: repoName, path: f.path })
                                });
                                if (fileRes.ok) {
                                    const fileData = await fileRes.json();
                                    const text = fileData.content;
                                    const draftMatch = text.match(/draft:\s*(true|false)/i);
                                    if (draftMatch && draftMatch[1].toLowerCase() === 'true') {
                                        drfPosts++;
                                    } else {
                                        pubPosts++;
                                    }
                                }
                            } catch (e) {
                                pubPosts++; // default
                            }
                        }));
                    }
                }

                // Fetch Authors
                const authRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/authors.json' })
                });

                let tAuthors = 0;
                if (authRes.ok) {
                    const data = await authRes.json();
                    const parsed = JSON.parse(data.content);
                    tAuthors = Array.isArray(parsed) ? parsed.length : 0;
                }

                setStats({
                    totalPosts: tPosts,
                    publishedPosts: pubPosts,
                    draftPosts: drfPosts,
                    totalAuthors: tAuthors
                });
            } catch (e) {
                console.error("Erro ao puxar stats:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [repoName]);

    return (
        <div className="space-y-6 mb-12">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-1">
                Estatísticas do Projeto
                <span className="flex h-2 w-2 relative ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Posts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-violet-300 hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total de Artigos</p>
                        <p className="text-4xl font-black text-slate-800">{loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-2" /> : stats.totalPosts}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        <FileText className="w-6 h-6" />
                    </div>
                </div>

                {/* Published Posts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-violet-300 hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Publicados</p>
                        <p className="text-4xl font-black text-slate-800">{loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-2" /> : stats.publishedPosts}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                </div>

                {/* Draft Posts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-violet-300 hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rascunhos</p>
                        <p className="text-4xl font-black text-slate-800">{loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-2" /> : stats.draftPosts}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        <FileEdit className="w-6 h-6" />
                    </div>
                </div>

                {/* Authors */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-violet-300 hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Equipe</p>
                        <p className="text-4xl font-black text-slate-800">{loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-300 mt-2" /> : stats.totalAuthors}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
