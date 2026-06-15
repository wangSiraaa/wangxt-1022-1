import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  User,
  Stethoscope,
  ShieldAlert,
  UserX,
  ShieldCheck,
  AlertOctagon,
  FileWarning,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge, RegistrationStatusBadge } from '../components/StatusBadge'
import type { Attendance, AttendanceStatus, AbsenceStrategy, SuspensionSuggestion, DirectorTodoType } from '../types'

type SuggestionLevel = 'mild' | 'moderate' | 'severe'
type PresetReason = '头晕胸闷' | '血压异常' | '身体疼痛' | '情绪异常' | '其他'

interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface ExceptionModalState {
  isOpen: boolean
  registrationId: string
  scheduleId: string
  elderId: string
  courseId: string
}

const suggestionLevelConfig: Record<SuggestionLevel, {
  label: string
  desc: string
  priority: DirectorTodoType extends infer T ? 'high' | 'medium' | 'low' : never
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  borderClass: string
}> = {
  mild: {
    label: '轻度 - 建议休息1周',
    desc: '身体不适但无严重症状，建议短期休息后复诊',
    priority: 'low',
    icon: Stethoscope,
    colorClass: 'text-amber-700 bg-amber-50',
    borderClass: 'border-amber-300 ring-amber-400',
  },
  moderate: {
    label: '中度 - 建议停2周+复诊',
    desc: '症状较为明显，建议停止上课并尽快就医复诊',
    priority: 'medium',
    icon: FileWarning,
    colorClass: 'text-orange-700 bg-orange-50',
    borderClass: 'border-orange-300 ring-orange-400',
  },
  severe: {
    label: '重度 - 建议立即停课',
    desc: '身体状态异常，强烈建议立即停止上课并紧急就医',
    priority: 'high',
    icon: AlertOctagon,
    colorClass: 'text-red-700 bg-red-50',
    borderClass: 'border-red-300 ring-red-400',
  },
}

const presetReasons: PresetReason[] = ['头晕胸闷', '血压异常', '身体疼痛', '情绪异常', '其他']

