import React, { useState, useMemo } from 'react'
import {
  User,
  Users,
  MapPin,
  Dumbbell,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Info,
  ChevronRight,
  BookOpen,
  Calendar,
  FileText,
  Heart,
  ClipboardCheck,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronLeft,
  MessageSquare,
  Activity,
  Stethoscope,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import { Empty } from '../components/Empty'
import type { ReinstatementApproval, Elder, Course, Registration, Attendance, ReservedResource } from '../types'

type TabType = 'pending' | 'approved' | 'rejected'

interface ApprovalDetailModalProps {
  approval: ReinstatementApproval
  elder: Elder
  course: Course
  registrations: Registration[]
  attendances: Attendance[]
  onClose: () => void
  onApprove: (comments: string) => void
  onReject: (comments: string) => void
}

const statusTabLabels: Record<TabType, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
}

const statusTabColors: Record<TabType, string> = {
  pending: 'text-amber-600 border-amber-500 bg-amber-50',
  approved: 'text-green-600 border-green-500 bg-green-50',
  rejected: 'text-red-600 border-red-500 bg-red-50',
}

const approvalStatusMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'pending'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
}

const approvalStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
}

function calculateAttendanceStats(attendances: Attendance[]) {
  if (attendances.length === 0) {
    return { rate: 0, absentCount: 0, presentCount: 0, lateCount: 0, total: 0 }
  }
  const presentCount = attendances.filter(a => a.status === 'present').length
  const absentCount = attendances.filter(a => a.status === 'absent').length
  const lateCount = attendances.filter(a => a.status === 'late').length
  const rate = Math.round((presentCount / attendances.length) * 100)
  return { rate, absentCount, presentCount, lateCount, total: attendances.length }
}

function getHealthSummary(elder: Elder): string {
  const parts: string[] = []
  if (elder.healthRecord?.chronicDiseases?.length) {
    parts.push(`慢性病：${elder.healthRecord.chronicDiseases.join('、')}`)
  }
  if (elder.healthRecord?.bloodPressure) {
    parts.push(`血压：${elder.healthRecord.bloodPressure}`)
  }
  if (elder.healthRecord?.bloodSugar) {
    parts.push(`血糖：${elder.healthRecord.bloodSugar}`)
  }
  if (elder.riskAssessment?.fallRisk) {
    const fallRiskLabels: Record<string, string> = { low: '低', medium: '中', high: '高' }
    parts.push(`跌倒风险：${fallRiskLabels[elder.riskAssessment.fallRisk]}`)
  }
  if (elder.riskAssessment?.doctorRecommendation) {
    parts.push(`医生建议：${elder.riskAssessment.doctorRecommendation}`)
  }
  return parts.length > 0 ? parts.join(' | ') : '暂无健康档案信息'
}

function calculatePreservedResourceCount(preservedResources?: ReservedResource): number {
  if (!preservedResources) return 0
  let count = 0
  if (preservedResources.equipmentIds?.length) {
    count += preservedResources.equipmentIds.length
  }
  if (preservedResources.venueTimeSlot) {
    count += 1
  }
  return count
}

function hasLockedResources(approval: ReinstatementApproval): boolean {
  if (approval.preservedWaitlistPosition !== undefined && approval.preservedWaitlistPosition > 0) {
    return true
  }
  return calculatePreservedResourceCount(approval.preservedResources) > 0
}

