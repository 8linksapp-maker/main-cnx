/**
 * ThemeWizard.tsx
 *
 * Componente React principal do Wizard de Criação de Temas CNX.
 * Orquestra as 6 etapas de coleta de dados, a seleção inicial do tipo de site
 * e a exibição do prompt gerado ao final.
 *
 * Fluxo:
 *   1. Seleção do tipo de site (apenas Blog liberado)
 *   2. Etapas 1-6 (Repositório → Marca → NAP → SEO → Conteúdo → Design)
 *   3. Tela final com prompt copiável
 */

import { useState, useCallback } from 'react';
import type { WizardData } from './wizard/types';
import { DEFAULT_WIZARD_DATA } from './wizard/types';
import { generatePrompt } from '../../utils/theme-prompt-generator';

import SiteTypeSelector  from './wizard/SiteTypeSelector';
import StepIndicator     from './wizard/StepIndicator';
import Step1Repo         from './wizard/Step1Repo';
import Step2Brand        from './wizard/Step2Brand';
import Step3NAP          from './wizard/Step3NAP';
import Step4SEO          from './wizard/Step4SEO';
import Step5Content      from './wizard/Step5Content';
import Step6Design       from './wizard/Step6Design';
import PromptResult      from './wizard/PromptResult';

const TOTAL_STEPS = 6;

type Stage = 'type-select' | 'wizard' | 'prompt';

// ─── Validação mínima por step ────────────────────────────────────────────────

function canAdvance(step: number, data: WizardData): { ok: boolean; message?: string } {
    if (step === 1 && !data.repoUrl.startsWith('http')) {
        return { ok: false, message: 'Informe a URL do repositório GitHub.' };
    }
    if (step === 2 && !data.brandName.trim()) {
        return { ok: false, message: 'Informe o nome da marca.' };
    }
    if (step === 2 && !data.niche) {
        return { ok: false, message: 'Selecione o nicho do blog.' };
    }
    if (step === 6 && data.homeSections.length === 0) {
        return { ok: false, message: 'Selecione pelo menos 1 seção para a home.' };
    }
    return { ok: true };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ThemeWizard() {
    const [stage,        setStage]     = useState<Stage>('type-select');
    const [currentStep,  setStep]      = useState(1);
    const [data,         setData]      = useState<WizardData>(DEFAULT_WIZARD_DATA);
    const [validError,   setValidError]= useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');

    const onChange = useCallback((updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
        setValidError('');
    }, []);

    function handleTypeSelect(typeId: string) {
        if (typeId === 'blog') {
            setStage('wizard');
            setStep(1);
        }
    }

    function handleNext() {
        const check = canAdvance(currentStep, data);
        if (!check.ok) { setValidError(check.message!); return; }
        setValidError('');

        if (currentStep < TOTAL_STEPS) {
            setStep(s => s + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const prompt = generatePrompt(data);
            setGeneratedPrompt(prompt);
            setStage('prompt');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function handleBack() {
        setValidError('');
        if (currentStep > 1) {
            setStep(s => s - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setStage('type-select');
        }
    }

    function handleRestart() {
        setStage('type-select');
        setStep(1);
        setData(DEFAULT_WIZARD_DATA);
        setGeneratedPrompt('');
        setValidError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Render: seleção de tipo ────────────────────────────────────────────────
    if (stage === 'type-select') {
        return (
            <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
                <SiteTypeSelector onSelect={handleTypeSelect} />
            </div>
        );
    }

    // ── Render: resultado ──────────────────────────────────────────────────────
    if (stage === 'prompt') {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
                <PromptResult
                    prompt={generatedPrompt}
                    brandName={data.brandName}
                    themeSlug={data.themeSlug}
                    onRestart={handleRestart}
                />
            </div>
        );
    }

    // ── Render: wizard steps ───────────────────────────────────────────────────
    const stepComponents: Record<number, React.ReactNode> = {
        1: <Step1Repo    data={data} onChange={onChange} />,
        2: <Step2Brand   data={data} onChange={onChange} />,
        3: <Step3NAP     data={data} onChange={onChange} />,
        4: <Step4SEO     data={data} onChange={onChange} />,
        5: <Step5Content data={data} onChange={onChange} />,
        6: <Step6Design  data={data} onChange={onChange} />,
    };

    const isLastStep = currentStep === TOTAL_STEPS;

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem 1rem' }}>
            {/* Indicador de progresso */}
            <StepIndicator currentStep={currentStep} />

            {/* Card da etapa */}
            <div className="admin-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                {stepComponents[currentStep]}
            </div>

            {/* Erro de validação */}
            {validError && (
                <div style={{
                    padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                    color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    <span>⚠️</span> {validError}
                </div>
            )}

            {/* Navegação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    type="button"
                    onClick={handleBack}
                    className="admin-btn admin-btn-secondary"
                >
                    ← {currentStep === 1 ? 'Voltar' : 'Etapa anterior'}
                </button>

                <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle)' }}>
                    Etapa {currentStep} de {TOTAL_STEPS}
                </span>

                <button
                    type="button"
                    onClick={handleNext}
                    className="admin-btn admin-btn-primary"
                    style={{ minWidth: '140px' }}
                >
                    {isLastStep ? '✨ Gerar Prompt' : 'Próxima etapa →'}
                </button>
            </div>
        </div>
    );
}
