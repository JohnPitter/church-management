/**
 * Cloud Functions for Church Management System
 *
 * These functions handle server-side operations that require admin privileges,
 * such as creating and deleting user accounts in Firebase Authentication.
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export upload thumbnail function
export { uploadStreamThumbnail } from './uploadStreamThumbnail';

// Export upload profile photo function
export { uploadProfilePhoto } from './uploadProfilePhoto';

// Export push notification trigger (FCM) for new notifications
export { onNotificationCreated } from './onNotificationCreated';

/**
 * Create User Account
 *
 * Creates a new user in Firebase Auth and Firestore.
 * Requires admin authentication.
 */
export const createUserAccount = functions
  .region('southamerica-east1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado'
      );
    }

    // Verify admin role
    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    const callerRole = callerDoc.data()?.role;

    if (callerRole !== 'admin' && callerRole !== 'secretary') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores e secretários podem criar usuários'
      );
    }

    // Validate input
    const { email, password, displayName, role } = data;

    if (!email || !password || !displayName) {
      throw new functions.https.HttpsError(
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
        createdBy: context.auth.token.email || 'admin',
      });

      functions.logger.info('User created successfully', {
        userId: userRecord.uid,
        email,
        role,
        createdBy: context.auth.token.email
      });

      return {
        success: true,
        userId: userRecord.uid,
        message: 'Usuário criado com sucesso'
      };
    } catch (error: any) {
      functions.logger.error('Error creating user', {
        error: error.message,
        email,
        role
      });

      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'Este email já está cadastrado'
        );
      }

      throw new functions.https.HttpsError(
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
export const deleteUserAccount = functions
  .region('southamerica-east1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado'
      );
    }

    // Verify admin role
    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    const callerRole = callerDoc.data()?.role;

    if (callerRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem deletar usuários'
      );
    }

    // Validate input
    const { userId } = data;

    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID do usuário é obrigatório'
      );
    }

    // Prevent self-deletion
    if (userId === callerUid) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Você não pode deletar sua própria conta'
      );
    }

    try {
      // Get user data before deletion (for logging)
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new functions.https.HttpsError(
          'not-found',
          'Usuário não encontrado'
        );
      }

      // Delete user from Firebase Auth
      await admin.auth().deleteUser(userId);

      // Delete user document from Firestore
      await admin.firestore().collection('users').doc(userId).delete();

      functions.logger.info('User deleted successfully', {
        userId,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        deletedBy: context.auth.token.email
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
      functions.logger.error('Error deleting user', {
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
          throw new functions.https.HttpsError(
            'internal',
            'Erro ao deletar usuário do Firestore: ' + firestoreError.message
          );
        }
      }

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erro ao deletar usuário: ' + error.message
      );
    }
  });

/**
 * Bootstrap do primeiro admin (setup inicial).
 * Só funciona se ainda não existir nenhum usuário com role admin.
 * Usa Admin SDK (bypassa Firestore rules).
 */
export const bootstrapFirstAdmin = functions
  .region('southamerica-east1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado'
      );
    }

    const adminsSnap = await admin
      .firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    if (!adminsSnap.empty) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Já existe um administrador no sistema. Use o fluxo normal de usuários.'
      );
    }

    const uid = context.auth.uid;
    const email = (context.auth.token.email || data?.email || '').toString().toLowerCase();
    const displayName =
      (data?.displayName as string) ||
      (context.auth.token.name as string) ||
      'Administrador';
    const photoURL = (data?.photoURL as string) || (context.auth.token.picture as string) || null;

    const now = admin.firestore.FieldValue.serverTimestamp();
    await admin.firestore().collection('users').doc(uid).set(
      {
        email,
        displayName,
        photoURL,
        role: 'admin',
        status: 'approved',
        createdAt: now,
        updatedAt: now,
        approvedBy: 'system-bootstrap',
        approvedAt: now,
      },
      { merge: true }
    );

    await admin.firestore().collection('settings').doc('system').set(
      {
        initialized: true,
        firstAdminCreated: now,
        version: '1.3.0',
        bootstrapVia: 'bootstrapFirstAdmin',
      },
      { merge: true }
    );

    functions.logger.info('First admin bootstrapped', { uid, email });

    return {
      success: true,
      userId: uid,
      message: 'Administrador inicial criado com sucesso',
    };
  });
