import { create } from 'zustand'
import type {
  Elder,
  Teacher,
  Venue,
  Course,
  CourseSchedule,
  CourseLevel,
  Registration,
  Attendance,
  ReinstatementApproval,
  WaitlistItem,
  Statistics,
  User,
  UserRole,
  HealthRecord,
  RiskAssessment,
  PageType,
} from '../types'

interface AppState {
  currentUser: User | null
  currentPage: PageType
  currentElderId: string | null
  elders: Elder[]
  teachers: Teacher[]
  venues: Venue[]
  courses: Course[]
  courseLevels: CourseLevel[]
  registrations: Registration[]
  attendances: Attendance[]
  reinstatementApprovals: ReinstatementApproval[]
  waitlistItems: WaitlistItem[]
  users: User[]
  setCurrentUser: (user: User | null) => void
  setCurrentPage: (page: PageType) => void
  setCurrentElderId: (id: string | null) => void
  addCourse: (course: Omit<Course, 'id' | 'createdAt'>) => void
  updateCourse: (id: string, course: Partial<Course>) => void
  addElder: (elder: Omit<Elder, 'id' | 'registrationDate'>) => void
  updateElder: (id: string, elder: Partial<Elder>) => void
  updateHealthRecord: (elderId: string, record: HealthRecord) => void
  updateRiskAssessment: (elderId: string, assessment: RiskAssessment) => void
  registerCourse: (elderId: string, courseId: string) => { success: boolean; message: string }
  confirmHealthCheck: (registrationId: string, socialWorkerId: string) => void
  checkIn: (registrationId: string, scheduleId: string, date: string, status: 'present' | 'absent' | 'late' | 'exception', notes?: string) => { success: boolean; message: string }
  approveReinstatement: (approvalId: string, reviewerId: string, comments: string) => void
  rejectReinstatement: (approvalId: string, reviewerId: string, comments: string) => void
  applyReinstatement: (elderId: string, courseId: string, registrationId: string, reason: string, applicantId: string) => void
  promoteWaitlist: (courseId: string) => void
  removeWaitlist: (waitlistId: string) => void
  markWaitlistNotified: (waitlistId: string) => void
  getStatistics: () => Statistics
  getElderById: (id: string) => Elder | undefined
  getCourseById: (id: string) => Course | undefined
  getTeacherById: (id: string) => Teacher | undefined
  getVenueById: (id: string) => Venue | undefined
  getLevelById: (id: string) => CourseLevel | undefined
  getRegistrationsByElder: (elderId: string) => Registration[]
  getRegistrationsByCourse: (courseId: string) => Registration[]
  getAttendancesByCourseAndDate: (courseId: string, date: string) => Attendance[]
  getSuspendedElders: () => Elder[]
  getTodayExceptions: () => Attendance[]
  getCurrentElder: () => Elder | undefined
}

