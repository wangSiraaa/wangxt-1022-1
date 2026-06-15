import React from 'react'
import { cn } from '../lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending'
  children: React.ReactNode
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
  const styles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
        styles[status],
        className
      )}
    >
      {children}
    </span>
  )
}
