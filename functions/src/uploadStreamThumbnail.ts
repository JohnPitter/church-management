import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Cloud Function to upload stream thumbnails
// This bypasses CORS issues by handling upload server-side
export const uploadStreamThumbnail = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to upload thumbnails'
    );
  }

  const data = request.data;

  // Verify data
  if (!data.fileData || !data.fileName || !data.contentType) {
    throw new HttpsError(
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
          uploadedBy: request.auth.uid,
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
    throw new HttpsError(
      'internal',
      `Failed to upload thumbnail: ${error.message}`
    );
  }
});
