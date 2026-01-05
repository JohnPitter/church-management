// Domain Repository Interface - Member
// Defines the contract for member data operations

import { Member, MemberStatus } from '../entities/Member';

export interface IMemberRepository {
  // Query methods
  findById(id: string): Promise<Member | null>;
  findByEmail(email: string): Promise<Member | null>;
  findAll(): Promise<Member[]>;
  findByStatus(status: MemberStatus): Promise<Member[]>;
  findByMinistry(ministry: string): Promise<Member[]>;
  findBirthdays(month: number): Promise<Member[]>;
  search(query: string): Promise<Member[]>;
  
  // Command methods
  create(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member>;
  update(id: string, data: Partial<Member>): Promise<Member>;
  delete(id: string): Promise<void>;
  
  // Business operations
  transferMember(memberId: string, toChurch: string, transferredBy: string): Promise<void>;
  disciplineMember(memberId: string, reason: string, disciplinedBy: string): Promise<void>;
  restoreMember(memberId: string, restoredBy: string): Promise<void>;
  
  // Statistics
  countTotal(): Promise<number>;
  countByStatus(status: MemberStatus): Promise<number>;
  countByMinistry(ministry: string): Promise<number>;
  getAgeDistribution(): Promise<Map<string, number>>;
  getGrowthStats(startDate: Date, endDate: Date): Promise<number>;
}