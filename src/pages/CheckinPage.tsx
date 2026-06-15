import React, { useState, useMemo } from 'react'
import { Calendar, Users, CheckCircle, Clock, XCircle, AlertTriangle, ChevronDown, User } from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import type { Attendance, AttendanceStatus } from '../types'

interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface ExceptionModalState {
  isOpen: boolean
  registrationId: string
  scheduleId: string
}

export default function CheckinPage() {
  const {
    courses,
    checkIn,
    getRegistrationsByCourse,
    getAttendancesByCourseAndDate,
    getElderById,
    getCourseById,
  } = useAppStore()

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [exceptionModal, setExceptionModal] = useState<ExceptionModalState>({
    isOpen: false,
    registrationId: '',
    scheduleId: '',
  })
  const [exceptionNotes, setExceptionNotes] = useState<string>('')
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false)

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null
    return getCourseById(selectedCourseId)
  }, [selectedCourseId, getCourseById])

  const registrations = useMemo(() => {
    if (!selectedCourseId) return []
    return getRegistrationsByCourse(selectedCourseId).filter(
      (r) => r.status === 'confirmed' || r.status === 'pending'
    )
  }, [selectedCourseId, getRegistrationsByCourse])

  const attendances = useMemo(() => {
    if (!selectedCourseId) return []
    return getAttendancesByCourseAndDate(selectedCourseId, selectedDate)
  }, [selectedCourseId, selectedDate, getAttendancesByCourseAndDate])

  const todaySchedule = useMemo(() => {
    if (!selectedCourse) return null
    const dayOfWeek = new Date(selectedDate).getDay()
    return selectedCourse.schedules.find((s) => s.dayOfWeek === dayOfWeek) || selectedCourse.schedules[0]
  }, [selectedCourse, selectedDate])

  const getAttendanceForRegistration = (registrationId: string): Attendance | undefined => {
    return attendances.find((a) => a.registrationId === registrationId)
  }

  const showToast = (type: ToastMessage['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCheckIn = (
    registrationId: string,
    status: 'present' | 'absent' | 'late' | 'exception',
    notes?: string
  ) => {
    if (!selectedCourseId || !todaySchedule) {
      showToast('error', '请先选择课程')
      return
    }

    const registration = registrations.find((r) => r.id === registrationId)
    if (!registration) {
      showToast('error', '报名记录不存在')
      return
    }

    if (registration.status === 'suspended') {
      showToast('error', '该学员已被暂停上课')
      return
    }

    const result = checkIn(registrationId, todaySchedule.id, selectedDate, status, notes)
    if (result.success) {
      showToast('success', result.message)
    } else {
      showToast('error', result.message)
    }
  }

  const handleExceptionClick = (registrationId: string) => {
    if (!todaySchedule) return
    setExceptionModal({
      isOpen: true,
      registrationId,
      scheduleId: todaySchedule.id,
    })
    setExceptionNotes('')
  }

  const handleExceptionConfirm = () => {
    if (!exceptionNotes.trim()) {
      showToast('warning', '请填写异常备注')
      return
    }
    handleCheckIn(exceptionModal.registrationId, 'exception', exceptionNotes)
    setExceptionModal({ isOpen: false, registrationId: '', scheduleId: '' })
    setExceptionNotes('')
  }

  const handleExceptionCancel = () => {
    setExceptionModal({ isOpen: false, registrationId: '', scheduleId: '' })
    setExceptionNotes('')
  }

  const getStatusBadgeStatus = (attendanceStatus: AttendanceStatus): 'success' | 'warning' | 'error' | 'info' | 'pending' => {
    switch (attendanceStatus) {
      case 'present':
        return 'success'
      case 'late':
        return 'warning'
      case 'absent':
        return 'error'
      case 'exception':
        return 'error'
      case 'leave':
        return 'info'
      default:
        return 'pending'
    }
  }

  const getStatusText = (status: AttendanceStatus): string => {
    switch (status) {
      case 'present':
        return '出勤'
      case 'late':
        return '迟到'
      case 'absent':
        return '缺勤'
      case 'exception':
        return '异常'
      case 'leave':
        return '请假'
      default:
        return status
    }
  }

  const getRegistrationStatusText = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return '已确认'
      case 'pending':
        return '待确认'
      case 'waitlisted':
        return '候补'
      case 'cancelled':
        return '已取消'
      case 'suspended':
        return '已暂停'
      default:
        return status
    }
  }

  const getRegistrationBadgeStatus = (status: string): 'success' | 'warning' | 'error' | 'info' | 'pending' => {
    switch (status) {
      case 'confirmed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'waitlisted':
        return 'info'
      case 'cancelled':
        return 'error'
      case 'suspended':
        return 'error'
      default:
        return 'pending'
    }
  }

  const publishedCourses = courses.filter((c) => c.status === 'published')

  const stats = useMemo(() => {
    const total = registrations.length
    const checkedIn = attendances.length
    const present = attendances.filter((a) => a.status === 'present').length
    const late = attendances.filter((a) => a.status === 'late').length
    const absent = attendances.filter((a) => a.status === 'absent').length
    const exception = attendances.filter((a) => a.status === 'exception').length
    return { total, checkedIn, present, late, absent, exception }
  }, [registrations, attendances])

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : toast.type === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {exceptionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                异常签到
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 mb-4">
                请填写异常原因，异常签到将自动上报主任视图。
              </p>
              <textarea
                className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows={4}
                placeholder="请输入异常原因..."
                value={exceptionNotes}
                onChange={(e) => setExceptionNotes(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" className="flex-1" onClick={handleExceptionCancel}>
                  取消
                </Button>
                <Button variant="danger" className="flex-1" onClick={handleExceptionConfirm}>
                  确认异常
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-3xl font-bold text-amber-900 mb-2">签到台</h2>
        <p className="text-amber-600">管理课程签到，记录学员出勤情况</p>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                选择课程
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 border border-amber-200 rounded-lg bg-white hover:border-amber-400 transition-colors"
                >
                  <span className={selectedCourseId ? 'text-amber-900' : 'text-amber-400'}>
                    {selectedCourse ? selectedCourse.name : '请选择课程'}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-600 transition-transform ${
                      isCourseDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isCourseDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-amber-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {publishedCourses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => {
                          setSelectedCourseId(course.id)
                          setIsCourseDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b border-amber-100 last:border-0"
                      >
                        <div className="font-medium text-amber-900">{course.name}</div>
                        <div className="text-sm text-amber-600">
                          {course.schedules.length} 个课时 · {course.currentParticipants}/{course.maxParticipants} 人
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                选择日期
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-900"
                />
              </div>
            </div>

            {todaySchedule && (
              <div className="flex items-end">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-amber-600">今日课时</div>
                  <div className="font-medium text-amber-900">
                    {todaySchedule.startTime} - {todaySchedule.endTime}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCourseId && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="text-center">
                <Users className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-900">{stats.total}</div>
                <div className="text-sm text-amber-600">应签到</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{stats.checkedIn}</div>
                <div className="text-sm text-green-600">已签到</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="text-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-700">{stats.present}</div>
                <div className="text-sm text-emerald-600">出勤</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-amber-50">
              <CardContent className="text-center">
                <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
                <div className="text-sm text-yellow-600">迟到</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-rose-50">
              <CardContent className="text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                <div className="text-sm text-red-600">缺勤</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="text-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{stats.exception}</div>
                <div className="text-sm text-orange-600">异常</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                签到列表
                <span className="text-sm font-normal text-amber-600">
                  ({stats.checkedIn}/{stats.total} 已签到)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="text-center py-12 text-amber-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无报名学员</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((registration) => {
                    const elder = getElderById(registration.elderId)
                    const attendance = getAttendanceForRegistration(registration.id)
                    const isSuspended = registration.status === 'suspended'

                    if (!elder) return null

                    return (
                      <div
                        key={registration.id}
                        className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border transition-all ${
                          attendance
                            ? 'bg-green-50 border-green-200'
                            : isSuspended
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                            {elder.avatar ? (
                              <img
                                src={elder.avatar}
                                alt={elder.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-7 h-7" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-amber-900">
                                {elder.name}
                              </span>
                              <span className="text-amber-600">{elder.age}岁</span>
                              <StatusBadge
                                status={getRegistrationBadgeStatus(registration.status)}
                                className="text-xs"
                              >
                                {getRegistrationStatusText(registration.status)}
                              </StatusBadge>
                              {elder.isSuspended && (
                                <StatusBadge status="error" className="text-xs">
                                  已暂停
                                </StatusBadge>
                              )}
                            </div>
                            {attendance && (
                              <div className="flex items-center gap-2 mt-1 text-sm">
                                <StatusBadge status={getStatusBadgeStatus(attendance.status)}>
                                  {getStatusText(attendance.status)}
                                </StatusBadge>
                                {attendance.checkInTime && (
                                  <span className="text-amber-600">
                                    {attendance.checkInTime} 签到
                                  </span>
                                )}
                                {attendance.notes && (
                                  <span className="text-amber-500 text-xs">
                                    备注：{attendance.notes}
                                  </span>
                                )}
                                {attendance.reportedToDirector && (
                                  <span className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    已上报主任
                                  </span>
                                )}
                              </div>
                            )}
                            {isSuspended && !attendance && (
                              <div className="text-sm text-gray-500 mt-1">
                                该学员已被暂停上课，无法签到
                              </div>
                            )}
                          </div>
                        </div>

                        {!attendance && !isSuspended && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleCheckIn(registration.id, 'present')}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              出勤
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCheckIn(registration.id, 'late')}
                              className="flex items-center gap-1"
                            >
                              <Clock className="w-4 h-4" />
                              迟到
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleCheckIn(registration.id, 'absent')}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              缺勤
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExceptionClick(registration.id)}
                              className="flex items-center gap-1 text-orange-700 hover:bg-orange-100"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              异常
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedCourseId && (
        <Card className="text-center py-16">
          <CardContent>
            <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-800 mb-2">请选择课程</h3>
            <p className="text-amber-600">在上方选择课程和日期后，即可查看签到列表</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
