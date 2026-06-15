import React, { useState } from 'react'
import {
  BookOpen,
  Users,
  Calendar,
  MapPin,
  Plus,
  Clock,
  User,
  Heart,
  AlertTriangle,
  X,
  Phone,
  Home,
  FileText,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card'
import { Button } from '../components/Button'
import { StatusBadge } from '../components/StatusBadge'
import type { CourseType, Elder } from '../types'

type TabType = 'courses' | 'elders' | 'teachers' | 'venues'

const courseTypeLabels: Record<CourseType, string> = {
  calligraphy: '书法',
  dance: '舞蹈',
  health: '健康',
  sports: '运动',
}

const courseTypeColors: Record<CourseType, string> = {
  calligraphy: 'bg-amber-100 text-amber-800',
  dance: 'bg-pink-100 text-pink-800',
  health: 'bg-green-100 text-green-800',
  sports: 'bg-blue-100 text-blue-800',
}

const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function SocialWorkerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('courses')
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [selectedElder, setSelectedElder] = useState<Elder | null>(null)
  const [newCourse, setNewCourse] = useState({
    name: '',
    type: 'calligraphy' as CourseType,
    description: '',
    levelId: 'l1',
    maxParticipants: 15,
    requiresHealthCheck: false,
  })

  const {
    courses,
    elders,
    teachers,
    venues,
    getLevelById,
    getTeacherById,
    getVenueById,
    addCourse,
    currentUser,
  } = useAppStore()

  const getCourseStatus = (status: string) => {
    switch (status) {
      case 'published':
        return { status: 'success' as const, label: '已发布' }
      case 'draft':
        return { status: 'pending' as const, label: '草稿' }
      case 'completed':
        return { status: 'info' as const, label: '已完成' }
      case 'cancelled':
        return { status: 'error' as const, label: '已取消' }
      default:
        return { status: 'pending' as const, label: status }
    }
  }

  const getElderHealthStatus = (elder: Elder) => {
    if (elder.isSuspended) {
      return { status: 'error' as const, label: '已暂停' }
    }
    if (elder.consecutiveAbsences >= 2) {
      return { status: 'warning' as const, label: '高风险' }
    }
    if (elder.consecutiveAbsences === 1) {
      return { status: 'warning' as const, label: '需关注' }
    }
    if (elder.riskAssessment?.fallRisk === 'high') {
      return { status: 'warning' as const, label: '需关注' }
    }
    return { status: 'success' as const, label: '正常' }
  }

  const getVenueStatus = (status: string) => {
    switch (status) {
      case 'available':
        return { status: 'success' as const, label: '可用' }
      case 'occupied':
        return { status: 'warning' as const, label: '使用中' }
      case 'maintenance':
        return { status: 'error' as const, label: '维护中' }
      default:
        return { status: 'pending' as const, label: status }
    }
  }

  const handleAddCourse = () => {
    if (!currentUser) return
    addCourse({
      ...newCourse,
      currentParticipants: 0,
      waitlistCount: 0,
      schedules: [],
      status: 'draft',
      createdBy: currentUser.id,
    })
    setShowAddCourse(false)
    setNewCourse({
      name: '',
      type: 'calligraphy',
      description: '',
      levelId: 'l1',
      maxParticipants: 15,
      requiresHealthCheck: false,
    })
  }

  const getTeacherSchedules = (teacherId: string) => {
    return courses.flatMap((course) =>
      course.schedules
        .filter((s) => s.teacherId === teacherId)
        .map((s) => ({ ...s, courseName: course.name }))
    )
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-900 mb-2">社工工作台</h1>
        <p className="text-amber-600">管理课程、老人档案、老师排班和场地资源</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-amber-200">
        {[
          { id: 'courses' as TabType, label: '课程管理', icon: BookOpen },
          { id: 'elders' as TabType, label: '老人档案', icon: Users },
          { id: 'teachers' as TabType, label: '老师排班', icon: Calendar },
          { id: 'venues' as TabType, label: '场地管理', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-amber-600 border-amber-600 bg-amber-50'
                  : 'text-amber-700 border-transparent hover:text-amber-600 hover:bg-amber-50/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'courses' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-amber-900">所有课程</h2>
            <Button onClick={() => setShowAddCourse(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增课程
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const level = getLevelById(course.levelId)
              const statusInfo = getCourseStatus(course.status)
              const schedule = course.schedules[0]
              const teacher = schedule ? getTeacherById(schedule.teacherId) : null
              const venue = schedule ? getVenueById(schedule.venueId) : null

              return (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${courseTypeColors[course.type]}`}
                        >
                          {courseTypeLabels[course.type]}
                        </span>
                        <CardTitle>{course.name}</CardTitle>
                      </div>
                      <StatusBadge status={statusInfo.status}>{statusInfo.label}</StatusBadge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-600 mb-4 line-clamp-2">{course.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-amber-500">课程等级</span>
                        <span className="text-amber-800">{level?.name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-500">报名人数</span>
                        <span className="text-amber-800">
                          {course.currentParticipants}/{course.maxParticipants}人
                          {course.waitlistCount > 0 && (
                            <span className="text-amber-500 ml-1">
                              (候补{course.waitlistCount}人)
                            </span>
                          )}
                        </span>
                      </div>
                      {schedule && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-amber-500">上课时间</span>
                            <span className="text-amber-800">
                              {dayLabels[schedule.dayOfWeek]} {schedule.startTime}-{schedule.endTime}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-500">授课老师</span>
                            <span className="text-amber-800">{teacher?.name || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-500">上课地点</span>
                            <span className="text-amber-800">{venue?.name || '-'}</span>
                          </div>
                        </>
                      )}
                      {course.requiresHealthCheck && (
                        <div className="flex items-center gap-1 text-amber-600 mt-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs">需要健康评估确认</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full bg-amber-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(course.currentParticipants / course.maxParticipants) * 100}%`,
                        }}
                      />
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'elders' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-amber-900">老人档案</h2>
            <div className="flex gap-2">
              <span className="text-sm text-amber-600">共 {elders.length} 位老人</span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">姓名</th>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">年龄</th>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">性别</th>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">联系电话</th>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">健康状态</th>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">连续缺勤</th>
                    <th className="text-left px-6 py-4 text-amber-800 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {elders.map((elder) => {
                    const healthStatus = getElderHealthStatus(elder)
                    return (
                      <tr
                        key={elder.id}
                        className="hover:bg-amber-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-amber-600" />
                            </div>
                            <span className="font-medium text-amber-900">{elder.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-amber-800">{elder.age}岁</td>
                        <td className="px-6 py-4 text-amber-800">
                          {elder.gender === 'male' ? '男' : '女'}
                        </td>
                        <td className="px-6 py-4 text-amber-800">{elder.phone}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={healthStatus.status}>
                            {healthStatus.label}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-medium ${
                              elder.consecutiveAbsences >= 2
                                ? 'text-red-600'
                                : elder.consecutiveAbsences === 1
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }`}
                          >
                            {elder.consecutiveAbsences}次
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedElder(elder)}
                          >
                            查看详情
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-amber-900">老师排班</h2>
            <span className="text-sm text-amber-600">共 {teachers.length} 位老师</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teachers.map((teacher) => {
              const schedules = getTeacherSchedules(teacher.id)
              return (
                <Card key={teacher.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                          <User className="w-7 h-7 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle>{teacher.name}</CardTitle>
                          <p className="text-sm text-amber-600">
                            {teacher.gender === 'male' ? '男' : '女'} · {teacher.age}岁
                          </p>
                        </div>
                      </div>
                      <StatusBadge
                        status={teacher.status === 'active' ? 'success' : 'error'}
                      >
                        {teacher.status === 'active' ? '在职' : '离职'}
                      </StatusBadge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-amber-500 mb-2">擅长领域</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.specialty.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-amber-500">联系电话</p>
                      <p className="text-amber-800">{teacher.phone}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-amber-500 mb-3">本周排班</p>
                    {schedules.length > 0 ? (
                      <div className="space-y-2">
                        {schedules.map((schedule) => {
                          const venue = getVenueById(schedule.venueId)
                          return (
                            <div
                              key={schedule.id}
                              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-amber-900">
                                  {schedule.courseName}
                                </p>
                                <p className="text-sm text-amber-600">
                                  {dayLabels[schedule.dayOfWeek]} {schedule.startTime}-
                                  {schedule.endTime}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-amber-700">{venue?.name}</p>
                                <p className="text-xs text-amber-500">{venue?.location}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-amber-400 text-sm">暂无排班</p>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'venues' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-amber-900">场地管理</h2>
            <span className="text-sm text-amber-600">共 {venues.length} 个场地</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {venues.map((venue) => {
              const statusInfo = getVenueStatus(venue.status)
              return (
                <Card key={venue.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle>{venue.name}</CardTitle>
                          <p className="text-sm text-amber-600">{venue.location}</p>
                        </div>
                      </div>
                      <StatusBadge status={statusInfo.status}>{statusInfo.label}</StatusBadge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-amber-500 mb-1">容纳人数</p>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-800 font-medium">{venue.capacity}人</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-amber-500 mb-1">设备数量</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-800 font-medium">
                            {venue.equipment.length}项
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-amber-500 mb-2">场地设备</p>
                      <div className="flex flex-wrap gap-2">
                        {venue.equipment.map((eq, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {showAddCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-amber-100">
              <h3 className="text-xl font-bold text-amber-900">新增课程</h3>
              <button
                onClick={() => setShowAddCourse(false)}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-amber-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  课程名称
                </label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="请输入课程名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    课程类型
                  </label>
                  <select
                    value={newCourse.type}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, type: e.target.value as CourseType })
                    }
                    className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="calligraphy">书法</option>
                    <option value="dance">舞蹈</option>
                    <option value="health">健康</option>
                    <option value="sports">运动</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2">
                    最大人数
                  </label>
                  <input
                    type="number"
                    value={newCourse.maxParticipants}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, maxParticipants: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  课程等级
                </label>
                <select
                  value={newCourse.levelId}
                  onChange={(e) => setNewCourse({ ...newCourse, levelId: e.target.value })}
                  className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="l1">入门级</option>
                  <option value="l2">进阶级</option>
                  <option value="l3">提高级</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  课程描述
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="请输入课程描述"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="healthCheck"
                  checked={newCourse.requiresHealthCheck}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, requiresHealthCheck: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="healthCheck" className="text-sm text-amber-800">
                  需要健康评估确认
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-amber-100">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowAddCourse(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddCourse}
                disabled={!newCourse.name}
              >
                创建课程
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedElder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-amber-100 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-amber-900">老人详情</h3>
              <button
                onClick={() => setSelectedElder(null)}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-amber-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-amber-900">{selectedElder.name}</h4>
                  <p className="text-amber-600">
                    {selectedElder.gender === 'male' ? '男' : '女'} · {selectedElder.age}岁
                  </p>
                  <StatusBadge
                    status={getElderHealthStatus(selectedElder).status}
                    className="mt-2"
                  >
                    {getElderHealthStatus(selectedElder).label}
                  </StatusBadge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="p-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-amber-500">联系电话</span>
                    </div>
                    <p className="text-amber-900 font-medium">{selectedElder.phone}</p>
                  </CardContent>
                </Card>
                <Card className="p-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Home className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-amber-500">家庭住址</span>
                    </div>
                    <p className="text-amber-900 font-medium">{selectedElder.address}</p>
                  </CardContent>
                </Card>
                <Card className="p-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-amber-500">身份证号</span>
                    </div>
                    <p className="text-amber-900 font-medium">{selectedElder.idCard}</p>
                  </CardContent>
                </Card>
                <Card className="p-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="text-sm text-amber-500">注册日期</span>
                    </div>
                    <p className="text-amber-900 font-medium">
                      {selectedElder.registrationDate}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {selectedElder.healthRecord && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    健康档案
                  </h5>
                  <Card className="p-0">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-amber-500">血压</p>
                          <p className="text-amber-900 font-medium">
                            {selectedElder.healthRecord.bloodPressure}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-amber-500">血糖</p>
                          <p className="text-amber-900 font-medium">
                            {selectedElder.healthRecord.bloodSugar}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-amber-500">心率</p>
                          <p className="text-amber-900 font-medium">
                            {selectedElder.healthRecord.heartRate}
                          </p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-amber-500 mb-2">慢性病</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedElder.healthRecord.chronicDiseases.length > 0 ? (
                            selectedElder.healthRecord.chronicDiseases.map((d, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                              >
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-400 text-sm">无</span>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm text-amber-500 mb-2">过敏史</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedElder.healthRecord.allergies.length > 0 ? (
                            selectedElder.healthRecord.allergies.map((a, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                              >
                                {a}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-400 text-sm">无</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-amber-500 mb-2">当前用药</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedElder.healthRecord.currentMedications.length > 0 ? (
                            selectedElder.healthRecord.currentMedications.map((m, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                              >
                                {m}
                              </span>
                            ))
                          ) : (
                            <span className="text-amber-400 text-sm">无</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedElder.riskAssessment && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    风险评估
                  </h5>
                  <Card className="p-0">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-amber-500 mb-2">跌倒风险</p>
                          <StatusBadge
                            status={
                              selectedElder.riskAssessment.fallRisk === 'low'
                                ? 'success'
                                : selectedElder.riskAssessment.fallRisk === 'medium'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {selectedElder.riskAssessment.fallRisk === 'low'
                              ? '低'
                              : selectedElder.riskAssessment.fallRisk === 'medium'
                              ? '中'
                              : '高'}
                          </StatusBadge>
                        </div>
                        <div>
                          <p className="text-sm text-amber-500 mb-2">运动能力</p>
                          <StatusBadge
                            status={
                              selectedElder.riskAssessment.exerciseTolerance === 'normal'
                                ? 'success'
                                : selectedElder.riskAssessment.exerciseTolerance === 'limited'
                                ? 'warning'
                                : 'error'
                            }
                          >
                            {selectedElder.riskAssessment.exerciseTolerance === 'normal'
                              ? '正常'
                              : selectedElder.riskAssessment.exerciseTolerance === 'limited'
                              ? '受限'
                              : '严重受限'}
                          </StatusBadge>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mb-4">
                        {selectedElder.riskAssessment.heartCondition && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                            心脏病
                          </span>
                        )}
                        {selectedElder.riskAssessment.highBloodPressure && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                            高血压
                          </span>
                        )}
                        {selectedElder.riskAssessment.diabetes && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            糖尿病
                          </span>
                        )}
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-500 mb-1">医生建议</p>
                        <p className="text-amber-800">
                          {selectedElder.riskAssessment.doctorRecommendation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div>
                <h5 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  紧急联系人
                </h5>
                <div className="space-y-3">
                  {selectedElder.emergencyContacts.map((contact, idx) => (
                    <Card key={idx} className="p-0">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-amber-900">{contact.name}</p>
                          <p className="text-sm text-amber-600">{contact.relationship}</p>
                        </div>
                        <p className="text-amber-800">{contact.phone}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-amber-100 sticky bottom-0 bg-white">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => setSelectedElder(null)}
              >
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
