'use client'

import { useState, useEffect, useCallback } from 'react'

interface TourStep {
  target: string
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  { target: '[data-testid="agency-sidebar"]', title: 'Your sidebar', content: 'Navigate between clients, projects, invoices, and more from here.', position: 'right' },
  { target: '[data-testid="nav-dashboard"]', title: 'Dashboard', content: 'See all your KPIs, revenue charts, and activity at a glance.', position: 'right' },
  { target: '[data-testid="nav-clients"]', title: 'Client CRM', content: 'Add clients, track their pipeline status, and manage communications.', position: 'right' },
  { target: '[data-testid="nav-projects"]', title: 'Projects', content: 'Create projects with auto-generated tasks based on the platform.', position: 'right' },
  { target: '[data-testid="nav-invoices"]', title: 'Invoicing', content: 'Create invoices with IVU tax, generate PDFs, and track payments.', position: 'right' },
]

const STORAGE_KEY = 'cobrahub-tour-completed'

export default function OnboardingTour() {
  const [step, setStep] = useState(-1)
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })

  const startTour = useCallback(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      setTimeout(() => setStep(0), 1000)
    }
  }, [])

  useEffect(() => { startTour() }, [startTour])

  useEffect(() => {
    if (step < 0 || step >= TOUR_STEPS.length) return
    const el = document.querySelector(TOUR_STEPS[step].target)
    if (!el) { finish(); return }
    const rect = el.getBoundingClientRect()
    setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
  }, [step])

  function next() {
    if (step >= TOUR_STEPS.length - 1) finish()
    else setStep(s => s + 1)
  }

  function finish() {
    setStep(-1)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  if (step < 0 || step >= TOUR_STEPS.length) return null

  const current = TOUR_STEPS[step]
  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
    ...(current.position === 'right'
      ? { top: pos.top + pos.height / 2 - 40, left: pos.left + pos.width + 12 }
      : current.position === 'bottom'
      ? { top: pos.top + pos.height + 12, left: pos.left }
      : { top: pos.top - 100, left: pos.left }),
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[10000]" onClick={finish}>
        <div className="absolute inset-0 bg-black/40" />
        {/* Spotlight cutout */}
        <div
          className="fixed rounded-md ring-4 ring-emerald-400 ring-offset-2 bg-transparent"
          style={{ top: pos.top - 4, left: pos.left - 4, width: pos.width + 8, height: pos.height + 8, zIndex: 10001, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }}
        />
      </div>
      {/* Tooltip */}
      <div style={tooltipStyle} className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64" onClick={e => e.stopPropagation()}>
        <p className="text-xs text-emerald-600 font-medium mb-1">Step {step + 1} of {TOUR_STEPS.length}</p>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{current.title}</h3>
        <p className="text-xs text-gray-500 mb-3">{current.content}</p>
        <div className="flex items-center justify-between">
          <button onClick={finish} className="text-xs text-gray-400 hover:text-gray-600">Skip tour</button>
          <button onClick={next} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-emerald-700">
            {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
        <div className="flex gap-1 mt-3">
          {TOUR_STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    </>
  )
}
