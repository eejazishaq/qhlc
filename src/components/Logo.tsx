import Image from 'next/image'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  showBackground?: boolean
}

export function Logo({ width = 24, height = 24, className = '', showBackground = false }: LogoProps) {
  const logo = (
    <Image
      src="/logo.jpg"
      alt="QHLC Logo"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
      unoptimized
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

// For use as an icon component in navigation menus
export function LogoIcon({ className = '' }: { className?: string }) {
  return <Logo width={20} height={20} className={className} />
}

