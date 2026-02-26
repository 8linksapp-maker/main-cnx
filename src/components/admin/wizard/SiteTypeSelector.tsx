/**
 * wizard/SiteTypeSelector.tsx
 *
 * Tela inicial do wizard — exibe cards para cada tipo de site disponível.
 * Apenas "Blog / Conteúdo" está liberado; os demais mostram cadeado "Em breve".
 */

import { SITE_TYPES } from './types';

interface Props {
    onSelect: (typeId: string) => void;
}

export default function SiteTypeSelector({ onSelect }: Props) {
    return (
        <div>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
                    Que tipo de site você quer criar?
                </h2>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>
                    Selecione o tipo de site para iniciar o wizard de criação de tema.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {SITE_TYPES.map((type) => (
                    <button
                        key={type.id}
                        type="button"
                        disabled={type.locked}
                        onClick={() => !type.locked && onSelect(type.id)}
                        style={{
                            position: 'relative',
                            padding: '1.5rem 1rem',
                            borderRadius: '0.75rem',
                            border: type.locked
                                ? '1px solid var(--admin-border)'
                                : '2px solid var(--admin-accent)',
                            background: type.locked ? 'var(--admin-surface)' : 'rgba(59,130,246,0.07)',
                            cursor: type.locked ? 'not-allowed' : 'pointer',
                            opacity: type.locked ? 0.55 : 1,
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                        }}
                    >
                        {/* Badge "Em breve" */}
                        {type.locked && (
                            <span style={{
                                position: 'absolute', top: '8px', right: '8px',
                                fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px',
                                borderRadius: '999px', background: 'var(--admin-border)',
                                color: 'var(--admin-text-subtle)',
                            }}>
                                Em breve
                            </span>
                        )}
                        {/* Badge "Disponível" */}
                        {!type.locked && (
                            <span style={{
                                position: 'absolute', top: '8px', right: '8px',
                                fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px',
                                borderRadius: '999px', background: 'rgba(59,130,246,0.2)',
                                color: 'var(--admin-accent)',
                            }}>
                                ✓ Disponível
                            </span>
                        )}
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{type.emoji}</div>
                        <div style={{
                            fontSize: '0.9rem', fontWeight: 600,
                            color: type.locked ? 'var(--admin-text-muted)' : 'var(--admin-text)',
                        }}>
                            {type.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
