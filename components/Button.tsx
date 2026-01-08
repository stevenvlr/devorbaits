import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  className?: string
  disabled?: boolean
  fullWidth?: boolean
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  disabled = false,
  fullWidth = false
}: ButtonProps) {
  const baseClasses = 'font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-yellow-500 text-noir-950 hover:bg-yellow-400',
    secondary: 'bg-noir-700 text-white hover:bg-noir-600',
    success: 'bg-green-500 text-white hover:bg-green-400',
    danger: 'bg-red-500 text-white hover:bg-red-400',
    info: 'bg-blue-500 text-white hover:bg-blue-400',
    outline: 'bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-noir-950'
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  )
}

