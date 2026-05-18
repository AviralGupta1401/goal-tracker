import mongoose from 'mongoose';

const goalCycleSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  goalSettingOpen: { type: Date, default: () => new Date(new Date().getFullYear(), 4, 1) },
  q1Start: { type: Date, default: () => new Date(new Date().getFullYear(), 6, 1) },
  q2Start: { type: Date, default: () => new Date(new Date().getFullYear(), 9, 1) },
  q3Start: { type: Date, default: () => new Date(new Date().getFullYear(), 0, 1) },
  q4Start: { type: Date, default: () => new Date(new Date().getFullYear(), 2, 1) },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const GoalCycle = mongoose.model('GoalCycle', goalCycleSchema);
