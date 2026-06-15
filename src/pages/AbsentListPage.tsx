import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  User,
  Calendar,
  BookOpen,
  XCircle,
  PauseCircle,
  History,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardContent } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { Elder, Attendance } from '../types'

type TabType = 'consecutive' | 'history' | 'suspended'

interface AbsentElderInfo {
  elder: Elder
  consecutiveAbsences: number
  lastAbsentDate: string
  courseName: string
}

const AbsentListPage: React.FC = () => {
  const {
    elders,
    attendances,
    registrations,
    getElderById,
    getCourseById,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('consecutive')

  const absentRecords = useMemo(() => {
    return attendances
      .filter(a => a.status === 'absent')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [attendances])

  const consecutiveAbsentElders = useMemo((): AbsentElderInfo[] => {
    const elderAbsenceMap = new Map<string, {
      elder: Elder
      absences: Attendance[]
    }>()

    elders.forEach(elder => {
      if (elder.consecutiveAbsences >= 1) {
        const elderAbsences = absentRecords.filter(a => a.elderId === elder.id)
        elderAbsenceMap.set(elder.id, {
          elder,
          absences: elderAbsences,
        })
      }
    })

    const result: AbsentElderInfo[] = []
    elderAbsenceMap.forEach(({ elder, absences }) => {
      const lastAbsence = absences[0]
      const course = lastAbsence ? getCourseById(lastAbsence.courseId) : null
      const registration = lastAbsence
        ? registrations.find(r => r.id === lastAbsence.registrationId)
        : null
      const confirmedCourse = course || (registration ? getCourseById(registration.courseId) : null)

      result.push({
        elder,
        consecutiveAbsences: elder.consecutiveAbsences,
        lastAbsentDate: lastAbsence?.date || '-',
        courseName: confirmedCourse?.name || '-',
      })
    })

    return result.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences)
  }, [elders, absentRecords, registrations, getCourseById])

  const suspendedElders = useMemo((): AbsentElderInfo[] => {
    return elders
      .filter(e => e.isSuspended)
      .map(elder => {
        const elderAbsences = absentRecords.filter(a => a.elderId === elder.id)
        const lastAbsence = elderAbsences[0]
        const course = lastAbsence ? getCourseById(lastAbsence.courseId) : null
        const registration = lastAbsence
          ? registrations.find(r => r.id === lastAbsence.registrationId)
          : null
        const confirmedCourse = course || (registration ? getCourseById(registration.courseId) : null)

        return {
          elder,
          consecutiveAbsences: elder.consecutiveAbsences,
          lastAbsentDate: lastAbsence?.date || '-',
          courseName: confirmedCourse?.name || '-',
        }
      })
  }, [elders, absentRecords, registrations, getCourseById])

  const getAbsentHistoryInfo = (attendance: Attendance) => {
    const elder = getElderById(attendance.elderId)
    const course = getCourseById(attendance.courseId)
    return { elder, course }
  }

  const getAbsenceLevel = (count: number): 'high' | 'medium' => {
    return count >= 2 ? 'high' : 'medium'
  }

  const getCardHighlightClass = (count: number): string => {
    if (count >= 2) {
      return 'border-red-300 bg-red-50'
    }
    if (count === 1) {
      return 'border-amber-300 bg-amber-50'
    }
    return ''
  }

  const renderElderCard = (info: AbsentElderInfo, showBadge: boolean = true) => {
    const level = getAbsenceLevel(info.consecutiveAbsences)
    const highlightClass = getCardHighlightClass(info.consecutiveAbsences)

    return (
      <Card key={info.elder.id} className={highlightClass}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                info.elder.isSuspended
                  ? 'bg-red-100'
                  : level === 'high'
                  ? 'bg-red-100'
                  : 'bg-amber-100'
              }`}>
                <User
                  size={24}
                  className={
                    info.elder.isSuspended
                      ? 'text-red-600'
                      : level === 'high'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-lg">
                    {info.elder.name}
                  </span>
                  <span className="text-gray-500">
                    {info.elder.age}岁
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>上次缺勤：{info.lastAbsentDate}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <BookOpen size={14} />
                  <span>{info.courseName}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {showBadge && (
                <>
                  {info.elder.isSuspended ? (
                    <StatusBadge status="error">
                      <PauseCircle size={14} className="mr-1" />
                      已暂停
                    </StatusBadge>
                  ) : level === 'high' ? (
                    <StatusBadge status="error">
                      <XCircle size={14} className="mr-1" />
                      连续缺勤{info.consecutiveAbsences}次
                    </StatusBadge>
                  ) : (
                    <StatusBadge status="warning">
                      <AlertTriangle size={14} className="mr-1" />
                      连续缺勤{info.consecutiveAbsences}次
                    </StatusBadge>
                  )}
                </>
              )}
              <div className={`text-2xl font-bold ${
                info.elder.isSuspended
                  ? 'text-red-600'
                  : level === 'high'
                  ? 'text-red-600'
                  : 'text-amber-600'
              }`}>
                {info.consecutiveAbsences}
                <span className="text-sm font-normal text-gray-500 ml-1">次</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderHistoryCard = (attendance: Attendance) => {
    const { elder, course } = getAbsentHistoryInfo(attendance)
    if (!elder) return null

    return (
      <Card key={attendance.id}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
                <User size={24} className="text-gray-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-lg">
                    {elder.name}
                  </span>
                  <span className="text-gray-500">
                    {elder.age}岁
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <BookOpen size={14} />
                  <span>{course?.name || '-'}</span>
                </div>
                {attendance.notes && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {attendance.notes}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status="error">
                <XCircle size={14} className="mr-1" />
                缺勤
              </StatusBadge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar size={14} />
                <span>{attendance.date}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle size={28} />
              缺勤红榜
            </h2>
            <p className="text-red-100 mt-1">
              关注学员出勤情况，及时干预缺勤问题
            </p>
          </div>
          <div className="text-right">
            <div className="flex gap-6">
              <div>
                <div className="text-3xl font-bold">{consecutiveAbsentElders.length}</div>
                <div className="text-red-100 text-sm">连续缺勤</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{suspendedElders.length}</div>
                <div className="text-red-100 text-sm">已暂停</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{absentRecords.length}</div>
                <div className="text-red-100 text-sm">缺勤记录</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('consecutive')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'consecutive'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertTriangle size={20} />
            连续缺勤
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <History size={20} />
            缺勤历史
          </button>
          <button
            onClick={() => setActiveTab('suspended')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'suspended'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <PauseCircle size={20} />
            已暂停
          </button>
        </div>
      </div>

      {activeTab === 'consecutive' && (
        <div className="space-y-4">
          {consecutiveAbsentElders.length === 0 ? (
            <Empty
              icon={<AlertTriangle size={48} />}
              title="暂无连续缺勤记录"
              description="目前没有学员连续缺勤，继续保持良好的出勤情况"
            />
          ) : (
            <div className="space-y-3">
              {consecutiveAbsentElders.map(info => renderElderCard(info))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {absentRecords.length === 0 ? (
            <Empty
              icon={<History size={48} />}
              title="暂无缺勤历史记录"
              description="目前没有学员缺勤记录"
            />
          ) : (
            <div className="space-y-3">
              {absentRecords.map(attendance => renderHistoryCard(attendance))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'suspended' && (
        <div className="space-y-4">
          {suspendedElders.length === 0 ? (
            <Empty
              icon={<PauseCircle size={48} />}
              title="暂无已暂停学员"
              description="目前没有学员被暂停上课资格"
            />
          ) : (
            <div className="space-y-3">
              {suspendedElders.map(info => renderElderCard(info, false))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AbsentListPage
