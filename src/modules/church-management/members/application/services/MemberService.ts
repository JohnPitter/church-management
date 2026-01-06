// Infrastructure Service - Member Service
// Service layer for member-related operations using English entities

import { Member, MemberStatus } from '@modules/church-management/members/domain/entities/Member';
import { FirebaseMemberRepository } from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository';

export interface MemberStatistics {
  total: number;
  active: number;
  inactive: number;
  transferred: number;
  disciplined: number;
  ageDistribution: Map<string, number>;
  monthlyGrowth: number;
}

export class MemberService {
  private memberRepository: FirebaseMemberRepository;

  constructor() {
    this.memberRepository = new FirebaseMemberRepository();
  }

  // Get all members
  async getAllMembers(): Promise<Member[]> {
    return await this.memberRepository.findAll();
  }

  // Get member by ID
  async getMemberById(id: string): Promise<Member | null> {
    return await this.memberRepository.findById(id);
  }

  // Get members by status
  async getMembersByStatus(status: MemberStatus): Promise<Member[]> {
    return await this.memberRepository.findByStatus(status);
  }

  // Search members
  async searchMembers(query: string): Promise<Member[]> {
    return await this.memberRepository.search(query);
  }

  // Create new member
  async createMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    return await this.memberRepository.create(memberData);
  }

  // Update member
  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    return await this.memberRepository.update(id, updates);
  }

  // Update member status
  async updateMemberStatus(id: string, status: MemberStatus): Promise<Member> {
    return await this.memberRepository.update(id, { status });
  }

  // Delete member
  async deleteMember(id: string): Promise<void> {
    return await this.memberRepository.delete(id);
  }

  // Transfer member
  async transferMember(memberId: string, toChurch: string, transferredBy: string): Promise<void> {
    return await this.memberRepository.transferMember(memberId, toChurch, transferredBy);
  }

  // Discipline member
  async disciplineMember(memberId: string, reason: string, disciplinedBy: string): Promise<void> {
    return await this.memberRepository.disciplineMember(memberId, reason, disciplinedBy);
  }

  // Restore member
  async restoreMember(memberId: string, restoredBy: string): Promise<void> {
    return await this.memberRepository.restoreMember(memberId, restoredBy);
  }

  // Get member statistics
  async getStatistics(): Promise<MemberStatistics> {
    const [
      total,
      active,
      inactive,
      transferred,
      disciplined,
      ageDistribution,
      monthlyGrowth
    ] = await Promise.all([
      this.memberRepository.countTotal(),
      this.memberRepository.countByStatus(MemberStatus.Active),
      this.memberRepository.countByStatus(MemberStatus.Inactive),
      this.memberRepository.countByStatus(MemberStatus.Transferred),
      this.memberRepository.countByStatus(MemberStatus.Disciplined),
      this.memberRepository.getAgeDistribution(),
      this.getMonthlyGrowth()
    ]);

    return {
      total,
      active,
      inactive,
      transferred,
      disciplined,
      ageDistribution,
      monthlyGrowth
    };
  }

  // Get birthdays for current month
  async getBirthdays(month?: number): Promise<Member[]> {
    const targetMonth = month || new Date().getMonth() + 1;
    return await this.memberRepository.findBirthdays(targetMonth);
  }

  // Get members by ministry
  async getMembersByMinistry(ministry: string): Promise<Member[]> {
    return await this.memberRepository.findByMinistry(ministry);
  }

  // Get growth statistics for current month
  private async getMonthlyGrowth(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return await this.memberRepository.getGrowthStats(startOfMonth, endOfMonth);
  }

  // Export members data
  async exportMembers(): Promise<any[]> {
    const members = await this.getAllMembers();
    
    return members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      birthDate: member.birthDate.toLocaleDateString(),
      address: member.address ? `${member.address.street}, ${member.address.city}` : '',
      maritalStatus: member.maritalStatus,
      baptismDate: member.baptismDate?.toLocaleDateString() || '',
      ministries: member.ministries?.join(', ') || '',
      status: member.status,
      createdAt: member.createdAt.toLocaleDateString()
    }));
  }

  // Generate member reports
  async generateReport(type: 'active' | 'inactive' | 'birthdays' | 'all' = 'all'): Promise<any> {
    const statistics = await this.getStatistics();
    
    let members: Member[] = [];
    switch (type) {
      case 'active':
        members = await this.getMembersByStatus(MemberStatus.Active);
        break;
      case 'inactive':
        members = await this.getMembersByStatus(MemberStatus.Inactive);
        break;
      case 'birthdays':
        members = await this.getBirthdays();
        break;
      default:
        members = await this.getAllMembers();
        break;
    }

    return {
      type,
      generatedAt: new Date(),
      statistics,
      members,
      count: members.length
    };
  }
}
