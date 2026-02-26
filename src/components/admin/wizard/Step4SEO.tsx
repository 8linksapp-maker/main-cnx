/**
 * wizard/Step4SEO.tsx
 *
 * Etapa 4 do wizard — configurações de SEO e Open Graph:
 * separador de título, OG title/description/image, Twitter handle,
 * Google Site Verification e toggles para sitemap, robots.txt e Schema.org.
 */

import type { WizardData } from './types';

interface Props {
    data: WizardData;
    onChange: (updates: Partial<WizardData>) => void;
}

const SEPARATORS: Array<{ value: WizardData['titleSeparator']; example: string }> = [
    { value: '|', example: 'Post | Site' },
    { value: '—', example: 'Post — Site' },
    { value: '•', example: 'Post • Site' },
];

function AIToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.3rem 0.625rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem',
            background: enabled ? 'rgba(59,130,246,0.1)' : 'var(--admin-surface)',
            border: `1px solid ${enabled ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
            color: enabled ? 'var(--admin-accent)' : 'var(--admin-text-subtle)',
            transition: 'all 0.15s ease',
        }}>
            {enabled ? '✓' : '○'} Deixar a IA criar
        </button>
    );
}

function CheckToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <button type="button" onClick={onChange} style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', width: '100%',
            background: checked ? 'rgba(59,130,246,0.08)' : 'var(--admin-surface)',
            border: `1px solid ${checked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
            color: 'var(--admin-text)', fontSize: '0.85rem', fontWeight: checked ? 600 : 400,
            transition: 'all 0.15s ease', textAlign: 'left',
        }}>
            <span style={{
                width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                background: checked ? 'var(--admin-accent)' : 'transparent',
                border: `2px solid ${checked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                color: 'white',
            }}>
                {checked && '✓'}
            </span>
            {label}
        </button>
    );
}

export default function Step4SEO({ data, onChange }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.375rem' }}>
                    SEO & Open Graph
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    Configurações que controlam como o site aparece no Google, WhatsApp, redes sociais e buscadores.
                </p>
            </div>

            {/* Separador de título */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.625rem' }}>
                    Separador do título da página
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {SEPARATORS.map(sep => {
                        const sel = data.titleSeparator === sep.value;
                        return (
                            <button key={sep.value} type="button"
                                onClick={() => onChange({ titleSeparator: sep.value })}
                                style={{
                                    flex: 1, padding: '0.625rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    background: sel ? 'rgba(59,130,246,0.12)' : 'var(--admin-surface)',
                                    border: `1px solid ${sel ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                    color: sel ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                    fontSize: '0.82rem', textAlign: 'center',
                                    transition: 'all 0.15s ease',
                                }}>
                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{sep.value}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)' }}>{sep.example}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* OG Title */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>OG Title (título padrão)</label>
                    <AIToggle enabled={data.ogTitleAI} onToggle={() => onChange({ ogTitleAI: !data.ogTitleAI })} />
                </div>
                {!data.ogTitleAI && (
                    <input className="admin-input" value={data.ogTitle}
                        onChange={e => onChange({ ogTitle: e.target.value })}
                        placeholder="Título que aparece ao compartilhar o site (máx 60 chars)"
                        maxLength={60} />
                )}
                {data.ogTitleAI && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', padding: '0.5rem', background: 'var(--admin-surface)', borderRadius: '0.5rem', border: '1px dashed var(--admin-border)' }}>
                        A IA vai gerar um OG title baseado no nome e nicho da marca.
                    </p>
                )}
            </div>

            {/* OG Description */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>OG Description (meta description)</label>
                    <AIToggle enabled={data.ogDescriptionAI} onToggle={() => onChange({ ogDescriptionAI: !data.ogDescriptionAI })} />
                </div>
                {!data.ogDescriptionAI && (
                    <textarea className="admin-input" rows={2} value={data.ogDescription}
                        onChange={e => onChange({ ogDescription: e.target.value })}
                        placeholder="Descrição do site (máx 160 caracteres)"
                        maxLength={160}
                        style={{ resize: 'vertical' }} />
                )}
                {data.ogDescriptionAI && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', padding: '0.5rem', background: 'var(--admin-surface)', borderRadius: '0.5rem', border: '1px dashed var(--admin-border)' }}>
                        A IA vai gerar uma meta description baseada no nicho.
                    </p>
                )}
            </div>

            {/* OG Image + Twitter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                        OG Image (URL)
                    </label>
                    <input className="admin-input" type="url" value={data.ogImage}
                        onChange={e => onChange({ ogImage: e.target.value })}
                        placeholder="https://...imagem.jpg" />
                    <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)', marginTop: '0.25rem' }}>Recomendado: 1200×630px</p>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                        Twitter / X handle
                    </label>
                    <input className="admin-input" value={data.twitterHandle}
                        onChange={e => onChange({ twitterHandle: e.target.value })}
                        placeholder="@usuario" />
                </div>
            </div>

            {/* Google Site Verification */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                    Google Search Console — código de verificação <span style={{ fontWeight: 400, color: 'var(--admin-text-subtle)' }}>(opcional)</span>
                </label>
                <input className="admin-input" value={data.gscCode}
                    onChange={e => onChange({ gscCode: e.target.value })}
                    placeholder="Apenas o valor do atributo content da meta tag" />
                <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)', marginTop: '0.25rem' }}>
                    GSC → Configurações → Verificação → Tag HTML → copie apenas o valor após content="..."
                </p>
            </div>

            {/* Toggles: sitemap, robots, schema */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.625rem' }}>
                    Recursos de SEO técnico
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <CheckToggle
                        label="Gerar sitemap.xml automaticamente"
                        checked={data.generateSitemap}
                        onChange={() => onChange({ generateSitemap: !data.generateSitemap })}
                    />
                    <CheckToggle
                        label="Gerar robots.txt"
                        checked={data.generateRobots}
                        onChange={() => onChange({ generateRobots: !data.generateRobots })}
                    />
                    <CheckToggle
                        label="Gerar Schema.org (dados estruturados JSON-LD)"
                        checked={data.generateSchema}
                        onChange={() => onChange({ generateSchema: !data.generateSchema })}
                    />
                </div>
            </div>
        </div>
    );
}
