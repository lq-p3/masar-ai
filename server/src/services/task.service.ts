import { FieldValue, Timestamp } from '@google-cloud/firestore';
import { getFirestore } from '../config/firestore.js';
import { TaskDoc, CreateTaskDTO, UpdateTaskDTO } from '../types/task.types.js';
import { AppError } from '../types/api.types.js';
import { logger } from '../utils/logger.js';

const COLLECTION_NAME = 'tasks';

function formatTaskDocument(doc: FirebaseFirestore.DocumentSnapshot): TaskDoc {
  const data = doc.data();
  if (!data) {
    throw new AppError('Task document data is empty', 500, 'DATA_ERROR');
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
    id: doc.id,
    userId: data.userId || '',
    text: data.text || '',
    dueDate: data.dueDate || 'TODAY',
    completed: Boolean(data.completed),
    urgent: Boolean(data.urgent),
    company: data.company || undefined,
    createdAt: formatTimestamp(data.createdAt),
    updatedAt: data.updatedAt ? formatTimestamp(data.updatedAt) : undefined
  };
}

export class TaskService {
  private get collection() {
    return getFirestore().collection(COLLECTION_NAME);
  }

  async getTasks(uid: string): Promise<TaskDoc[]> {
    try {
      const snapshot = await this.collection.where('userId', '==', uid).get();
      const tasks: TaskDoc[] = [];

      snapshot.forEach((doc) => {
        try {
          tasks.push(formatTaskDocument(doc));
        } catch (err) {
          logger.warn(`Failed to parse task document ${doc.id}`, { err });
        }
      });

      return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      logger.error(`Error fetching tasks for UID '${uid}' from Firestore`, error);
      throw new AppError('Unable to retrieve tasks from Firestore', 500, 'DATABASE_ERROR', error);
    }
  }

  async createTask(uid: string, dto: CreateTaskDTO): Promise<TaskDoc> {
    try {
      const newDocData = {
        userId: uid,
        text: dto.text.trim(),
        dueDate: dto.dueDate ? dto.dueDate.trim() : 'TODAY',
        completed: false,
        urgent: Boolean(dto.urgent),
        ...(dto.company ? { company: dto.company.trim() } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const docRef = await this.collection.add(newDocData);
      logger.info(`Created new task in Firestore for user ${uid}`, { id: docRef.id });

      const createdDoc = await docRef.get();
      return formatTaskDocument(createdDoc);
    } catch (error) {
      logger.error('Error creating task in Firestore', error);
      throw new AppError('Unable to create task in Firestore', 500, 'DATABASE_ERROR', error);
    }
  }

  async updateTask(uid: string, id: string, dto: UpdateTaskDTO): Promise<TaskDoc> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`Task with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const formatted = formatTaskDocument(doc);
      if (formatted.userId !== uid) {
        logger.warn(`User '${uid}' attempted unauthorized update on task '${id}' owned by '${formatted.userId}'`);
        throw new AppError(`Task with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const updateData: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
      };

      if (dto.text !== undefined) updateData.text = dto.text.trim();
      if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate.trim();
      if (dto.completed !== undefined) updateData.completed = dto.completed;
      if (dto.urgent !== undefined) updateData.urgent = dto.urgent;
      if (dto.company !== undefined) updateData.company = dto.company.trim();

      await docRef.update(updateData);
      logger.info(`Updated task in Firestore for user ${uid}`, { id });

      const updatedDoc = await docRef.get();
      return formatTaskDocument(updatedDoc);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error updating task '${id}' in Firestore`, error);
      throw new AppError(`Unable to update task '${id}'`, 500, 'DATABASE_ERROR', error);
    }
  }

  async deleteTask(uid: string, id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError(`Task with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      const formatted = formatTaskDocument(doc);
      if (formatted.userId !== uid) {
        logger.warn(`User '${uid}' attempted unauthorized delete on task '${id}' owned by '${formatted.userId}'`);
        throw new AppError(`Task with ID '${id}' not found`, 404, 'NOT_FOUND');
      }

      await docRef.delete();
      logger.info(`Deleted task from Firestore for user ${uid}`, { id });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error deleting task '${id}' from Firestore`, error);
      throw new AppError(`Unable to delete task '${id}'`, 500, 'DATABASE_ERROR', error);
    }
  }
}

export const taskService = new TaskService();
