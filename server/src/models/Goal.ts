import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cycleYear: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  thrustArea: { type: String, required: true },
  uom: { type: String, enum: ['numeric', 'percentage', 'timeline', 'zero'], required: true },
  uomDirection: { type: String, enum: ['min', 'max'], default: 'min' },
  targetValue: { type: mongoose.Schema.Types.Mixed, required: true },
  weightage: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected', 'locked'], default: 'draft' },
  managerComment: { type: String },
  isShared: { type: Boolean, default: false },
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
  achievementActual: { type: mongoose.Schema.Types.Mixed },
  progressStatus: { type: String, enum: ['not_started', 'on_track', 'completed'], default: 'not_started' },
  progressScore: { type: Number, default: 0 },
}, { timestamps: true });

export const Goal = mongoose.model('Goal', goalSchema);
