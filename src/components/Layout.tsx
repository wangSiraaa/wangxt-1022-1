import React from 'react'
import {
  Home,
  Users,
  UserCircle,
  ClipboardCheck,
  BarChart3,
  Heart,
  ListOrdered,
  AlertTriangle,
  FileCheck,
  PieChart,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '../store'
import { Button } from './Button'
import type { PageType, UserRole } from '../types'

interface LayoutProps {
  children: React.ReactNode
}

interface NavItem {
  page: PageType
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { page: 'home', label: '首页', icon: <Home size={20} />, roles: ['socialWorker', 'elder', 'teacher', 'director'] },
  { page: 'socialWorker', label: '社工工作台', icon: <Users size={20} />, roles: ['socialWorker'] },
  { page: 'elder', label: '老人报名端', icon: <UserCircle size={20} />, roles: ['elder'] },
  { page: 'checkin', label: '签到台', icon: <ClipboardCheck size={20} />, roles: ['teacher', 'socialWorker'] },
  { page: 'healthCheck', label: '健康确认', icon: <Heart size={20} />, roles: ['socialWorker'] },
  { page: 'waitlist', label: '候补队列', icon: <ListOrdered size={20} />, roles: ['socialWorker', 'director'] },
  { page: 'absentList', label: '缺勤红榜', icon: <AlertTriangle size={20} />, roles: ['socialWorker', 'director'] },
  { page: 'reinstatement', label: '复课审批', icon: <FileCheck size={20} />, roles: ['director'] },
  { page: 'statistics', label: '统计审计', icon: <PieChart size={20} />, roles: ['director'] },
  { page: 'director', label: '主任管理', icon: <BarChart3 size={20} />, roles: ['director'] },
]

const roleNames: Record<UserRole, string> = {
  socialWorker: '社工',
  elder: '老人',
  teacher: '老师',
  director: '主任',
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, currentPage, setCurrentPage, setCurrentUser, setCurrentElderId, currentElderId, getCurrentElder } = useAppStore()
  const currentElder = getCurrentElder()

  const handleLogout = () => {
    setCurrentUser(null)
    setCurrentElderId(null)
    setCurrentPage('home')
  }

  const filteredNavItems = navItems.filter(
    (item) => !currentUser || item.roles.includes(currentUser.role)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <header className="bg-white shadow-md border-b border-amber-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-800">老人活动中心</h1>
              <p className="text-xs text-amber-600">课程报名管理系统</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <UserCircle size={20} className="text-amber-600" />
                <div className="text-sm">
                  <span className="font-medium text-amber-800">{currentUser.name}</span>
                  <span className="text-amber-500 ml-2">({roleNames[currentUser.role]})</span>
                </div>
                {currentElder && currentUser.role === 'elder' && (
                  <div className="ml-2 pl-2 border-l border-amber-200 text-sm text-amber-700">
                    当前老人：{currentElder.name}
                  </div>
                )}
              </div>
            )}
            {currentUser && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-amber-700 hover:text-amber-900">
                <LogOut size={16} />
                退出
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {currentUser && filteredNavItems.length > 1 && (
          <aside className="w-56 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-lg border border-amber-100 p-3 sticky top-24">
              <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider px-3 py-2">
                功能导航
              </h3>
              <ul className="space-y-1">
                {filteredNavItems.map((item) => (
                  <li key={item.page}>
                    <button
                      onClick={() => setCurrentPage(item.page)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        currentPage === item.page
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200'
                          : 'text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium text-sm">{item.label}</span>
                      {currentPage === item.page && (
                        <ChevronRight size={16} className="ml-auto" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
