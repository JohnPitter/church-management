// Infrastructure Service - Firebase Auth Service
// Complete implementation for authentication services

import { IAuthService } from '@modules/user-management/users/domain/services/IAuthService';
import { User, UserStatus, UserRole } from '@modules/User';
import { auth, db } from '@/config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export class FirebaseAuthService implements IAuthService {
  async login(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.getFullUserData(credential.user);
      
      if (!user) {
        throw new Error('Dados do usuário não encontrados');
      }

      return user;
    } catch (error: any) {
      // Check if the error is related to authentication method
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        try {
          // Check what sign-in methods are available for this email
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);
          
          if (signInMethods.length > 0) {
            if (signInMethods.includes('google.com')) {
              throw new Error('Esta conta foi criada com Google. Use "Continuar com Google" para fazer login.');
            }
            if (signInMethods.includes('password')) {
              throw new Error('Email ou senha incorretos.');
            }
          }
        } catch (methodError) {
          // If we can't check methods, fall back to original error
        }
      }
      
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const credential = await signInWithPopup(auth, provider);
      
      const user = await this.getFullUserData(credential.user);
      
      if (!user) {
        throw new Error('Dados do usuário não encontrados');
      }

      return user;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(this.getErrorMessage(error.code || 'unknown'));
    }
  }

  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        email: email.toLowerCase(),
        displayName,
        role: UserRole.Member,  // Membro da igreja
        status: UserStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Remove undefined fields before saving to Firestore
      const firestoreData: any = {
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        status: userData.status,
        createdAt: Timestamp.fromDate(userData.createdAt),
        updatedAt: Timestamp.fromDate(userData.updatedAt)
      };

      await setDoc(doc(db, 'users', credential.user.uid), firestoreData);

      return {
        id: credential.user.uid,
        ...userData
      };
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Erro ao sair da conta');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    return await this.getFullUserData(firebaseUser);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.getFullUserData(firebaseUser);
          callback(user);
        } catch (error: any) {
          console.warn('Error fetching user data, but user is authenticated:', error);
          // Don't logout the user just because we can't fetch their profile
          // Instead, create a basic user object from Firebase data
          const basicUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Usuário',
            role: UserRole.Member, // Default role - membro da igreja
            status: UserStatus.Approved,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          callback(basicUser);
        }
      } else {
        callback(null);
      }
    });
  }

  async linkEmailPassword(password: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Nenhum usuário logado');
      }

      // Check if user already has password authentication
      const signInMethods = await fetchSignInMethodsForEmail(auth, currentUser.email!);
      if (signInMethods.includes('password')) {
        throw new Error('Este usuário já possui uma senha definida');
      }

      // Create email credential and link it
      const credential = EmailAuthProvider.credential(currentUser.email!, password);
      await linkWithCredential(currentUser, credential);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async getSignInMethods(email: string): Promise<string[]> {
    try {
      return await fetchSignInMethodsForEmail(auth, email);
    } catch (error: any) {
      throw new Error('Erro ao verificar métodos de login');
    }
  }

  private async getFullUserData(firebaseUser: FirebaseUser): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Create default user document if it doesn't exist
        const userData: Omit<User, 'id'> = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email || '',
          role: UserRole.Member,  // Membro da igreja
          status: UserStatus.Pending,
          createdAt: new Date(),
          updatedAt: new Date(),
          photoURL: firebaseUser.photoURL || undefined,
          phoneNumber: firebaseUser.phoneNumber || undefined
        };

        // Remove undefined fields before saving to Firestore
        const firestoreData: any = {
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          status: userData.status,
          createdAt: Timestamp.fromDate(userData.createdAt),
          updatedAt: Timestamp.fromDate(userData.updatedAt)
        };

        if (userData.photoURL) {
          firestoreData.photoURL = userData.photoURL;
        }

        if (userData.phoneNumber) {
          firestoreData.phoneNumber = userData.phoneNumber;
        }

        if (userData.biography) {
          firestoreData.biography = userData.biography;
        }

        await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);

        return {
          id: firebaseUser.uid,
          ...userData
        };
      }

      const data = userDoc.data();
      return {
        id: firebaseUser.uid,
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
    } catch (error) {
      // Silently fail and return null
      return null;
    }
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Conta desabilitada';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Tente novamente mais tarde';
      case 'auth/popup-closed-by-user':
        return 'Login cancelado pelo usuário';
      case 'auth/popup-blocked':
        return 'Popup bloqueado pelo navegador. Permita popups para este site';
      case 'auth/cancelled-popup-request':
        return 'Solicitação de popup foi cancelada';
      case 'auth/network-request-failed':
        return 'Erro de conexão. Verifique sua internet';
      case 'auth/unauthorized-domain':
        return 'Domínio não autorizado para login com Google';
      case 'auth/operation-not-allowed':
        return 'Login com Google não está habilitado. Configure no Firebase Console: Authentication → Sign-in providers → Google';
      default:
        console.error('Firebase Auth Error Code:', errorCode);
        return `Erro de autenticação: ${errorCode}`;
    }
  }
}
