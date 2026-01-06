// Data Repository Implementation - Firebase Member Repository
// Complete implementation for member data operations

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IMemberRepository } from '../../domain/repositories/IMemberRepository';
import { Member, MemberStatus, MemberType, Address } from '../../domain/entities/Member';

export class FirebaseMemberRepository implements IMemberRepository {
  private readonly collectionName = 'members';

  async findById(id: string): Promise<Member | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToMember(id, docSnap.data());
    } catch (error) {
      console.error('Error finding member by id:', error);
      throw new Error('Erro ao buscar membro');
    }
  }

  async findByEmail(email: string): Promise<Member | null> {
    try {
      const q = query(
        collection(db, this.collectionName), 
        where('email', '==', email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.mapToMember(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding member by email:', error);
      throw new Error('Erro ao buscar membro por email');
    }
  }

  async findAll(): Promise<Member[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToMember(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all members:', error);
      throw new Error('Erro ao buscar membros');
    }
  }

  async findByStatus(status: MemberStatus): Promise<Member[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToMember(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding members by status:', error);
      throw new Error('Erro ao buscar membros por status');
    }
  }

  async findByMinistry(ministry: string): Promise<Member[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('ministries', 'array-contains', ministry),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToMember(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding members by ministry:', error);
      throw new Error('Erro ao buscar membros por ministério');
    }
  }

  async findBirthdays(month: number): Promise<Member[]> {
    try {
      // Note: This is a simplified approach. In production, you might want to use
      // a more sophisticated query or index the birth month separately
      const allMembers = await this.findAll();
      
      return allMembers.filter(member => {
        if (!member.birthDate) {
          return false;
        }
        const birthMonth = new Date(member.birthDate).getMonth() + 1; // getMonth() is 0-based
        return birthMonth === month;
      });
    } catch (error) {
      console.error('Error finding birthdays:', error);
      throw new Error('Erro ao buscar aniversários');
    }
  }

  async search(searchQuery: string): Promise<Member[]> {
    try {
      // Firestore doesn't support full-text search natively
      // This is a basic implementation that searches by name
      const allMembers = await this.findAll();
      const query = searchQuery.toLowerCase();
      
      return allMembers.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.phone.includes(query)
      );
    } catch (error) {
      console.error('Error searching members:', error);
      throw new Error('Erro ao pesquisar membros');
    }
  }

  async create(member: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<Member> {
    try {
      const memberData = {
        ...member,
        birthDate: Timestamp.fromDate(member.birthDate),
        baptismDate: member.baptismDate ? Timestamp.fromDate(member.baptismDate) : null,
        conversionDate: member.conversionDate ? Timestamp.fromDate(member.conversionDate) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.collectionName), memberData);
      
      return {
        id: docRef.id,
        ...member,
        createdAt: memberData.createdAt.toDate(),
        updatedAt: memberData.updatedAt.toDate()
      };
    } catch (error) {
      console.error('Error creating member:', error);
      throw new Error('Erro ao criar membro');
    }
  }

  async update(id: string, data: Partial<Member>): Promise<Member> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Convert dates to Timestamps
      if (data.birthDate) {
        updateData.birthDate = Timestamp.fromDate(data.birthDate);
      }
      if (data.baptismDate) {
        updateData.baptismDate = Timestamp.fromDate(data.baptismDate);
      }
      if (data.conversionDate) {
        updateData.conversionDate = Timestamp.fromDate(data.conversionDate);
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.collectionName, id), updateData);

      const updatedMember = await this.findById(id);
      if (!updatedMember) {
        throw new Error('Membro não encontrado após atualização');
      }

      return updatedMember;
    } catch (error) {
      console.error('Error updating member:', error);
      throw new Error('Erro ao atualizar membro');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error('Error deleting member:', error);
      throw new Error('Erro ao deletar membro');
    }
  }

  async transferMember(memberId: string, toChurch: string, transferredBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, memberId), {
        status: MemberStatus.Transferred,
        transferredTo: toChurch,
        transferredBy,
        transferredAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error transferring member:', error);
      throw new Error('Erro ao transferir membro');
    }
  }

  async disciplineMember(memberId: string, reason: string, disciplinedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, memberId), {
        status: MemberStatus.Disciplined,
        disciplineReason: reason,
        disciplinedBy,
        disciplinedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error disciplining member:', error);
      throw new Error('Erro ao disciplinar membro');
    }
  }

  async restoreMember(memberId: string, restoredBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, memberId), {
        status: MemberStatus.Active,
        restoredBy,
        restoredAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error restoring member:', error);
      throw new Error('Erro ao restaurar membro');
    }
  }

  async countTotal(): Promise<number> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting total members:', error);
      throw new Error('Erro ao contar membros');
    }
  }

  async countByStatus(status: MemberStatus): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting members by status:', error);
      throw new Error('Erro ao contar membros por status');
    }
  }

  async countByMinistry(ministry: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('ministries', 'array-contains', ministry)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting members by ministry:', error);
      throw new Error('Erro ao contar membros por ministério');
    }
  }

  async getAgeDistribution(): Promise<Map<string, number>> {
    try {
      const members = await this.findAll();
      const distribution = new Map<string, number>();
      
      // Initialize age groups
      const ageGroups = ['0-17', '18-29', '30-49', '50-69', '70+'];
      ageGroups.forEach(group => distribution.set(group, 0));

      members.forEach(member => {
        const age = this.calculateAge(member.birthDate);
        let group: string;
        
        if (age < 18) group = '0-17';
        else if (age < 30) group = '18-29';
        else if (age < 50) group = '30-49';
        else if (age < 70) group = '50-69';
        else group = '70+';
        
        distribution.set(group, (distribution.get(group) || 0) + 1);
      });

      return distribution;
    } catch (error) {
      console.error('Error getting age distribution:', error);
      throw new Error('Erro ao obter distribuição de idades');
    }
  }

  async getGrowthStats(startDate: Date, endDate: Date): Promise<number> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting growth stats:', error);
      throw new Error('Erro ao obter estatísticas de crescimento');
    }
  }

  private mapToMember(id: string, data: any): Member {
    // Handle both Portuguese and English field names for backward compatibility
    const birthDate = data.birthDate?.toDate() || data.dataNascimento?.toDate() || new Date();
    const baptismDate = data.baptismDate?.toDate() || data.dadosBatismo?.data?.toDate();
    const conversionDate = data.conversionDate?.toDate();

    return {
      id,
      name: data.name || data.nome,
      email: data.email || '',
      phone: data.phone || data.telefone,
      birthDate,
      address: data.address || data.endereco as Address,
      maritalStatus: data.maritalStatus || data.estadoCivil,
      baptismDate,
      conversionDate,
      ministries: data.ministries || data.ministerios || [],
      role: data.role,
      observations: data.observations,
      photoURL: data.photoURL,
      status: (data.status || data.status) as MemberStatus,
      memberType: data.memberType || MemberType.Member, // Default to Member for existing records
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}