import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '../lib/utils'

interface EmptyProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const Empty: React.FC<EmptyProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4">
        {icon || <Inbox className="w-16 h-16 text-amber-400" strokeWidth={1.5} />}
      </div>
      {title && (
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
