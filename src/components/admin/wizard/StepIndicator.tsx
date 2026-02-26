/**
 * wizard/StepIndicator.tsx
 *
 * Barra de progresso visual do wizard, mostrando as 6 etapas
 * com estado atual, concluído e pendente.
 */

import { STEP_LABELS } from './types';

interface Props {
    currentStep: number; // 1-based
}

export default function StepIndicator({ currentStep }: Props) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {STEP_LABELS.map((label, i) => {
                    const stepNum  = i + 1;
                    const done     = stepNum < currentStep;
                    const active   = stepNum === currentStep;
                    const pending  = stepNum > currentStep;

                    return (
                        <div key={stepNum} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? '1' : undefined, minWidth: 0 }}>
                            {/* Círculo */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', minWidth: '56px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                                    background: done   ? 'var(--admin-accent)'       :
                                                active ? 'var(--admin-accent)'       : 'var(--admin-surface)',
                                    border: `2px solid ${done || active ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                                    color:  done || active ? '#fff' : 'var(--admin-text-subtle)',
                                    transition: 'all 0.2s ease',
                                }}>
                                    {done ? '✓' : stepNum}
                                </div>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: active ? 600 : 400,
                                    color: active ? 'var(--admin-text)' : done ? 'var(--admin-text-muted)' : 'var(--admin-text-subtle)',
                                    whiteSpace: 'nowrap', textAlign: 'center',
                                }}>
                                    {label}
                                </span>
                            </div>
                            {/* Linha conectora */}
                            {i < STEP_LABELS.length - 1 && (
                                <div style={{
                                    flex: 1, height: '2px', margin: '-1.25rem 4px 0',
                                    background: done ? 'var(--admin-accent)' : 'var(--admin-border)',
                                    transition: 'background 0.3s ease',
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
