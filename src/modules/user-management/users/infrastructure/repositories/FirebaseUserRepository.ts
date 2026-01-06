// Data Repository Implementation - Firebase User Repository
// Implements the IUserRepository interface using Firebase

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '@/config/firebase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserCredentials, UserRegistration, UserRole, UserStatus } from '@/domain/entities/User';

export class FirebaseUserRepository implements IUserRepository {
  private readonly collectionName = 'users';

  async findById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToUser(id, docSnap.data());
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw new Error('Erro ao buscar usuário');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
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
      return this.mapToUser(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Erro ao buscar usuário por email');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToUser(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new Error('Erro ao buscar usuários');
    }
  }

  async findByRole(role: UserRole): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('role', '==', role),
        orderBy('displayName', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToUser(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding users by role:', error);
      throw new Error('Erro ao buscar usuários por perfil');
    }
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToUser(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding users by status:', error);
      throw new Error('Erro ao buscar usuários por status');
    }
  }

  async create(data: UserRegistration): Promise<User> {
    try {
      // Verify admin is logged in
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário administrador não está logado');
      }

      console.log('Creating user account via Cloud Function:', {
        email: data.email,
        displayName: data.displayName,
        role: data.role || UserRole.Member
      });

      // Generate temporary password for user creation
      const temporaryPassword = this.generateTemporaryPassword();

      // Call Cloud Function to create user account (região Brasil)
      const createUserAccount = httpsCallable(functions, 'createUserAccount');

      const result = await createUserAccount({
        email: data.email,
        password: temporaryPassword,
        displayName: data.displayName,
        role: data.role || UserRole.Member
      });

      const resultData = result.data as {
        success: boolean;
        userId: string;
        message: string;
      };

      if (!resultData.success) {
        throw new Error(resultData.message || 'Erro ao criar conta de usuário');
      }

      console.log('User account created successfully:', resultData);

      // Fetch the created user from Firestore
      const newUser = await this.findById(resultData.userId);
      if (!newUser) {
        throw new Error('Usuário criado mas não encontrado no banco de dados');
      }

      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle Cloud Function errors
      if (error.code === 'already-exists') {
        throw new Error('Este email já está cadastrado');
      } else if (error.code === 'permission-denied') {
        throw new Error('Sem permissão para criar usuários');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Dados inválidos fornecidos');
      }
      
      throw new Error('Erro ao criar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  }

  private generateTemporaryPassword(): string {
    // Generate a temporary password with letters, numbers and symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;

      // Remove undefined fields - Firestore doesn't accept undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(doc(db, this.collectionName, id), updateData);

      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('Usuário não encontrado após atualização');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Erro ao atualizar usuário');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Use Cloud Function to delete user from both Auth and Firestore (região Brasil)
      const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
      
      console.log('Deleting user account via Cloud Function:', { userId: id });
      
      const result = await deleteUserAccount({ userId: id });
      
      const resultData = result.data as {
        success: boolean;
        message: string;
        deletedUser?: {
          email: string;
          displayName: string;
          role: string;
        };
      };

      if (!resultData.success) {
        throw new Error(resultData.message || 'Erro ao deletar usuário');
      }

      console.log('User account deleted successfully:', resultData);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      // Handle Cloud Function errors
      if (error.code === 'permission-denied') {
        throw new Error('Sem permissão para deletar usuários');
      } else if (error.code === 'not-found') {
        throw new Error('Usuário não encontrado');
      } else if (error.code === 'failed-precondition') {
        throw new Error(error.message || 'Não é possível deletar este usuário');
      }
      
      throw new Error('Erro ao deletar usuário: ' + (error.message || 'Erro desconhecido'));
    }
  }

  async authenticate(credentials: UserCredentials): Promise<User | null> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      return await this.findById(userCredential.user.uid);
    } catch (error: any) {
      console.error('Error authenticating user:', error);
      
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-email') {
        return null;
      }
      
      throw new Error('Erro ao autenticar usuário');
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('Usuário não autenticado');
      }

      await firebaseUpdatePassword(currentUser, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Erro ao atualizar senha');
    }
  }

  async approveUser(userId: string, approvedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, userId), {
        status: UserStatus.Approved,
        approvedBy,
        approvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error approving user:', error);
      throw new Error('Erro ao aprovar usuário');
    }
  }

  async rejectUser(userId: string, rejectedBy: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, userId), {
        status: UserStatus.Rejected,
        rejectedBy,
        rejectedAt: Timestamp.now(),
        rejectionReason: reason,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw new Error('Erro ao rejeitar usuário');
    }
  }

  async suspendUser(userId: string, suspendedBy: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, userId), {
        status: UserStatus.Suspended,
        suspendedBy,
        suspendedAt: Timestamp.now(),
        suspensionReason: reason,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      throw new Error('Erro ao suspender usuário');
    }
  }

  async updateRole(userId: string, newRole: UserRole | string, updatedBy: string): Promise<void> {
    try {
      console.log(`[FirebaseUserRepository] Updating role for user ${userId} to: ${newRole}`);
      await updateDoc(doc(db, this.collectionName, userId), {
        role: newRole,
        roleUpdatedBy: updatedBy,
        roleUpdatedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`[FirebaseUserRepository] Role updated successfully`);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Erro ao atualizar perfil do usuário');
    }
  }

  private mapToUser(id: string, data: any): User {
    return {
      id,
      email: data.email,
      displayName: data.displayName,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      photoURL: data.photoURL,
      phoneNumber: data.phoneNumber,
      biography: data.biography
    };
  }
}