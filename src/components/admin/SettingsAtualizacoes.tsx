/**
 * SettingsAtualizacoes.tsx
 *
 * Componente React para ativar atualizações automáticas do template CNX.
 * Quando o usuário marca a opção e salva, o arquivo .github/workflows/sync-cnx.yml
 * é criado no repositório via GitHub API (o Deploy da Vercel não copia .github ao clonar).
 *
 * Isso permite que o botão "Aplicar agora" no painel funcione.
 */

import { useState, useEffect } from 'react';

export default function SettingsAtualizacoes() {
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/site-settings')
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res.success && typeof res.data?.autoUpdateEnabled === 'boolean') {
          setAutoUpdateEnabled(res.data.autoUpdateEnabled);
        }
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleToggle() {
    const next = !autoUpdateEnabled;
    setAutoUpdateEnabled(next);

    if (!next) {
      await saveSettings(false);
      return;
    }

    setLoading(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/ensure-workflow', { method: 'POST' });
      let data: { success?: boolean; error?: string };
      try {
        data = await res.json();
      } catch {
        setSaveStatus('error');
        setErrorMessage('Resposta inválida. Tente novamente.');
        setAutoUpdateEnabled(false);
        setLoading(false);
        return;
      }

      if (data.success) {
        setSaveStatus('success');
        await saveSettings(true);
      } else {
        setSaveStatus('error');
        const err = data.error || 'Não foi possível ativar.';
        setErrorMessage(
          err.includes('GITHUB') || err.includes('variáveis')
            ? 'Configure a conexão com o GitHub. Vá em Ajuda → Primeiros passos.'
            : err
        );
        setAutoUpdateEnabled(false);
      }
    } catch (e) {
      setSaveStatus('error');
      setErrorMessage('Erro de conexão. Verifique a internet e tente novamente.');
      setAutoUpdateEnabled(false);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 8000);
    }
  }

  async function saveSettings(enabled: boolean) {
    try {
      await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoUpdateEnabled: enabled }),
      });
    } catch {
      /* ignorar */
    }
  }

  if (!loaded) {
    return (
      <div style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>
        Carregando...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '640px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${autoUpdateEnabled ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <input
            type="checkbox"
            checked={autoUpdateEnabled}
            onChange={handleToggle}
            disabled={loading}
            style={{
              width: '1.25rem',
              height: '1.25rem',
              minWidth: '1.25rem',
              minHeight: '1.25rem',
              accentColor: 'var(--primary, #6366f1)',
              cursor: loading ? 'not-allowed' : 'pointer',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#e5e5e5',
            }}
          >
            Ativar para receber atualizações do template
          </span>
        </label>

        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '10px',
            background: autoUpdateEnabled ? 'rgba(34,197,94,0.2)' : 'var(--primary, #6366f1)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: `1px solid ${autoUpdateEnabled ? 'rgba(34,197,94,0.4)' : 'rgba(99,102,241,0.5)'}`,
            alignSelf: 'flex-start',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? '⏳ Configurando...'
            : autoUpdateEnabled
              ? '✅ Ativado'
              : '🔄 Ativar'}
        </button>
      </div>

      {loading && (
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
          ⏳ Configurando workflow no repositório...
        </p>
      )}

      {saveStatus === 'success' && !loading && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.25)',
            color: '#86efac',
            fontSize: '0.85rem',
          }}
        >
          ✅ Pronto. Você receberá as atualizações do template.
        </div>
      )}

      {saveStatus === 'error' && errorMessage && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}
        >
          ❌ {errorMessage}
          {errorMessage.includes('Ajuda') && (
            <a
              href="/admin/ajuda"
              style={{
                display: 'block',
                marginTop: '0.5rem',
                color: '#fbbf24',
                textDecoration: 'underline',
              }}
            >
              Abrir Ajuda →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
