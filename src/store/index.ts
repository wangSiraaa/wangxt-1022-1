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
  DirectorTodo,
  DetailedRegistrationStatus,
  ReservedResource,
  SuspensionSuggestion,
  CourseType,
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
  directorTodos: DirectorTodo[]
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
  confirmHealthCheck: (registrationId: string, socialWorkerId: string, extra?: { familyConfirmed?: boolean; volunteerAssigned?: boolean; volunteerId?: string; volunteerName?: string }) => void
  checkIn: (registrationId: string, scheduleId: string, date: string, status: 'present' | 'absent' | 'late' | 'exception', notes?: string, suspensionSuggestion?: SuspensionSuggestion) => { success: boolean; message: string }
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
  getDetailedRegistrationStatus: (registration: Registration, elder?: Elder, course?: Course) => DetailedRegistrationStatus
  createDirectorTodo: (todo: Omit<DirectorTodo, 'id' | 'createdAt' | 'status'>) => void
  updateDirectorTodo: (todoId: string, updates: Partial<DirectorTodo>) => void
  getPendingDirectorTodos: () => DirectorTodo[]
  validateRehabilitationRegistration: (elderId: string, courseId: string) => { valid: boolean; messages: string[] }
  buildReservedResources: (courseId: string, scheduleId?: string) => ReservedResource
  getRegistrationsWithDetailedStatus: (courseId?: string) => Array<{ registration: Registration; elder?: Elder; course?: Course; detailedStatus: DetailedRegistrationStatus }>
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
      lastDoctorAdviceDate: '2025-05-10',
      canParticipateSports: true,
      requiresGuardian: false,
      familyConfirmed: true,
      familyConfirmedBy: '张小明',
      familyConfirmedDate: '2025-05-10',
      volunteerAssigned: false,
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
      lastDoctorAdviceDate: '2025-04-20',
      canParticipateSports: true,
      requiresGuardian: true,
      familyConfirmed: true,
      familyConfirmedBy: '李小红',
      familyConfirmedDate: '2025-04-20',
      volunteerAssigned: true,
      volunteerId: 'v1',
      volunteerName: '志愿者小王',
      volunteerAssignmentDate: '2025-04-25',
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
      lastDoctorAdviceDate: '2025-06-01',
      canParticipateSports: false,
      requiresGuardian: true,
      familyConfirmed: false,
      volunteerAssigned: false,
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
      lastDoctorAdviceDate: '2025-05-15',
      canParticipateSports: true,
      requiresGuardian: false,
      familyConfirmed: true,
      familyConfirmedBy: '赵小刚',
      familyConfirmedDate: '2025-05-15',
      volunteerAssigned: false,
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
      lastDoctorAdviceDate: '2025-05-20',
      canParticipateSports: true,
      requiresGuardian: false,
      familyConfirmed: true,
      familyConfirmedBy: '刘芳',
      familyConfirmedDate: '2025-05-20',
      volunteerAssigned: false,
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
  {
    id: 't5',
    name: '吴康复师',
    gender: 'female',
    age: 42,
    phone: '13700137005',
    specialty: ['康复训练', '物理治疗'],
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
  {
    id: 'v5',
    name: '康复训练室',
    capacity: 8,
    equipment: ['康复训练器械', '平衡垫', '牵引床', '理疗仪'],
    location: '一楼东侧康复区',
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
  {
    id: 'l4',
    name: '康复级',
    description: '适合需要康复训练的学员',
    minAge: 55,
    maxAge: 90,
    requiredPhysicalCondition: '需有医生康复建议',
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
  {
    id: 's9',
    courseId: 'c5',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:30',
    teacherId: 't5',
    venueId: 'v5',
    startDate: '2025-06-02',
    endDate: '2025-12-29',
  },
  {
    id: 's10',
    courseId: 'c5',
    dayOfWeek: 3,
    startTime: '10:00',
    endTime: '11:30',
    teacherId: 't5',
    venueId: 'v5',
    startDate: '2025-06-04',
    endDate: '2025-12-31',
  },
  {
    id: 's11',
    courseId: 'c5',
    dayOfWeek: 5,
    startTime: '10:00',
    endTime: '11:30',
    teacherId: 't5',
    venueId: 'v5',
    startDate: '2025-06-06',
    endDate: '2026-01-03',
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
    isRehabilitation: false,
    absenceStrategy: 'suspend',
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
    isRehabilitation: false,
    absenceStrategy: 'suspend',
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
    isRehabilitation: false,
    absenceStrategy: 'suspend',
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
    isRehabilitation: false,
    absenceStrategy: 'socialWorkerVisit',
    schedules: mockSchedules.filter(s => s.courseId === 'c4'),
    status: 'published',
    createdBy: 'sw1',
    createdAt: '2025-05-28',
  },
  {
    id: 'c5',
    name: '康复训练班（关节术后）',
    type: 'rehabilitation',
    description: '针对关节术后老人的专业康复训练，需有医生建议、家属确认和志愿者陪同。配备专业康复器械。',
    levelId: 'l4',
    maxParticipants: 8,
    currentParticipants: 6,
    waitlistCount: 4,
    requiresHealthCheck: true,
    isRehabilitation: true,
    absenceStrategy: 'socialWorkerVisit',
    requiredEquipmentIds: ['eq1', 'eq2', 'eq3'],
    schedules: mockSchedules.filter(s => s.courseId === 'c5'),
    status: 'published',
    createdBy: 'sw1',
    createdAt: '2025-06-01',
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
    reinstatementPending: false,
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
    reinstatementPending: true,
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
    reinstatementPending: false,
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
    reinstatementPending: false,
  },
  {
    id: 'r5',
    elderId: 'e1',
    courseId: 'c3',
    status: 'pending',
    healthConfirmed: false,
    registrationDate: '2025-06-10',
    reinstatementPending: false,
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
    reinstatementPending: false,
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
    reinstatementPending: false,
  },
  {
    id: 'r8',
    elderId: 'e2',
    courseId: 'c3',
    status: 'waitlisted',
    healthConfirmed: false,
    waitlistPosition: 2,
    registrationDate: '2025-06-12',
    reinstatementPending: false,
  },
  {
    id: 'r9',
    elderId: 'e3',
    courseId: 'c5',
    status: 'pending',
    healthConfirmed: false,
    registrationDate: '2025-06-14',
    reinstatementPending: false,
  },
  {
    id: 'r10',
    elderId: 'e2',
    courseId: 'c5',
    status: 'confirmed',
    healthConfirmed: true,
    healthConfirmationDate: '2025-06-10',
    confirmedBy: 'sw1',
    registrationDate: '2025-06-05',
    reinstatementPending: false,
    reservedResources: {
      equipmentIds: ['eq1', 'eq2'],
      venueTimeSlot: {
        venueId: 'v5',
        scheduleId: 's9',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:30',
      },
    },
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
    directorTodoCreated: false,
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
    directorTodoCreated: false,
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
    directorTodoCreated: false,
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
    directorTodoCreated: false,
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
    directorTodoCreated: true,
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
    suspensionSuggestion: {
      suggested: true,
      reason: '老人状态异常，建议临时停课观察',
      severity: 'warning',
    },
    handled: false,
    directorTodoCreated: true,
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
    directorTodoCreated: false,
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
    directorTodoCreated: false,
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
    preservedWaitlistPosition: 0,
    preservedResources: {
      equipmentIds: [],
      venueTimeSlot: null,
    },
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
  {
    id: 'w6',
    registrationId: 'w-r12',
    elderId: 'e6',
    courseId: 'c5',
    position: 1,
    addedDate: '2025-06-14',
    expiresAt: '2025-06-28',
    notified: false,
  },
  {
    id: 'w7',
    registrationId: 'w-r13',
    elderId: 'e7',
    courseId: 'c5',
    position: 2,
    addedDate: '2025-06-14',
    expiresAt: '2025-06-28',
    notified: false,
  },
  {
    id: 'w8',
    registrationId: 'w-r14',
    elderId: 'e8',
    courseId: 'c5',
    position: 3,
    addedDate: '2025-06-15',
    expiresAt: '2025-06-29',
    notified: false,
  },
  {
    id: 'w9',
    registrationId: 'w-r15',
    elderId: 'e5',
    courseId: 'c5',
    position: 4,
    addedDate: '2025-06-15',
    expiresAt: '2025-06-29',
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
  {
    id: 'v1',
    name: '志愿者小王',
    role: 'volunteer',
    phone: '13400134001',
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
      lastDoctorAdviceDate: '2025-05-25',
      canParticipateSports: true,
      requiresGuardian: false,
      familyConfirmed: true,
      familyConfirmedBy: '孙伟',
      familyConfirmedDate: '2025-05-25',
      volunteerAssigned: false,
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
      lastDoctorAdviceDate: '2025-05-28',
      canParticipateSports: true,
      requiresGuardian: false,
      familyConfirmed: true,
      familyConfirmedBy: '周明',
      familyConfirmedDate: '2025-05-28',
      volunteerAssigned: true,
      volunteerId: 'v1',
      volunteerName: '志愿者小王',
      volunteerAssignmentDate: '2025-06-01',
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
      lastDoctorAdviceDate: '2025-06-01',
      canParticipateSports: true,
      requiresGuardian: false,
      familyConfirmed: true,
      familyConfirmedBy: '吴强',
      familyConfirmedDate: '2025-06-01',
      volunteerAssigned: false,
    },
  },
]

const mockDirectorTodos: DirectorTodo[] = [
  {
    id: 'dt1',
    type: 'abnormalStatus',
    elderId: 'e3',
    elderName: '王爷爷',
    courseId: 'c1',
    courseName: '书法基础班',
    registrationId: 'r3',
    title: '签到异常-迟到超过30分钟',
    description: '王爷爷在书法基础班签到时迟到超过30分钟，签到异常，建议关注老人状态。',
    attendanceId: 'a6',
    status: 'pending',
    priority: 'high',
    createdAt: yesterday,
  },
  {
    id: 'dt2',
    type: 'absenceSuspend',
    elderId: 'e2',
    elderName: '李奶奶',
    courseId: 'c1',
    courseName: '书法基础班',
    registrationId: 'r2',
    title: '连续缺勤暂停-书法基础班',
    description: '李奶奶连续两次缺勤书法基础班，已自动暂停上课资格，待申请复课。',
    attendanceId: 'a5',
    status: 'pending',
    priority: 'medium',
    createdAt: yesterday,
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
  directorTodos: mockDirectorTodos,

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

  getDetailedRegistrationStatus: (registration, elder, course) => {
    if (registration.status === 'suspended' || (elder?.isSuspended)) {
      if (registration.reinstatementPending) {
        return 'reinstatementPending'
      }
      return 'suspendedByAbsence'
    }
    if (registration.status === 'waitlisted') {
      return 'waitlistPendingPromotion'
    }
    if (registration.status === 'pending' || !registration.healthConfirmed || (course?.requiresHealthCheck && !registration.healthConfirmed)) {
      return 'riskUnconfirmed'
    }
    return 'normalEnrolled'
  },

  validateRehabilitationRegistration: (elderId, courseId) => {
    const state = get()
    const elder = state.getElderById(elderId)
    const course = state.getCourseById(courseId)
    const messages: string[] = []

    if (!elder || !course) {
      return { valid: false, messages: ['老人或课程不存在'] }
    }

    if (!course.isRehabilitation) {
      return { valid: true, messages: [] }
    }

    const risk = elder.riskAssessment

    if (!risk) {
      messages.push('需要先完成健康风险评估')
      return { valid: false, messages }
    }

    if (!risk.lastDoctorAdviceDate) {
      messages.push('缺少最近一次医生建议日期')
    } else {
      const adviceDate = new Date(risk.lastDoctorAdviceDate)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      if (adviceDate < threeMonthsAgo) {
        messages.push('最近一次医生建议已超过3个月，请更新')
      }
    }

    if (!risk.familyConfirmed) {
      messages.push('需要家属签字确认参加康复课程')
    }

    if (!risk.volunteerAssigned) {
      messages.push('需要安排志愿者陪同参加康复训练')
    }

    if (!risk.doctorRecommendation || risk.doctorRecommendation.trim().length === 0) {
      messages.push('需要填写详细的医生康复建议')
    }

    return { valid: messages.length === 0, messages }
  },

  buildReservedResources: (courseId, scheduleId) => {
    const state = get()
    const course = state.getCourseById(courseId)
    if (!course) {
      return { equipmentIds: [], venueTimeSlot: null }
    }

    const schedule = scheduleId
      ? course.schedules.find(s => s.id === scheduleId)
      : course.schedules[0]

    const venue = schedule ? state.getVenueById(schedule.venueId) : undefined
    const equipmentIds = course.requiredEquipmentIds || []

    return {
      equipmentIds,
      venueTimeSlot: schedule ? {
        venueId: schedule.venueId,
        scheduleId: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      } : null,
    }
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

    if (course.isRehabilitation) {
      const rehabCheck = state.validateRehabilitationRegistration(elderId, courseId)
      if (!rehabCheck.valid) {
        return { success: false, message: '康复课程特殊要求：' + rehabCheck.messages.join('；') }
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

    const reservedResources = (course.isRehabilitation || (course.requiredEquipmentIds && course.requiredEquipmentIds.length > 0))
      ? state.buildReservedResources(courseId)
      : undefined

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
      reinstatementPending: false,
      reservedResources,
      originalWaitlistPosition: isFull ? course.waitlistCount + 1 : undefined,
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

      if (course.isRehabilitation) {
        return { success: true, message: '康复课程已满，已加入候补队列（顺位第' + (course.waitlistCount + 1) + '位）。请注意：候补期间需确保医生建议、家属确认和志愿者陪同三项均有效。' }
      }

      return { success: true, message: '课程已满，已加入候补队列，顺位第' + (course.waitlistCount + 1) + '位' }
    }

    if (needsHealthCheck) {
      set((state) => ({
        registrations: [...state.registrations, newRegistration],
        courses: state.courses.map((c) =>
          c.id === courseId ? { ...c, currentParticipants: c.currentParticipants + 1 } : c
        ),
      }))

      if (course.isRehabilitation) {
        return { success: true, message: '康复课程报名成功，等待社工确认健康风险（含医生建议、家属确认、志愿者陪同三项）' }
      }

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

  confirmHealthCheck: (registrationId, socialWorkerId, extra) => {
    set((state) => {
      const registration = state.registrations.find(r => r.id === registrationId)
      if (!registration) return state

      const elder = state.getElderById(registration.elderId)
      if (!elder || !elder.riskAssessment) return state

      const updatedRiskAssessment = { ...elder.riskAssessment }
      if (extra?.familyConfirmed !== undefined) {
        updatedRiskAssessment.familyConfirmed = extra.familyConfirmed
        if (extra.familyConfirmed) {
          updatedRiskAssessment.familyConfirmedDate = new Date().toISOString().split('T')[0]
          updatedRiskAssessment.familyConfirmedBy = socialWorkerId
        }
      }
      if (extra?.volunteerAssigned !== undefined) {
        updatedRiskAssessment.volunteerAssigned = extra.volunteerAssigned
        if (extra.volunteerAssigned) {
          updatedRiskAssessment.volunteerAssignmentDate = new Date().toISOString().split('T')[0]
          updatedRiskAssessment.volunteerId = extra.volunteerId
          updatedRiskAssessment.volunteerName = extra.volunteerName
        }
      }

      return {
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
        elders: state.elders.map((e) =>
          e.id === registration.elderId
            ? { ...e, riskAssessment: updatedRiskAssessment }
            : e
        ),
      }
    })
  },

  createDirectorTodo: (todo) => {
    const newTodo: DirectorTodo = {
      ...todo,
      id: `dt${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending',
    }
    set((state) => ({
      directorTodos: [...state.directorTodos, newTodo],
    }))
  },

  updateDirectorTodo: (todoId, updates) => {
    set((state) => ({
      directorTodos: state.directorTodos.map((t) =>
        t.id === todoId ? { ...t, ...updates } : t
      ),
    }))
  },

  getPendingDirectorTodos: () => {
    return get().directorTodos.filter(t => t.status === 'pending')
  },

  checkIn: (registrationId, scheduleId, date, status, notes, suspensionSuggestion) => {
    const state = get()
    const registration = state.registrations.find((r) => r.id === registrationId)

    if (!registration) {
      return { success: false, message: '报名记录不存在' }
    }

    if (registration.status === 'suspended' && !registration.reinstatementPending) {
      return { success: false, message: '该学员已被暂停上课' }
    }

    const existingAttendance = state.attendances.find(
      (a) => a.registrationId === registrationId && a.scheduleId === scheduleId && a.date === date
    )

    if (existingAttendance) {
      return { success: false, message: '已经签到过' }
    }

    const course = state.getCourseById(registration.courseId)
    const elder = state.getElderById(registration.elderId)
    const isException = status === 'exception' || status === 'absent'

    let consecutiveAbsences = 0
    if (status === 'absent') {
      consecutiveAbsences = (elder?.consecutiveAbsences || 0) + 1
    }

    const shouldSuspend = consecutiveAbsences >= 2
    const absenceStrategy = course?.absenceStrategy || 'suspend'
    const needSocialWorkerVisit = shouldSuspend && absenceStrategy === 'socialWorkerVisit'
    const needSuspend = shouldSuspend && absenceStrategy === 'suspend'

    let finalSuspensionSuggestion = suspensionSuggestion
    if (status === 'exception' && !finalSuspensionSuggestion) {
      finalSuspensionSuggestion = {
        suggested: true,
        reason: '老师标记异常，建议临时停课并通知家属',
        severity: 'danger',
      }
    }

    const shouldReportToDirector = isException || !!finalSuspensionSuggestion?.suggested

    const directorTodoCreated = shouldReportToDirector

    const newAttendance: Attendance = {
      id: `a${Date.now()}`,
      registrationId,
      elderId: registration.elderId,
      courseId: registration.courseId,
      scheduleId,
      date,
      status,
      checkInTime: status === 'present' || status === 'late' ? new Date().toTimeString().slice(0, 5) : undefined,
      notes: notes || (needSuspend ? '连续缺勤两次，已触发暂停机制（暂停策略）' : needSocialWorkerVisit ? '连续缺勤两次，已触发社工回访机制' : undefined),
      isException,
      reportedToDirector: shouldReportToDirector,
      suspensionSuggestion: finalSuspensionSuggestion,
      handled: false,
      directorTodoCreated,
    }

    set((state) => {
      let updatedElders = state.elders
      let updatedRegistrations = state.registrations
      let newTodos: DirectorTodo[] = []

      if (status === 'absent') {
        updatedElders = state.elders.map((e) =>
          e.id === registration.elderId
            ? {
                ...e,
                consecutiveAbsences,
                isSuspended: needSuspend ? true : e.isSuspended,
                suspensionReason: needSuspend ? '连续缺勤两次（暂停策略）' : needSocialWorkerVisit ? '连续缺勤两次（转社工回访）' : e.suspensionReason,
                socialWorkerVisitAssigned: needSocialWorkerVisit ? true : e.socialWorkerVisitAssigned,
                socialWorkerAssignmentDate: needSocialWorkerVisit ? new Date().toISOString().split('T')[0] : e.socialWorkerAssignmentDate,
              }
            : e
        )

        if (needSuspend) {
          updatedRegistrations = state.registrations.map((r) =>
            r.elderId === registration.elderId && r.status === 'confirmed'
              ? { ...r, status: 'suspended', suspensionReason: '连续缺勤两次（暂停策略）', reinstatementPending: false }
              : r
          )
          newTodos.push({
            id: `dt${Date.now()}_suspend`,
            type: 'absenceSuspend',
            elderId: registration.elderId,
            elderName: elder?.name || '',
            courseId: registration.courseId,
            courseName: course?.name || '',
            registrationId: registration.id,
            title: `连续缺勤暂停-${course?.name || ''}`,
            description: `${elder?.name || ''}连续两次缺勤${course?.name || ''}，已自动暂停上课资格，待申请复课。课程缺勤策略为：暂停。`,
            attendanceId: newAttendance.id,
            status: 'pending',
            priority: 'medium',
            createdAt: new Date().toISOString().split('T')[0],
          })
        }

        if (needSocialWorkerVisit) {
          newTodos.push({
            id: `dt${Date.now()}_visit`,
            type: 'absenceSocialWorker',
            elderId: registration.elderId,
            elderName: elder?.name || '',
            courseId: registration.courseId,
            courseName: course?.name || '',
            registrationId: registration.id,
            title: `连续缺勤转社工回访-${course?.name || ''}`,
            description: `${elder?.name || ''}连续两次缺勤${course?.name || ''}，课程缺勤策略为：转社工回访。请安排社工进行家访回访。`,
            attendanceId: newAttendance.id,
            status: 'pending',
            priority: 'high',
            createdAt: new Date().toISOString().split('T')[0],
          })
        }
      } else if (status === 'present') {
        updatedElders = state.elders.map((e) =>
          e.id === registration.elderId ? { ...e, consecutiveAbsences: 0 } : e
        )
      }

      if (status === 'exception' && finalSuspensionSuggestion) {
        newTodos.push({
          id: `dt${Date.now()}_abnormal`,
          type: 'abnormalStatus',
          elderId: registration.elderId,
          elderName: elder?.name || '',
          courseId: registration.courseId,
          courseName: course?.name || '',
          registrationId: registration.id,
          title: `老人状态异常-${course?.name || ''}`,
          description: `老师在${course?.name || ''}签到时标记${elder?.name || ''}状态异常。停课建议：${finalSuspensionSuggestion.reason}。请主任尽快处理。`,
          attendanceId: newAttendance.id,
          status: 'pending',
          priority: finalSuspensionSuggestion.severity === 'danger' ? 'high' : 'medium',
          createdAt: new Date().toISOString().split('T')[0],
        })
      }

      return {
        attendances: [...state.attendances, newAttendance],
        elders: updatedElders,
        registrations: updatedRegistrations,
        directorTodos: [...state.directorTodos, ...newTodos],
      }
    })

    if (needSuspend) {
      return { success: true, message: '已标记缺勤，连续缺勤两次。课程策略为暂停，已自动暂停该学员后续报名资格并生成主任待办。' }
    }
    if (needSocialWorkerVisit) {
      return { success: true, message: '已标记缺勤，连续缺勤两次。课程策略为转社工回访，已生成社工回访主任待办。' }
    }
    if (status === 'exception' && finalSuspensionSuggestion) {
      return { success: true, message: `已记录异常签到，停课建议：${finalSuspensionSuggestion.reason}，已自动生成主任待办。` }
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

    const preservedResources = approval.preservedResources || []
    const preservedWaitlistPosition = approval.preservedWaitlistPosition

    set({
      reinstatementApprovals: state.reinstatementApprovals.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'approved',
              reviewerId,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewComments: comments || a.reviewComments
            }
          : a
      ),
      registrations: state.registrations.map((r) => {
        if (r.id !== approval.registrationId) return r
        const updated = {
          ...r,
          status: 'enrolled' as const,
          reinstatementPending: false,
          originalWaitlistPosition: undefined as number | undefined,
          reservedResources: [] as ReservedResource[]
        }
        return updated
      }),
      waitlistEntries: state.waitlistEntries.map((w) =>
        w.registrationId === approval.registrationId
          ? { ...w, position: preservedWaitlistPosition ?? w.position }
          : w
      ),
      directorTodos: state.directorTodos.map((t) =>
        t.registrationId === approval.registrationId && t.type === 'reinstatementApproval'
          ? { ...t, status: 'completed' as const }
          : t
      )
    })

    if (preservedResources.length > 0) {
      console.log('[复课审批通过] 已释放资源占用保护:', preservedResources.map(r => r.type).join(', '))
    }
    console.log('[复课审批通过] 学员已恢复正常在读状态:', approval.elderName)
  },

  rejectReinstatement: (approvalId, reviewerId, comments) => {
    const state = get()
    const approval = state.reinstatementApprovals.find((a) => a.id === approvalId)

    if (!approval) return

    const preservedResources = approval.preservedResources || []

    set({
      reinstatementApprovals: state.reinstatementApprovals.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'rejected',
              reviewerId,
              reviewDate: new Date().toISOString().split('T')[0],
              reviewComments: comments || a.reviewComments
            }
          : a
      ),
      registrations: state.registrations.map((r) => {
        if (r.id !== approval.registrationId) return r
        return {
          ...r,
          reinstatementPending: false,
          originalWaitlistPosition: undefined as number | undefined,
          reservedResources: [] as ReservedResource[]
        }
      }),
      waitlistEntries: state.waitlistEntries.filter((w) => w.registrationId !== approval.registrationId)
    })

    if (preservedResources.length > 0) {
      console.log('[复课审批拒绝] 已释放占用的资源:', preservedResources.map(r => r.resourceId).join(', '))
    }
  },

  applyReinstatement: (registrationId, reason) => {
    const state = get()
    const registration = state.registrations.find((r) => r.id === registrationId)
    if (!registration) return

    const course = state.courses.find((c) => c.id === registration.courseId)
    const elder = state.elders.find((e) => e.id === registration.elderId)
    if (!course || !elder) return

    const currentWaitlist = state.waitlistEntries.find((w) => w.registrationId === registrationId)
    const originalWaitlistPosition = currentWaitlist?.position

    const reservedResources = state.buildReservedResources(registration, course)

    const newApproval: ReinstatementApproval = {
      id: 'ra_' + Date.now(),
      registrationId,
      elderId: registration.elderId,
      elderName: elder.name,
      courseId: registration.courseId,
      courseName: course.name,
      applicationDate: new Date().toISOString().split('T')[0],
      reason: reason || '老人身体状态恢复，申请复课',
      status: 'pending',
      preservedWaitlistPosition: originalWaitlistPosition,
      preservedResources: reservedResources
    }

    set({
      reinstatementApprovals: [...state.reinstatementApprovals, newApproval],
      registrations: state.registrations.map((r) =>
        r.id === registrationId
          ? {
              ...r,
              reinstatementPending: true,
              originalWaitlistPosition,
              reservedResources
            }
          : r
      )
    })

    state.createDirectorTodo({
      type: 'reinstatementApproval',
      elderId: elder.id,
      elderName: elder.name,
      courseId: course.id,
      courseName: course.name,
      registrationId,
      title: '复课申请待审批',
      description: `${elder.name} 申请复课「${course.name}」，原候补顺位: ${originalWaitlistPosition ?? '无'}，占用资源数: ${reservedResources.length}`,
      priority: 'medium'
    })
  },

  promoteWaitlist: (courseId) => {
    const state = get()
    const course = state.courses.find((c) => c.id === courseId)
    if (!course) return

    const enrolledCount = state.registrations.filter(
      (r) =>
        r.courseId === courseId &&
        r.status === 'enrolled' &&
        !r.reinstatementPending
    ).length

    if (enrolledCount >= course.capacity) return

    const availableSlots = course.capacity - enrolledCount

    const promotableWaitlist = state.waitlistEntries
      .filter((w) => w.courseId === courseId && w.status === 'waiting')
      .filter((w) => {
        const reg = state.registrations.find((r) => r.id === w.registrationId)
        return reg && !reg.reinstatementPending
      })
      .sort((a, b) => a.position - b.position)
      .slice(0, availableSlots)

    if (promotableWaitlist.length === 0) return

    set({
      waitlistEntries: state.waitlistEntries.map((w) =>
        promotableWaitlist.find((p) => p.id === w.id)
          ? { ...w, status: 'promoted' as const, promotedDate: new Date().toISOString().split('T')[0] }
          : w
      ),
      registrations: state.registrations.map((r) =>
        promotableWaitlist.find((p) => p.registrationId === r.id)
          ? { ...r, status: 'enrolled' as const, waitlisted: false }
          : r
      )
    })
  },

  removeWaitlist: (waitlistId) => {
    const state = get()
    const waitlistEntry = state.waitlistEntries.find((w) => w.id === waitlistId)
    if (!waitlistEntry) return

    set({
      waitlistEntries: state.waitlistEntries.filter((w) => w.id !== waitlistId),
      registrations: state.registrations.map((r) =>
        r.id === waitlistEntry.registrationId
          ? { ...r, waitlisted: false, status: 'cancelled' as const }
          : r
      )
    })
  },

  markWaitlistNotified: (waitlistId) => {
    const state = get()
    set({
      waitlistEntries: state.waitlistEntries.map((w) =>
        w.id === waitlistId ? { ...w, notified: true, notifiedDate: new Date().toISOString().split('T')[0] } : w
      )
    })
  },

  getStatistics: () => {
    const state = get()
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const today = now.toISOString().split('T')[0]

    const elderCount = state.elders.length
    const courseCount = state.courses.length
    const registrationCount = state.registrations.length

    const riskUnconfirmed = state.registrations.filter(
      (r) => !r.healthConfirmed && r.status === 'pending'
    ).length

    const waitlistPendingPromotion = state.registrations.filter(
      (r) =>
        r.waitlisted &&
        r.status === 'pending' &&
        !r.reinstatementPending
    ).length

    const suspendedByAbsence = state.registrations.filter(
      (r) => r.status === 'suspended' && !r.reinstatementPending
    ).length

    const reinstatementPending = state.registrations.filter(
      (r) => r.reinstatementPending
    ).length

    const normalEnrolled = state.registrations.filter(
      (r) => r.status === 'enrolled' && !r.reinstatementPending
    ).length

    const todayAttendanceCount = state.attendances.filter((a) => a.checkInDate === today).length

    const monthlyRevenue = state.registrations
      .filter((r) => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.amountPaid ?? 0), 0)

    const pendingDirectorTodos = state.directorTodos.filter((t) => t.status === 'pending').length

    return {
      elderCount,
      courseCount,
      registrationCount,
      todayAttendanceCount,
      monthlyRevenue,
      activeRegistrations: normalEnrolled,
      waitlistCount: waitlistPendingPromotion,
      riskUnconfirmed,
      waitlistPendingPromotion,
      suspendedByAbsence,
      reinstatementPending,
      normalEnrolled,
      pendingDirectorTodos
    }
  },

  getElderById: (id) => get().elders.find((e) => e.id === id),

  getCourseById: (id) => get().courses.find((c) => c.id === id),

  getTeacherById: (id) => get().teachers.find((t) => t.id === id),

  getVenueById: (id) => get().venues.find((v) => v.id === id),

  getLevelById: (id) => get().levels.find((l) => l.id === id),

  getRegistrationsByElder: (elderId) =>
    get()
      .registrations.filter((r) => r.elderId === elderId)
      .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()),

  getRegistrationsByCourse: (courseId) =>
    get()
      .registrations.filter((r) => r.courseId === courseId)
      .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime()),

  getAttendancesByCourseAndDate: (courseId, date) =>
    get().attendances.filter((a) => a.courseId === courseId && a.checkInDate === date),

  getSuspendedElders: () =>
    get().registrations.filter((r) => r.status === 'suspended' && !r.reinstatementPending),

  getTodayExceptions: () =>
    get().attendances.filter(
      (a) => a.checkInDate === new Date().toISOString().split('T')[0] && a.status === 'exception'
    ),

  getRegistrationsWithDetailedStatus: () => {
    const state = get()
    return state.registrations.map((r) => ({
      ...r,
      detailedStatus: state.getDetailedRegistrationStatus(r)
    }))
  }
}))