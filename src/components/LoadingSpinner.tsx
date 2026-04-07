interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${SIZE_CLASSES[size]}`}
      role="status"
      aria-label="Cargando"
      data-testid="loading-spinner"
    />
  )
}
