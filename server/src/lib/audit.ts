import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';

export const createAuditLog = async (
  entityType: 'goal' | 'checkin' | 'cycle' | 'user',
  entityId: mongoose.Types.ObjectId | string,
  action: string,
  userId: mongoose.Types.ObjectId | string,
  userName: string,
  changes?: any,
  previousValues?: any,
  newValues?: any
) => {
  await AuditLog.create({
    entityType,
    entityId,
    action,
    userId,
    userName,
    changes,
    previousValues,
    newValues,
    timestamp: new Date(),
  });
};
