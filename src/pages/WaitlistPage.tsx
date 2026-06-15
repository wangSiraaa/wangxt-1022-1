import React, { useMemo } from 'react'
import {
  ClipboardList,
  User,
  Bell,
  XCircle,
  ArrowUp,
  Users,
  Calendar,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { WaitlistItem, Course, Elder, CourseType } from '../types'

interface WaitlistDetail {
  item: WaitlistItem
  elder: Elder | undefined
  course: Course | undefined
}

interface CourseWaitlistGroup {
  course: Course
  waitlist: WaitlistDetail[]
  count: number
}

const courseTypeNames: Record<CourseType, string> = {
  calligraphy: '书法',
  dance: '舞蹈',
  sports: '运动',
  health: '健康',
}

const courseTypeColors: Record<CourseType, string> = {
  calligraphy: 'bg-blue-100 text-blue-700',
  dance: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700',
  health: 'bg-red-100 text-red-700',
}

const courseTypeProgressColors: Record<CourseType, string> = {
  calligraphy: 'bg-blue-500',
  dance: 'bg-purple-500',
  sports: 'bg-green-500',
  health: 'bg-red-500',
}

const WaitlistPage: React.FC = () => {
  const {
    waitlistItems,
    courses,
    getElderById,
    getCourseById,
    promoteWaitlist,
    removeWaitlist,
    markWaitlistNotified,
  } = useAppStore()

  const allWaitlistDetails = useMemo((): WaitlistDetail[] => {
    return waitlistItems
      .map(item => ({
        item,
        elder: getElderById(item.elderId),
        course: getCourseById(item.courseId),
      }))
      .filter(d => d.course)
      .sort((a, b) => {
        if (a.item.courseId !== b.item.courseId) {
          return a.item.courseId.localeCompare(b.item.courseId)
        }
        return a.item.position - b.item.position
      })
  }, [waitlistItems, getElderById, getCourseById])

  const coursesWithWaitlist = useMemo((): CourseWaitlistGroup[] => {
    const courseMap = new Map<string, CourseWaitlistGroup>()

    allWaitlistDetails.forEach(detail => {
      const courseId = detail.item.courseId
      if (!courseMap.has(courseId) && detail.course) {
        courseMap.set(courseId, {
          course: detail.course,
          count: 0,
          waitlist: [],
        })
      }
      const entry = courseMap.get(courseId)
      if (entry) {
        entry.count++
        entry.waitlist.push(detail)
      }
    })

    return Array.from(courseMap.values()).sort((a, b) => b.count - a.count)
  }, [allWaitlistDetails])

  const handlePromote = (courseId: string, courseName?: string) => {
    promoteWaitlist(courseId)
    alert(`已为「${courseName || '该课程'}」顺位提升，第一位候补学员已转入待确认状态`)
  }

  const handleRemove = (waitlistId: string, elderName?: string) => {
    if (confirm(`确定要移除${elderName || '该学员'}的候补资格吗？`)) {
      removeWaitlist(waitlistId)
    }
  }

  const handleNotify = (waitlistId: string, elderName?: string) => {
    markWaitlistNotified(waitlistId)
    alert(`已通知${elderName || '该学员'}`)
  }

  const getProgressPercentage = (current: number, max: number) => {
    return Math.min(Math.round((current / max) * 100), 100)
  }

  const totalWaitlist = allWaitlistDetails.length
  const firstPositionCount = allWaitlistDetails.filter(d => d.item.position === 1).length
  const notifiedCount = allWaitlistDetails.filter(d => d.item.notified).length
  const expiringCount = allWaitlistDetails.filter(d => {
    const expiresDate = new Date(d.item.expiresAt)
    const now = new Date()
    const diffDays = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }).length

  const renderWaitlistItem = (detail: WaitlistDetail) => {
    const { item, elder, course } = detail
    const isFirst = item.position === 1
    const isExpired = new Date(item.expiresAt) < new Date()
    const canPromote = isFirst && course && course.currentParticipants < course.maxParticipants

    return (
      <div
        key={item.id}
        className={`p-4 rounded-xl mb-3 transition-all ${
          isFirst
            ? 'bg-amber-50 border-2 border-amber-300'
            : isExpired
            ? 'bg-red-50 border border-red-200'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isFirst ? 'bg-amber-200' : isExpired ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              {isFirst ? (
                <span className="text-2xl">👑</span>
              ) : (
                <User size={24} className={isExpired ? 'text-red-600' : 'text-gray-600'} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-gray-800 text-lg">
                  {elder?.name || '-'}
                </span>
                {elder && (
                  <span className="text-gray-500 text-sm">
                    {elder.age}岁
                  </span>
                )}
                <StatusBadge status={isFirst ? 'success' : isExpired ? 'error' : 'info'}>
                  {isFirst && '👑 '}
                  第{item.position}位
                </StatusBadge>
                {item.notified && (
                  <StatusBadge status="info">
                    <Bell size={12} className="mr-1" />
                    已通知
                  </StatusBadge>
                )}
                {isExpired && (
                  <StatusBadge status="error">已过期</StatusBadge>
                )}
                {canPromote && (
                  <StatusBadge status="success">
                    <CheckCircle size={12} className="mr-1" />
                    可顺位提升
                  </StatusBadge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  加入日期：{item.addedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  有效期至：{item.expiresAt}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {canPromote && (
              <Button
                size="sm"
                variant="success"
                onClick={() => handlePromote(item.courseId, course?.name)}
                className="flex items-center gap-1"
              >
                <ArrowUp size={14} />
                顺位提升
              </Button>
            )}
            {!item.notified && !isExpired && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleNotify(item.id, elder?.name)}
                className="flex items-center gap-1"
              >
                <Bell size={14} />
                通知
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleRemove(item.id, elder?.name)}
              className="flex items-center gap-1"
            >
              <XCircle size={14} />
              移除
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderCourseCard = (group: CourseWaitlistGroup) => {
    const { course, waitlist, count } = group
    const progressPercent = getProgressPercentage(course.currentParticipants, course.maxParticipants)
    const hasCapacity = course.currentParticipants < course.maxParticipants
    const firstItem = waitlist[0]

    return (
      <Card key={course.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${courseTypeColors[course.type]}`}>
                  {courseTypeNames[course.type]}
                </span>
                <StatusBadge status={hasCapacity ? 'success' : 'warning'}>
                  {hasCapacity ? '有名额' : '已满员'}
                </StatusBadge>
              </div>
              <CardTitle className="text-xl">{course.name}</CardTitle>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <Users size={14} />
                当前人数：{course.currentParticipants}/{course.maxParticipants}人
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList size={14} />
                候补人数：{count}人
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${courseTypeProgressColors[course.type]}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              容量使用率：{progressPercent}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {waitlist.map(detail => renderWaitlistItem(detail))}
          </div>
          {hasCapacity && firstItem && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-700 font-medium">
                    👑 第一位候补：{firstItem.elder?.name || '-'} 可顺位提升
                  </span>
                  <p className="text-sm text-green-600 mt-1">
                    当前课程有名额，可将第一位候补学员转为待确认状态
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handlePromote(course.id, course.name)}
                  className="flex items-center gap-1"
                >
                  <ArrowUp size={14} />
                  顺位提升
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList size={28} />
              候补队列管理
            </h2>
            <p className="text-amber-100 mt-1">
              按课程分组管理候补学员，及时处理顺位提升和通知
            </p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{totalWaitlist}</div>
              <div className="text-amber-100 text-sm">候补总数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{firstPositionCount}</div>
              <div className="text-amber-100 text-sm">可顺位提升</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{notifiedCount}</div>
              <div className="text-amber-100 text-sm">已通知</div>
            </div>
            {expiringCount > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-200">{expiringCount}</div>
                <div className="text-amber-100 text-sm">即将过期</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {coursesWithWaitlist.length === 0 ? (
        <Empty
          icon={<ClipboardList size={48} />}
          title="暂无候补队列"
          description="目前没有课程有候补学员"
        />
      ) : (
        <div className="space-y-6">
          {coursesWithWaitlist.map(group => renderCourseCard(group))}
        </div>
      )}
    </div>
  )
}

export default WaitlistPage
