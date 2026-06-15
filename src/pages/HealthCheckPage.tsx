import React, { useState, useMemo } from 'react'
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Heart,
  Activity,
  User,
  BookOpen,
  FileText,
  Clock,
  AlertCircle,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  HandHeart,
  ShieldAlert,
  Shield,
  UserX,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge, StatusLegend } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { Registration, Elder, Course, RiskAssessment } from '../types'

type TabType = 'pending' | 'confirmed'

interface ConfirmHealthCheckOpts {
  familyConfirmed?: boolean
  familyConfirmedByName?: string
  volunteerId?: string
  volunteerName?: string
  doctorAdviceDate?: string
  volunteerAssigned?: boolean
}

const fallRiskNames: Record<RiskAssessment['fallRisk'], string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const fallRiskColors: Record<RiskAssessment['fallRisk'], string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const exerciseToleranceNames: Record<RiskAssessment['exerciseTolerance'], string> = {
  normal: '正常',
  limited: '受限',
  severelyLimited: '严重受限',
}

const exerciseToleranceColors: Record<RiskAssessment['exerciseTolerance'], string> = {
  normal: 'bg-green-100 text-green-700',
  limited: 'bg-amber-100 text-amber-700',
  severelyLimited: 'bg-red-100 text-red-700',
}

const courseTypeNames: Record<Course['type'], string> = {
  calligraphy: '书法',
  dance: '舞蹈',
  sports: '运动',
  health: '健康',
  rehabilitation: '康复',
}

const courseTypeColors: Record<Course['type'], string> = {
  calligraphy: 'bg-blue-100 text-blue-700',
  dance: 'bg-purple-100 text-purple-700',
  sports: 'bg-green-100 text-green-700',
  health: 'bg-red-100 text-red-700',
  rehabilitation: 'bg-teal-100 text-teal-700',
}

interface RehabilitationToggleState {
  familyConfirmed: boolean
  volunteerAssigned: boolean
}

const isDoctorAdviceValid = (dateStr?: string): boolean => {
  if (!dateStr) return false
  const adviceDate = new Date(dateStr)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return adviceDate >= threeMonthsAgo
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  return dateStr
}

