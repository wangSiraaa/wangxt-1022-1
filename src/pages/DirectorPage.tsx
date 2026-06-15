import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Users,
  TrendingUp,
  FileCheck,
  AlertCircle,
  ListChecks,
  ClipboardList,
  UserCheck,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Megaphone,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { Attendance, PageType } from '../types'

const DirectorPage: React.FC = () => {
  const {
    getStatistics,
    getTodayExceptions,
    getElderById,
    getCourseById,
    setCurrentPage,
  } = useAppStore()

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({
    show: false,
    message: '',
    type: 'success',
  })

  const statistics = getStatistics()
  const todayExceptions = getTodayExceptions()

  const activeElders = useMemo(() => {
    const { elders } = useAppStore.getState()
    return elders.filter(e => e.status === 'active').length
  }, [])

  const statCards = [
    {
      title: '总课程数',
      value: statistics.totalCourses,
      icon: <BookOpen size={28} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '在籍老人',
      value: activeElders,
      icon: <Users size={28} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '今日出勤率',
      value: statistics.attendanceRate + '%',
      icon: <TrendingUp size={28} />,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: '待审批复课',
      value: statistics.pendingApprovals,
      icon: <FileCheck size={28} />,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
    },
  ]

  const quickEntries = [
    {
      title: '缺勤红榜',
      description: '查看缺勤记录',
      icon: <AlertCircle size={32} />,
      page: 'absentList' as PageType,
      color: 'from-red-400 to-red-500',
    },
    {
      title: '复课审批',
      description: '审批复课申请',
      icon: <ListChecks size={32} />,
      page: 'reinstatement' as PageType,
      color: 'from-amber-400 to-orange-500',
    },
    {
      title: '候补队列',
      description: '管理候补名单',
      icon: <ClipboardList size={32} />,
      page: 'waitlist' as PageType,
      color: 'from-blue-400 to-blue-500',
    },
    {
      title: '统计审计',
      description: '数据统计分析',
      icon: <UserCheck size={32} />,
      page: 'statistics' as PageType,
      color: 'from-green-400 to-green-500',
    },
  ]

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleSupervise = (exception: Attendance) => {
    const elder = getElderById(exception.elderId)
    const name = elder?.name || '该老人'
    showToast('已督办 ' + name + '的异常签到，已通知社工跟进处理', 'success')
  }

  const getExceptionTypeLabel = (status: string) => {
    const labels: Record<string, string> = {
      absent: '缺勤',
      exception: '异常',
      late: '迟到',
      leave: '请假',
    }
    return labels[status] || status
  }

  const getExceptionTypeStatus = (status: string) => {
    const statusMap: Record<string, 'error' | 'warning' | 'info'> = {
      absent: 'error',
      exception: 'error',
      late: 'warning',
      leave: 'info',
    }
    return statusMap[status] || 'warning'
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <div
          className={
            'fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-[toastIn_0.3s_ease-out] ' +
            (toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-amber-500 text-white')
          }
        >
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'warning' && <AlertTriangle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Users size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">主任管理中心</h2>
              <p className="text-amber-100 mt-1">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Bell size={20} />
              <span className="text-amber-100">今日异常</span>
            </div>
            <div className="text-3xl font-bold mt-1">{todayExceptions.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Card key={index} className="overflow-hidden p-0">
            <div className="flex items-stretch">
              <div className={card.bgColor + ' p-5 flex flex-col items-center justify-center min-w-[80px]'}>
                <div className={'bg-gradient-to-br ' + card.color + ' text-white p-3 rounded-xl shadow-md'}>
                  {card.icon}
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="text-sm text-gray-500 mb-1">{card.title}</div>
                <div className="text-3xl font-bold text-amber-900">{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks size={24} className="text-amber-600" />
            快速入口
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickEntries.map((entry, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(entry.page)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-amber-100 hover:border-amber-300 bg-white hover:bg-amber-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className={
                    'w-16 h-16 rounded-2xl bg-gradient-to-br ' +
                    entry.color +
                    ' text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300'
                  }
                >
                  {entry.icon}
                </div>
                <div className="text-center">
                  <div className="font-bold text-amber-900 text-lg">{entry.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{entry.description}</div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={24} className="text-amber-600" />
            今日异常列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayExceptions.length === 0 ? (
            <Empty
              icon={<CheckCircle size={48} className="text-green-400" />}
              title="今日暂无异常"
              description="所有老人签到正常，继续保持！"
            />
          ) : (
            <div className="space-y-3">
              {todayExceptions.map((exception) => {
                const elder = getElderById(exception.elderId)
                const course = getCourseById(exception.courseId)

                return (
                  <div
                    key={exception.id}
                    className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border-2 border-amber-200">
                        <span className="text-xl font-bold text-amber-600">
                          {(elder?.name && elder.name.charAt(0)) || '-'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-medium text-gray-800">{course?.name || '-'}</span>
                          <StatusBadge status={getExceptionTypeStatus(exception.status)}>
                            {getExceptionTypeLabel(exception.status)}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {elder?.name || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {exception.checkInTime || '--:--'}
                          </span>
                        </div>
                        {exception.notes && (
                          <div className="text-sm text-amber-700 mt-1 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {exception.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleSupervise(exception)}
                      className="flex items-center gap-1"
                    >
                      <Megaphone size={14} />
                      督办
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DirectorPage