const mockElders: Elder[] = [
  {
    id: 'e1',
    name: '张爷爷',
    gender: 'male',
    age: 72,
    phone: '13800138001',
    address: '幸福小区1号楼',
    idCard: '110101195201011234',
    emergencyContacts: [{ name: '张小明', relationship: '儿子', phone: '13900139001' }],
    registrationDate: '2024-01-15',
    status: 'active',
    consecutiveAbsences: 0,
    isSuspended: false,
    healthRecord: {
      elderId: 'e1',
      chronicDiseases: ['高血压'],
      allergies: ['青霉素'],
      currentMedications: ['降压药'],
      lastCheckupDate: '2025-05-10',
      bloodPressure: '140/90',
      bloodSugar: '6.5',
      heartRate: '72',
      notes: '血压控制良好',
    },
    riskAssessment: {
      elderId: 'e1',
      assessmentDate: '2025-05-10',
      fallRisk: 'low',
      exerciseTolerance: 'normal',
      heartCondition: false,
      highBloodPressure: true,
      diabetes: false,
      doctorRecommendation: '可以参加低强度运动，避免剧烈活动',
      canParticipateSports: true,
      requiresGuardian: false,
    },
  },
  {
    id: 'e2',
    name: '李奶奶',
    gender: 'female',
    age: 68,
    phone: '13800138002',
    address: '幸福小区2号楼',
    idCard: '110101195606152345',
    emergencyContacts: [{ name: '李小红', relationship: '女儿', phone: '13900139002' }],
    registrationDate: '2024-02-20',
    status: 'active',
    consecutiveAbsences: 2,
    isSuspended: true,
    suspensionReason: '连续缺勤两次',
    healthRecord: {
      elderId: 'e2',
      chronicDiseases: ['糖尿病', '关节炎'],
      allergies: [],
      currentMedications: ['二甲双胍', '钙片'],
      lastCheckupDate: '2025-04-20',
      bloodPressure: '130/80',
      bloodSugar: '7.8',
      heartRate: '68',
      notes: '血糖需要定期监测',
    },
    riskAssessment: {
      elderId: 'e2',
      assessmentDate: '2025-04-20',
      fallRisk: 'medium',
      exerciseTolerance: 'limited',
      heartCondition: false,
      highBloodPressure: false,
      diabetes: true,
      doctorRecommendation: '建议参加温和运动，需要家属陪同',
      canParticipateSports: true,
      requiresGuardian: true,
    },
  },
  {
    id: 'e3',
    name: '王爷爷',
    gender: 'male',
    age: 75,
    phone: '13800138003',
    address: '幸福小区3号楼',
    idCard: '110101194903203456',
    emergencyContacts: [{ name: '王大伟', relationship: '儿子', phone: '13900139003' }],
    registrationDate: '2024-03-10',
    status: 'active',
    consecutiveAbsences: 0,
    isSuspended: false,
    healthRecord: {
      elderId: 'e3',
      chronicDiseases: ['冠心病'],
      allergies: [],
      currentMedications: ['阿司匹林', '他汀类'],
      lastCheckupDate: '2025-06-01',
      bloodPressure: '135/85',
      bloodSugar: '5.8',
      heartRate: '75',
      notes: '心脏功能一般，避免剧烈运动',
    },
    riskAssessment: {
      elderId: 'e3',
      assessmentDate: '2025-06-01',
      fallRisk: 'medium',
      exerciseTolerance: 'severelyLimited',
      heartCondition: true,
      highBloodPressure: true,
      diabetes: false,
      doctorRecommendation: '不建议参加运动类课程，可参加书法等静态课程',
      canParticipateSports: false,
      requiresGuardian: true,
    },
  },
  {
    id: 'e4',
    name: '赵奶奶',
    gender: 'female',
    age: 65,
    phone: '13800138004',
    address: '阳光小区1号楼',
    idCard: '110101195908104567',
    emergencyContacts: [{ name: '赵小刚', relationship: '儿子', phone: '13900139004' }],
    registrationDate: '2024-05-01',
    status: 'active',
    consecutiveAbsences: 1,
    isSuspended: false,
    healthRecord: {
      elderId: 'e4',
      chronicDiseases: [],
      allergies: ['海鲜'],
      currentMedications: ['维生素D'],
      lastCheckupDate: '2025-05-15',
      bloodPressure: '120/80',
      bloodSugar: '5.5',
      heartRate: '70',
      notes: '身体健康',
    },
    riskAssessment: {
      elderId: 'e4',
      assessmentDate: '2025-05-15',
      fallRisk: 'low',
      exerciseTolerance: 'normal',
      heartCondition: false,
      highBloodPressure: false,
      diabetes: false,
      doctorRecommendation: '可以参加各类课程',
      canParticipateSports: true,
      requiresGuardian: false,
    },
  },
  {
    id: 'e5',
    name: '刘爷爷',
    gender: 'male',
    age: 70,
    phone: '13800138005',
    address: '阳光小区2号楼',
    idCard: '110101195411255678',
    emergencyContacts: [{ name: '刘芳', relationship: '女儿', phone: '13900139005' }],
    registrationDate: '2024-06-15',
    status: 'active',
    consecutiveAbsences: 0,
    isSuspended: false,
    healthRecord: {
      elderId: 'e5',
      chronicDiseases: ['高血脂'],
      allergies: [],
      currentMedications: ['他汀类'],
      lastCheckupDate: '2025-05-20',
      bloodPressure: '125/80',
      bloodSugar: '5.9',
      heartRate: '72',
      notes: '血脂偏高，建议多运动',
    },
    riskAssessment: {
      elderId: 'e5',
      assessmentDate: '2025-05-20',
      fallRisk: 'low',
      exerciseTolerance: 'normal',
      heartCondition: false,
      highBloodPressure: false,
      diabetes: false,
      doctorRecommendation: '可以参加各类运动课程',
      canParticipateSports: true,
      requiresGuardian: false,
    },
  },
]

const mockTeachers: Teacher[] = [
  {
    id: 't1',
    name: '陈老师',
    gender: 'female',
    age: 45,
    phone: '13700137001',
    specialty: ['书法', '国画'],
    status: 'active',
  },
  {
    id: 't2',
    name: '林老师',
    gender: 'female',
    age: 38,
    phone: '13700137002',
    specialty: ['舞蹈', '瑜伽'],
    status: 'active',
  },
  {
    id: 't3',
    name: '黄老师',
    gender: 'male',
    age: 50,
    phone: '13700137003',
    specialty: ['太极拳', '健身'],
    status: 'active',
  },
  {
    id: 't4',
    name: '周医生',
    gender: 'male',
    age: 55,
    phone: '13700137004',
    specialty: ['健康讲座', '中医养生'],
    status: 'active',
  },
]

