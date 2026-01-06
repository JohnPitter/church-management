// Use Case - Create Member
// Business logic for creating a new church member

import { Member, MemberEntity, Address, MemberStatus } from '@modules/church-management/members/domain/entities/Member';
import { User, UserEntity } from '@modules/user-management/users/domain/entities/User';
import { IMemberRepository } from '@modules/church-management/members/domain/repositories/IMemberRepository';
import { IAuditService } from '@modules/church-management/members/domain/services/IAuditService';

export interface CreateMemberUseCaseInput {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  address: Address;
  maritalStatus: Member['maritalStatus'];
  baptismDate?: string;
  conversionDate?: string;
  ministries?: string[];
  role?: string;
  observations?: string;
  photoURL?: string;
}

export class CreateMemberUseCase {
  constructor(
    private memberRepository: IMemberRepository,
    private auditService: IAuditService
  ) {}

  async execute(
    input: CreateMemberUseCaseInput, 
    currentUser: User
  ): Promise<Member> {
    // Check permissions
    if (!UserEntity.canCreateContent(currentUser)) {
      throw new Error('Você não tem permissão para cadastrar membros');
    }

    // Validate input
    this.validateInput(input);

    // Check if member already exists
    const existingMember = await this.memberRepository.findByEmail(input.email);
    if (existingMember) {
      throw new Error('Já existe um membro cadastrado com este email');
    }

    // Prepare member data
    const memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> = {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      phone: MemberEntity.formatPhone(input.phone),
      birthDate: new Date(input.birthDate),
      address: this.validateAddress(input.address),
      maritalStatus: input.maritalStatus,
      baptismDate: input.baptismDate ? new Date(input.baptismDate) : undefined,
      conversionDate: input.conversionDate ? new Date(input.conversionDate) : undefined,
      ministries: input.ministries || [],
      role: input.role,
      observations: input.observations,
      photoURL: input.photoURL,
      status: MemberStatus.Active,
      createdBy: currentUser.id
    };

    // Validate business rules
    this.validateBusinessRules(memberData);

    // Create member
    const newMember = await this.memberRepository.create(memberData);

    // Log action
    await this.auditService.log({
      userId: currentUser.id,
      action: 'CREATE_MEMBER',
      entityType: 'member',
      entityId: newMember.id,
      details: {
        memberName: newMember.name,
        memberEmail: newMember.email
      }
    });

    return newMember;
  }

  private validateInput(input: CreateMemberUseCaseInput): void {
    // Validate required fields
    if (!input.name || !input.email || !input.phone || !input.birthDate) {
      throw new Error('Nome, email, telefone e data de nascimento são obrigatórios');
    }

    // Validate email format
    if (!MemberEntity.validateEmail(input.email)) {
      throw new Error('Email inválido');
    }

    // Validate phone format
    if (!MemberEntity.validatePhone(MemberEntity.formatPhone(input.phone))) {
      throw new Error('Telefone inválido. Use o formato (XX) XXXXX-XXXX');
    }

    // Validate birth date
    const birthDate = new Date(input.birthDate);
    if (birthDate > new Date()) {
      throw new Error('Data de nascimento não pode ser no futuro');
    }
  }

  private validateAddress(address: Address): Address {
    if (!address.street || !address.number || !address.neighborhood || 
        !address.city || !address.state || !address.zipCode) {
      throw new Error('Endereço incompleto');
    }

    return {
      street: address.street.trim(),
      number: address.number.trim(),
      complement: address.complement?.trim(),
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim().toUpperCase(),
      zipCode: address.zipCode.replace(/\D/g, '')
    };
  }

  private validateBusinessRules(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Validate baptism date
    if (member.baptismDate && member.birthDate) {
      if (member.baptismDate < member.birthDate) {
        throw new Error('Data de batismo não pode ser anterior à data de nascimento');
      }
    }

    // Validate conversion date
    if (member.conversionDate && member.birthDate) {
      if (member.conversionDate < member.birthDate) {
        throw new Error('Data de conversão não pode ser anterior à data de nascimento');
      }
    }

    // Validate conversion and baptism dates
    if (member.baptismDate && member.conversionDate) {
      if (member.baptismDate < member.conversionDate) {
        throw new Error('Data de batismo não pode ser anterior à data de conversão');
      }
    }
  }
}