const HealthCheckPage: React.FC = () => {
  const {
    currentUser,
    registrations,
    elders,
    courses,
    users,
    confirmHealthCheck,
    getElderById,
    getCourseById,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' })
  const [rehabToggleMap, setRehabToggleMap] = useState<Record<string, RehabilitationToggleState>>({})

  const pendingRegistrations = useMemo(() => {
    return registrations.filter(r => r.status === 'pending')
  }, [registrations])

  const confirmedRegistrations = useMemo(() => {
    return registrations.filter(r => r.healthConfirmed)
  }, [registrations])

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const getRehabToggle = (registrationId: string, elder: Elder): RehabilitationToggleState => {
    if (rehabToggleMap[registrationId]) {
      return rehabToggleMap[registrationId]
    }
    return {
      familyConfirmed: elder.riskAssessment?.familyConfirmed ?? false,
      volunteerAssigned: elder.riskAssessment?.volunteerAssigned ?? false,
    }
  }

  const toggleFamilyConfirmed = (registrationId: string, elder: Elder) => {
    const current = getRehabToggle(registrationId, elder)
    setRehabToggleMap(prev => ({
      ...prev,
      [registrationId]: {
        ...current,
        familyConfirmed: !current.familyConfirmed,
      },
    }))
  }

  const toggleVolunteerAssigned = (registrationId: string, elder: Elder) => {
    const current = getRehabToggle(registrationId, elder)
    setRehabToggleMap(prev => ({
      ...prev,
      [registrationId]: {
        ...current,
        volunteerAssigned: !current.volunteerAssigned,
      },
    }))
  }

  const handleConfirm = (registrationId: string, elder: Elder, course: Course) => {
    if (!currentUser?.id) {
      showToast('请先登录', 'error')
      return
    }

    const opts: ConfirmHealthCheckOpts = {}

    if (course.isRehabilitation) {
      const toggle = getRehabToggle(registrationId, elder)
      const risk = elder.riskAssessment

      opts.familyConfirmed = toggle.familyConfirmed
      if (toggle.familyConfirmed) {
        opts.familyConfirmedByName = risk?.familyConfirmedBy || currentUser.name
      }

      opts.volunteerAssigned = toggle.volunteerAssigned
      if (toggle.volunteerAssigned) {
        const volunteer = users.find(u => u.role === 'volunteer')
        opts.volunteerId = risk?.volunteerId || volunteer?.id || 'v1'
        opts.volunteerName = risk?.volunteerName || volunteer?.name || '志愿者小王'
      }

      opts.doctorAdviceDate = risk?.lastDoctorAdviceDate
    }

    confirmHealthCheck(registrationId, currentUser.id, opts)
    showToast(course.isRehabilitation ? '康复课程健康确认通过，三要素已同步记录' : '健康风险确认通过', 'success')
  }

  const handleFurtherAssessment = (_registrationId: string) => {
    showToast('已标记需要进一步评估', 'warning')
  }

  const getUserName = (userId?: string): string => {
    if (!userId) return '-'
    const user = users.find(u => u.id === userId)
    return user?.name || '-'
  }

  const isHighRisk = (risk?: RiskAssessment): boolean => {
    if (!risk) return false
    return risk.fallRisk === 'high' || risk.exerciseTolerance === 'severelyLimited' || risk.heartCondition
  }

  const renderRehabilitationChecklist = (elder: Elder): React.ReactNode => {
    const risk = elder.riskAssessment
    const lastDoctorAdviceDate = risk?.lastDoctorAdviceDate
    const doctorAdviceValid = isDoctorAdviceValid(lastDoctorAdviceDate)
    const familyConfirmed = risk?.familyConfirmed ?? false
    const familyConfirmedByName = risk?.familyConfirmedBy
    const volunteerAssigned = risk?.volunteerAssigned ?? false
    const volunteerName = risk?.volunteerName

    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Stethoscope size={16} className="text-teal-600" />
          <span className="font-medium text-teal-800">康复类前置校验</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-lg p-3 border ${doctorAdviceValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-1 mb-2">
              <Stethoscope size={14} className={doctorAdviceValid ? 'text-green-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${doctorAdviceValid ? 'text-green-700' : 'text-red-700'}`}>最近医生建议</span>
            </div>
            <div className={`text-sm font-semibold ${doctorAdviceValid ? 'text-green-800' : 'text-red-800'}`}>
              {formatDate(lastDoctorAdviceDate)}
            </div>
            <div className={`text-xs mt-1 ${doctorAdviceValid ? 'text-green-600' : 'text-red-600'}`}>
              {doctorAdviceValid ? '3个月内有效' : '已超过3个月'}
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${familyConfirmed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-1 mb-2">
              <HandHeart size={14} className={familyConfirmed ? 'text-green-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${familyConfirmed ? 'text-green-700' : 'text-red-700'}`}>家属确认签字</span>
            </div>
            <div className={`text-sm font-semibold ${familyConfirmed ? 'text-green-800' : 'text-red-800'}`}>
              {familyConfirmed ? '已签字' : '未签字'}
            </div>
            <div className="text-xs mt-1 text-gray-600">
              {familyConfirmed && familyConfirmedByName ? `签字人：${familyConfirmedByName}` : '待家属确认'}
            </div>
          </div>

          <div className={`rounded-lg p-3 border ${volunteerAssigned ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-1 mb-2">
              <ShieldCheck size={14} className={volunteerAssigned ? 'text-green-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${volunteerAssigned ? 'text-green-700' : 'text-red-700'}`}>志愿者陪同</span>
            </div>
            <div className={`text-sm font-semibold ${volunteerAssigned ? 'text-green-800' : 'text-red-800'}`}>
              {volunteerAssigned ? '已安排' : '未安排'}
            </div>
            <div className="text-xs mt-1 text-gray-600">
              {volunteerAssigned && volunteerName ? `志愿者：${volunteerName}` : '待分配志愿者'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderRehabCheckBadges = (elder: Elder, registrationId: string, isPending: boolean): React.ReactNode => {
    const risk = elder.riskAssessment
    const toggle = isPending ? getRehabToggle(registrationId, elder) : null

    const doctorAdviceValid = isDoctorAdviceValid(risk?.lastDoctorAdviceDate)
    const familyOk = isPending && toggle ? toggle.familyConfirmed : (risk?.familyConfirmed ?? false)
    const volunteerOk = isPending && toggle ? toggle.volunteerAssigned : (risk?.volunteerAssigned ?? false)

    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          doctorAdviceValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {doctorAdviceValid ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
          医生建议{doctorAdviceValid ? '有效' : '过期'}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          familyOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {familyOk ? <HandHeart size={10} /> : <UserX size={10} />}
          家属{familyOk ? '已确认' : '未确认'}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          volunteerOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {volunteerOk ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
          志愿者{volunteerOk ? '已安排' : '未安排'}
        </span>
      </div>
    )
  }

  const renderRehabToggles = (elder: Elder, registrationId: string): React.ReactNode => {
    const toggle = getRehabToggle(registrationId, elder)

    return (
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-teal-200">
        <button
          type="button"
          onClick={() => toggleFamilyConfirmed(registrationId, elder)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            toggle.familyConfirmed
              ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <HandHeart size={14} />
          {toggle.familyConfirmed ? '家属已确认 ✓' : '家属未确认 ✗'}
          <span className="text-xs opacity-70 ml-1">(点击切换)</span>
        </button>
        <button
          type="button"
          onClick={() => toggleVolunteerAssigned(registrationId, elder)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            toggle.volunteerAssigned
              ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Shield size={14} />
          {toggle.volunteerAssigned ? '志愿者已安排 ✓' : '志愿者未安排 ✗'}
          <span className="text-xs opacity-70 ml-1">(点击切换)</span>
        </button>
      </div>
    )
  }

  const renderRegistrationCard = (registration: Registration, isPending: boolean): React.ReactNode => {
    const elder = getElderById(registration.elderId)
    const course = getCourseById(registration.courseId)
    const risk = elder?.riskAssessment
    const healthRecord = elder?.healthRecord
    const highRisk = isHighRisk(risk)

    if (!elder || !course) return null

    const isRehab = course.isRehabilitation

    return (
      <Card
        key={registration.id}
        className={`${
          isPending ? 'bg-amber-50 border-amber-200' : ''
        } ${
          highRisk ? 'border-red-300' : ''
        } ${
          isRehab ? 'border-teal-300' : ''
        }`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${courseTypeColors[course.type]}`}>
                  {courseTypeNames[course.type]}
                </span>
                {isRehab && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-200">
                    <Stethoscope size={10} />
                    康复类课程
                  </span>
                )}
                {course.requiresHealthCheck && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                    <Heart size={10} />
                    需健康确认
                  </span>
                )}
                {highRisk && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                    <AlertTriangle size={10} />
                    高风险
                  </span>
                )}
                {isPending && (
                  <StatusBadge status="warning">待确认</StatusBadge>
                )}
                {!isPending && (
                  <StatusBadge status="success">已确认</StatusBadge>
                )}
              </div>
              <CardTitle className="text-lg">{course.name}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-amber-600" />
                <span className="font-medium text-gray-700">老人信息</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">姓名：</span>
                  <span className="font-medium">{elder.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">年龄：</span>
                  <span>{elder.age}岁</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">性别：</span>
                  <span>{elder.gender === 'male' ? '男' : '女'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">电话：</span>
                  <span>{elder.phone}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-amber-600" />
                <span className="font-medium text-gray-700">课程信息</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">课程类型：</span>
                  <span>{courseTypeNames[course.type]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">报名时间：</span>
                  <span>{registration.registrationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">人数：</span>
                  <span>{course.currentParticipants}/{course.maxParticipants}人</span>
                </div>
              </div>
            </div>
          </div>

          {isRehab && renderRehabilitationChecklist(elder)}

          {healthRecord && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-amber-600" />
                <span className="font-medium text-gray-700">健康档案</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">血压</span>
                    <span className="font-medium">{healthRecord.bloodPressure}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">血糖</span>
                    <span className="font-medium">{healthRecord.bloodSugar}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">心率</span>
                    <span className="font-medium">{healthRecord.heartRate}</span>
                  </div>
                </div>
                {healthRecord.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 text-xs">备注：</span>
                    <span className="ml-1">{healthRecord.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {risk && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className={highRisk ? 'text-red-600' : 'text-amber-600'} />
                <span className={`font-medium ${highRisk ? 'text-red-700' : 'text-gray-700'}`}>风险评估</span>
              </div>
              <div className={`rounded-lg p-3 space-y-3 ${highRisk ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">跌倒风险：</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fallRiskColors[risk.fallRisk]}`}>
                      {fallRiskNames[risk.fallRisk]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">运动耐量：</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exerciseToleranceColors[risk.exerciseTolerance]}`}>
                      {exerciseToleranceNames[risk.exerciseTolerance]}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-sm">心脏病：</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      risk.heartCondition ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {risk.heartCondition ? '有' : '无'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-sm">高血压：</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      risk.highBloodPressure ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {risk.highBloodPressure ? '有' : '无'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600 text-sm">糖尿病：</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      risk.diabetes ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {risk.diabetes ? '有' : '无'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-sm">
                    <span className="text-gray-600">医生建议：</span>
                    <span className="ml-1 text-gray-800">{risk.doctorRecommendation}</span>
                  </div>
                  {risk.requiresGuardian && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-amber-700">
                      <AlertCircle size={14} />
                      <span>需要家属陪同</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!risk && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1 text-amber-700">
                <AlertTriangle size={16} />
                <span className="font-medium">该老人尚未完成健康风险评估</span>
              </div>
            </div>
          )}

          {!isPending && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>确认日期：{registration.healthConfirmationDate || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <UserCheck size={14} />
                <span>确认人：{getUserName(registration.confirmedBy)}</span>
              </div>
              {isRehab && risk && (
                <>
                  <div className="flex items-center gap-1">
                    <HandHeart size={14} className={risk.familyConfirmed ? 'text-green-600' : 'text-red-500'} />
                    <span className={risk.familyConfirmed ? 'text-green-700' : 'text-red-600'}>
                      已确认家属：{risk.familyConfirmed ? (risk.familyConfirmedBy || '是') : '否'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck size={14} className={risk.volunteerAssigned ? 'text-green-600' : 'text-red-500'} />
                    <span className={risk.volunteerAssigned ? 'text-green-700' : 'text-red-600'}>
                      已安排志愿者：{risk.volunteerAssigned ? (risk.volunteerName || '是') : '否'}
                    </span>
                  </div>
                  {risk.lastDoctorAdviceDate && (
                    <div className="flex items-center gap-1">
                      <Stethoscope size={14} className={isDoctorAdviceValid(risk.lastDoctorAdviceDate) ? 'text-green-600' : 'text-red-500'} />
                      <span>医生建议日期：{formatDate(risk.lastDoctorAdviceDate)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>

        {isPending && (
          <CardFooter className="flex flex-col gap-3">
            {isRehab && renderRehabCheckBadges(elder, registration.id, isPending)}
            {isRehab && renderRehabToggles(elder, registration.id)}
            <div className="flex gap-3 w-full">
              <Button
                variant="success"
                className="flex-1"
                onClick={() => handleConfirm(registration.id, elder, course)}
              >
                <CheckCircle size={16} />
                确认通过
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleFurtherAssessment(registration.id)}
              >
                <AlertTriangle size={16} />
                需要进一步评估
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
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
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'warning' && <AlertTriangle size={20} />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">健康风险确认</h1>
            <p className="text-amber-100 mt-1">审核报名老人的健康风险，确认是否可以参加课程</p>
          </div>
        </div>
      </div>

      <StatusLegend />

      <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'pending'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock size={20} />
            待确认
            {pendingRegistrations.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {pendingRegistrations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${
              activeTab === 'confirmed'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <CheckCircle size={20} />
            已确认
            {confirmedRegistrations.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {confirmedRegistrations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRegistrations.length === 0 ? (
            <Empty
              icon={<Clock size={48} />}
              title="暂无待确认记录"
              description="所有报名记录的健康风险都已确认完成"
            />
          ) : (
            pendingRegistrations.map(registration => renderRegistrationCard(registration, true))
          )}
        </div>
      )}

      {activeTab === 'confirmed' && (
        <div className="space-y-4">
          {confirmedRegistrations.length === 0 ? (
            <Empty
              icon={<CheckCircle size={48} />}
              title="暂无已确认记录"
              description="还没有已完成健康风险确认的报名记录"
            />
          ) : (
            confirmedRegistrations.map(registration => renderRegistrationCard(registration, false))
          )}
        </div>
      )}
    </div>
  )
}

export default HealthCheckPage
