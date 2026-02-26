/**
 * wizard/Step2Brand.tsx
 *
 * Etapa 2 do wizard — coleta identidade da marca: nome, nicho e slogan.
 * Todos os nichos são cards clicáveis; slogan pode ser gerado por IA.
 */

import { useState } from 'react';
import type { WizardData } from './types';
import { NICHE_OPTIONS, slugify } from './types';

interface Props {
    data: WizardData;
    onChange: (updates: Partial<WizardData>) => void;
}

export default function Step2Brand({ data, onChange }: Props) {
    const [customSlugEdited, setCustomSlugEdited] = useState(!!data.themeSlug);

    function handleBrandName(name: string) {
        onChange({
            brandName: name,
            ...(!customSlugEdited ? { themeSlug: slugify(name) } : {}),
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.375rem' }}>
                    Identidade da Marca
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    Essas informações definem a personalidade do site gerado.
                </p>
            </div>

            {/* Nome da marca */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                    Nome do site / marca <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                    className="admin-input"
                    value={data.brandName}
                    onChange={e => handleBrandName(e.target.value)}
                    placeholder="Ex: João Silva Blog, Receitas da Mari"
                />
            </div>

            {/* Slug do tema */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                    Identificador do tema (slug)
                </label>
                <input
                    className="admin-input"
                    value={data.themeSlug}
                    onChange={e => { setCustomSlugEdited(true); onChange({ themeSlug: e.target.value }); }}
                    placeholder="ex: joao-financas"
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)', marginTop: '0.3rem' }}>
                    Gerado automaticamente a partir do nome. Pasta: src/themes/<strong>{data.themeSlug || 'seu-tema'}</strong>/
                </p>
            </div>

            {/* Nicho */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
                    Nicho do blog <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    {NICHE_OPTIONS.map(opt => {
                        const selected = data.niche === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onChange({ niche: opt.id })}
                                style={{
                                    padding: '0.625rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    background: selected ? 'rgba(59,130,246,0.12)' : 'var(--admin-surface)',
                                    border: `1px solid ${selected ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                    color: selected ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                    fontSize: '0.8rem', fontWeight: selected ? 600 : 400,
                                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <span>{opt.emoji}</span>
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Campo "Outro" */}
                {data.niche === 'outro' && (
                    <input
                        className="admin-input"
                        style={{ marginTop: '0.75rem' }}
                        value={data.customNiche}
                        onChange={e => onChange({ customNiche: e.target.value })}
                        placeholder="Descreva o seu nicho..."
                        autoFocus
                    />
                )}
            </div>

            {/* Slogan */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>
                    Slogan
                </label>
                <button
                    type="button"
                    onClick={() => onChange({ sloganAI: !data.sloganAI })}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem',
                        padding: '0.5rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem',
                        background: data.sloganAI ? 'rgba(59,130,246,0.1)' : 'var(--admin-surface)',
                        border: `1px solid ${data.sloganAI ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                        color: data.sloganAI ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                        transition: 'all 0.15s ease',
                    }}
                >
                    <span>{data.sloganAI ? '✓' : '○'}</span>
                    <span>Deixar a IA criar o slogan</span>
                </button>
                {!data.sloganAI && (
                    <input
                        className="admin-input"
                        value={data.slogan}
                        onChange={e => onChange({ slogan: e.target.value })}
                        placeholder="Ex: Transformando vidas através do conteúdo"
                    />
                )}
            </div>
        </div>
    );
}
