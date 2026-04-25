'use client'

export default function LocaleSwitcher() {
  function switchLocale(locale: string) {
    const secure = window.location.protocol === 'https:' ? ';Secure' : ''
    document.cookie = `locale=${locale};path=/;max-age=31536000;SameSite=Lax${secure}`
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => switchLocale('es')} className="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100" title="Español">ES</button>
      <button onClick={() => switchLocale('en')} className="text-xs px-1.5 py-0.5 rounded hover:bg-gray-100" title="English">EN</button>
    </div>
  )
}
