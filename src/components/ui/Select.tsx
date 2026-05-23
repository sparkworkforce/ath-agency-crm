import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, className = '', ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = error ? `${selectId}-error` : undefined
    return (
      <div>
        {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white ${error ? 'border-red-300' : 'border-gray-300'} ${className}`}
          aria-invalid={!!error}
          aria-describedby={errorId}
          {...props}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p id={errorId} className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
