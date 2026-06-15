import React, { useMemo } from 'react'
import {
  TrendingUp,
  Users,
  BookOpen,
  AlertCircle,
  FileCheck,
  BarChart3,
  PieChart,
  AlertTriangle,
  Clock,
  UserCheck,
  Activity,
  ClipboardList,
  AlertOctagon,
  UserPlus,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import type { CourseType } from '../types'

const courseTypeNames: Record<CourseType, string> = {
  calligraphy: '书法',
  dance: '舞蹈',
  sports: '运动',
  health: '健康',
}

const courseTypeColors: Record<CourseType, string> = {
  calligraphy: 'bg-blue-500',
  dance: 'bg-purple-500',
  sports: 'bg-green-500',
  health: 'bg-red-500',
}

const StatisticsPage: React.FC = () => {
  const {
    getStatistics,
    courses,
    elders,
    attendances,
  } = useAppStore()

  const statistics = getStatistics()

  const activeElders = useMemo(() => {
    return elders.filter(e => e.status === 'active').length
  }, [elders])

  const courseAttendanceStats = useMemo(() => {
    return courses.map(course => {
      const courseAttendances = attendances.filter(a => a.courseId === course.id)
      const total = courseAttendances.length
      const present = courseAttendances.filter(a => a.status === 'present').length
      const rate = total > 0 ? Math.round((present / total) * 100) : 0

      return {
        courseId: course.id,
        courseName: course.name,
        courseType: course.type,
        totalAttendances: total,
        presentCount: present,
        attendanceRate: rate,
        occupancy: Math.round((course.currentParticipants / course.maxParticipants) * 100),
      }
    }).sort((a, b) => b.attendanceRate - a.attendanceRate)
  }, [courses, attendances])

  const courseTypeDistribution = useMemo(() => {
    const typeCount: Record<CourseType, number> = {
      calligraphy: 0,
      dance: 0,
      sports: 0,
      health: 0,
    }
    courses.forEach(course => {
      typeCount[course.type]++
    })
    const total = courses.length
    return Object.entries(typeCount).map(([type, count]) => ({
      type: type as CourseType,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
  }, [courses])

  const exceptionStats = useMemo(() => {
    const stats = {
      absent: 0,
      late: 0,
      exception: 0,
      leave: 0,
    }
    attendances.forEach(a => {
      if (a.status === 'absent') stats.absent++
      if (a.status === 'late') stats.late++
      if (a.status === 'exception') stats.exception++
      if (a.status === 'leave') stats.leave++
    })
    return stats
  }, [attendances])

  const operationLogs = useMemo(() => {
    const logs = [
      {
        id: 'log1',
        type: 'checkin',
        icon: UserCheck,
        title: '签到记录',
        description: '张爷爷 完成了 书法基础班 签到',
        time: '今天 09:05',
        status: 'success',
      },
      {
        id: 'log2',
        type: 'approval',
        icon: FileCheck,
        title: '复课审批',
        description: '李奶奶 的复课申请已通过审批',
        time: '今天 08:30',
        status: 'success',
      },
      {
        id: 'log3',
        type: 'exception',
        icon: AlertTriangle,
        title: '异常处理',
        description: '王爷爷 太极拳课程 异常签到已督办',
        time: '今天 08:15',
        status: 'warning',
      },
      {
        id: 'log4',
        type: 'register',
        icon: UserPlus,
        title: '课程报名',
        description: '赵奶奶 报名了 健康养生讲座',
        time: '昨天 15:20',
        status: 'success',
      },
      {
        id: 'log5',
        type: 'suspend',
        icon: AlertOctagon,
        title: '暂停通知',
        description: '刘爷爷 因连续缺勤两次被暂停上课资格',
        time: '昨天 14:00',
        status: 'error',
      },
      {
        id: 'log6',
        type: 'health',
        icon: Activity,
        title: '健康评估',
        description: '孙爷爷 完成健康风险评估',
        time: '前天 10:30',
        status: 'info',
      },
    ]
    return logs
  }, [])

  const statCards = [
    {
      title: '课程总数',
      value: statistics.totalCourses,
      icon: <BookOpen size={24} />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '老人总数',
      value: activeElders,
      icon: <Users size={24} />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '今日出勤率',
      value: statistics.attendanceRate + '%',
      icon: <TrendingUp size={24} />,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
    },
    {
      title: '平均满员率',
      value: statistics.averageOccupancy + '%',
      icon: <UserCheck size={24} />,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: '待审批复课',
      value: statistics.pendingApprovals,
      icon: <FileCheck size={24} />,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
    },
    {
      title: '今日异常数',
      value: statistics.todayExceptions,
      icon: <AlertTriangle size={24} />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-rose-50',
    },
  ]

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500'
    if (rate >= 70) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-700'
      case 'warning':
        return 'bg-amber-100 text-amber-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-blue-100 text-blue-700'
    }
  }

  const getLogIconBgColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-amber-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">统计审计</h2>
              <p className="text-amber-100 mt-1">
                全面掌握教学运营数据，辅助管理决策
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-amber-100">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => (
          <Card key={index} className="overflow-hidden p-0">
            <div className="flex items-stretch">
              <div className={card.bgColor + ' p-4 flex flex-col items-center justify-center min-w-[70px]'}>
                <div className={'bg-gradient-to-br ' + card.color + ' text-white p-2.5 rounded-xl shadow-md'}>
                  {card.icon}
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="text-sm text-gray-500 mb-1">{card.title}</div>
                <div className="text-2xl font-bold text-amber-900">{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={24} className="text-amber-600" />
            出勤率排行榜
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseAttendanceStats.map((stat, index) => (
            <div key={stat.courseId}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-800">{stat.courseName}</span>
                  <StatusBadge status="info">
                    {courseTypeNames[stat.courseType]}
                  </StatusBadge>
                </div>
                <span className="font-bold text-amber-900">{stat.attendanceRate}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={'h-full rounded-full transition-all duration-500 ' + getAttendanceRateColor(stat.attendanceRate)}
                  style={{ width: stat.attendanceRate + '%' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>出勤 {stat.presentCount} / 总签到 {stat.totalAttendances} 次</span>
                <span>满员率 {stat.occupancy}%</span>
              </div>
            </div>
          ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart size={24} className="text-amber-600" />
            课程类型分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {courseTypeDistribution.reduce((acc, item, index) => {
                  const prevPercentage = courseTypeDistribution
                    .slice(0, index)
                    .reduce((sum, i) => sum + i.percentage, 0)
                  const rotation = (prevPercentage / 100) * 360
                  const angle = (item.percentage / 100) * 360
                  if (item.percentage === 0) return acc
                  return (
                    <>
                      {acc}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `conic-gradient(${courseTypeColors[item.type]} ${rotation}deg ${rotation + angle}deg)`,
                        clipPath: 'circle(50% at 50% 50%)',
                      }}
                    />
                    </>
                  )
                }, <></>)}
              </div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-900">{courses.length}</div>
                  <div className="text-sm text-gray-500">门课程</div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {courseTypeDistribution.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className={'w-4 h-4 rounded-full ' + courseTypeColors[item.type]} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{courseTypeNames[item.type]}</div>
                  <div className="text-xs text-gray-500">{item.count} 门 · {item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle size={24} className="text-amber-600" />
          异常统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
            <div className="text-3xl font-bold text-red-600">{exceptionStats.absent}</div>
            <div className="text-sm text-gray-600 mt-1">缺勤</div>
            <div className="w-full h-2 bg-red-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: Math.min(exceptionStats.absent * 10, 100) + '%' }} />
            </div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
            <div className="text-3xl font-bold text-amber-600">{exceptionStats.late}</div>
            <div className="text-sm text-gray-600 mt-1">迟到</div>
            <div className="w-full h-2 bg-amber-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: Math.min(exceptionStats.late * 15, 100) + '%' }} />
            </div>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 text-center">
            <div className="text-3xl font-bold text-rose-600">{exceptionStats.exception}</div>
            <div className="text-sm text-gray-600 mt-1">异常</div>
            <div className="w-full h-2 bg-rose-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: Math.min(exceptionStats.exception * 20, 100) + '%' }} />
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <div className="text-3xl font-bold text-blue-600">{exceptionStats.leave}</div>
            <div className="text-sm text-gray-600 mt-1">请假</div>
            <div className="w-full h-2 bg-blue-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: Math.min(exceptionStats.leave * 25, 100) + '%' }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList size={24} className="text-amber-600" />
          操作日志
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {operationLogs.map((log) => {
            const IconComponent = log.icon
            return (
              <div
                key={log.id}
                className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:shadow-md transition-all duration-200"
              >
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center text-white ' + getLogIconBgColor(log.status)}>
                  <IconComponent size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{log.title}</div>
                  <div className="text-sm text-gray-600">{log.description}</div>
                </div>
                <div className="text-right">
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + getLogStatusColor(log.status)}>
                    {log.status === 'success' ? '成功' : log.status === 'warning' ? '警告' : log.status === 'error' ? '失败' : '信息'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{log.time}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

export default StatisticsPage
