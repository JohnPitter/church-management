/**
 * onNotificationCreated
 *
 * Gatilho Firestore: quando um documento é criado em `notifications/{id}`,
 * envia uma notificação push (FCM) para os dispositivos do usuário destinatário.
 * Os tokens FCM ficam em `users/{userId}.fcmTokens` (array, gravado pelo app móvel).
 */

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

export const onNotificationCreated = functions
  .region('southamerica-east1')
  .firestore.document('notifications/{notificationId}')
  .onCreate(async (snapshot) => {
    const data = snapshot.data();
    if (!data) return;

    const userId: string | undefined = data.userId;
    // Sem destinatário específico (broadcast) está fora do escopo deste gatilho.
    if (!userId) return;

    const userSnap = await admin.firestore().collection('users').doc(userId).get();
    const tokens: string[] = (userSnap.data()?.fcmTokens || []).filter(
      (token: unknown): token is string => typeof token === 'string' && token.length > 0
    );
    if (tokens.length === 0) return;

    const title: string = data.title || 'Novo aviso';
    const body: string = data.message || '';

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: { channelId: 'avisos' },
      },
    });

    // Remove tokens que não são mais válidos.
    const invalidTokens: string[] = [];
    response.responses.forEach((result, index) => {
      if (!result.success) {
        const code = result.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await admin.firestore().collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      });
    }
  });