export default function CheckinPage() {
  const {
    courses,
    checkIn,
    getRegistrationsByCourse,
    getAttendancesByCourseAndDate,
    getElderById,
    getCourseById,
    getDetailedRegistrationStatus,
    getPendingDirectorTodos,
    createDirectorTodo,
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
    elderId: '',
    courseId: '',
  })
  const [exceptionNotes, setExceptionNotes] = useState<string>('')
  const [suspensionSuggestionLevel, setSuspensionSuggestionLevel] = useState<SuggestionLevel | ''>('')
  const [selectedPresetReason, setSelectedPresetReason] = useState<PresetReason | ''>('')
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false)
  const [isPresetReasonOpen, setIsPresetReasonOpen] = useState(false)

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null
    return getCourseById(selectedCourseId)
  }, [selectedCourseId, getCourseById])

  const absenceStrategy: AbsenceStrategy | undefined = selectedCourse?.absenceStrategy

  const registrations = useMemo(() => {
    if (!selectedCourseId) return []
    return getRegistrationsByCourse(selectedCourseId).filter(
      (r) => r.status === 'confirmed' || r.status === 'pending' || r.status === 'suspended'
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

  const pendingTodos = useMemo(() => getPendingDirectorTodos(), [getPendingDirectorTodos])

  const getAttendanceForRegistration = (registrationId: string): Attendance | undefined => {
    return attendances.find((a) => a.registrationId === registrationId)
  }

  const hasDirectorTodoForRegistration = (registrationId: string): boolean => {
    return pendingTodos.some((t) => t.registrationId === registrationId)
  }

  const showToast = (type: ToastMessage['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const buildSuspensionSuggestion = (): SuspensionSuggestion | undefined => {
    if (!suspensionSuggestionLevel) return undefined
    const config = suggestionLevelConfig[suspensionSuggestionLevel]
    const reasonParts: string[] = []
    if (selectedPresetReason) {
      reasonParts.push(selectedPresetReason)
    }
    if (exceptionNotes.trim()) {
      reasonParts.push(exceptionNotes.trim())
    }
    const reason = reasonParts.length > 0
      ? `${config.label}。原因：${reasonParts.join('；')}`
      : config.label
    return {
      suggested: true,
      reason,
      severity: suspensionSuggestionLevel === 'severe' ? 'danger' : 'warning',
    }
  }

  const handleCheckIn = (
    registrationId: string,
    status: 'present' | 'absent' | 'late' | 'exception',
    notes?: string,
    suspensionSuggestion?: SuspensionSuggestion
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

    const elder = getElderById(registration.elderId)
    const isAutoSuspended = elder?.consecutiveAbsences && elder.consecutiveAbsences >= 2 && absenceStrategy === 'suspend'

    if (registration.status === 'suspended' || isAutoSuspended) {
      showToast('error', '该学员已被暂停上课')
      return
    }

    const result = checkIn(registrationId, todaySchedule.id, selectedDate, status, notes, suspensionSuggestion)
    if (result.success) {
      showToast('success', result.message)
    } else {
      showToast('error', result.message)
    }
  }

  const handleExceptionClick = (registrationId: string) => {
    if (!todaySchedule) return
    const registration = registrations.find((r) => r.id === registrationId)
    if (!registration) return
    setExceptionModal({
      isOpen: true,
      registrationId,
      scheduleId: todaySchedule.id,
      elderId: registration.elderId,
      courseId: registration.courseId,
    })
    setExceptionNotes('')
    setSuspensionSuggestionLevel('')
    setSelectedPresetReason('')
  }

  const createExceptionDirectorTodo = (
    elderId: string,
    courseId: string,
    registrationId: string,
    suggestion: SuspensionSuggestion
  ) => {
    const elder = getElderById(elderId)
    const course = getCourseById(courseId)
    const priority = suggestion.severity === 'danger' ? 'high' : 'medium'
    createDirectorTodo({
      type: 'abnormalStatus',
      elderId,
      elderName: elder?.name || '',
      courseId,
      courseName: course?.name || '',
      registrationId,
      title: `异常签到待处理-${course?.name || ''}`,
      description: `${elder?.name || ''}在${course?.name || ''}签到时被标记为异常。${suggestion.reason}请主任尽快跟进处理。`,
      priority,
    })
  }

  const handleExceptionConfirm = () => {
    const hasNotes = exceptionNotes.trim().length > 0
    const hasPresetReason = selectedPresetReason !== ''
    const hasSuggestion = suspensionSuggestionLevel !== ''

    if (!hasNotes && !hasPresetReason && !hasSuggestion) {
      showToast('warning', '请填写异常原因或选择停课建议')
      return
    }

    const suggestion = buildSuspensionSuggestion()
    const notesParts: string[] = []
    if (selectedPresetReason) {
      notesParts.push(selectedPresetReason)
    }
    if (exceptionNotes.trim()) {
      notesParts.push(exceptionNotes.trim())
    }
    if (suggestion) {
      notesParts.push(suggestion.reason)
    }
    const combinedNotes = notesParts.join('；')

    handleCheckIn(
      exceptionModal.registrationId,
      'exception',
      combinedNotes,
      suggestion
    )

    const elder = getElderById(exceptionModal.elderId)
    if (elder && elder.consecutiveAbsences >= 2 && !hasDirectorTodoForRegistration(exceptionModal.registrationId)) {
      createDirectorTodo({
        type: absenceStrategy === 'suspend' ? 'absenceSuspend' : 'absenceSocialWorker',
        elderId: exceptionModal.elderId,
        elderName: elder.name,
        courseId: exceptionModal.courseId,
        courseName: selectedCourse?.name || '',
        registrationId: exceptionModal.registrationId,
        title: `连续缺勤异常签到-${selectedCourse?.name || ''}`,
        description: `${elder.name}已连续缺勤${elder.consecutiveAbsences}次，本次异常签到。${combinedNotes}请主任关注。`,
        priority: 'high',
      })
    } else if (suggestion) {
      createExceptionDirectorTodo(
        exceptionModal.elderId,
        exceptionModal.courseId,
        exceptionModal.registrationId,
        suggestion
      )
    }

    setExceptionModal({ isOpen: false, registrationId: '', scheduleId: '', elderId: '', courseId: '' })
    setExceptionNotes('')
    setSuspensionSuggestionLevel('')
    setSelectedPresetReason('')
  }

  const handleExceptionCancel = () => {
    setExceptionModal({ isOpen: false, registrationId: '', scheduleId: '', elderId: '', courseId: '' })
    setExceptionNotes('')
    setSuspensionSuggestionLevel('')
    setSelectedPresetReason('')
    setIsPresetReasonOpen(false)
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

  const getAbsenceStrategyText = (strategy: AbsenceStrategy): string => {
    return strategy === 'suspend' ? '自动暂停' : '社工回访'
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

  const isConsecutiveAbsenceReached = (elderId: string): boolean => {
    const elder = getElderById(elderId)
    return (elder?.consecutiveAbsences ?? 0) >= 2
  }

  const renderAbsenceStrategyBanner = () => {
    if (!selectedCourse || !absenceStrategy) return null

    const isSuspend = absenceStrategy === 'suspend'
    const Icon = isSuspend ? UserX : ShieldCheck
    const title = isSuspend ? '缺勤策略：自动暂停' : '缺勤策略：社工回访'
    const description = isSuspend
      ? '本课程连续缺勤2次将自动暂停资格，并生成主任待办'
      : '本课程连续缺勤2次将转社工回访，不自动暂停'
    const bgClass = isSuspend
      ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
      : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200'
    const iconClass = isSuspend ? 'text-orange-600' : 'text-blue-600'
    const titleClass = isSuspend ? 'text-orange-900' : 'text-blue-900'
    const descClass = isSuspend ? 'text-orange-700' : 'text-blue-700'
    const badgeClass = isSuspend
      ? 'bg-orange-100 text-orange-700 border-orange-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'

    return (
      <div className={`mb-6 p-4 rounded-xl border-2 ${bgClass}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-white/70 shadow-sm flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${iconClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`text-lg font-semibold ${titleClass}`}>
                {title}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
                {isSuspend ? 'suspend 策略' : 'socialWorkerVisit 策略'}
              </span>
            </div>
            <p className={`mt-1.5 text-sm ${descClass}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                异常签到
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-amber-700">
                请填写异常原因，异常签到将自动上报主任视图。
              </p>

              {(() => {
                const elder = getElderById(exceptionModal.elderId)
                const hasReachedAbsence = elder ? isConsecutiveAbsenceReached(elder.id) : false
                const todoAlreadyExists = hasDirectorTodoForRegistration(exceptionModal.registrationId)
                if (hasReachedAbsence && todoAlreadyExists) {
                  return (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-50 border border-violet-200">
                      <ShieldAlert className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-violet-800">主任待办已生成</div>
                        <div className="text-sm text-violet-600">
                          该学员已连续缺勤{elder?.consecutiveAbsences}次，相关主任待办已在队列中，本次异常签到将自动追加备注。
                        </div>
                      </div>
                    </div>
                  )
                }
                if (hasReachedAbsence) {
                  return (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-amber-800">已连续缺勤{elder?.consecutiveAbsences}次</div>
                        <div className="text-sm text-amber-600">
                          本次异常签到提交后，将自动生成{absenceStrategy === 'suspend' ? '暂停资格' : '社工回访'}主任待办。
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-amber-800">
                  预设原因 <span className="text-amber-500 font-normal">(可快速选择)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPresetReasonOpen(!isPresetReasonOpen)}
                    className="w-full flex items-center justify-between p-3 border border-amber-200 rounded-lg bg-white hover:border-amber-400 transition-colors text-left"
                  >
                    <span className={selectedPresetReason ? 'text-amber-900' : 'text-amber-400'}>
                      {selectedPresetReason || '请选择预设原因'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-amber-600 transition-transform flex-shrink-0 ml-2 ${
                        isPresetReasonOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isPresetReasonOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-amber-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      {presetReasons.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setSelectedPresetReason(reason)
                            setIsPresetReasonOpen(false)
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b border-amber-100 last:border-0 ${
                            selectedPresetReason === reason ? 'bg-amber-50 font-medium text-amber-900' : 'text-amber-800'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-amber-800">
                  异常详情备注 <span className="text-amber-500 font-normal">(补充说明)</span>
                </label>
                <textarea
                  className="w-full p-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  rows={3}
                  placeholder="请输入异常详情说明..."
                  value={exceptionNotes}
                  onChange={(e) => setExceptionNotes(e.target.value)}
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-amber-100">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-amber-700" />
                  <label className="text-sm font-medium text-amber-800">
                    停课建议 <span className="text-amber-500 font-normal">(SuspensionSuggestion)</span>
                  </label>
                </div>
                <div className="space-y-2">
                  {(Object.keys(suggestionLevelConfig) as SuggestionLevel[]).map((level) => {
                    const config = suggestionLevelConfig[level]
                    const LevelIcon = config.icon
                    const isSelected = suspensionSuggestionLevel === level
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSuspensionSuggestionLevel(isSelected ? '' : level)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `${config.colorClass} ${config.borderClass} ring-2 shadow-sm`
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg bg-white/70 flex-shrink-0 ${
                            isSelected ? config.colorClass.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0] : 'bg-gray-100'
                          }`}>
                            <LevelIcon className={`w-4 h-4 ${isSelected ? config.colorClass.split(' ')[0].replace('text-', 'text-') : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${isSelected ? config.colorClass.split(' ')[0] : 'text-gray-800'}`}>
                              {config.label}
                            </div>
                            <div className={`text-xs mt-0.5 ${isSelected ? config.colorClass.split(' ')[0].replace('700', '600') : 'text-gray-500'}`}>
                              {config.desc}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
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
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-amber-900">{course.name}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                            course.absenceStrategy === 'suspend'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {getAbsenceStrategyText(course.absenceStrategy)}
                          </span>
                        </div>
                        <div className="text-sm text-amber-600 mt-1">
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
          {renderAbsenceStrategyBanner()}

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
                    const consecutiveAbsences = elder?.consecutiveAbsences ?? 0
                    const hasConsecutiveWarning = consecutiveAbsences >= 1
                    const reachedSuspendThreshold = consecutiveAbsences >= 2 && absenceStrategy === 'suspend'
                    const isSuspended = registration.status === 'suspended' || elder?.isSuspended || reachedSuspendThreshold
                    const detailedStatus = getDetailedRegistrationStatus(registration, elder, selectedCourse || undefined)
                    const hasExistingTodo = hasDirectorTodoForRegistration(registration.id)

                    if (!elder) return null

                    return (
                      <div
                        key={registration.id}
                        className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          attendance
                            ? 'bg-green-50 border-green-200'
                            : reachedSuspendThreshold
                            ? 'bg-red-50 border-red-400 shadow-sm'
                            : isSuspended
                            ? 'bg-gray-50 border-gray-300 opacity-70'
                            : hasConsecutiveWarning
                            ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400'
                            : 'bg-white border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0 ${
                            reachedSuspendThreshold
                              ? 'bg-gradient-to-br from-red-500 to-rose-600'
                              : hasConsecutiveWarning
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                              : 'bg-gradient-to-br from-amber-400 to-orange-500'
                          }`}>
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
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg font-semibold text-amber-900">
                                {elder.name}
                              </span>
                              <span className="text-amber-600">{elder.age}岁</span>
                              <RegistrationStatusBadge
                                status={detailedStatus}
                                className="text-xs"
                              />
                              {elder.isSuspended && (
                                <StatusBadge status="error" className="text-xs">
                                  已暂停
                                </StatusBadge>
                              )}
                              {hasConsecutiveWarning && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border-2 ${
                                  reachedSuspendThreshold
                                    ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  <AlertTriangle className="w-3 h-3" />
                                  已连续缺勤{consecutiveAbsences}次
                                </span>
                              )}
                              {absenceStrategy && hasConsecutiveWarning && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                  absenceStrategy === 'suspend'
                                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                }`}>
                                  {absenceStrategy === 'suspend' ? (
                                    <><UserX className="w-2.5 h-2.5 mr-1" />暂停策略</>
                                  ) : (
                                    <><ShieldCheck className="w-2.5 h-2.5 mr-1" />社工回访</>
                                  )}
                                </span>
                              )}
                              {hasExistingTodo && !attendance && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                                  <ShieldAlert className="w-3 h-3" />
                                  主任待办已生成
                                </span>
                              )}
                            </div>
                            {reachedSuspendThreshold && !attendance && (
                              <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-100/70 border border-red-200">
                                <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-700">
                                  <span className="font-semibold">已自动暂停</span>
                                  <span className="block text-xs mt-0.5">
                                    连续缺勤{consecutiveAbsences}次，达到{absenceStrategy === 'suspend' ? 'suspend暂停' : 'socialWorkerVisit社工回访'}策略阈值，签到功能已锁定。
                                  </span>
                                </div>
                              </div>
                            )}
                            {attendance && (
                              <div className="flex items-center gap-2 mt-1.5 text-sm flex-wrap">
                                <StatusBadge status={getStatusBadgeStatus(attendance.status)}>
                                  {getStatusText(attendance.status)}
                                </StatusBadge>
                                {attendance.checkInTime && (
                                  <span className="text-amber-600">
                                    {attendance.checkInTime} 签到
                                  </span>
                                )}
                                {attendance.notes && (
                                  <span className="text-amber-500 text-xs truncate max-w-xs">
                                    备注：{attendance.notes}
                                  </span>
                                )}
                                {attendance.reportedToDirector && (
                                  <span className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    已上报主任
                                  </span>
                                )}
                                {attendance.directorTodoCreated && (
                                  <span className="text-violet-600 text-xs flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" />
                                    待办已生成
                                  </span>
                                )}
                              </div>
                            )}
                            {isSuspended && !attendance && !reachedSuspendThreshold && (
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
                              className={`flex items-center gap-1 ${
                                hasExistingTodo || hasConsecutiveWarning
                                  ? 'text-violet-700 hover:bg-violet-100 border border-violet-200'
                                  : 'text-orange-700 hover:bg-orange-100'
                              }`}
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
