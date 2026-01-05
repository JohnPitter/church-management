/**
 * Upload Profile Photo Cloud Function
 *
 * Handles profile photo uploads with proper validation and security.
 * This function receives a base64 encoded image and uploads it to Firebase Storage.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface UploadProfilePhotoData {
  imageData: string; // base64 encoded image
  fileName: string;
  contentType: string;
}

export const uploadProfilePhoto = functions
  .region('southamerica-east1')
  .https.onCall(async (data: UploadProfilePhotoData, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Usuário deve estar autenticado para fazer upload de foto'
      );
    }

    const userId = context.auth.uid;

    // Validate input
    const { imageData, fileName, contentType } = data;

    if (!imageData || !fileName || !contentType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Dados da imagem, nome do arquivo e tipo de conteúdo são obrigatórios'
      );
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Tipo de arquivo não suportado. Use JPEG, PNG, GIF ou WebP'
      );
    }

    try {
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (imageBuffer.length > maxSize) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'A imagem deve ter no máximo 5MB'
        );
      }

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const storagePath = `profile-photos/${userId}/profile-${timestamp}.${fileExtension}`;

      // Get Storage bucket
      const bucket = admin.storage().bucket();
      const file = bucket.file(storagePath);

      // Upload file with metadata
      await file.save(imageBuffer, {
        metadata: {
          contentType: contentType,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            originalFileName: fileName
          }
        },
        public: true, // Make the file publicly readable
        validation: 'md5'
      });

      // Get the public URL
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // Update user profile in Firestore
      await admin.firestore().collection('users').doc(userId).update({
        photoURL: downloadURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update Firebase Auth profile
      await admin.auth().updateUser(userId, {
        photoURL: downloadURL
      });

      functions.logger.info('Profile photo uploaded successfully', {
        userId,
        storagePath,
        fileSize: imageBuffer.length,
        contentType
      });

      return {
        success: true,
        photoURL: downloadURL,
        message: 'Foto de perfil atualizada com sucesso'
      };
    } catch (error: any) {
      functions.logger.error('Error uploading profile photo', {
        error: error.message,
        userId,
        fileName
      });

      // Re-throw HttpsErrors as-is
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erro ao fazer upload da foto: ' + error.message
      );
    }
  });