const mockVenues: Venue[] = [
  {
    id: 'v1',
    name: '多功能活动室',
    capacity: 30,
    equipment: ['音响', '投影仪', '桌椅'],
    location: '一楼东侧',
    status: 'available',
  },
  {
    id: 'v2',
    name: '舞蹈室',
    capacity: 20,
    equipment: ['把杆', '镜子', '地板胶'],
    location: '二楼南侧',
    status: 'available',
  },
  {
    id: 'v3',
    name: '书法室',
    capacity: 15,
    equipment: ['书画桌', '毛毡', '文房四宝'],
    location: '二楼北侧',
    status: 'available',
  },
  {
    id: 'v4',
    name: '健身房',
    capacity: 10,
    equipment: ['跑步机', '椭圆机', '哑铃'],
    location: '一楼西侧',
    status: 'available',
  },
]

const mockCourseLevels: CourseLevel[] = [
  {
    id: 'l1',
    name: '入门级',
    description: '适合零基础学员',
    minAge: 55,
    maxAge: 90,
    requiredPhysicalCondition: '无特殊要求',
  },
  {
    id: 'l2',
    name: '进阶级',
    description: '适合有一定基础的学员',
    minAge: 55,
    maxAge: 80,
    requiredPhysicalCondition: '身体健康，能适应中等强度活动',
  },
  {
    id: 'l3',
    name: '提高级',
    description: '适合基础较好的学员',
    minAge: 55,
    maxAge: 75,
    requiredPhysicalCondition: '身体健康，能适应较大强度活动',
  },
]

const mockSchedules: CourseSchedule[] = [
  {
    id: 's1',
    courseId: 'c1',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    teacherId: 't1',
    venueId: 'v3',
    startDate: '2025-06-02',
    endDate: '2025-12-29',
  },
  {
    id: 's2',
    courseId: 'c1',
    dayOfWeek: 3,
    startTime: '09:00',
    endTime: '10:30',
    teacherId: 't1',
    venueId: 'v3',
    startDate: '2025-06-04',
    endDate: '2025-12-31',
  },
  {
    id: 's3',
    courseId: 'c2',
    dayOfWeek: 2,
    startTime: '14:00',
    endTime: '15:30',
    teacherId: 't2',
    venueId: 'v2',
    startDate: '2025-06-03',
    endDate: '2025-12-30',
  },
  {
    id: 's4',
    courseId: 'c2',
    dayOfWeek: 4,
    startTime: '14:00',
    endTime: '15:30',
    teacherId: 't2',
    venueId: 'v2',
    startDate: '2025-06-05',
    endDate: '2026-01-02',
  },
  {
    id: 's5',
    courseId: 'c3',
    dayOfWeek: 1,
    startTime: '14:00',
    endTime: '15:30',
    teacherId: 't3',
    venueId: 'v1',
    startDate: '2025-06-02',
    endDate: '2025-12-29',
  },
  {
    id: 's6',
    courseId: 'c3',
    dayOfWeek: 5,
    startTime: '09:00',
    endTime: '10:30',
    teacherId: 't3',
    venueId: 'v1',
    startDate: '2025-06-06',
    endDate: '2026-01-03',
  },
  {
    id: 's7',
    courseId: 'c4',
    dayOfWeek: 2,
    startTime: '09:00',
    endTime: '10:30',
    teacherId: 't4',
    venueId: 'v1',
    startDate: '2025-06-03',
    endDate: '2025-12-30',
  },
  {
    id: 's8',
    courseId: 'c4',
    dayOfWeek: 4,
    startTime: '09:00',
    endTime: '10:30',
    teacherId: 't4',
    venueId: 'v1',
    startDate: '2025-06-05',
    endDate: '2026-01-02',
  },
]

const mockCourses: Course[] = [
  {
    id: 'c1',
    name: '书法基础班',
    type: 'calligraphy',
    description: '学习楷书、行书基础，适合零基础老人',
    levelId: 'l1',
    maxParticipants: 15,
    currentParticipants: 15,
    waitlistCount: 3,
    requiresHealthCheck: false,
    schedules: mockSchedules.filter(s => s.courseId === 'c1'),
    status: 'published',
    createdBy: 'sw1',
    createdAt: '2025-05-20',
  },
  {
    id: 'c2',
    name: '老年广场舞',
    type: 'dance',
    description: '学习广场舞基础动作，锻炼身体协调性',
    levelId: 'l1',
    maxParticipants: 20,
    currentParticipants: 18,
    waitlistCount: 0,
    requiresHealthCheck: true,
    schedules: mockSchedules.filter(s => s.courseId === 'c2'),
    status: 'published',
    createdBy: 'sw1',
    createdAt: '2025-05-22',
  },
  {
    id: 'c3',
    name: '二十四式太极拳',
    type: 'sports',
    description: '学习传统太极拳，强身健体。运动类课程需确认健康风险。',
    levelId: 'l1',
    maxParticipants: 10,
    currentParticipants: 10,
    waitlistCount: 5,
    requiresHealthCheck: true,
    schedules: mockSchedules.filter(s => s.courseId === 'c3'),
    status: 'published',
    createdBy: 'sw1',
    createdAt: '2025-05-25',
  },
  {
    id: 'c4',
    name: '健康养生讲座',
    type: 'health',
    description: '每周健康知识讲座，包括饮食、运动、常见疾病预防',
    levelId: 'l1',
    maxParticipants: 30,
    currentParticipants: 25,
    waitlistCount: 0,
    requiresHealthCheck: false,
    schedules: mockSchedules.filter(s => s.courseId === 'c4'),
    status: 'published',
    createdBy: 'sw1',
    createdAt: '2025-05-28',
  },
]

