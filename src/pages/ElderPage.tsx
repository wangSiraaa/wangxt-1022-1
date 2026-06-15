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
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { Course, CourseType, Registration } from '../types'

type TabType = 'hall' | 'myCourses'

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

const ElderPage: React.FC = () => {
  const {
    currentElderId,
    getCurrentElder,
    courses,
    registrations,
    registerCourse,
    getRegistrationsByElder,
    getCourseById,
    applyReinstatement,
    getTeacherById,
    getVenueById,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('hall')
  const [selectedType, setSelectedType] = useState<CourseType | 'all'>('all')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showReinstatementModal, setShowReinstatementModal] = useState(false)
  const [reinstatementCourse, setReinstatementCourse] = useState<{ courseId: string; registrationId: string } | null>(null)
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

  const getRegistrationStatus = (courseId: string): Registration | undefined => {
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
    if (!currentElderId || !reinstatementCourse) return

    applyReinstatement(
      currentElderId,
      reinstatementCourse.courseId,
      reinstatementCourse.registrationId,
      reinstatementReason,
      currentElderId
    )

    showToast('复课申请已提交，等待主任审批', 'success')
    setShowReinstatementModal(false)
    setReinstatementReason('')
    setReinstatementCourse(null)
  }

  const openReinstatementModal = (courseId: string, registrationId: string) => {
    setReinstatementCourse({ courseId, registrationId })
    setShowReinstatementModal(true)
  }

  const getRegistrationStatusBadge = (registration: Registration) => {
    switch (registration.status) {
      case 'confirmed':
        return <StatusBadge status="success">已报名</StatusBadge>
      case 'pending':
        return <StatusBadge status="pending">待确认</StatusBadge>
      case 'waitlisted':
        return <StatusBadge status="warning">候补第{registration.waitlistPosition}位</StatusBadge>
      case 'suspended':
        return <StatusBadge status="error">已暂停</StatusBadge>
      case 'cancelled':
        return <StatusBadge status="info">已取消</StatusBadge>
      default:
        return null
    }
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
      const isFull = course.currentParticipants >= course.maxParticipants
      return { 
        disabled: false, 
        text: isFull ? '加入候补' : '立即报名', 
        variant: 'primary' as const 
      }
    }

    if (registration.status === 'confirmed') {
      return { disabled: true, text: '已报名', variant: 'secondary' as const }
    }
    if (registration.status === 'pending') {
      return { disabled: true, text: '待健康确认', variant: 'secondary' as const }
    }
    if (registration.status === 'waitlisted') {
      return { disabled: true, text: `候补第${registration.waitlistPosition}位`, variant: 'secondary' as const }
    }
    if (registration.status === 'suspended') {
      return { disabled: false, text: '申请复课', variant: 'primary' as const }
    }

    return { disabled: true, text: '立即报名', variant: 'primary' as const }
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
            <div className="text-3xl font-bold">{myRegistrations.filter(r => r.status === 'confirmed').length}</div>
            <div className="text-amber-100 text-sm">已报名课程</div>
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
              const registration = getRegistrationStatus(course.id)
              const buttonStatus = getButtonStatus(course, registration)
              const isFull = course.currentParticipants >= course.maxParticipants

              return (
                <Card
                  key={course.id}
                  className={`transition-all duration-300 hover:shadow-xl cursor-pointer ${
                    selectedCourse?.id === course.id ? 'ring-2 ring-amber-500' : ''
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${courseTypeColors[course.type]}`}>
                            {courseTypeNames[course.type]}
                          </span>
                          {course.requiresHealthCheck && (
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
                      {registration && getRegistrationStatusBadge(registration)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-600 text-sm line-clamp-2">{course.description}</p>
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
                    {registration?.status === 'suspended' ? (
                      <Button
                        className="w-full"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          openReinstatementModal(course.id, registration.id)
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

                  return (
                    <Card key={registration.id}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              registration.status === 'confirmed' ? 'bg-green-100' :
                              registration.status === 'suspended' ? 'bg-red-100' :
                              registration.status === 'waitlisted' ? 'bg-amber-100' :
                              'bg-blue-100'
                            }`}>
                              {course.type === 'calligraphy' && <BookOpen size={24} className="text-blue-600" />}
                              {course.type === 'dance' && <Users size={24} className="text-purple-600" />}
                              {course.type === 'sports' && <Heart size={24} className="text-green-600" />}
                              {course.type === 'health' && <Heart size={24} className="text-red-600" />}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{course.name}</div>
                              <div className="text-sm text-gray-500">
                                报名时间：{registration.registrationDate}
                              </div>
                              {registration.status === 'waitlisted' && (
                                <div className="text-sm text-amber-600 mt-1">
                                  候补顺位：第 {registration.waitlistPosition} 位
                                </div>
                              )}
                              {registration.status === 'suspended' && registration.suspensionReason && (
                                <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                  <AlertCircle size={14} />
                                  {registration.suspensionReason}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getRegistrationStatusBadge(registration)}
                            {registration.status === 'suspended' && (
                              <Button
                                size="sm"
                                onClick={() => openReinstatementModal(course.id, registration.id)}
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
            <p className="text-gray-600 mb-4">
              您的账号因「{currentElder.suspensionReason}」已被暂停，请填写复课申请理由，待主任审批通过后恢复上课资格。
            </p>
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
                    setReinstatementCourse(null)
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
