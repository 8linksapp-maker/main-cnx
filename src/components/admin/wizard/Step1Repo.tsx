/**
 * wizard/Step1Repo.tsx
 *
 * Etapa 1 do wizard — coleta a URL do repositório GitHub e a branch.
 * Esses dados são usados no comando git clone do prompt gerado.
 */

import type { WizardData } from './types';

interface Props {
    data: WizardData;
    onChange: (updates: Partial<WizardData>) => void;
}

const label = (text: string, required = false) => (
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
        {text}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
    </label>
);

export default function Step1Repo({ data, onChange }: Props) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.375rem' }}>
                    Repositório GitHub
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
                    Informe a URL do repositório que você criou a partir do template CNX.
                    O Cursor Agent vai clonar este repositório e criar o tema dentro dele.
                </p>
            </div>

            {/* URL do repositório */}
            <div>
                {label('URL do repositório GitHub', true)}
                <input
                    className="admin-input"
                    type="url"
                    value={data.repoUrl}
                    onChange={e => onChange({ repoUrl: e.target.value })}
                    placeholder="https://github.com/seu-usuario/seu-repo"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)', marginTop: '0.375rem' }}>
                    💡 Encontre em: GitHub → seu repositório → botão verde "Code" → HTTPS
                </p>
            </div>

            {/* Branch */}
            <div>
                {label('Branch principal')}
                <input
                    className="admin-input"
                    type="text"
                    value={data.branch}
                    onChange={e => onChange({ branch: e.target.value })}
                    placeholder="main"
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)', marginTop: '0.375rem' }}>
                    Deixe "main" caso não tenha alterado o padrão.
                </p>
            </div>

            {/* Preview do comando */}
            {data.repoUrl && (
                <div style={{
                    padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--admin-border)',
                    color: 'var(--admin-text-muted)',
                }}>
                    <div style={{ color: 'var(--admin-text-subtle)', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Preview do comando gerado
                    </div>
                    <div style={{ color: '#4ade80' }}>$ git clone <span style={{ color: '#93c5fd' }}>{data.repoUrl}</span> .</div>
                </div>
            )}
        </div>
    );
}
