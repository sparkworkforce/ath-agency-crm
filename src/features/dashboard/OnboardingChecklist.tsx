'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ChecklistItem {
  key: string
  label: string
  done: boolean
  href: string
}

interface Props {
  items: ChecklistItem[]
}

export default function OnboardingChecklist({ items }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const t = useTranslations('agency.onboarding')
  const done = items.filter(i => i.done).length

  if (dismissed || done === items.length) return null

  return (
    <div className="bg-white border border-emerald-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{t('firstSteps')}</h2>
          <p className="text-xs text-gray-400">{t('completed', { done, total: items.length })}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-xs text-gray-400 hover:text-gray-600">{t('hide')}</button>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.key}>
            <Link href={item.href} className="flex items-center gap-2 text-sm group">
              <span className={item.done ? 'text-green-500' : 'text-gray-300'}>{item.done ? '✓' : '○'}</span>
              <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-emerald-600'}>{t(item.label)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
