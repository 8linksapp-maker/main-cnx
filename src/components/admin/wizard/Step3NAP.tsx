/**
 * wizard/Step3NAP.tsx
 *
 * Etapa 3 do wizard — coleta dados de NAP (Name, Address, Phone),
 * tipo de negócio para Schema.org e redes sociais.
 * Esses dados alimentam contact.yaml e o Schema.org no tema.
 */

import type { WizardData } from './types';

interface Props {
    data: WizardData;
    onChange: (updates: Partial<WizardData>) => void;
}

const BUSINESS_TYPES = [
    { id: 'person',       label: 'Pessoa / Criador',    emoji: '👤' },
    { id: 'local',        label: 'Empresa Local',        emoji: '🏢' },
    { id: 'organization', label: 'Organização / ONG',   emoji: '🌐' },
    { id: 'ecommerce',    label: 'E-commerce / Loja',   emoji: '🛒' },
] as const;

const SOCIALS = [
    { key: 'socialInstagram', label: 'Instagram', placeholder: '@usuario', emoji: '📸' },
    { key: 'socialYoutube',   label: 'YouTube',   placeholder: 'https://youtube.com/...',  emoji: '▶️' },
    { key: 'socialLinkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/...', emoji: '💼' },
    { key: 'socialPinterest', label: 'Pinterest', placeholder: '@usuario', emoji: '📌' },
    { key: 'socialTiktok',    label: 'TikTok',    placeholder: '@usuario', emoji: '🎵' },
    { key: 'socialTwitter',   label: 'X / Twitter', placeholder: '@usuario', emoji: '🐦' },
] as const;

function FieldLabel({ text, hint }: { text: string; hint?: string }) {
    return (
        <div style={{ marginBottom: '0.375rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>{text}</label>
            {hint && <p style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)' }}>{hint}</p>}
        </div>
    );
}

export default function Step3NAP({ data, onChange }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.375rem' }}>
                    NAP & Dados de Contato
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    NAP (Name, Address, Phone) é fundamental para SEO local. Esses dados aparecem
                    na página de contato e no Schema.org do site.
                </p>
            </div>

            {/* Tipo de negócio */}
            <div>
                <FieldLabel text="Tipo de negócio (Schema.org)" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {BUSINESS_TYPES.map(bt => {
                        const sel = data.businessType === bt.id;
                        return (
                            <button key={bt.id} type="button"
                                onClick={() => onChange({ businessType: bt.id as WizardData['businessType'] })}
                                style={{
                                    padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
                                    background: sel ? 'rgba(59,130,246,0.12)' : 'var(--admin-surface)',
                                    border: `1px solid ${sel ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                    color: sel ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                                    fontSize: '0.82rem', fontWeight: sel ? 600 : 400,
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    transition: 'all 0.15s ease',
                                }}>
                                <span>{bt.emoji}</span><span>{bt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Nome oficial */}
            <div>
                <FieldLabel text="Nome oficial (para Schema.org)" hint="Pode ser diferente do nome da marca. Ex: 'João Silva ME'" />
                <input className="admin-input" value={data.businessName}
                    onChange={e => onChange({ businessName: e.target.value })}
                    placeholder={data.brandName || 'Nome oficial do negócio'} />
            </div>

            {/* Endereço */}
            <div>
                <FieldLabel text="Endereço" hint="Opcional — recomendado para negócios com endereço físico (SEO local)" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="admin-input" value={data.addressStreet}
                        onChange={e => onChange({ addressStreet: e.target.value })}
                        placeholder="Rua / Avenida" />
                    <input className="admin-input" style={{ width: '90px' }} value={data.addressNumber}
                        onChange={e => onChange({ addressNumber: e.target.value })}
                        placeholder="Nº" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="admin-input" value={data.addressComplement}
                        onChange={e => onChange({ addressComplement: e.target.value })}
                        placeholder="Complemento" />
                    <input className="admin-input" value={data.addressZip}
                        onChange={e => onChange({ addressZip: e.target.value })}
                        placeholder="CEP" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                    <input className="admin-input" value={data.addressCity}
                        onChange={e => onChange({ addressCity: e.target.value })}
                        placeholder="Cidade" />
                    <input className="admin-input" style={{ width: '60px' }} value={data.addressState}
                        onChange={e => onChange({ addressState: e.target.value })}
                        placeholder="UF" maxLength={2} />
                </div>
            </div>

            {/* Contatos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <FieldLabel text="Telefone (com DDD)" />
                    <input className="admin-input" type="tel" value={data.phone}
                        onChange={e => onChange({ phone: e.target.value })}
                        placeholder="(11) 99999-9999" />
                </div>
                <div>
                    <FieldLabel text="E-mail de contato" />
                    <input className="admin-input" type="email" value={data.email}
                        onChange={e => onChange({ email: e.target.value })}
                        placeholder="contato@seusite.com" />
                </div>
            </div>

            {/* URL Canônica */}
            <div>
                <FieldLabel text="URL canônica do site" hint="Ex: https://www.seusite.com.br (sem barra no final)" />
                <input className="admin-input" type="url" value={data.canonicalUrl}
                    onChange={e => onChange({ canonicalUrl: e.target.value })}
                    placeholder="https://www.seusite.com.br" />
            </div>

            {/* Redes sociais */}
            <div>
                <FieldLabel text="Redes Sociais (preencha apenas as que você tem)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {SOCIALS.map(s => (
                        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '24px', textAlign: 'center', flexShrink: 0 }}>{s.emoji}</span>
                            <span style={{ width: '80px', fontSize: '0.78rem', color: 'var(--admin-text-muted)', flexShrink: 0 }}>{s.label}</span>
                            <input
                                className="admin-input"
                                value={(data as Record<string, string>)[s.key] ?? ''}
                                onChange={e => onChange({ [s.key]: e.target.value } as Partial<WizardData>)}
                                placeholder={s.placeholder}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
