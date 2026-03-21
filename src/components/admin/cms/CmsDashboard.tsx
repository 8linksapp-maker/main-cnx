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
                                pubPosts++;
                            }
                        }));
                    }
                }

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

                setStats({ totalPosts: tPosts, publishedPosts: pubPosts, draftPosts: drfPosts, totalAuthors: tAuthors });
            } catch (e) {
                console.error("Erro ao puxar stats:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [repoName]);

    const statItems = [
        { label: 'Total de artigos', value: stats.totalPosts, icon: FileText },
        { label: 'Publicados', value: stats.publishedPosts, icon: CheckCircle },
        { label: 'Rascunhos', value: stats.draftPosts, icon: FileEdit },
        { label: 'Equipe', value: stats.totalAuthors, icon: Users },
    ];

    return (
        <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Estatísticas</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statItems.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-400">{label}</p>
                            <Icon className="w-4 h-4 text-violet-400 shrink-0" />
                        </div>
                        <p className="text-3xl font-bold text-slate-900 leading-none">
                            {loading
                                ? <Loader2 className="w-5 h-5 animate-spin text-slate-200 mt-1" />
                                : value
                            }
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
