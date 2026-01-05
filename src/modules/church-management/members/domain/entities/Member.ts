// Domain Entity - Member
// Represents a church member with all business rules

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: Date;
  address: Address;
  maritalStatus: MaritalStatus;
  memberType: MemberType; // Tipo: Membro ou Congregado
  baptismDate?: Date;
  conversionDate?: Date;
  ministries: string[];
  role?: string;
  observations?: string;
  photoURL?: string;
  status: MemberStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export enum MaritalStatus {
  Single = 'single',
  Married = 'married',
  Divorced = 'divorced',
  Widowed = 'widowed'
}

export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Transferred = 'transferred',
  Disciplined = 'disciplined'
}

export enum MemberType {
  Member = 'member',      // Membro oficial - pode assinar atas
  Congregant = 'congregant' // Congregado - não pode assinar atas
}

// Business Rules
export class MemberEntity {
  static calculateAge(member: Member): number {
    const today = new Date();
    const birthDate = new Date(member.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  static isMinor(member: Member): boolean {
    return this.calculateAge(member) < 18;
  }

  static isBaptized(member: Member): boolean {
    return !!member.baptismDate;
  }

  static canVoteInAssembly(member: Member): boolean {
    return member.status === MemberStatus.Active &&
           member.memberType === MemberType.Member && // Apenas membros oficiais podem votar
           this.isBaptized(member) &&
           !this.isMinor(member);
  }

  static canSignDocuments(member: Member): boolean {
    // Apenas membros oficiais podem assinar documentos/atas
    return member.status === MemberStatus.Active &&
           member.memberType === MemberType.Member &&
           !this.isMinor(member);
  }

  static isCongregant(member: Member): boolean {
    return member.memberType === MemberType.Congregant;
  }

  static isMember(member: Member): boolean {
    return member.memberType === MemberType.Member;
  }

  static getYearsAsMember(member: Member): number {
    if (!member.conversionDate) return 0;
    
    const today = new Date();
    const conversionDate = new Date(member.conversionDate);
    return today.getFullYear() - conversionDate.getFullYear();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  }

  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
  }
}
