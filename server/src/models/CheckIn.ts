import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quarter: { type: String, enum: ['Q1', 'Q2', 'Q3', 'Q4'], required: true },
  year: { type: Number, required: true },
  plannedTarget: { type: mongoose.Schema.Types.Mixed, required: true },
  actualAchievement: { type: mongoose.Schema.Types.Mixed },
  progressStatus: { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  progressScore: { type: Number, default: 0 },
  employeeComment: { type: String },
  managerComment: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isCompleted: { type: Boolean, default: false },
  checkInDate: { type: Date },
}, { timestamps: true });

export const CheckIn = mongoose.model('CheckIn', checkInSchema);
