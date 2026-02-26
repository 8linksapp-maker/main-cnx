/**
 * wizard/Step5Content.tsx
 *
 * Etapa 5 do wizard — conteúdo inicial das páginas:
 * texto da página /sobre, tipo da página /contato e bio do autor.
 * Todos os textos podem ser gerados por IA.
 */

import type { WizardData } from './types';

interface Props {
    data: WizardData;
    onChange: (updates: Partial<WizardData>) => void;
}

const CONTACT_OPTIONS: Array<{ value: WizardData['contactPageType']; label: string; desc: string; emoji: string }> = [
    { value: 'with-form', label: 'NAP + Formulário',  desc: 'Endereço, telefone, e-mail e formulário de contato', emoji: '📋' },
    { value: 'nap-only',  label: 'Apenas NAP',         desc: 'Só exibe endereço, telefone e e-mail, sem formulário', emoji: '📍' },
    { value: 'none',      label: 'Sem página',          desc: 'Não criar página /contato', emoji: '✕' },
];

export default function Step5Content({ data, onChange }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.375rem' }}>
                    Conteúdo Inicial das Páginas
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    Esses textos são o ponto de partida — você pode editar tudo pelo painel admin depois.
                </p>
            </div>

            {/* Página /sobre */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>
                        Texto da página /sobre
                    </label>
                    <button type="button" onClick={() => onChange({ aboutAI: !data.aboutAI })} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.3rem 0.625rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem',
                        background: data.aboutAI ? 'rgba(59,130,246,0.1)' : 'var(--admin-surface)',
                        border: `1px solid ${data.aboutAI ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                        color: data.aboutAI ? 'var(--admin-accent)' : 'var(--admin-text-subtle)',
                        transition: 'all 0.15s ease',
                    }}>
                        {data.aboutAI ? '✓' : '○'} Deixar a IA criar
                    </button>
                </div>
                {data.aboutAI ? (
                    <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', padding: '0.75rem', background: 'var(--admin-surface)', borderRadius: '0.5rem', border: '1px dashed var(--admin-border)' }}>
                        A IA vai escrever um texto "Sobre" com 3-4 parágrafos baseado no nome e nicho da marca.
                    </p>
                ) : (
                    <textarea
                        className="admin-input"
                        rows={5}
                        value={data.aboutText}
                        onChange={e => onChange({ aboutText: e.target.value })}
                        placeholder="Conte sobre você, sua marca, sua missão... (este texto vai aparecer na página /sobre)"
                        style={{ resize: 'vertical' }}
                    />
                )}
            </div>

            {/* Bio do autor */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>
                        Bio do autor (sidebar dos posts)
                    </label>
                    <button type="button" onClick={() => onChange({ authorBioSameAsAbout: !data.authorBioSameAsAbout })} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.3rem 0.625rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem',
                        background: data.authorBioSameAsAbout ? 'rgba(59,130,246,0.1)' : 'var(--admin-surface)',
                        border: `1px solid ${data.authorBioSameAsAbout ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                        color: data.authorBioSameAsAbout ? 'var(--admin-accent)' : 'var(--admin-text-subtle)',
                        transition: 'all 0.15s ease',
                    }}>
                        {data.authorBioSameAsAbout ? '✓' : '○'} Resumo do texto "Sobre"
                    </button>
                </div>
                {!data.authorBioSameAsAbout && (
                    <textarea
                        className="admin-input"
                        rows={2}
                        value={data.authorBio}
                        onChange={e => onChange({ authorBio: e.target.value })}
                        placeholder="Bio curta de 2-3 frases que aparece na sidebar dos posts..."
                        style={{ resize: 'vertical' }}
                    />
                )}
                {data.authorBioSameAsAbout && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)', padding: '0.625rem', background: 'var(--admin-surface)', borderRadius: '0.5rem', border: '1px dashed var(--admin-border)' }}>
                        A IA vai criar um resumo de 2-3 frases a partir do texto "Sobre".
                    </p>
                )}
            </div>

            {/* Página de contato */}
            <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.625rem' }}>
                    Página /contato
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {CONTACT_OPTIONS.map(opt => {
                        const sel = data.contactPageType === opt.value;
                        return (
                            <button key={opt.value} type="button"
                                onClick={() => onChange({ contactPageType: opt.value })}
                                style={{
                                    padding: '0.75rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    background: sel ? 'rgba(59,130,246,0.08)' : 'var(--admin-surface)',
                                    border: `1px solid ${sel ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                    color: 'var(--admin-text)', fontSize: '0.85rem',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}>
                                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{opt.emoji}</span>
                                <div>
                                    <div style={{ fontWeight: sel ? 600 : 400 }}>{opt.label}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{opt.desc}</div>
                                </div>
                                {sel && <span style={{ marginLeft: 'auto', color: 'var(--admin-accent)', fontWeight: 700 }}>✓</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
