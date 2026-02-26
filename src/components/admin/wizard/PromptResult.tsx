/**
 * wizard/PromptResult.tsx
 *
 * Tela final do wizard — exibe o prompt gerado com botão de cópia,
 * instruções de uso no Cursor e resumo do que será criado.
 */

import { useState } from 'react';

interface Props {
    prompt: string;
    brandName: string;
    themeSlug: string;
    onRestart: () => void;
}

export default function PromptResult({ prompt, brandName, themeSlug, onRestart }: Props) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = prompt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header de sucesso */}
            <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚀</div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-text)', marginBottom: '0.5rem' }}>
                    Prompt gerado com sucesso!
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                    Tema <strong style={{ color: 'var(--admin-text)' }}>{brandName}</strong> (slug: <code style={{ fontSize: '0.85em', color: 'var(--admin-accent)' }}>{themeSlug}</code>)
                </p>
            </div>

            {/* Instruções */}
            <div style={{
                padding: '1rem 1.25rem', borderRadius: '0.75rem',
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
            }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-accent)', marginBottom: '0.5rem' }}>
                    📋 Como usar este prompt
                </p>
                <ol style={{ fontSize: '0.82rem', color: 'var(--admin-text-muted)', paddingLeft: '1.25rem', margin: 0, lineHeight: 1.7 }}>
                    <li>Abra o <strong style={{ color: 'var(--admin-text)' }}>Cursor</strong> e crie uma <strong>nova pasta vazia</strong></li>
                    <li>Ative o <strong style={{ color: 'var(--admin-text)' }}>Agent mode</strong> no chat (ícone de raio)</li>
                    <li>Clique em <strong style={{ color: 'var(--admin-text)' }}>Copiar Prompt</strong> abaixo</li>
                    <li>Cole no chat e pressione <kbd style={{ fontSize: '0.78em', padding: '1px 4px', background: 'var(--admin-surface)', borderRadius: '3px', border: '1px solid var(--admin-border)' }}>Enter</kbd></li>
                    <li>Aguarde — quando pedir autenticação, clique <strong>"Authorize"</strong> no browser</li>
                    <li>Após o Cursor terminar, acesse <code style={{ fontSize: '0.85em' }}>localhost:4321</code> para ver o resultado</li>
                </ol>
            </div>

            {/* Botão copiar */}
            <button
                type="button"
                onClick={handleCopy}
                style={{
                    padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                    background: copied ? 'rgba(74,222,128,0.15)' : 'var(--admin-accent)',
                    border: `2px solid ${copied ? '#4ade80' : 'var(--admin-accent)'}`,
                    color: copied ? '#4ade80' : 'white',
                    transition: 'all 0.25s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
            >
                {copied ? '✓ Copiado!' : '📋 Copiar Prompt Completo'}
            </button>

            {/* Prompt exibido */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>
                        Preview do prompt
                    </label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)' }}>
                        {prompt.length.toLocaleString('pt-BR')} caracteres
                    </span>
                </div>
                <div style={{
                    maxHeight: '400px', overflowY: 'auto', padding: '1rem',
                    borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6',
                    background: 'rgba(0,0,0,0.4)', border: '1px solid var(--admin-border)',
                    color: 'var(--admin-text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    {prompt}
                </div>
            </div>

            {/* Recomeçar */}
            <div style={{ textAlign: 'center', paddingBottom: '1rem' }}>
                <button
                    type="button"
                    onClick={onRestart}
                    className="admin-btn admin-btn-secondary"
                    style={{ fontSize: '0.85rem' }}
                >
                    ← Criar outro tema
                </button>
            </div>
        </div>
    );
}