const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  approval,
  elder,
  course,
  registrations,
  attendances,
  onClose,
  onApprove,
  onReject,
}) => {
  const [comments, setComments] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)

  const attendanceStats = calculateAttendanceStats(attendances)
  const healthSummary = getHealthSummary(elder)

  const preservedResourceCount = calculatePreservedResourceCount(approval.preservedResources)
  const hasWaitlistProtection = approval.preservedWaitlistPosition !== undefined && approval.preservedWaitlistPosition > 0
  const hasResourceProtection = preservedResourceCount > 0
  const totalLockedCount = preservedResourceCount + (hasWaitlistProtection ? 1 : 0)

  const equipmentIds = approval.preservedResources?.equipmentIds ?? []
  const venueTimeSlot = approval.preservedResources?.venueTimeSlot

  const equipmentList = useMemo(() => {
    const { getEquipmentById } = useAppStore.getState()
    return equipmentIds.map(id => getEquipmentById(id))
  }, [equipmentIds])

  const venueName = useMemo(() => {
    if (!venueTimeSlot) return null
    const { getVenueById } = useAppStore.getState()
    return getVenueById(venueTimeSlot.venueId)
  }, [venueTimeSlot])

  const handleApproveClick = () => {
    if (hasLockedResources(approval)) {
      setShowApproveConfirm(true)
    } else {
      onApprove(comments)
    }
  }

  const confirmApprove = () => {
    setShowApproveConfirm(false)
    onApprove(comments)
  }

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }
    if (!rejectReason.trim()) {
      return
    }
    onReject(rejectReason)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              <h2 className="text-2xl font-bold">复课申请审批</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-amber-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-amber-900">{elder.name}</h3>
                <StatusBadge status={approvalStatusMap[approval.status]}>
                  {approvalStatusLabels[approval.status]}
                </StatusBadge>
                {hasLockedResources(approval) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                    <Lock className="w-3 h-3" />
                    保护锁定中
                  </span>
                )}
              </div>
              <p className="text-amber-700">
                {elder.gender === 'female' ? '女' : '男'}，{elder.age}岁
              </p>
              <p className="text-amber-600 text-sm mt-1">联系电话：{elder.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-amber-50">
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">原课程</span>
                </div>
                <p className="text-amber-800">{course.name}</p>
                <p className="text-sm text-amber-600 mt-1">课程类型：{course.type}</p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50">
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">申请日期</span>
                </div>
                <p className="text-amber-800">{approval.applicationDate}</p>
                <p className="text-sm text-amber-600 mt-1">
                  申请编号：{approval.id}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-slate-50 to-amber-50 border-slate-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-lg text-slate-800">保护机制锁定状态</CardTitle>
                {totalLockedCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-medium">
                    已锁定 {totalLockedCount} 项
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className={`${hasWaitlistProtection ? 'bg-white border-amber-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasWaitlistProtection ? 'bg-amber-100' : 'bg-gray-200'}`}>
                        <Users className={`w-4 h-4 ${hasWaitlistProtection ? 'text-amber-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${hasWaitlistProtection ? 'text-amber-900' : 'text-gray-500'}`}>候补顺位保护</span>
                    </div>
                    {hasWaitlistProtection ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-1">
                          <Lock className="w-4 h-4 text-amber-500" />
                          <span className="text-2xl font-bold text-amber-700">第{approval.preservedWaitlistPosition}位</span>
                        </div>
                        <p className="text-xs text-amber-600 mt-1">审批期间顺位保持不变</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">无候补顺位</p>
                    )}
                  </CardContent>
                </Card>

                <Card className={`${equipmentIds.length > 0 ? 'bg-white border-green-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${equipmentIds.length > 0 ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <Dumbbell className={`w-4 h-4 ${equipmentIds.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${equipmentIds.length > 0 ? 'text-green-900' : 'text-gray-500'}`}>器材占用保护</span>
                    </div>
                    {equipmentIds.length > 0 ? (
                      <div className="mt-2 space-y-1">
                        {equipmentList.map((eq, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-sm">
                            <Lock className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="text-green-700 truncate">
                              {eq ? eq.name : equipmentIds[idx]}
                            </span>
                          </div>
                        ))}
                        <p className="text-xs text-green-600 mt-1">共 {equipmentIds.length} 项器材</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">无需特殊器材</p>
                    )}
                  </CardContent>
                </Card>

                <Card className={`${venueTimeSlot ? 'bg-white border-blue-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${venueTimeSlot ? 'bg-blue-100' : 'bg-gray-200'}`}>
                        <MapPin className={`w-4 h-4 ${venueTimeSlot ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <span className={`text-sm font-medium ${venueTimeSlot ? 'text-blue-900' : 'text-gray-500'}`}>场地时间保护</span>
                    </div>
                    {venueTimeSlot ? (
                      <div className="mt-2">
                        <div className="flex items-start gap-1 text-sm">
                          <Lock className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-700">
                            {venueName ? venueName.name : venueTimeSlot.venueId}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          周{['日','一','二','三','四','五','六'][venueTimeSlot.dayOfWeek]} {venueTimeSlot.startTime}-{venueTimeSlot.endTime}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">无需场地预留</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {!hasWaitlistProtection && !hasResourceProtection && (
                <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-gray-300 text-center">
                  <Unlock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">无需特殊资源</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <CardTitle className="text-lg">暂停原因</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">{elder.suspensionReason || '无'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg">申请理由</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">{approval.reason}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">历史出勤情况</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.rate}%</p>
                  <p className="text-sm text-green-700">出勤率</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</p>
                  <p className="text-sm text-red-700">缺勤次数</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{attendanceStats.presentCount}</p>
                  <p className="text-sm text-blue-700">出勤次数</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{attendanceStats.lateCount}</p>
                  <p className="text-sm text-amber-700">迟到次数</p>
                </div>
              </div>
              <p className="text-sm text-amber-600 mt-4">
                共 {attendanceStats.total} 次考勤记录
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">健康档案摘要</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">{healthSummary}</p>
              {elder.healthRecord?.lastCheckupDate && (
                <p className="text-sm text-amber-600 mt-2">
                  上次体检日期：{elder.healthRecord.lastCheckupDate}
                </p>
              )}
            </CardContent>
          </Card>

          {approval.status === 'pending' && (
            <>
              <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-lg">审批意见</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={showRejectInput ? rejectReason : comments}
                    onChange={(e) => showRejectInput ? setRejectReason(e.target.value) : setComments(e.target.value)}
                    placeholder={showRejectInput ? '请填写拒绝原因（必填）' : '请填写审批意见（选填）'}
                    className="w-full p-3 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {showRejectInput && !rejectReason.trim() && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  请填写拒绝原因
                </p>
              )}
            </>
          )}

          {approval.status !== 'pending' && approval.reviewComments && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-lg">审批意见</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-amber-800">{approval.reviewComments}</p>
                <p className="text-sm text-amber-600 mt-2">
                  审批人：{approval.reviewerId} | 审批日期：{approval.reviewDate}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {approval.status === 'pending' && (
          <div className="p-6 border-t border-amber-100 bg-amber-50">
            {showApproveConfirm ? (
              <div className="space-y-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">确认批准复课？</p>
                        <p className="text-sm text-green-700 mt-1">
                          批准后将释放 {totalLockedCount} 项资源占用保护，
                          并恢复学员 {hasWaitlistProtection ? `候补顺位第${approval.preservedWaitlistPosition}位` : '正常在读'} 状态
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex gap-4">
                  <Button
                    variant="success"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={confirmApprove}
                  >
                    <CheckCircle className="w-5 h-5" />
                    确认批准
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => setShowApproveConfirm(false)}
                  >
                    <X className="w-5 h-5" />
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex gap-4 mb-3">
                  <Button
                    variant="success"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={handleApproveClick}
                  >
                    <CheckCircle className="w-5 h-5" />
                    批准复课
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={handleReject}
                  >
                    <XCircle className="w-5 h-5" />
                    {showRejectInput ? '确认拒绝' : '拒绝申请'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-xs text-green-700 flex items-start gap-1">
                    <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    批准后自动释放锁定资源并恢复正常状态
                  </p>
                  <p className="text-xs text-red-700 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    拒绝后释放锁定资源，学员需重新排队候补
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {approval.status !== 'pending' && (
          <div className="p-6 border-t border-amber-100 bg-gray-50">
            <Button
              variant="secondary"
              className="w-full flex items-center justify-center gap-2"
              onClick={onClose}
            >
              <ChevronLeft className="w-5 h-5" />
              返回列表
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ReinstatementCardProps {
  approval: ReinstatementApproval
  onView: () => void
}

const ReinstatementCard: React.FC<ReinstatementCardProps> = ({ approval, onView }) => {
  const { getElderById, getCourseById, getRegistrationsByElder, attendances } = useAppStore()

  const elder = getElderById(approval.elderId)
  const course = getCourseById(approval.courseId)
  const registrations = getRegistrationsByElder(approval.elderId)
  const elderAttendances = attendances.filter(a => a.elderId === approval.elderId)
  const attendanceStats = calculateAttendanceStats(elderAttendances)

  const preservedResourceCount = calculatePreservedResourceCount(approval.preservedResources)
  const hasWaitlist = approval.preservedWaitlistPosition !== undefined && approval.preservedWaitlistPosition > 0
  const showLockIcon = hasLockedResources(approval)

  if (!elder || !course) return null

  return (
    <Card onClick={onView} className="cursor-pointer group hover:shadow-xl relative overflow-hidden">
      {showLockIcon && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shadow-sm">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      )}
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
            <User className="w-8 h-8 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0 pr-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-amber-900">{elder.name}</h3>
                <span className="text-amber-600">{elder.age}岁</span>
              </div>
              <StatusBadge status={approvalStatusMap[approval.status]}>
                {approvalStatusLabels[approval.status]}
              </StatusBadge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-amber-700">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>原课程：{course.name}</span>
              </div>
              {hasWaitlist && (
                <div className="flex items-center gap-2 text-amber-700">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>
                    原候补顺位：<span className="font-medium text-amber-800">第{approval.preservedWaitlistPosition}位</span>
                  </span>
                </div>
              )}
              {preservedResourceCount > 0 && (
                <div className="flex items-center gap-2 text-amber-700">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>
                    锁定资源：<span className="font-medium text-green-700">{preservedResourceCount} 项</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="truncate">暂停原因：{elder.suspensionReason || '无'}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700">
                <FileText className="w-4 h-4 text-amber-500" />
                <span className="truncate">申请理由：{approval.reason}</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>申请日期：{approval.applicationDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-amber-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700 font-medium">
                  出勤率 {attendanceStats.rate}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-600">
                  缺勤 {attendanceStats.absentCount} 次
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-600">
                  {elder.healthRecord?.chronicDiseases?.length || 0} 项慢性病
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-amber-500 group-hover:translate-x-1 transition-transform">
                <span className="text-xs">查看详情</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReinstatementPage() {
  const {
    reinstatementApprovals,
    getElderById,
    getCourseById,
    getRegistrationsByElder,
    attendances,
    approveReinstatement,
    rejectReinstatement,
    currentUser,
    setCurrentPage,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [selectedApproval, setSelectedApproval] = useState<ReinstatementApproval | null>(null)

  const filteredApprovals = useMemo(() => {
    return reinstatementApprovals.filter(a => a.status === activeTab)
  }, [reinstatementApprovals, activeTab])

  const tabs: TabType[] = ['pending', 'approved', 'rejected']

  const handleApprove = (comments: string) => {
    if (!selectedApproval || !currentUser) return
    approveReinstatement(selectedApproval.id, currentUser.id, comments)
    setSelectedApproval(null)
  }

  const handleReject = (comments: string) => {
    if (!selectedApproval || !currentUser) return
    rejectReinstatement(selectedApproval.id, currentUser.id, comments)
    setSelectedApproval(null)
  }

  const handleCloseModal = () => {
    setSelectedApproval(null)
  }

  const selectedApprovalData = selectedApproval ? {
    approval: selectedApproval,
    elder: getElderById(selectedApproval.elderId)!,
    course: getCourseById(selectedApproval.courseId)!,
    registrations: getRegistrationsByElder(selectedApproval.elderId),
    attendances: attendances.filter(a => a.elderId === selectedApproval.elderId),
  } : null

  const pendingCount = reinstatementApprovals.filter(a => a.status === 'pending').length
  const approvedCount = reinstatementApprovals.filter(a => a.status === 'approved').length
  const rejectedCount = reinstatementApprovals.filter(a => a.status === 'rejected').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage('director')}
            className="p-2 hover:bg-amber-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-amber-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-amber-900">复课审批</h1>
            <p className="text-amber-600 mt-1">审核学员的复课申请</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <StatusBadge status="warning" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {pendingCount} 条待处理
          </StatusBadge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              activeTab === tab
                ? statusTabColors[tab]
                : 'bg-white border-gray-200 text-gray-500 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="text-2xl font-bold">
              {tab === 'pending' ? pendingCount : tab === 'approved' ? approvedCount : rejectedCount}
            </div>
            <div className="text-sm mt-1">{statusTabLabels[tab]}</div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Empty
            icon={<ClipboardCheck size={48} className="text-amber-400" />}
            title={`暂无${statusTabLabels[activeTab]}的申请`}
            description={activeTab === 'pending' ? '所有申请都已处理完毕' : '暂无历史记录'}
          />
        ) : (
          filteredApprovals.map((approval) => (
            <ReinstatementCard
              key={approval.id}
              approval={approval}
              onView={() => setSelectedApproval(approval)}
            />
          ))
        )}
      </div>

      {selectedApprovalData && (
        <ApprovalDetailModal
          {...selectedApprovalData}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
