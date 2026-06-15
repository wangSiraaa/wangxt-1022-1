import React from 'react'
import { AlertTriangle, Clock, UserCheck, RefreshCw, ShieldAlert } from 'lucide-react'
import { cn } from '../lib/utils'
import type { DetailedRegistrationStatus } from '../types'

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

interface RegistrationStatusBadgeProps {
  status: DetailedRegistrationStatus
  className?: string
}

const statusConfig: Record<DetailedRegistrationStatus, {
  label: string
  style: string
  Icon: React.ComponentType<{ className?: string }>
  pulse?: boolean
}> = {
  riskUnconfirmed: {
    label: '风险未确认',
    style: 'bg-red-50 text-red-700 border-red-300',
    Icon: ShieldAlert,
    pulse: true,
  },
  waitlistPendingPromotion: {
    label: '候补待转正',
    style: 'bg-amber-50 text-amber-700 border-amber-300',
    Icon: Clock,
  },
  suspendedByAbsence: {
    label: '缺勤暂停',
    style: 'bg-orange-50 text-orange-700 border-orange-300',
    Icon: AlertTriangle,
    pulse: true,
  },
  reinstatementPending: {
    label: '复课待批',
    style: 'bg-violet-50 text-violet-700 border-violet-300',
    Icon: RefreshCw,
  },
  normalEnrolled: {
    label: '正常在读',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Icon: UserCheck,
  },
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusBadgeProps> = ({
  status,
  className,
}) => {
  const config = statusConfig[status]
  const { Icon, label, style, pulse } = config

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
        style,
        pulse && 'animate-pulse',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

interface StatusLegendProps {
  className?: string
}

export const StatusLegend: React.FC<StatusLegendProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-3 p-3 bg-white/60 rounded-lg border border-gray-100',
        className
      )}
    >
      {(Object.keys(statusConfig) as DetailedRegistrationStatus[]).map((key) => (
        <RegistrationStatusBadge key={key} status={key} />
      ))}
    </div>
  )
}
