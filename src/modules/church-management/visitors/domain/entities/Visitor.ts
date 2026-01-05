// Domain Entity - Visitor
// Represents church visitors and their information

export interface Visitor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  birthDate?: Date;
  gender?: 'masculino' | 'feminino';
  maritalStatus?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo';
  profession?: string;
  howDidYouKnow?: string;
  interests?: string[];
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: VisitorStatus;
  
  // Visit tracking
  firstVisitDate: Date;
  lastVisitDate?: Date;
  totalVisits: number;
  
  // Follow-up
  contactAttempts: ContactAttempt[];
  followUpStatus: FollowUpStatus;
  assignedTo?: string; // User ID responsible for follow-up
  
  // Integration
  isMember: boolean;
  memberId?: string;
  convertedToMemberAt?: Date;
}

export enum VisitorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CONVERTED = 'converted', // Became a member
  NO_CONTACT = 'no_contact'
}

export enum FollowUpStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NO_RESPONSE = 'no_response'
}

export interface ContactAttempt {
  id: string;
  date: Date;
  type: ContactType;
  method: ContactMethod;
  notes: string;
  successful: boolean;
  nextContactDate?: Date;
  contactedBy: string;
}

export enum ContactType {
  WELCOME = 'welcome',
  FOLLOW_UP = 'follow_up',
  INVITATION = 'invitation',
  PRAYER_REQUEST = 'prayer_request',
  OTHER = 'other'
}

export enum ContactMethod {
  PHONE = 'phone',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  IN_PERSON = 'in_person',
  LETTER = 'letter'
}

export interface VisitRecord {
  id: string;
  visitorId: string;
  visitDate: Date;
  service: ServiceType;
  registeredBy: string;
  notes?: string;
  broughtBy?: string; // Member who brought the visitor
  createdAt: Date;
}

export enum ServiceType {
  SUNDAY_MORNING = 'sunday_morning',
  SUNDAY_EVENING = 'sunday_evening',
  WEDNESDAY_PRAYER = 'wednesday_prayer',
  BIBLE_STUDY = 'bible_study',
  YOUTH_SERVICE = 'youth_service',
  CHILDREN_SERVICE = 'children_service',
  SPECIAL_EVENT = 'special_event',
  OTHER = 'other'
}

// Visitor Statistics
export interface VisitorStats {
  totalVisitors: number;
  newThisMonth: number;
  activeVisitors: number;
  convertedToMembers: number;
  pendingFollowUp: number;
  averageVisitsPerVisitor: number;
  retentionRate: number;
  conversionRate: number;
}
