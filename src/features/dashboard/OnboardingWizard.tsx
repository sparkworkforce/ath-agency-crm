'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

const STEP_ICONS = ['👥', '📋', '🎨', '🚀']

interface Props {
  hasClients: boolean
  hasProjects: boolean
  hasLogo: boolean
}

export default function OnboardingWizard({ hasClients, hasProjects, hasLogo }: Props) {
  const router = useRouter()
  const t = useTranslations('agency.onboarding')
  const initialStep = !hasClients ? 0 : !hasProjects ? 1 : !hasLogo ? 2 : 3
  const [step, setStep] = useState(initialStep)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || initialStep >= 3) return null

  const titleKey = `step${step + 1}Title` as const
  const descKey = `step${step + 1}Desc` as const

  function handleAction() {
    if (step === 0) router.push('/clients/new')
    else if (step === 1) router.push('/projects')
    else if (step === 2) router.push('/settings')
    else setDismissed(true)
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{STEP_ICONS[step]}</span>
          <div>
            <p className="text-xs text-emerald-600 font-medium mb-0.5">{t('step', { step: step + 1, total: STEP_ICONS.length })}</p>
            <h2 className="text-sm font-semibold text-gray-900">{t(titleKey)}</h2>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-xs text-gray-400 hover:text-gray-600">{t('skip')}</button>
      </div>
      <p className="text-sm text-gray-500 mt-2 mb-4">{t(descKey)}</p>
      <div className="flex items-center gap-3">
        <button onClick={handleAction} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700">
          {step < 3 ? t('goNow') : t('start')}
        </button>
        {step < 3 && (
          <button onClick={() => setStep(Math.min(step + 1, 3))} className="text-sm text-gray-500 hover:text-gray-700">
            {t('later')}
          </button>
        )}
      </div>
      <div className="flex gap-1 mt-4">
        {STEP_ICONS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  )
}
