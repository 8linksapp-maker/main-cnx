import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Image as ImageIcon, Globe, Rocket, Settings, Trash2, RefreshCw, Plus, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { triggerToast } from './CmsToaster';

interface ConfigEditorProps {
    siteId: string;
    repoName: string;
    vercelProject?: any;
    vercelProjectId?: string;
    integrationId?: string;
    initialDeploys?: any[];
    initialDomains?: any[];
}

type ActiveTab = 'geral' | 'deploys' | 'dominios' | 'perigo';

// ─── Sub-Componente: Instruções DNS ────────────────────────────────────────────
function DnsInstructions({ domain }: { domain: any }) {
    const [dnsTab, setDnsTab] = useState<'records' | 'ns'>('records');
    const isSubdomain = domain.name?.split('.').length > 2;
    const recordType = isSubdomain ? 'CNAME' : 'A';
    const recordName = isSubdomain ? domain.name?.split('.')[0] : '@';
    const recordValue = isSubdomain ? 'cname.vercel-dns.com.' : '76.76.21.21';

    const copy = (text: string) => navigator.clipboard.writeText(text);

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-4 w-full text-slate-800 shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
                <button
                    type="button"
                    onClick={() => setDnsTab('records')}
                    className={`px-4 py-3 text-sm font-semibold -mb-[1px] border-b-2 transition-colors ${dnsTab === 'records' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                >DNS Records</button>
                <button
                    type="button"
                    onClick={() => setDnsTab('ns')}
                    className={`px-4 py-3 text-sm font-semibold -mb-[1px] border-b-2 transition-colors ${dnsTab === 'ns' ? 'text-slate-900 border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700'
                        }`}
                >Vercel DNS</button>
            </div>

            {/* DNS Records */}
            {dnsTab === 'records' && (
                <div className="p-5">
                    <p className="text-[13px] text-slate-600 mb-4">Os registros DNS no seu provedor devem corresponder aos seguintes registros para verificar e conectar seu domínio à Vercel.</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-[13px] whitespace-nowrap table-fixed">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-slate-500 font-semibold w-1/4">Tipo</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold w-1/4">Nome</th>
                                    <th className="px-4 py-3 text-slate-500 font-semibold w-1/2">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                <tr className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3.5 font-mono text-slate-700">{recordType}</td>
                                    <td className="px-4 py-3.5 font-mono text-slate-800 font-medium">
                                        <div className="flex items-center gap-2 group/n">
                                            {recordName}
                                            <button onClick={() => copy(recordName)} className="opacity-0 group-hover/n:opacity-100 transition-opacity" title="Copiar">
                                                <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-slate-800 font-medium">
                                        <div className="flex items-center gap-2 group/v">
                                            {recordValue}
                                            <button onClick={() => copy(recordValue)} className="opacity-0 group-hover/v:opacity-100 transition-opacity" title="Copiar">
                                                <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {!isSubdomain && (
                        <div className="mt-3 p-3.5 border border-slate-200 rounded-lg text-[13px] text-slate-600 bg-white">
                            Como parte de uma expansão planejada de IP, você pode notar <span className="text-violet-600 font-medium">novos registros</span> acima.
                        </div>
                    )}
                    <div className="mt-3 p-3.5 border border-slate-200 rounded-lg text-[13px] text-slate-600 bg-slate-50">
                        Pode levar algum tempo para os registros DNS serem aplicados.
                    </div>
                </div>
            )}

            {/* Vercel DNS (Nameservers) */}
            {dnsTab === 'ns' && (
                <div className="p-5">
                    <p className="text-[13px] text-slate-600 mb-4">Atualize os nameservers do seu domínio para ativar o Vercel DNS.</p>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-[13px] whitespace-nowrap table-fixed">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr><th className="px-4 py-3 text-slate-500 font-semibold">Nameservers</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {['ns1.vercel-dns.com', 'ns2.vercel-dns.com'].map(ns => (
                                    <tr key={ns} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3.5 font-mono text-slate-800 font-medium">
                                            <div className="flex items-center gap-2 group/ns">
                                                {ns}
                                                <button onClick={() => copy(ns)} className="opacity-0 group-hover/ns:opacity-100 transition-opacity" title="Copiar">
                                                    <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-3 p-3.5 border border-slate-200 rounded-lg text-[13px] text-slate-600 bg-slate-50">
                        Pode levar algum tempo para as alterações de nameservers serem aplicadas.
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-Componente: Badge de Status do Deploy ────────────────────────────────
function DeployBadge({ state }: { state: string }) {
    if (state === 'READY') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border bg-emerald-100 text-emerald-800 border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Concluído</span>;
    if (state === 'ERROR') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3" />Falhou</span>;
    if (state === 'BUILDING') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border bg-amber-100 text-amber-800 border-amber-200 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Processando</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded border bg-slate-100 text-slate-700 border-slate-200"><Clock className="w-3 h-3" />{state}</span>;
}

export default function ConfigEditor({ siteId, repoName, vercelProject: initialProject, vercelProjectId: initialProjectId, integrationId, initialDeploys, initialDomains }: ConfigEditorProps) {
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
        if (typeof window !== 'undefined') {
            const tabParam = new URLSearchParams(window.location.search).get('tab');
            if (tabParam === 'dominios' || tabParam === 'deploys' || tabParam === 'perigo' || tabParam === 'geral') {
                return tabParam as ActiveTab;
            }
        }
        return 'geral';
    });

    // ── Estado: Aba Geral ──────────────────────────────────────────────────────
    const [config, setConfig] = useState<any>(null);
    const [fileSha, setFileSha] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configError, setConfigError] = useState('');
    const [pendingLogo, setPendingLogo] = useState<File | null>(null);

    // Helper p/ converter logo
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result?.toString();
                resolve(result ? result.split(',')[1] : '');
            };
            reader.onerror = error => reject(error);
        });
    };

    // ── Estado: Abas Vercel (dados vêm do server via props) ───────────────────
    const [deploys] = useState<any[]>(initialDeploys || []);
    const [domains, setDomains] = useState<any[]>(initialDomains || []);
    const [newDomain, setNewDomain] = useState('');
    const [newDomainTarget, setNewDomainTarget] = useState('production');
    const [redeploying, setRedeploying] = useState(false);

    // ── Estado: Aba Perigo ─────────────────────────────────────────────────────
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // ─── Carrega Config GitHub ─────────────────────────────────────────────────
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', repo: repoName, path: 'src/data/siteConfig.json' })
                });
                if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar configurações.');
                const data = await res.json();
                setConfig(JSON.parse(data.content));
                setFileSha(data.sha);
            } catch (err: any) {
                setConfigError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [repoName]);

    // ─── Salvar Config ────────────────────────────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setConfigError('');
        triggerToast('Sincronizando configurações com o repositório...', 'progress', 20);
        try {
            let configCopy = { ...config };

            // Se houver logo alterado no estado pending
            if (pendingLogo) {
                triggerToast('Enviando nova imagem...', 'progress', 30);
                const base64Content = await fileToBase64(pendingLogo);
                const fileExt = pendingLogo.name.split('.').pop() || 'png';
                const ghPath = `public/uploads/${Date.now()}-logo.${fileExt}`;

                const uploadRes = await fetch('/api/cms/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'write', repo: repoName, path: ghPath,
                        content: base64Content, isBase64: true, message: 'CMS: Upload Logo'
                    })
                });
                if (!uploadRes.ok) throw new Error('Falha ao subir a imagem.');

                configCopy.logo = ghPath.replace('public', '');
            }

            const res = await fetch('/api/cms/github', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write', repo: repoName, path: 'src/data/siteConfig.json',
                    content: JSON.stringify(configCopy, null, 2), sha: fileSha,
                    message: 'CMS: Update siteConfig.json'
                })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Erro ao salvar no GitHub.');
            const data = await res.json();
            setFileSha(data.sha);
            setPendingLogo(null);
            triggerToast('Sincronizado! Reconstruindo site na nuvem da Vercel...', 'progress', 60);
            let prog = 60;
            const interval = setInterval(() => { prog += 4; if (prog >= 95) clearInterval(interval); else triggerToast('Reconstruindo site...', 'progress', prog); }, 1000);
            setTimeout(() => {
                clearInterval(interval);
                const finalLink = config?.url ? (config.url.startsWith('http') ? config.url : `https://${config.url}`) : `https://${repoName.split('/')[1]}.vercel.app`;
                triggerToast('Configurações aplicadas! O site já está atualizado online.', 'success', 100, finalLink);
                setSaving(false);
            }, 12000);
        } catch (err: any) {
            setConfigError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
            setSaving(false);
        }
    };

    // ─── Forçar Redeploy (usa form nativo POST igual [id].astro) ───────────────
    const handleRedeploy = () => {
        if (!deploys[0]?.uid || !integrationId || !initialProjectId) return;
        if (!window.confirm('Deseja agendar um novo deploy agora?')) return;
        setRedeploying(true);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/vercel/redeploy';
        const fields = {
            integration_id: integrationId,
            project_id: initialProjectId || (repoName ? repoName.split('/')[1] : siteId),
            deployment_id: deploys[0].uid,
            project_name: initialProject?.name || repoName.split('/')[1] || 'project',
            redirect_to: `/dashboard/cms/${siteId}/config?tab=dominios`
        };
        Object.entries(fields).forEach(([k, v]) => {
            const input = document.createElement('input');
            input.type = 'hidden'; input.name = k; input.value = v;
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    };

    // ─── Excluir Projeto (Vercel + Github) ───────────────────────────────────
    const handleDelete = () => setShowDeleteModal(true);

    const confirmDelete = async () => {
        setShowDeleteModal(false);
        setDeleting(true);
        triggerToast('Iniciando exclusão permanente...', 'progress', 20);
        try {
            const res = await fetch('/api/cms/project/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId, repoName })
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Erro ao excluir');
            triggerToast('Projeto excluído permanentemente.', 'success', 100);
            setTimeout(() => { window.location.href = '/dashboard/cms'; }, 2000);
        } catch (err: any) {
            triggerToast(`Erro: ${err.message}`, 'error');
            setDeleting(false);
        }
    };

    // ─── Classes de Aba ───────────────────────────────────────────────────────
    const tabClass = (tab: ActiveTab) =>
        `pb-3 font-semibold border-b-2 transition-colors flex items-center gap-2 text-sm ${activeTab === tab
            ? 'text-violet-600 border-violet-600'
            : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'}`;

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-400 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
            <p className="font-medium animate-pulse">Conectando ao Repositório...</p>
        </div>
    );

    if (configError && !config) return (
        <div className="bg-red-50 text-red-700 p-8 rounded-3xl border border-red-200 flex gap-4 items-start">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div><h3 className="text-xl font-bold mb-2">Erro de Leitura</h3><p>{configError}</p></div>
        </div>
    );

    return (
        <div className="space-y-6 pb-32">
            {/* ── Modal de Confirmação de Exclusão ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    {/* Card */}
                    <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/25 border border-slate-200 p-8 max-w-md w-full">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Excluir Projeto Permanentemente</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Esta ação vai remover <strong className="text-slate-700">{repoName.split('/')[1]}</strong> da <strong className="text-slate-700">Vercel</strong> e deletar o repositório no <strong className="text-slate-700">GitHub</strong>. Não é possível desfazer.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
                            >
                                Sim, excluir tudo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Nav Tabs ── */}
            <nav className="flex gap-6 overflow-x-auto border-b border-slate-200 pb-px">
                <button className={tabClass('geral')} onClick={() => setActiveTab('geral')}>
                    <Settings className="w-4 h-4" /> Geral
                </button>
                <button className={tabClass('deploys')} onClick={() => setActiveTab('deploys')}>
                    <Rocket className="w-4 h-4" /> Deploys
                </button>
                <button className={tabClass('dominios')} onClick={() => setActiveTab('dominios')}>
                    <Globe className="w-4 h-4" /> Domínios
                </button>
                <button className={tabClass('perigo')} onClick={() => setActiveTab('perigo')}>
                    <Trash2 className="w-4 h-4" /> Zona de Perigo
                </button>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ABA: GERAL                                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'geral' && (
                <form onSubmit={handleSave} className="space-y-8">
                    {/* Action Bar Sticky */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-5 px-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 sticky top-20 z-40">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Status de Sincronização</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Conectado a branch Main
                            </p>
                        </div>
                        <button type="submit" disabled={saving} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {saving ? 'Validando e Comitando...' : 'Salvar Alterações Globais'}
                        </button>
                    </div>

                    {configError && <div className="p-5 bg-red-100/50 text-red-700 rounded-2xl font-bold border border-red-200 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /> {configError}</div>}

                    {/* Identidade Base */}
                    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-4 flex items-center gap-3">
                            <span className="bg-slate-100 p-2 rounded-lg text-slate-600">📦</span> Identidade Base
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2 flex flex-col sm:flex-row gap-8 items-start">
                                <div className="w-full sm:w-1/3">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Logo Principal</label>
                                    <label className="group relative border-2 border-dashed border-slate-300 hover:border-violet-500 bg-slate-50 hover:bg-violet-50/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center h-48">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setPendingLogo(file);
                                                setConfig({ ...config, logo: URL.createObjectURL(file) });
                                            }
                                        }} />
                                        {config?.logo ? (
                                            <img src={config.logo} alt="Logo" className="max-h-24 w-auto object-contain mb-4 transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-3 group-hover:text-violet-500 transition-colors">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                        )}
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-violet-700 transition-colors">
                                            {config?.logo ? 'Trocar Logo' : 'Enviar Logo (PNG/SVG)'}
                                        </span>
                                    </label>
                                </div>
                                <div className="w-full sm:w-2/3 space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Site / Empresa</label>
                                        <input type="text" value={config?.name || ''} onChange={e => setConfig({ ...config, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-800 font-medium" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Cor Primária (Hex)</label>
                                            <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                                <input type="color" value={config?.theme?.primary || '#000000'} onChange={e => setConfig({ ...config, theme: { ...config.theme, primary: e.target.value, primaryDark: e.target.value } })} className="h-10 w-16 p-0 border-0 rounded-lg cursor-pointer bg-transparent" />
                                                <input type="text" value={config?.theme?.primary || ''} onChange={e => setConfig({ ...config, theme: { ...config.theme, primary: e.target.value, primaryDark: e.target.value } })} className="flex-1 bg-transparent border-none focus:outline-none font-mono text-slate-700 font-bold" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Cor Secundária (Hex)</label>
                                            <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                                <input type="color" value={config?.theme?.accent || '#ffffff'} onChange={e => setConfig({ ...config, theme: { ...config.theme, accent: e.target.value } })} className="h-10 w-16 p-0 border-0 rounded-lg cursor-pointer bg-transparent" />
                                                <input type="text" value={config?.theme?.accent || ''} onChange={e => setConfig({ ...config, theme: { ...config.theme, accent: e.target.value } })} className="flex-1 bg-transparent border-none focus:outline-none font-mono text-slate-700 font-bold" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Combinação de Fontes</label>
                                        <select value={config?.theme?.font || 'outfit'} onChange={e => setConfig({ ...config, theme: { ...config.theme, font: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium text-slate-700">
                                            <optgroup label="Mais Usadas / Populares">
                                                <option value="inter">Inter & Roboto Mono (Moderno / Tech)</option>
                                                <option value="outfit">Outfit & Inter (Clean / SaaS)</option>
                                                <option value="roboto">Roboto & Open Sans (Corporativo / Neutro)</option>
                                                <option value="poppins">Poppins & Lora (Criativo / Boutique)</option>
                                                <option value="montserrat">Montserrat & Merriweather (Profissional / Textual)</option>
                                            </optgroup>
                                            <optgroup label="Elegância & Editorial">
                                                <option value="playfair">Playfair Display & Source Sans (Elegante / Editorial)</option>
                                                <option value="cormorant">Cormorant Garamond & Proza Libre (Luxuoso / Sofisticado)</option>
                                                <option value="lora">Lora & Merriweather (Revista / Narrativa)</option>
                                                <option value="ptserif">PT Serif & PT Sans (Tradicional / Confiável)</option>
                                                <option value="notoserif">Noto Serif & Noto Sans (Universal / Legível)</option>
                                            </optgroup>
                                            <optgroup label="Moderna & Geométrica">
                                                <option value="dmsans">DM Sans & DM Mono (Geométrico / Tech)</option>
                                                <option value="spacegrotesk">Space Grotesk & Inter (Tech Vibe / Web3)</option>
                                                <option value="syne">Syne & Inter (Artístico / Avant-garde)</option>
                                                <option value="raleway">Raleway & Open Sans (Amplo / Flexível)</option>
                                                <option value="quicksand">Quicksand & Quicksand (Arredondado / Descontraído)</option>
                                            </optgroup>
                                            <optgroup label="Impacto & Negócios">
                                                <option value="oswald">Oswald & Cardo (Forte / Impactante)</option>
                                                <option value="bebas">Bebas Neue & Montserrat (Chamativo / Dinâmico)</option>
                                                <option value="lato">Lato & Roboto (Clássico / Minimalista)</option>
                                                <option value="ubuntu">Ubuntu & Lora (Amigável / Dinâmico)</option>
                                                <option value="sourceserif">Source Serif Pro & Source Sans Pro (Harmônico / Bank)</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Redes Sociais */}
                    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-4 flex items-center gap-3">
                            <span className="bg-slate-100 p-2 rounded-lg text-slate-600">🔗</span> Redes Sociais (Rodapé)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {['instagram', 'twitter', 'linkedin', 'github'].map(social => (
                                <div key={social}>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 capitalize">{social}</label>
                                    <input type="url" placeholder={`https://${social}.com/seuperfil`} value={config?.social?.[social] || ''} onChange={e => setConfig({ ...config, social: { ...config.social, [social]: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-sm font-mono text-slate-600" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contato */}
                    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-4 flex items-center gap-3">
                            <span className="bg-slate-100 p-2 rounded-lg text-slate-600">📬</span> SAC / Localização
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">E-mail Comercial Oficial</label>
                                <input type="email" value={config?.contact?.email || ''} onChange={e => setConfig({ ...config, contact: { ...config.contact, email: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-700 font-medium" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Telefone (Formato Visível)</label>
                                <input type="text" placeholder="+55 (11) 90000-0000" value={config?.contact?.phone || ''} onChange={e => setConfig({ ...config, contact: { ...config.contact, phone: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-700 font-medium" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Endereço Comercial / Sede</label>
                                <input type="text" value={config?.contact?.address || ''} onChange={e => setConfig({ ...config, contact: { ...config.contact, address: e.target.value } })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-slate-700 font-medium" />
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ABA: DEPLOYS                                                   */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'deploys' && (
                <div className="space-y-6">
                    {
                        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Histórico de Deploys</h3>
                                    <p className="text-sm text-slate-500">Últimas 15 atualizações e publicações do site.</p>
                                </div>
                                <button
                                    onClick={handleRedeploy}
                                    disabled={redeploying || !deploys[0]?.uid}
                                    className="px-5 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
                                >
                                    {redeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    {redeploying ? 'Agendando...' : 'Forçar Deploy'}
                                </button>
                            </div>

                            {deploys.length === 0 ? (
                                <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                                    <p className="text-slate-500 font-medium">Nenhum deploy registrado.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {deploys.map((dep: any) => (
                                        <li key={dep.uid} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <DeployBadge state={dep.readyState} />
                                                    <a href={`https://${dep.url}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-slate-700 group-hover:text-violet-600 font-medium flex items-center gap-1 hover:underline">
                                                        {dep.url} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {dep.source || 'API/Manual'} · {new Date(dep.createdAt).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                            <p className="text-xs font-mono text-slate-300">ID: {dep.uid?.substring(0, 12)}…</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    }
                </div>
            )}

            {activeTab === 'dominios' && (
                <div className="space-y-6">
                    <div className="bg-white border text-left border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8">
                        <div className="mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Gerenciar Domínios</h3>
                            <p className="text-sm text-slate-500">Adicione domínios personalizados (<code>www.seudominio.com.br</code>) para este projeto.</p>
                        </div>

                        {/* ── Formulário Adicionar (form nativo POST, igual [id].astro) ── */}
                        <form method="POST" action="/api/vercel/domains/add" className="flex flex-col sm:flex-row gap-4 mb-8">
                            <input type="hidden" name="integration_id" value={integrationId || ''} />
                            <input type="hidden" name="project_id" value={initialProjectId || (repoName ? repoName.split('/')[1] : siteId)} />
                            <input type="hidden" name="redirect_to" value={`/dashboard/cms/${siteId}/config?tab=dominios`} />
                            <input
                                type="text"
                                name="domain_name"
                                placeholder="Ex: meudominio.com.br"
                                required
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors font-mono text-sm"
                            />
                            <select
                                name="target"
                                className="px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors text-slate-700 font-medium cursor-pointer"
                            >
                                <option value="production">Ir para Produção</option>
                                <option value="preview">Ir para Preview</option>
                            </select>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 whitespace-nowrap flex items-center gap-2"
                            >
                                Adicionar Domínio
                            </button>
                        </form>


                        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Domínios Ativos</h4>

                        {domains.length === 0 ? (
                            <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                                <p className="text-slate-500 font-medium">Nenhum domínio configurado.</p>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {domains.map((dom: any) => (
                                    <li key={dom.name} className="flex flex-col p-5 bg-white border border-slate-200 rounded-xl shadow-sm gap-4 transition-all hover:border-slate-300 relative">
                                        {/* Barra âmbar para configuração pendente */}
                                        {(!dom.verified || dom.misconfigured) && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-xl"></div>
                                        )}

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div>
                                                <a href={`https://${dom.name}`} target="_blank" rel="noopener noreferrer" className="font-mono text-slate-800 font-bold hover:text-violet-600 hover:underline flex items-center gap-2 mb-2 text-lg">
                                                    {dom.name}
                                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                                </a>
                                                <div className="flex items-center gap-2 text-xs mb-3">
                                                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded uppercase tracking-wide">
                                                        Target: {dom.target === 'production' || !dom.gitBranch ? 'Produção' : 'Preview'}
                                                    </span>
                                                    {(dom.verified && !dom.misconfigured) ? (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded uppercase tracking-wide flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verificado
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-bold rounded uppercase tracking-wide flex items-center gap-1 border border-amber-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Configuração Pendente
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Instruções DNS quando pendente */}
                                                {(!dom.verified || dom.misconfigured) && (
                                                    <DnsInstructions domain={dom} />
                                                )}
                                            </div>

                                            {/* Botões de Ação (forms nativos POST, igual [id].astro) */}
                                            <div className="flex items-center gap-2 mt-1 shrink-0">
                                                {(!dom.verified || dom.misconfigured) && (
                                                    <form method="POST" action="/api/vercel/domains/verify" style={{ display: 'inline' }}>
                                                        <input type="hidden" name="integration_id" value={integrationId || ''} />
                                                        <input type="hidden" name="project_id" value={initialProjectId || (repoName ? repoName.split('/')[1] : siteId)} />
                                                        <input type="hidden" name="redirect_to" value={`/dashboard/cms/${siteId}/config?tab=dominios`} />
                                                        <input type="hidden" name="domain_name" value={dom.name} />
                                                        <button type="submit" className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5 shadow-sm">
                                                            <RefreshCw className="w-3.5 h-3.5" /> Refresh DNS
                                                        </button>
                                                    </form>
                                                )}
                                                <form method="POST" action="/api/vercel/domains/remove" style={{ display: 'inline' }} onSubmit={(e: any) => { if (!window.confirm(`CUIDADO: Remover '${dom.name}'? O site pode sair do ar.`)) e.preventDefault(); }}>
                                                    <input type="hidden" name="integration_id" value={integrationId || ''} />
                                                    <input type="hidden" name="project_id" value={initialProjectId || (repoName ? repoName.split('/')[1] : siteId)} />
                                                    <input type="hidden" name="redirect_to" value={`/dashboard/cms/${siteId}/config?tab=dominios`} />
                                                    <input type="hidden" name="domain_name" value={dom.name} />
                                                    <button type="submit" className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5 shadow-sm">
                                                        <Trash2 className="w-3.5 h-3.5" /> Remover
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ABA: ZONA DE PERIGO                                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'perigo' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8">
                    <h3 className="font-bold text-xl text-red-800 mb-2">Zona de Perigo</h3>
                    <p className="text-red-700 mb-6">As ações abaixo são destrutivas e afetam o site permanentemente na Vercel e no GitHub.</p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 text-center px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {deleting ? 'Excluindo...' : 'Excluir Projeto Permanentemente'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
