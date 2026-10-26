import { FieldValue, Timestamp } from '@google-cloud/firestore';
import { getFirestore } from '../config/firestore.js';
import { UserProfileDoc, UpdateProfileDTO } from '../types/user.types.js';
import { AuthenticatedUser } from '../types/auth.types.js';
import { AppError } from '../types/api.types.js';
import { logger } from '../utils/logger.js';

const COLLECTION_NAME = 'users';

function formatUserDocument(doc: FirebaseFirestore.DocumentSnapshot): UserProfileDoc {
  const data = doc.data();
  if (!data) {
    throw new AppError('User profile document is empty', 500, 'DATA_ERROR');
  }

  const formatTimestamp = (val: unknown): string => {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  };

  return {
    uid: doc.id,
    email: data.email || '',
    displayName: data.displayName || data.name || '',
    phoneNumber: data.phoneNumber || data.phone || undefined,
    photoURL: data.photoURL || data.picture || undefined,
    location: data.location || undefined,
    currentJobTitle: data.currentJobTitle || data.jobTitle || undefined,
    careerTracks: Array.isArray(data.careerTracks) ? data.careerTracks : [],
    onboardingCompleted: Boolean(data.onboardingCompleted),
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: data.updatedAt ? formatTimestamp(data.updatedAt) : undefined
  };
}

export class UserService {
  private get collection() {
    return getFirestore().collection(COLLECTION_NAME);
  }

  async getOrCreateUserProfile(authUser: AuthenticatedUser): Promise<UserProfileDoc> {
    try {
      const docRef = this.collection.doc(authUser.uid);
      const doc = await docRef.get();

      if (!doc.exists) {
        const newUser: Record<string, unknown> = {
          email: authUser.email || '',
          displayName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
          photoURL: authUser.photoURL || null,
          location: 'Riyadh, SA',
          currentJobTitle: 'Cloud / Software Engineer',
          careerTracks: ['Cloud Engineering', 'DevOps'],
          onboardingCompleted: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };

        await docRef.set(newUser);
        logger.info(`Created new user profile in Firestore for UID: ${authUser.uid}`);
        
        const createdDoc = await docRef.get();
        return formatUserDocument(createdDoc);
      }

      // Profile exists: update safe auth metadata (email, displayName, photoURL, updatedAt)
      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
      };
      if (authUser.email) updateData.email = authUser.email;
      if (authUser.displayName) updateData.displayName = authUser.displayName;
      if (authUser.photoURL) updateData.photoURL = authUser.photoURL;

      await docRef.update(updateData);
      
      const updatedDoc = await docRef.get();
      return formatUserDocument(updatedDoc);
    } catch (error) {
      logger.error(`Error in getOrCreateUserProfile for UID '${authUser.uid}'`, error);
      throw new AppError('Failed to fetch or sync user profile', 500, 'DATABASE_ERROR', error);
    }
  }

  async updateUserProfile(uid: string, dto: UpdateProfileDTO): Promise<UserProfileDoc> {
    try {
      const docRef = this.collection.doc(uid);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`User profile with UID '${uid}' not found`, 404, 'NOT_FOUND');
      }

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (dto.displayName !== undefined) updateData.displayName = dto.displayName.trim();
      if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber.trim();
      if (dto.location !== undefined) updateData.location = dto.location.trim();
      if (dto.currentJobTitle !== undefined) updateData.currentJobTitle = dto.currentJobTitle.trim();
      if (dto.careerTracks !== undefined) updateData.careerTracks = dto.careerTracks;
      if (dto.onboardingCompleted !== undefined) updateData.onboardingCompleted = dto.onboardingCompleted;

      await docRef.update(updateData);
      logger.info(`Updated user profile in Firestore for UID: ${uid}`);

      const updatedDoc = await docRef.get();
      return formatUserDocument(updatedDoc);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error updating user profile for UID '${uid}'`, error);
      throw new AppError('Failed to update user profile', 500, 'DATABASE_ERROR', error);
    }
  }
}

export const userService = new UserService();
