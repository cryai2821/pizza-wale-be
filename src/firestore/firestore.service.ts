import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private firestore: admin.firestore.Firestore;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Check if Firebase is already initialized
    if (!admin.apps.length) {
      // Try to use environment variables first (recommended for production)
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );

      if (projectId && privateKey && clientEmail) {
        // Initialize with environment variables
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
            clientEmail,
          }),
        });
        console.log('✅ Firebase initialized with environment variables');
      } else {
        // Fallback to JSON file (for local development)
        const serviceAccountPath = this.configService.get<string>(
          'FIREBASE_SERVICE_ACCOUNT_PATH',
        );
        if (serviceAccountPath) {
          const serviceAccount = require(`../../${serviceAccountPath}`);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('✅ Firebase initialized with service account file');
        } else {
          console.warn(
            '⚠️ Firebase not initialized - missing credentials. Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL or FIREBASE_SERVICE_ACCOUNT_PATH',
          );
        }
      }
    }

    this.firestore = admin.firestore();
  }

  async updateOrder(orderId: string, data: any) {
    if (!this.firestore) {
      console.log('[FIRESTORE MOCK] Firebase not initialized, skipping update');
      return;
    }

    try {
      const shopId = data.shopId;
      const userId = data.userId;

      // Write to shop's orders collection
      if (shopId) {
        const shopPath = `shops/${shopId}/orders/${orderId}`;
        console.log(`[FIRESTORE DEBUG] Writing to: ${shopPath}`);
        await this.firestore
          .collection('shops')
          .doc(shopId)
          .collection('orders')
          .doc(orderId)
          .set(
            {
              orderId,
              shortId: data.shortId,
              status: data.status,
              totalAmount: data.totalAmount,
              customerPhone: data.customerPhone || data.guestPhone,
              items: data.items,
              createdAt:
                data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              _debug_project: this.configService.get('FIREBASE_PROJECT_ID') || 'unknown'
            },
            { merge: true },
          );
          console.log(`[FIRESTORE DEBUG] Successfully wrote to ${shopPath}`);
      }

      // Write to user's orders collection
      if (userId) {
        await this.firestore
          .collection('users')
          .doc(userId)
          .collection('orders')
          .doc(orderId)
          .set(
            {
              orderId,
              shortId: data.shortId,
              shopId,
              shopName: data.shopName,
              status: data.status,
              totalAmount: data.totalAmount,
              items: data.items,
              createdAt:
                data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      }

      console.log(`✅ Firestore updated for order ${orderId}`);
    } catch (error) {
      console.error('❌ Firestore update failed:', error);
      // Don't throw - we don't want Firestore errors to break order creation
    }
  }
}
