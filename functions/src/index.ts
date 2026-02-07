/**
 * Cloud Functions for Church Management System
 *
 * These functions handle server-side operations that require admin privileges,
 * such as creating and deleting user accounts in Firebase Authentication.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set default region for all functions
setGlobalOptions({ region: 'southamerica-east1' });

// Export upload thumbnail function
export { uploadStreamThumbnail } from './uploadStreamThumbnail';

// Export upload profile photo function
export { uploadProfilePhoto } from './uploadProfilePhoto';

/**
 * Create User Account
 *
 * Creates a new user in Firebase Auth and Firestore.
 * Requires admin authentication.
 */
export const createUserAccount = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Usuário deve estar autenticado'
    );
  }

  // Verify admin role
  const callerUid = request.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole !== 'admin' && callerRole !== 'secretary') {
    throw new HttpsError(
      'permission-denied',
      'Apenas administradores e secretários podem criar usuários'
    );
  }

  // Validate input
  const { email, password, displayName, role } = request.data;

  if (!email || !password || !displayName) {
    throw new HttpsError(
      'invalid-argument',
      'Email, senha e nome são obrigatórios'
    );
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: email.toLowerCase(),
      displayName,
      role: role || 'member',
      status: 'approved',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.token.email || 'admin',
    });

    logger.info('User created successfully', {
      userId: userRecord.uid,
      email,
      role,
      createdBy: request.auth.token.email
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Usuário criado com sucesso'
    };
  } catch (error: any) {
    logger.error('Error creating user', {
      error: error.message,
      email,
      role
    });

    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError(
        'already-exists',
        'Este email já está cadastrado'
      );
    }

    throw new HttpsError(
      'internal',
      'Erro ao criar usuário: ' + error.message
    );
  }
});

/**
 * Delete User Account
 *
 * Deletes a user from both Firebase Auth and Firestore.
 * Requires admin authentication and prevents self-deletion.
 */
export const deleteUserAccount = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Usuário deve estar autenticado'
    );
  }

  // Verify admin role
  const callerUid = request.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Apenas administradores podem deletar usuários'
    );
  }

  // Validate input
  const { userId } = request.data;

  if (!userId) {
    throw new HttpsError(
      'invalid-argument',
      'ID do usuário é obrigatório'
    );
  }

  // Prevent self-deletion
  if (userId === callerUid) {
    throw new HttpsError(
      'failed-precondition',
      'Você não pode deletar sua própria conta'
    );
  }

  try {
    // Get user data before deletion (for logging)
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new HttpsError(
        'not-found',
        'Usuário não encontrado'
      );
    }

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(userId);

    // Delete user document from Firestore
    await admin.firestore().collection('users').doc(userId).delete();

    logger.info('User deleted successfully', {
      userId,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      deletedBy: request.auth.token.email
    });

    return {
      success: true,
      message: 'Usuário deletado com sucesso',
      deletedUser: {
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role
      }
    };
  } catch (error: any) {
    logger.error('Error deleting user', {
      error: error.message,
      userId
    });

    if (error.code === 'auth/user-not-found') {
      try {
        await admin.firestore().collection('users').doc(userId).delete();
        return {
          success: true,
          message: 'Usuário removido do Firestore (não existia no Auth)'
        };
      } catch (firestoreError: any) {
        throw new HttpsError(
          'internal',
          'Erro ao deletar usuário do Firestore: ' + firestoreError.message
        );
      }
    }

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      'internal',
      'Erro ao deletar usuário: ' + error.message
    );
  }
});
