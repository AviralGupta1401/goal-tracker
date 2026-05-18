import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['goal', 'checkin', 'cycle', 'user'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed },
  previousValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