const mockRegistrations: Registration[] = [
  {
    id: 'r1',
    elderId: 'e1',
    courseId: 'c1',
    status: 'confirmed',
    healthConfirmed: true,
    healthConfirmationDate: '2025-05-25',
    confirmedBy: 'sw1',
    registrationDate: '2025-05-25',
  },
  {
    id: 'r2',
    elderId: 'e2',
    courseId: 'c1',
    status: 'suspended',
    healthConfirmed: true,
    healthConfirmationDate: '2025-05-25',
    confirmedBy: 'sw1',
    registrationDate: '2025-05-25',
    suspensionReason: '连续缺勤两次',
  },
  {
    id: 'r3',
    elderId: 'e3',
    courseId: 'c1',
    status: 'confirmed',
    healthConfirmed: true,
    healthConfirmationDate: '2025-05-26',
    confirmedBy: 'sw1',
    registrationDate: '2025-05-26',
  },
  {
    id: 'r4',
    elderId: 'e4',
    courseId: 'c2',
    status: 'confirmed',
    healthConfirmed: true,
    healthConfirmationDate: '2025-05-28',
    confirmedBy: 'sw1',
    registrationDate: '2025-05-28',
  },
  {
    id: 'r5',
    elderId: 'e1',
    courseId: 'c3',
    status: 'pending',
    healthConfirmed: false,
    registrationDate: '2025-06-10',
  },
  {
    id: 'r6',
    elderId: 'e5',
    courseId: 'c3',
    status: 'waitlisted',
    healthConfirmed: true,
    healthConfirmationDate: '2025-06-08',
    confirmedBy: 'sw1',
    waitlistPosition: 1,
    registrationDate: '2025-06-08',
  },
  {
    id: 'r7',
    elderId: 'e4',
    courseId: 'c4',
    status: 'confirmed',
    healthConfirmed: true,
    healthConfirmationDate: '2025-05-30',
    confirmedBy: 'sw1',
    registrationDate: '2025-05-30',
  },
  {
    id: 'r8',
    elderId: 'e2',
    courseId: 'c3',
    status: 'waitlisted',
    healthConfirmed: false,
    waitlistPosition: 2,
    registrationDate: '2025-06-12',
  },
]

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]

const mockAttendances: Attendance[] = [
  {
    id: 'a1',
    registrationId: 'r1',
    elderId: 'e1',
    courseId: 'c1',
    scheduleId: 's1',
    date: twoDaysAgo,
    status: 'present',
    checkInTime: '09:05',
    isException: false,
    reportedToDirector: false,
    handled: false,
  },
  {
    id: 'a2',
    registrationId: 'r2',
    elderId: 'e2',
    courseId: 'c1',
    scheduleId: 's1',
    date: twoDaysAgo,
    status: 'absent',
    isException: false,
    reportedToDirector: false,
    handled: false,
  },
  {
    id: 'a3',
    registrationId: 'r3',
    elderId: 'e3',
    courseId: 'c1',
    scheduleId: 's1',
    date: twoDaysAgo,
    status: 'present',
    checkInTime: '09:02',
    isException: false,
    reportedToDirector: false,
    handled: false,
  },
  {
    id: 'a4',
    registrationId: 'r1',
    elderId: 'e1',
    courseId: 'c1',
    scheduleId: 's2',
    date: yesterday,
    status: 'present',
    checkInTime: '09:08',
    isException: false,
    reportedToDirector: false,
    handled: false,
  },
  {
    id: 'a5',
    registrationId: 'r2',
    elderId: 'e2',
    courseId: 'c1',
    scheduleId: 's2',
    date: yesterday,
    status: 'absent',
    isException: true,
    reportedToDirector: true,
    notes: '连续两次缺勤，已触发暂停机制',
    handled: false,
  },
  {
    id: 'a6',
    registrationId: 'r3',
    elderId: 'e3',
    courseId: 'c1',
    scheduleId: 's2',
    date: yesterday,
    status: 'exception',
    checkInTime: '10:00',
    isException: true,
    reportedToDirector: true,
    notes: '迟到超过30分钟，签到异常',
    handled: false,
  },
  {
    id: 'a7',
    registrationId: 'r4',
    elderId: 'e4',
    courseId: 'c2',
    scheduleId: 's3',
    date: today,
    status: 'present',
    checkInTime: '14:03',
    isException: false,
    reportedToDirector: false,
    handled: false,
  },
  {
    id: 'a8',
    registrationId: 'r7',
    elderId: 'e4',
    courseId: 'c4',
    scheduleId: 's7',
    date: twoDaysAgo,
    status: 'absent',
    isException: false,
    reportedToDirector: false,
    handled: false,
  },
]

