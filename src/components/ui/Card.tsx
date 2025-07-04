import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    children, 
    className = '', 
    padding = 'md', 
    shadow = 'sm', 
    border = true 
  }, ref) => {
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    }
    
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    }
    
    const borderClasses = border ? 'border border-gray-200' : ''
    
    const classes = `bg-white rounded-xl ${borderClasses} ${shadowClasses[shadow]} ${paddingClasses[padding]} ${className}`
    
    return (
      <div ref={ref} className={classes}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card Header component
interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`}>
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

// Card Title component
interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = '' }, ref) => {
    return (
      <h3 ref={ref} className={`text-lg font-semibold text-gray-900 ${className}`}>
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

// Card Content component
interface CardContentProps {
  children: React.ReactNode
  className?: string
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

// Card Footer component
interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardContent, CardFooter } 