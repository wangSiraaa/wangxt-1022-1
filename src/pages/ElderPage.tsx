import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  ListChecks,
  Heart,
  Users,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  UserCheck,
  ShieldCheck,
  HandHeart,
  Info,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge, RegistrationStatusBadge, StatusLegend } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { Course, CourseType, Registration } from '../types'

type TabType = 'hall' | 'myCourses'

const courseTypeNames: Record<CourseType, string> = {
  calligraphy: '书法',
  dance: '舞蹈',
  sports: '运动',
  health: '健康',
  rehabilitation: '康复',
}

const courseTypeColors: Record<CourseType, string> = {
  calligraphy: 'bg-blue-100 text-blue-700',
  dance: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700',
  health: 'bg-red-100 text-red-700',
  rehabilitation: 'bg-teal-100 text-teal-700',
}

const ElderPage: React.FC = () => {
  const {
    currentElderId,
    getCurrentElder,
    courses,
    registerCourse,
    getRegistrationsByElder,
    getCourseById,
    applyReinstatement,
    getTeacherById,
    getVenueById,
    getDetailedRegistrationStatus,
    validateRehabilitationRegistration,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('hall')
  const [selectedType, setSelectedType] = useState<CourseType | 'all'>('all')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showReinstatementModal, setShowReinstatementModal] = useState(false)
  const [reinstatementRegistrationId, setReinstatementRegistrationId] = useState<string | null>(null)
  const [reinstatementReason, setReinstatementReason] = useState('')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' })

  const currentElder = getCurrentElder()

  const myRegistrations = currentElderId ? getRegistrationsByElder(currentElderId) : []

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      if (course.status !== 'published') return false
      if (selectedType !== 'all' && course.type !== selectedType) return false
      return true
    })
  }, [courses, selectedType])

  const getRegistration = (courseId: string): Registration | undefined => {
    return myRegistrations.find(r => r.courseId === courseId && r.status !== 'cancelled')
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const handleRegister = (courseId: string) => {
    if (!currentElderId) {
      showToast('请先选择老人身份', 'error')
      return
    }

    const result = registerCourse(currentElderId, courseId)
    showToast(result.message, result.success ? 'success' : 'warning')
  }

  const handleApplyReinstatement = () => {
    if (!reinstatementRegistrationId) return

    applyReinstatement(reinstatementRegistrationId, reinstatementReason)

    showToast('复课申请已提交，等待主任审批。期间候补顺位、器材场地均已锁定保护。', 'success')
    setShowReinstatementModal(false)
    setReinstatementReason('')
    setReinstatementRegistrationId(null)
  }

  const openReinstatementModal = (registrationId: string) => {
    setReinstatementRegistrationId(registrationId)
    setShowReinstatementModal(true)
  }

  const getButtonStatus = (course: Course, registration?: Registration) => {
    if (!currentElder) {
      return { disabled: true, text: '请先选择老人', variant: 'secondary' as const }
    }

    if (currentElder.isSuspended) {
      return { disabled: true, text: '账号已暂停，需申请复课', variant: 'secondary' as const }
    }

    if (!registration) {
      if (course.requiresHealthCheck && !currentElder.riskAssessment) {
        return { disabled: true, text: '需先做健康评估', variant: 'secondary' as const }
      }
      if (course.requiresHealthCheck && course.type === 'sports' && !currentElder.riskAssessment?.canParticipateSports) {
        return { disabled: true, text: '不建议参加运动课程', variant: 'secondary' as const }
      }

      if (course.isRehabilitation && currentElder) {
        const rehabValidation = validateRehabilitationRegistration(currentElder, course)
        if (!rehabValidation.valid) {
          return { disabled: true, text: rehabValidation.message, variant: 'secondary' as const }
        }
      }

      const isFull = course.currentParticipants >= course.maxParticipants
      return {
        disabled: false,
        text: isFull ? (course.isRehabilitation ? '康复候补' : '加入候补') : '立即报名',
        variant: 'primary' as const
      }
    }

    const detailedStatus = getDetailedRegistrationStatus(registration)

    if (detailedStatus === 'normalEnrolled') {
      return { disabled: true, text: '正常在读', variant: 'secondary' as const }
    }
    if (detailedStatus === 'riskUnconfirmed') {
      return { disabled: true, text: '风险待确认', variant: 'secondary' as const }
    }
    if (detailedStatus === 'waitlistPendingPromotion') {
      return { disabled: true, text: `候补第${registration.waitlistPosition}位`, variant: 'secondary' as const }
    }
    if (detailedStatus === 'reinstatementPending') {
      return { disabled: true, text: '复课待批中', variant: 'secondary' as const }
    }
    if (detailedStatus === 'suspendedByAbsence') {
      return { disabled: false, text: '申请复课', variant: 'primary' as const }
    }

    return { disabled: true, text: '立即报名', variant: 'primary' as const }
  }

  const getRehabRequirementStatus = () => {
    if (!currentElder) return null

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const hasValidDoctorAdvice =
      !!currentElder.lastDoctorAdviceDate &&
      new Date(currentElder.lastDoctorAdviceDate) >= threeMonthsAgo

    return {
      doctorAdvice: {
        ok: hasValidDoctorAdvice,
        label: '最近医生建议',
        detail: currentElder.lastDoctorAdviceDate
          ? `（${currentElder.lastDoctorAdviceDate}，${hasValidDoctorAdvice ? '3个月内有效' : '已过期'}）`
          : '（缺失）',
      },
      familyConfirmed: {
        ok: !!currentElder.familyConfirmationSigned,
        label: '家属确认签字',
        detail: currentElder.familyConfirmationSigned
          ? `（${currentElder.familyConfirmedByName}）`
          : '（未签字）',
      },
      volunteer: {
        ok: !!currentElder.assignedVolunteerId,
        label: '志愿者陪同',
        detail: currentElder.assignedVolunteerName || '（未安排）',
      },
    }
  }

  if (!currentElder) {
    return (
      <div className="flex items-center justify-center py-20">
        <Empty
          icon={<User size={48} />}
          title="请先选择老人身份"
          description="请返回首页选择老人身份后再进入此页面"
        />
      </div>
    )
  }

  const stats = {
    total: myRegistrations.filter(r => r.status !== 'cancelled').length,
    normal: myRegistrations.filter(r => getDetailedRegistrationStatus(r) === 'normalEnrolled').length,
    risk: myRegistrations.filter(r => getDetailedRegistrationStatus(r) === 'riskUnconfirmed').length,
    waitlist: myRegistrations.filter(r => getDetailedRegistrationStatus(r) === 'waitlistPendingPromotion').length,
    suspended: myRegistrations.filter(r => getDetailedRegistrationStatus(r) === 'suspendedByAbsence').length,
    reinstating: myRegistrations.filter(r => getDetailedRegistrationStatus(r) === 'reinstatementPending').length,
  }

  const rehabStatus = getRehabRequirementStatus()

  return (
    <div className="space-y-6">
      {toast.show && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-[toastIn_0.3s_ease-out] ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-amber-500 text-white'
        }`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <XCircle size={20} />}
          {toast.type === 'warning' && <AlertTriangle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
              {currentElder.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentElder.name}</h2>
              <p className="text-amber-100 mt-1">
                {currentElder.age}岁 · {currentElder.gender === 'male' ? '男' : '女'} · {currentElder.phone}
              </p>
              {currentElder.isSuspended && (
                <div className="flex items-center gap-1 mt-2 text-amber-100">
                  <AlertCircle size={16} />
                  <span className="text-sm">账号已暂停：{currentElder.suspensionReason}</span>
                </div>
              )}
              {currentElder.consecutiveAbsences > 0 && (
                <div className="flex items-center gap-1 mt-1 text-amber-100">
                  <AlertTriangle size={16} />
                  <span className="text-sm">已连续缺勤 {currentElder.consecutiveAbsences} 次</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.normal}</div>
            <div className="text-amber-100 text-sm">正常在读</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('hall')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'hall'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <BookOpen size={20} />
            课程大厅
          </button>
          <button
            onClick={() => setActiveTab('myCourses')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'myCourses'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <ListChecks size={20} />
            我的课程
          </button>
        </div>
      </div>

      {activeTab === 'hall' && (
        <>
          {rehabStatus && (
            <Card className="border-teal-200 bg-teal-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-teal-800">
                  <Stethoscope size={18} />
                  康复类课程报名资质
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className={`p-3 rounded-xl border ${rehabStatus.doctorAdvice.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      {rehabStatus.doctorAdvice.ok ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                      <span className={rehabStatus.doctorAdvice.ok ? 'text-green-800' : 'text-red-800'}>{rehabStatus.doctorAdvice.label}</span>
                    </div>
                    <div className="text-xs text-gray-600">{rehabStatus.doctorAdvice.detail}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${rehabStatus.familyConfirmed.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      {rehabStatus.familyConfirmed.ok ? <ShieldCheck size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
                      <span className={rehabStatus.familyConfirmed.ok ? 'text-green-800' : 'text-red-800'}>{rehabStatus.familyConfirmed.label}</span>
                    </div>
                    <div className="text-xs text-gray-600">{rehabStatus.familyConfirmed.detail}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${rehabStatus.volunteer.ok ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-1.5 font-medium mb-1">
                      {rehabStatus.volunteer.ok ? <HandHeart size={14} className="text-green-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                      <span className={rehabStatus.volunteer.ok ? 'text-green-800' : 'text-amber-800'}>{rehabStatus.volunteer.label}</span>
                    </div>
                    <div className="text-xs text-gray-600">{rehabStatus.volunteer.detail}</div>
                  </div>
                </div>
                <p className="text-xs text-teal-700 flex items-start gap-1">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  以上三项为康复类课程报名的前置条件，任一缺失将无法报名康复课程。如有疑问请联系社工。
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedType === 'all'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              全部课程
            </button>
            {Object.entries(courseTypeNames).map(([type, name]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type as CourseType)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedType === type
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {filteredCourses.map((course) => {
              const registration = getRegistration(course.id)
              const buttonStatus = getButtonStatus(course, registration)
              const isFull = course.currentParticipants >= course.maxParticipants
              const detailedStatus = registration ? getDetailedRegistrationStatus(registration) : null

              return (
                <Card
                  key={course.id}
                  className={`transition-all duration-300 hover:shadow-xl cursor-pointer ${
                    selectedCourse?.id === course.id ? 'ring-2 ring-amber-500' : ''
                  } ${course.isRehabilitation ? 'border-teal-200' : ''}`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${courseTypeColors[course.type]}`}>
                            {courseTypeNames[course.type]}
                          </span>
                          {course.isRehabilitation && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                              <Stethoscope size={10} />
                              康复类
                            </span>
                          )}
                          {course.requiresHealthCheck && !course.isRehabilitation && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              <Heart size={10} />
                              需健康确认
                            </span>
                          )}
                          {isFull && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-600">
                              <Users size={10} />
                              已满员
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                      </div>
                      {registration && detailedStatus && (
                        <RegistrationStatusBadge status={detailedStatus} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>

                    {course.isRehabilitation && (
                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1.5">
                        <div className="font-medium flex items-center gap-1.5">
                          <Stethoscope size={12} />
                          康复课程报名前置校验
                        </div>
                        <ul className="space-y-0.5 pl-5 list-disc">
                          <li>需持有3个月内有效医生建议报告</li>
                          <li>家属须签署知情确认书</li>
                          <li>需安排固定志愿者陪同</li>
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users size={14} />
                        <span>{course.currentParticipants}/{course.maxParticipants}人</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin size={14} />
                        <span>{getVenueById(course.schedules[0]?.venueId)?.name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <User size={14} />
                        <span>{getTeacherById(course.schedules[0]?.teacherId)?.name || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        <span>{course.schedules[0]?.startTime || '-'}</span>
                      </div>
                    </div>

                    {course.requiresHealthCheck && currentElder.riskAssessment && (
                      <div className={`p-3 rounded-lg text-sm ${
                        currentElder.riskAssessment.canParticipateSports
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        <div className="font-medium mb-1">医生建议：</div>
                        <div>{currentElder.riskAssessment.doctorRecommendation}</div>
                      </div>
                    )}

                    {course.requiresHealthCheck && !currentElder.riskAssessment && (
                      <div className="p-3 rounded-lg text-sm bg-amber-50 text-amber-700 border border-amber-200">
                        <div className="flex items-center gap-1 font-medium mb-1">
                          <AlertTriangle size={14} />
                          温馨提示
                        </div>
                        <div>该课程需要健康风险评估，请先联系社工完成评估</div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {detailedStatus === 'suspendedByAbsence' && registration ? (
                      <Button
                        className="w-full"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          openReinstatementModal(registration.id)
                        }}
                      >
                        <FileText size={16} />
                        申请复课
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={buttonStatus.variant}
                        disabled={buttonStatus.disabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!buttonStatus.disabled) {
                            handleRegister(course.id)
                          }
                        }}
                      >
                        {isFull && !buttonStatus.disabled && <Plus size={16} />}
                        {buttonStatus.text}
                        {!isFull && !buttonStatus.disabled && <ChevronRight size={16} />}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {filteredCourses.length === 0 && (
            <Empty
              icon={<BookOpen size={48} />}
              title="暂无课程"
              description="该分类下暂无课程，请选择其他分类查看"
            />
          )}
        </>
      )}

      {activeTab === 'myCourses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-2">
            <Card className="bg-white/60 p-3 text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-xs text-gray-500">总报名</div>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{stats.normal}</div>
              <div className="text-xs text-emerald-600">正常在读</div>
            </Card>
            <Card className="bg-red-50 border-red-200 p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.risk}</div>
              <div className="text-xs text-red-600">风险未确认</div>
            </Card>
            <Card className="bg-amber-50 border-amber-200 p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">{stats.waitlist}</div>
              <div className="text-xs text-amber-600">候补待转</div>
            </Card>
            <Card className="bg-orange-50 border-orange-200 p-3 text-center">
              <div className="text-2xl font-bold text-orange-700">{stats.suspended}</div>
              <div className="text-xs text-orange-600">缺勤暂停</div>
            </Card>
            <Card className="bg-violet-50 border-violet-200 p-3 text-center">
              <div className="text-2xl font-bold text-violet-700">{stats.reinstating}</div>
              <div className="text-xs text-violet-600">复课待批</div>
            </Card>
          </div>

          <StatusLegend />

          {myRegistrations.filter(r => r.status !== 'cancelled').length === 0 ? (
            <Empty
              icon={<ListChecks size={48} />}
              title="暂无报名记录"
              description="去课程大厅看看有什么感兴趣的课程吧"
              action={
                <Button variant="primary" onClick={() => setActiveTab('hall')}>
                  去报名
                  <ChevronRight size={16} />
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {myRegistrations
                .filter(r => r.status !== 'cancelled')
                .map((registration) => {
                  const course = getCourseById(registration.courseId)
                  if (!course) return null
                  const detailedStatus = getDetailedRegistrationStatus(registration)

                  return (
                    <Card
                      key={registration.id}
                      className={detailedStatus === 'riskUnconfirmed' || detailedStatus === 'suspendedByAbsence'
                        ? 'animate-pulse border-l-4 border-l-orange-400'
                        : ''
                      }
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              course.type === 'calligraphy' ? 'bg-blue-100' :
                              course.type === 'dance' ? 'bg-purple-100' :
                              course.type === 'sports' ? 'bg-green-100' :
                              course.type === 'health' ? 'bg-red-100' :
                              'bg-teal-100'
                            }`}>
                              {course.type === 'calligraphy' && <BookOpen size={24} className="text-blue-600" />}
                              {course.type === 'dance' && <Users size={24} className="text-purple-600" />}
                              {course.type === 'sports' && <Heart size={24} className="text-green-600" />}
                              {course.type === 'health' && <Heart size={24} className="text-red-600" />}
                              {course.type === 'rehabilitation' && <Stethoscope size={24} className="text-teal-600" />}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 flex items-center gap-2">
                                {course.name}
                                {course.isRehabilitation && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">康复</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                报名时间：{registration.registrationDate}
                              </div>
                              {detailedStatus === 'waitlistPendingPromotion' && (
                                <div className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                                  <Clock size={12} />
                                  候补顺位：第 {registration.waitlistPosition} 位
                                </div>
                              )}
                              {detailedStatus === 'reinstatementPending' && (
                                <div className="text-sm text-violet-600 mt-1 flex items-center gap-1">
                                  <ShieldCheck size={12} />
                                  原候补顺位 {registration.originalWaitlistPosition ?? '无'}，资源已锁定保护
                                </div>
                              )}
                              {detailedStatus === 'suspendedByAbsence' && registration.suspensionReason && (
                                <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} />
                                  {registration.suspensionReason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <RegistrationStatusBadge status={detailedStatus} />
                            {detailedStatus === 'suspendedByAbsence' && (
                              <Button
                                size="sm"
                                onClick={() => openReinstatementModal(registration.id)}
                              >
                                <FileText size={14} />
                                申请复课
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {showReinstatementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={24} className="text-amber-500" />
              申请复课
            </h3>
            <div className="space-y-3 mb-4">
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-sm text-violet-800">
                <div className="font-medium flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={14} />
                  复课审批保护机制
                </div>
                <ul className="text-xs space-y-0.5 pl-5 list-disc">
                  <li>审批期间原候补顺位保持不变，不会被他人顶替</li>
                  <li>已占用的器材和场地时间段将被锁定保留</li>
                  <li>主任审批通过后自动恢复正常在读状态</li>
                  <li>审批拒绝则自动释放锁定的资源</li>
                </ul>
              </div>
              <p className="text-gray-600 text-sm">
                请填写复课申请理由，提交后等待主任审批。
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  申请理由
                </label>
                <textarea
                  value={reinstatementReason}
                  onChange={(e) => setReinstatementReason(e.target.value)}
                  placeholder="请说明您的身体恢复情况和复课理由..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowReinstatementModal(false)
                    setReinstatementReason('')
                    setReinstatementRegistrationId(null)
                  }}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApplyReinstatement}
                  disabled={!reinstatementReason.trim()}
                >
                  <CheckCircle size={16} />
                  提交申请
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ElderPage