const mockReinstatementApprovals: ReinstatementApproval[] = [
  {
    id: 'ra1',
    elderId: 'e2',
    courseId: 'c1',
    registrationId: 'r2',
    reason: '之前因为身体不适缺勤，现在已经恢复，可以继续上课',
    status: 'pending',
    applicantId: 'e2',
    applicationDate: yesterday,
  },
]

const mockWaitlistItems: WaitlistItem[] = [
  {
    id: 'w1',
    registrationId: 'r6',
    elderId: 'e5',
    courseId: 'c3',
    position: 1,
    addedDate: '2025-06-08',
    expiresAt: '2025-06-22',
    notified: false,
  },
  {
    id: 'w2',
    registrationId: 'r8',
    elderId: 'e2',
    courseId: 'c3',
    position: 2,
    addedDate: '2025-06-12',
    expiresAt: '2025-06-26',
    notified: false,
  },
  {
    id: 'w3',
    registrationId: 'w-r9',
    elderId: 'e6',
    courseId: 'c3',
    position: 3,
    addedDate: '2025-06-13',
    expiresAt: '2025-06-27',
    notified: false,
  },
  {
    id: 'w4',
    registrationId: 'w-r10',
    elderId: 'e7',
    courseId: 'c3',
    position: 4,
    addedDate: '2025-06-13',
    expiresAt: '2025-06-27',
    notified: true,
  },
  {
    id: 'w5',
    registrationId: 'w-r11',
    elderId: 'e8',
    courseId: 'c3',
    position: 5,
    addedDate: '2025-06-14',
    expiresAt: '2025-06-28',
    notified: false,
  },
]

const mockUsers: User[] = [
  {
    id: 'sw1',
    name: '社工小王',
    role: 'socialWorker',
    phone: '13600136001',
  },
  {
    id: 'd1',
    name: '刘主任',
    role: 'director',
    phone: '13500135001',
  },
]

const extraElders: Elder[] = [
  {
    id: 'e6',
    name: '孙爷爷',
    gender: 'male',
    age: 73,
    phone: '13800138006',
    address: '和平小区1号楼',
    idCard: '110101195105106789',
    emergencyContacts: [{ name: '孙伟', relationship: '儿子', phone: '13900139006' }],
    registrationDate: '2024-07-01',
    status: 'active',
    consecutiveAbsences: 0,
    isSuspended: false,
    riskAssessment: {
      elderId: 'e6',
      assessmentDate: '2025-05-25',
      fallRisk: 'low',
      exerciseTolerance: 'normal',
      heartCondition: false,
      highBloodPressure: false,
      diabetes: false,
      doctorRecommendation: '可以参加各类课程',
      canParticipateSports: true,
      requiresGuardian: false,
    },
  },
  {
    id: 'e7',
    name: '周奶奶',
    gender: 'female',
    age: 66,
    phone: '13800138007',
    address: '和平小区2号楼',
    idCard: '110101195809207890',
    emergencyContacts: [{ name: '周明', relationship: '儿子', phone: '13900139007' }],
    registrationDate: '2024-08-15',
    status: 'active',
    consecutiveAbsences: 0,
    isSuspended: false,
    riskAssessment: {
      elderId: 'e7',
      assessmentDate: '2025-05-28',
      fallRisk: 'low',
      exerciseTolerance: 'normal',
      heartCondition: false,
      highBloodPressure: false,
      diabetes: false,
      doctorRecommendation: '可以参加各类课程',
      canParticipateSports: true,
      requiresGuardian: false,
    },
  },
  {
    id: 'e8',
    name: '吴爷爷',
    gender: 'male',
    age: 71,
    phone: '13800138008',
    address: '和平小区3号楼',
    idCard: '110101195312158901',
    emergencyContacts: [{ name: '吴强', relationship: '儿子', phone: '13900139008' }],
    registrationDate: '2024-09-01',
    status: 'active',
    consecutiveAbsences: 0,
    isSuspended: false,
    riskAssessment: {
      elderId: 'e8',
      assessmentDate: '2025-06-01',
      fallRisk: 'low',
      exerciseTolerance: 'normal',
      heartCondition: false,
      highBloodPressure: false,
      diabetes: false,
      doctorRecommendation: '可以参加各类课程',
      canParticipateSports: true,
      requiresGuardian: false,
    },
  },
]

