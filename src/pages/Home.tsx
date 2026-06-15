import React, { useState } from 'react'
import { Heart, Users, UserCircle, ClipboardCheck, BarChart3, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useAppStore } from '../store'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import type { Elder, UserRole } from '../types'

interface RoleCard {
  role: UserRole
  title: string
  description: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
}

const roleCards: RoleCard[] = [
  {
    role: 'socialWorker',
    title: '社工工作台',
    description: '排课管理、老人档案、风险评估、场地管理',
    icon: <Users size={32} />,
    color: 'text-blue-600',
    bgColor: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
  },
  {
    role: 'elder',
    title: '老人报名端',
    description: '浏览课程、在线报名、查看我的课程',
    icon: <UserCircle size={32} />,
    color: 'text-amber-600',
    bgColor: 'from-amber-50 to-orange-100',
    borderColor: 'border-amber-200',
  },
  {
    role: 'teacher',
    title: '签到台',
    description: '课程签到、出勤管理、异常处理',
    icon: <ClipboardCheck size={32} />,
    color: 'text-green-600',
    bgColor: 'from-green-50 to-emerald-100',
    borderColor: 'border-green-200',
  },
  {
    role: 'director',
    title: '主任管理',
    description: '数据统计、缺勤管理、复课审批、督办',
    icon: <BarChart3 size={32} />,
    color: 'text-purple-600',
    bgColor: 'from-purple-50 to-violet-100',
    borderColor: 'border-purple-200',
  },
]

const roleUsers: Record<UserRole, { id: string; name: string }[]> = {
  socialWorker: [{ id: 'sw1', name: '社工小王' }],
  elder: [],
  teacher: [
    { id: 't1', name: '陈老师（书法）' },
    { id: 't2', name: '林老师（舞蹈）' },
    { id: 't3', name: '黄老师（太极）' },
    { id: 't4', name: '周医生（健康）' },
  ],
  director: [{ id: 'd1', name: '刘主任' }],
}

const Home: React.FC = () => {
  const { setCurrentUser, setCurrentPage, setCurrentElderId, elders, getStatistics } = useAppStore()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedElder, setSelectedElder] = useState<string | null>(null)

  const stats = getStatistics()

  const activeElders = elders.filter(e => e.status === 'active')

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setSelectedUser(null)
    setSelectedElder(null)
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId)
    if (selectedRole !== 'elder') {
      setSelectedElder(null)
    }
  }

  const handleElderSelect = (elderId: string) => {
    setSelectedElder(elderId)
  }

  const handleEnter = () => {
    if (!selectedRole) return

    let userId = selectedUser
    let elderId: string | null = selectedElder

    if (selectedRole === 'elder') {
      if (!selectedElder) return
      userId = selectedElder
      elderId = selectedElder
    } else {
      if (!selectedUser) return
    }

    const userList = selectedRole === 'elder' 
      ? elders.map(e => ({ id: e.id, name: e.name, role: 'elder' as UserRole, phone: e.phone }))
      : roleUsers[selectedRole].map(u => ({ ...u, role: selectedRole, phone: '' }))

    const user = userList.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
      setCurrentElderId(elderId)
      setCurrentPage(selectedRole === 'elder' ? 'elder' : selectedRole === 'director' ? 'director' : selectedRole === 'teacher' ? 'checkin' : 'socialWorker')
    }
  }

  const canEnter = () => {
    if (!selectedRole) return false
    if (selectedRole === 'elder') return !!selectedElder
    return !!selectedUser
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Heart size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">欢迎来到老人活动中心</h1>
            <p className="text-amber-100 mt-1">老有所学、老有所乐、老有所为</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{stats.totalCourses}</div>
            <div className="text-amber-100 text-sm">在开课程</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{stats.totalElders}</div>
            <div className="text-amber-100 text-sm">注册老人</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{stats.attendanceRate}%</div>
            <div className="text-amber-100 text-sm">今日出勤率</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="text-3xl font-bold">{stats.pendingApprovals}</div>
            <div className="text-amber-100 text-sm">待审批</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
          请选择您的身份进入系统
        </h2>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {roleCards.map((card) => (
            <Card
              key={card.role}
              className={`cursor-pointer border-2 transition-all duration-300 hover:shadow-xl ${
                selectedRole === card.role
                  ? `${card.borderColor} shadow-lg scale-[1.02]`
                  : 'border-transparent hover:border-amber-200'
              } bg-gradient-to-br ${card.bgColor}`}
              onClick={() => handleRoleSelect(card.role)}
            >
              <CardContent className="p-6">
                <div className={`${card.color} mb-3`}>{card.icon}</div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
                {selectedRole === card.role && (
                  <div className="mt-3 flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    已选择
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedRole && selectedRole === 'elder' && (
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 mb-6">
            <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
              <UserCircle size={20} />
              请选择老人身份
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {activeElders.map((elder: Elder) => (
                <button
                  key={elder.id}
                  onClick={() => handleElderSelect(elder.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedElder === elder.id
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      elder.isSuspended 
                        ? 'bg-gray-400' 
                        : 'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      {elder.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{elder.name}</div>
                      <div className="text-xs text-gray-500">{elder.age}岁</div>
                      {elder.isSuspended && (
                        <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle size={12} />
                          已暂停
                        </div>
                      )}
                    </div>
                    {selectedElder === elder.id && (
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedRole && selectedRole !== 'elder' && (
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 mb-6">
            <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
              <UserCircle size={20} />
              请选择账号
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {roleUsers[selectedRole].map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedUser === user.id
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-white">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{user.name}</div>
                    </div>
                    {selectedUser === user.id && (
                      <CheckCircle size={20} className="text-green-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {canEnter() && (
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleEnter}
              className="px-8 py-3 text-lg shadow-lg shadow-amber-200 hover:shadow-xl"
            >
              进入系统
              <ChevronRight size={20} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
