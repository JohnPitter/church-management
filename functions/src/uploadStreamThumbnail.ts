import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

// Cloud Function to upload stream thumbnails
// This bypasses CORS issues by handling upload server-side
export const uploadStreamThumbnail = functions
  .region('southamerica-east1')
  .https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to upload thumbnails'
      );
    }

    // Verify data
    if (!data.fileData || !data.fileName || !data.contentType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: fileData, fileName, or contentType'
      );
    }

    try {
      const bucket = admin.storage().bucket();
      const timestamp = Date.now();
      const sanitizedName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `streams/thumbnails/${timestamp}_${sanitizedName}`;

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(data.fileData, 'base64');

      // Upload to Firebase Storage
      const file = bucket.file(filename);
      await file.save(fileBuffer, {
        metadata: {
          contentType: data.contentType,
          metadata: {
            uploadedBy: context.auth.uid,
            uploadedAt: new Date().toISOString()
          }
        },
        public: true // Make file publicly readable
      });

      // Get download URL
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future expiry
      });

      // Or use public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      return {
        success: true,
        url: publicUrl,
        signedUrl: url
      };
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to upload thumbnail: ${error.message}`
      );
    }
  });