const allElders = [...mockElders, ...extraElders]

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentPage: 'home',
  currentElderId: null,
  elders: allElders,
  teachers: mockTeachers,
  venues: mockVenues,
  courses: mockCourses,
  courseLevels: mockCourseLevels,
  registrations: mockRegistrations,
  attendances: mockAttendances,
  reinstatementApprovals: mockReinstatementApprovals,
  waitlistItems: mockWaitlistItems,
  users: mockUsers,

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentElderId: (id) => set({ currentElderId: id }),

  getCurrentElder: () => {
    const state = get()
    if (!state.currentElderId) return undefined
    return state.elders.find(e => e.id === state.currentElderId)
  },

  addCourse: (course) => {
    const newCourse: Course = {
      ...course,
      id: `c${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    set((state) => ({ courses: [...state.courses, newCourse] }))
  },

  updateCourse: (id, course) => {
    set((state) => ({
      courses: state.courses.map((c) => (c.id === id ? { ...c, ...course } : c)),
    }))
  },

  addElder: (elder) => {
    const newElder: Elder = {
      ...elder,
      id: `e${Date.now()}`,
      registrationDate: new Date().toISOString().split('T')[0],
    }
    set((state) => ({ elders: [...state.elders, newElder] }))
  },

  updateElder: (id, elder) => {
    set((state) => ({
      elders: state.elders.map((e) => (e.id === id ? { ...e, ...elder } : e)),
    }))
  },

  updateHealthRecord: (elderId, record) => {
    set((state) => ({
      elders: state.elders.map((e) =>
        e.id === elderId ? { ...e, healthRecord: record } : e
      ),
    }))
  },

  updateRiskAssessment: (elderId, assessment) => {
    set((state) => ({
      elders: state.elders.map((e) =>
        e.id === elderId ? { ...e, riskAssessment: assessment } : e
      ),
    }))
  },

  registerCourse: (elderId, courseId) => {
    const state = get()
    const elder = state.getElderById(elderId)
    const course = state.getCourseById(courseId)

    if (!elder || !course) {
      return { success: false, message: '老人或课程不存在' }
    }

    if (elder.isSuspended) {
      return { success: false, message: '该老人已被暂停报名，需先申请复课' }
    }

    const existingRegistration = state.registrations.find(
      (r) => r.elderId === elderId && r.courseId === courseId && r.status !== 'cancelled'
    )

    if (existingRegistration) {
      if (existingRegistration.status === 'waitlisted') {
        return { success: false, message: '已在候补队列中' }
      }
      if (existingRegistration.status === 'pending') {
        return { success: false, message: '报名待确认中' }
      }
      if (existingRegistration.status === 'confirmed') {
        return { success: false, message: '已经报名该课程' }
      }
    }

    const isFull = course.currentParticipants >= course.maxParticipants
    const needsHealthCheck = course.requiresHealthCheck
    const hasRiskAssessment = !!elder.riskAssessment
    const canDoSports = elder.riskAssessment?.canParticipateSports ?? true

    if (needsHealthCheck && !hasRiskAssessment) {
      return { success: false, message: '该课程需要健康风险评估，请先完成评估' }
    }

    if (needsHealthCheck && course.type === 'sports' && !canDoSports) {
      return { success: false, message: '根据健康评估，不建议参加运动类课程' }
    }

    const newRegistration: Registration = {
      id: `r${Date.now()}`,
      elderId,
      courseId,
      status: isFull ? 'waitlisted' : needsHealthCheck ? 'pending' : 'confirmed',
      healthConfirmed: !needsHealthCheck,
      healthConfirmationDate: !needsHealthCheck ? new Date().toISOString().split('T')[0] : undefined,
      confirmedBy: !needsHealthCheck ? 'system' : undefined,
      waitlistPosition: isFull ? course.waitlistCount + 1 : undefined,
      registrationDate: new Date().toISOString().split('T')[0],
    }

    if (isFull) {
      const newWaitlistItem: WaitlistItem = {
        id: `w${Date.now()}`,
        registrationId: newRegistration.id,
        elderId,
        courseId,
        position: course.waitlistCount + 1,
        addedDate: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notified: false,
      }

      set((state) => ({
        registrations: [...state.registrations, newRegistration],
        waitlistItems: [...state.waitlistItems, newWaitlistItem],
        courses: state.courses.map((c) =>
          c.id === courseId ? { ...c, waitlistCount: c.waitlistCount + 1 } : c
        ),
      }))

      return { success: true, message: '课程已满，已加入候补队列，顺位第' + (course.waitlistCount + 1) + '位' }
    }

    if (needsHealthCheck) {
      set((state) => ({
        registrations: [...state.registrations, newRegistration],
        courses: state.courses.map((c) =>
          c.id === courseId ? { ...c, currentParticipants: c.currentParticipants + 1 } : c
        ),
      }))

      return { success: true, message: '报名成功，等待社工确认健康风险' }
    }

    set((state) => ({
      registrations: [...state.registrations, newRegistration],
      courses: state.courses.map((c) =>
        c.id === courseId ? { ...c, currentParticipants: c.currentParticipants + 1 } : c
      ),
    }))

    return { success: true, message: '报名成功' }
  },

  confirmHealthCheck: (registrationId, socialWorkerId) => {
    set((state) => ({
      registrations: state.registrations.map((r) =>
        r.id === registrationId
          ? {
              ...r,
              status: 'confirmed',
              healthConfirmed: true,
              healthConfirmationDate: new Date().toISOString().split('T')[0],
              confirmedBy: socialWorkerId,
            }
          : r
      ),
    }))
  },

  checkIn: (registrationId, scheduleId, date, status, notes) => {
    const state = get()
    const registration = state.registrations.find((r) => r.id === registrationId)

    if (!registration) {
      return { success: false, message: '报名记录不存在' }
    }

    if (registration.status === 'suspended') {
      return { success: false, message: '该学员已被暂停上课' }
    }

    const existingAttendance = state.attendances.find(
      (a) => a.registrationId === registrationId && a.scheduleId === scheduleId && a.date === date
    )

    if (existingAttendance) {
      return { success: false, message: '已经签到过' }
    }

    const isException = status === 'exception' || status === 'absent'

    let consecutiveAbsences = 0
    if (status === 'absent') {
      const elder = state.getElderById(registration.elderId)
      consecutiveAbsences = (elder?.consecutiveAbsences || 0) + 1
    }

    const shouldSuspend = consecutiveAbsences >= 2

    const newAttendance: Attendance = {
      id: `a${Date.now()}`,
      registrationId,
      elderId: registration.elderId,
      courseId: registration.courseId,
      scheduleId,
      date,
      status,
      checkInTime: status === 'present' || status === 'late' ? new Date().toTimeString().slice(0, 5) : undefined,
      notes: notes || (shouldSuspend ? '连续缺勤两次，已触发暂停机制' : undefined),
      isException,
      reportedToDirector: isException,
      handled: false,
    }

    set((state) => {
      let updatedElders = state.elders
      let updatedRegistrations = state.registrations

      if (status === 'absent') {
        updatedElders = state.elders.map((e) =>
          e.id === registration.elderId
            ? {
                ...e,
                consecutiveAbsences,
                isSuspended: shouldSuspend,
                suspensionReason: shouldSuspend ? '连续缺勤两次' : undefined,
              }
            : e
        )

        if (shouldSuspend) {
          updatedRegistrations = state.registrations.map((r) =>
            r.elderId === registration.elderId && r.status === 'confirmed'
              ? { ...r, status: 'suspended', suspensionReason: '连续缺勤两次' }
              : r
          )
        }
      } else if (status === 'present') {
        updatedElders = state.elders.map((e) =>
          e.id === registration.elderId ? { ...e, consecutiveAbsences: 0 } : e
        )
      }

      return {
        attendances: [...state.attendances, newAttendance],
        elders: updatedElders,
        registrations: updatedRegistrations,
      }
    })

    if (shouldSuspend) {
      return { success: true, message: '已标记缺勤，连续缺勤两次，已自动暂停该学员后续报名资格' }
    }

    const statusText = {
      present: '出勤',
      late: '迟到',
      absent: '缺勤',
      exception: '异常'
    }[status]

    return { success: true, message: `签到成功：${statusText}` }
  },

  approveReinstatement: (approvalId, reviewerId, comments) => {
    const state = get()
    const approval = state.reinstatementApprovals.find((a) => a.id === approvalId)

    if (!approval) return

    set((state) => ({
      reinstatementApprovals: state.reinstatementApprovals.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'approved',
              reviewerId,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewComments: comments,
            }
          : a
      ),
      elders: state.elders.map((e) =>
        e.id === approval.elderId
          ? { ...e, isSuspended: false, consecutiveAbsences: 0, suspensionReason: undefined }
          : e
      ),
      registrations: state.registrations.map((r) =>
        r.id === approval.registrationId ? { ...r, status: 'confirmed', suspensionReason: undefined } : r
      ),
    }))
  },

  rejectReinstatement: (approvalId, reviewerId, comments) => {
    set((state) => ({
      reinstatementApprovals: state.reinstatementApprovals.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'rejected',
              reviewerId,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewComments: comments,
            }
          : a
      ),
    }))
  },

  applyReinstatement: (elderId, courseId, registrationId, reason, applicantId) => {
    const existingApproval = get().reinstatementApprovals.find(
      (a) => a.elderId === elderId && a.courseId === courseId && a.status === 'pending'
    )

    if (existingApproval) {
      return
    }

    const newApproval: ReinstatementApproval = {
      id: `ra${Date.now()}`,
      elderId,
      courseId,
      registrationId,
      reason,
      status: 'pending',
      applicantId,
      applicationDate: new Date().toISOString().split('T')[0],
    }

    set((state) => ({
      reinstatementApprovals: [...state.reinstatementApprovals, newApproval],
    }))
  },

  promoteWaitlist: (courseId) => {
    const state = get()
    const course = state.getCourseById(courseId)
    if (!course) return

    const waitlist = state.waitlistItems
      .filter((w) => w.courseId === courseId)
      .sort((a, b) => a.position - b.position)

    if (waitlist.length === 0) return

    const firstInLine = waitlist[0]
    const hasCapacity = course.currentParticipants < course.maxParticipants

    if (hasCapacity) {
      set((state) => ({
        registrations: state.registrations.map((r) =>
          r.id === firstInLine.registrationId
            ? { ...r, status: 'pending', waitlistPosition: undefined }
            : r
        ),
        waitlistItems: state.waitlistItems
          .filter((w) => w.id !== firstInLine.id)
          .map((w) => (w.courseId === courseId ? { ...w, position: w.position - 1 } : w)),
        courses: state.courses.map((c) =>
          c.id === courseId ? { ...c, waitlistCount: c.waitlistCount - 1 } : c
        ),
      }))
    }
  },

  removeWaitlist: (waitlistId) => {
    const state = get()
    const waitlistItem = state.waitlistItems.find(w => w.id === waitlistId)
    if (!waitlistItem) return

    set((state) => ({
      waitlistItems: state.waitlistItems
        .filter((w) => w.id !== waitlistId)
        .map((w) => (w.courseId === waitlistItem.courseId && w.position > waitlistItem.position
          ? { ...w, position: w.position - 1 }
          : w
        )),
      registrations: state.registrations.map((r) =>
        r.id === waitlistItem.registrationId ? { ...r, status: 'cancelled', waitlistPosition: undefined } : r
      ),
      courses: state.courses.map((c) =>
        c.id === waitlistItem.courseId ? { ...c, waitlistCount: c.waitlistCount - 1 } : c
      ),
    }))
  },

  markWaitlistNotified: (waitlistId) => {
    set((state) => ({
      waitlistItems: state.waitlistItems.map((w) =>
        w.id === waitlistId ? { ...w, notified: true } : w
      ),
    }))
  },

  getStatistics: () => {
    const state = get()
    const today = new Date().toISOString().split('T')[0]
    const todayAttendances = state.attendances.filter((a) => a.date === today)
    const presentCount = todayAttendances.filter((a) => a.status === 'present').length
    const totalToday = todayAttendances.length
    const attendanceRate = totalToday > 0 ? Math.round((presentCount / totalToday) * 100) : 0

    const totalCapacity = state.courses.reduce((sum, c) => sum + c.maxParticipants, 0)
    const totalEnrolled = state.courses.reduce((sum, c) => sum + c.currentParticipants, 0)
    const averageOccupancy = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

    return {
      totalCourses: state.courses.length,
      totalElders: state.elders.length,
      totalRegistrations: state.registrations.length,
      attendanceRate,
      averageOccupancy,
      pendingApprovals: state.reinstatementApprovals.filter((a) => a.status === 'pending').length,
      todayAbsences: todayAttendances.filter((a) => a.status === 'absent').length,
      todayExceptions: todayAttendances.filter((a) => a.isException).length,
    }
  },

  getElderById: (id) => get().elders.find((e) => e.id === id),
  getCourseById: (id) => get().courses.find((c) => c.id === id),
  getTeacherById: (id) => get().teachers.find((t) => t.id === id),
  getVenueById: (id) => get().venues.find((v) => v.id === id),
  getLevelById: (id) => get().courseLevels.find((l) => l.id === id),

  getRegistrationsByElder: (elderId) =>
    get().registrations.filter((r) => r.elderId === elderId),

  getRegistrationsByCourse: (courseId) =>
    get().registrations.filter((r) => r.courseId === courseId),

  getAttendancesByCourseAndDate: (courseId, date) =>
    get().attendances.filter((a) => a.courseId === courseId && a.date === date),

  getSuspendedElders: () => get().elders.filter((e) => e.isSuspended),

  getTodayExceptions: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().attendances.filter((a) => a.date === today && a.isException)
  },
}))
