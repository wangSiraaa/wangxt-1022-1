export type UserRole = 'socialWorker' | 'elder' | 'teacher' | 'director'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
  phone: string
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface HealthRecord {
  elderId: string
  chronicDiseases: string[]
  allergies: string[]
  currentMedications: string[]
  lastCheckupDate: string
  bloodPressure: string
  bloodSugar: string
  heartRate: string
  notes: string
}

export interface RiskAssessment {
  elderId: string
  assessmentDate: string
  fallRisk: 'low' | 'medium' | 'high'
  exerciseTolerance: 'normal' | 'limited' | 'severelyLimited'
  heartCondition: boolean
  highBloodPressure: boolean
  diabetes: boolean
  doctorRecommendation: string
  canParticipateSports: boolean
  requiresGuardian: boolean
}

export interface Elder {
  id: string
  name: string
  gender: 'male' | 'female'
  age: number
  phone: string
  address: string
  idCard: string
  avatar?: string
  emergencyContacts: EmergencyContact[]
  healthRecord?: HealthRecord
  riskAssessment?: RiskAssessment
  registrationDate: string
  status: 'active' | 'suspended' | 'inactive'
  consecutiveAbsences: number
  isSuspended: boolean
  suspensionReason?: string
}

export interface Teacher {
  id: string
  name: string
  gender: 'male' | 'female'
  age: number
  phone: string
  specialty: string[]
  avatar?: string
  status: 'active' | 'inactive'
}

export interface Venue {
  id: string
  name: string
  capacity: number
  equipment: string[]
  location: string
  status: 'available' | 'occupied' | 'maintenance'
}

export interface CourseLevel {
  id: string
  name: string
  description: string
  minAge: number
  maxAge: number
  requiredPhysicalCondition: string
}

export type CourseType = 'calligraphy' | 'dance' | 'health' | 'sports'

export interface CourseSchedule {
  id: string
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  teacherId: string
  venueId: string
  startDate: string
  endDate: string
}

export interface Course {
  id: string
  name: string
  type: CourseType
  description: string
  levelId: string
  maxParticipants: number
  currentParticipants: number
  waitlistCount: number
  requiresHealthCheck: boolean
  schedules: CourseSchedule[]
  status: 'draft' | 'published' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: string
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'cancelled' | 'suspended'

export interface Registration {
  id: string
  elderId: string
  courseId: string
  status: RegistrationStatus
  healthConfirmed: boolean
  healthConfirmationDate?: string
  confirmedBy?: string
  waitlistPosition?: number
  registrationDate: string
  cancelReason?: string
  suspensionReason?: string
  suspensionEndDate?: string
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'exception'

export interface Attendance {
  id: string
  registrationId: string
  elderId: string
  courseId: string
  scheduleId: string
  date: string
  status: AttendanceStatus
  checkInTime?: string
  notes?: string
  isException: boolean
  reportedToDirector: boolean
  handled: boolean
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ReinstatementApproval {
  id: string
  elderId: string
  courseId: string
  registrationId: string
  reason: string
  supportingDocuments?: string[]
  status: ApprovalStatus
  applicantId: string
  applicationDate: string
  reviewerId?: string
  reviewDate?: string
  reviewComments?: string
}

export interface WaitlistItem {
  id: string
  registrationId: string
  elderId: string
  courseId: string
  position: number
  addedDate: string
  expiresAt: string
  notified: boolean
}

export interface Statistics {
  totalCourses: number
  totalElders: number
  totalRegistrations: number
  attendanceRate: number
  averageOccupancy: number
  pendingApprovals: number
  todayAbsences: number
  todayExceptions: number
}

export type PageType = 'home' | 'socialWorker' | 'elder' | 'checkin' | 'director' | 'healthCheck' | 'waitlist' | 'absentList' | 'reinstatement' | 'statistics'
