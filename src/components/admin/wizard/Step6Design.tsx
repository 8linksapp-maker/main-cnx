/**
 * wizard/Step6Design.tsx
 *
 * Etapa 6 do wizard — todas as escolhas de design e estrutura do site:
 * estilo visual, modo dark/light, fonte, cores (paleta + picker),
 * estilo do blog (magazine/grid/lista), modelo do post e seções da home.
 */

import type { WizardData } from './types';
import { COLOR_PALETTE, HOME_SECTION_OPTIONS } from './types';

interface Props {
    data: WizardData;
    onChange: (updates: Partial<WizardData>) => void;
}

// ─── Mini sub-componentes ──────────────────────────────────────────────────────

function OptionCard({
    selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} style={{
            padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
            background: selected ? 'rgba(59,130,246,0.12)' : 'var(--admin-surface)',
            border: `1px solid ${selected ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
            color: selected ? 'var(--admin-text)' : 'var(--admin-text-muted)',
            transition: 'all 0.15s ease', textAlign: 'center',
        }}>
            {children}
        </button>
    );
}

function SectionLabel({ text }: { text: string }) {
    return (
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.625rem' }}>
            {text}
        </label>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Step6Design({ data, onChange }: Props) {
    function toggleSection(id: string) {
        const current = data.homeSections;
        onChange({
            homeSections: current.includes(id)
                ? current.filter(s => s !== id)
                : [...current, id],
        });
    }

    function toggleColor(hex: string, field: 'primaryColor' | 'secondaryColor') {
        onChange({ [field]: hex });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.375rem' }}>
                    Design & Estrutura do Site
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    Defina a aparência e organização do tema gerado.
                </p>
            </div>

            {/* Estilo visual */}
            <div>
                <SectionLabel text="Estilo visual" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                    {([
                        { id: 'minimal',  label: 'Minimalista',     emoji: '◻️' },
                        { id: 'bold',     label: 'Bold/Impactante', emoji: '⚡' },
                        { id: 'elegant',  label: 'Elegante/Luxo',   emoji: '✨' },
                        { id: 'tech',     label: 'Moderno/Tech',    emoji: '🔷' },
                        { id: 'organic',  label: 'Orgânico',        emoji: '🌿' },
                    ] as const).map(s => (
                        <OptionCard key={s.id} selected={data.visualStyle === s.id} onClick={() => onChange({ visualStyle: s.id })}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{s.emoji}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>{s.label}</div>
                        </OptionCard>
                    ))}
                </div>
            </div>

            {/* Modo dark/light */}
            <div>
                <SectionLabel text="Modo padrão do site" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <OptionCard selected={data.colorMode === 'dark'} onClick={() => onChange({ colorMode: 'dark' })}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>🌙</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Escuro</div>
                    </OptionCard>
                    <OptionCard selected={data.colorMode === 'light'} onClick={() => onChange({ colorMode: 'light' })}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>☀️</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Claro</div>
                    </OptionCard>
                </div>
            </div>

            {/* Fonte */}
            <div>
                <SectionLabel text="Estilo de fonte" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {([
                        { id: 'sans',    label: 'Sem serifa', sample: 'Aa',   desc: 'Inter, DM Sans' },
                        { id: 'serif',   label: 'Serifada',   sample: 'Aa',   desc: 'Playfair, Lora' },
                        { id: 'display', label: 'Display',    sample: 'Aa',   desc: 'Outfit, Syne' },
                    ] as const).map(f => (
                        <OptionCard key={f.id} selected={data.fontStyle === f.id} onClick={() => onChange({ fontStyle: f.id })}>
                            <div style={{
                                fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem',
                                fontFamily: f.id === 'serif' ? 'Georgia, serif' : f.id === 'display' ? 'system-ui' : 'system-ui',
                            }}>{f.sample}</div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>{f.label}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>{f.desc}</div>
                        </OptionCard>
                    ))}
                </div>
            </div>

            {/* Cores */}
            {(['primaryColor', 'secondaryColor'] as const).map(field => (
                <div key={field}>
                    <SectionLabel text={field === 'primaryColor' ? 'Cor primária (destaque)' : 'Cor secundária'} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                        {COLOR_PALETTE.map(c => (
                            <button key={c.hex} type="button" title={c.name}
                                onClick={() => toggleColor(c.hex, field)}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                    background: c.hex, border: `3px solid ${data[field] === c.hex ? 'white' : 'transparent'}`,
                                    outline: data[field] === c.hex ? `2px solid ${c.hex}` : 'none',
                                    transition: 'all 0.15s ease',
                                }}
                            />
                        ))}
                        {/* Custom picker */}
                        <div style={{ position: 'relative' }}>
                            <input type="color" value={data[field]}
                                onChange={e => onChange({ [field]: e.target.value })}
                                style={{ width: '32px', height: '32px', padding: 0, border: '1px solid var(--admin-border)', borderRadius: '50%', cursor: 'pointer', background: 'none' }}
                                title="Cor personalizada"
                            />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)', marginLeft: '0.25rem' }}>
                            {data[field]}
                        </span>
                    </div>
                </div>
            ))}

            {/* Estilo do blog */}
            <div>
                <SectionLabel text="Estilo de listagem do blog" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {/* Magazine */}
                    <OptionCard selected={data.blogStyle === 'magazine'} onClick={() => onChange({ blogStyle: 'magazine' })}>
                        <div style={{ marginBottom: '0.5rem', padding: '0.25rem' }}>
                            <div style={{ height: '28px', background: 'var(--admin-border)', borderRadius: '3px', marginBottom: '4px' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px' }}>
                                <div style={{ height: '16px', background: 'var(--admin-border)', borderRadius: '2px' }} />
                                <div style={{ height: '16px', background: 'var(--admin-border)', borderRadius: '2px' }} />
                                <div style={{ height: '16px', background: 'var(--admin-border)', borderRadius: '2px' }} />
                            </div>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>Magazine</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>Destaque + grid</div>
                    </OptionCard>

                    {/* Grid */}
                    <OptionCard selected={data.blogStyle === 'grid'} onClick={() => onChange({ blogStyle: 'grid' })}>
                        <div style={{ marginBottom: '0.5rem', padding: '0.25rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', marginBottom: '3px' }}>
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} style={{ height: '16px', background: 'var(--admin-border)', borderRadius: '2px' }} />
                                ))}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>Grid</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>Cards iguais</div>
                    </OptionCard>

                    {/* Lista */}
                    <OptionCard selected={data.blogStyle === 'list'} onClick={() => onChange({ blogStyle: 'list' })}>
                        <div style={{ marginBottom: '0.5rem', padding: '0.25rem' }}>
                            {[1,2,3].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                                    <div style={{ width: '24px', height: '18px', background: 'var(--admin-border)', borderRadius: '2px', flexShrink: 0 }} />
                                    <div style={{ flex: 1, height: '18px', background: 'var(--admin-border)', borderRadius: '2px' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 500 }}>Lista</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>Img + texto</div>
                    </OptionCard>
                </div>
            </div>

            {/* Sidebar no post */}
            <div>
                <SectionLabel text="Modelo do post individual" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <OptionCard selected={data.postSidebar} onClick={() => onChange({ postSidebar: true })}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>📑</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>Com sidebar</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>Autor, data, categoria</div>
                    </OptionCard>
                    <OptionCard selected={!data.postSidebar} onClick={() => onChange({ postSidebar: false })}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>📄</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>Sem sidebar</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>Foco no conteúdo</div>
                    </OptionCard>
                </div>
            </div>

            {/* Seções da home */}
            <div>
                <SectionLabel text="Seções da Home (marque e organize na ordem desejada)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {HOME_SECTION_OPTIONS.map(sec => {
                        const checked = data.homeSections.includes(sec.id);
                        const idx     = data.homeSections.indexOf(sec.id);
                        return (
                            <button key={sec.id} type="button" onClick={() => toggleSection(sec.id)} style={{
                                padding: '0.625rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', width: '100%',
                                background: checked ? 'rgba(59,130,246,0.08)' : 'var(--admin-surface)',
                                border: `1px solid ${checked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                color: 'var(--admin-text)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                textAlign: 'left', transition: 'all 0.15s ease',
                            }}>
                                <span style={{
                                    width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0,
                                    background: checked ? 'var(--admin-accent)' : 'transparent',
                                    border: `2px solid ${checked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.72rem', color: 'white', fontWeight: 700,
                                }}>
                                    {checked ? (idx + 1) : ''}
                                </span>
                                <span style={{ fontSize: '1rem' }}>{sec.emoji}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: checked ? 600 : 400 }}>{sec.label}</span>
                            </button>
                        );
                    })}
                </div>
                {data.homeSections.length === 0 && (
                    <p style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.5rem' }}>
                        Selecione pelo menos 1 seção para a home.
                    </p>
                )}
            </div>
        </div>
    );
}
