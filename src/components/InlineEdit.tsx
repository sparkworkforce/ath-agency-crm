'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onSave: (value: string) => Promise<void>
  className?: string
}

export default function InlineEdit({ value: initial, onSave, className = '' }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleSave() {
    if (saving || value === initial) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
    } catch {
      setValue(initial)
      setEditing(false)
    }
    setSaving(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setValue(initial); setEditing(false) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={`px-1 py-0.5 border border-emerald-400 rounded text-sm bg-white dark:bg-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-1 py-0.5 rounded transition-colors ${className}`}
      title="Click to edit"
    >
      {initial || <span className="text-gray-400 italic">Click to edit</span>}
    </span>
  )
}
