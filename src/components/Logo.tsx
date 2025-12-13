interface LogoProps {
  width?: number
  height?: number
  className?: string
  showBackground?: boolean
}

export function Logo({ width = 24, height = 24, className = '', showBackground = false }: LogoProps) {
  const logo = (
    <img
      src="/logo.jpg"
      alt="QHLC Logo"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )

  if (showBackground) {
    return (
      <div className="rounded-lg flex items-center justify-center">
        {logo}
      </div>
    )
  }

  return logo
}

// For use as an icon component in navigation menus (compatible with lucide-react icon interface)
export function LogoIcon({ className = '' }: { className?: string }) {
  // Extract size from className if present (e.g., "h-5 w-5" = 20px), otherwise default to 20px
  const size = className.includes('h-5') || className.includes('w-5') ? 20 : 
                className.includes('h-6') || className.includes('w-6') ? 24 :
                className.includes('h-4') || className.includes('w-4') ? 16 : 20
  
  return <Logo width={size} height={size} className={className} />
}

