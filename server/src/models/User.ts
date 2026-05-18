import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'manager', 'admin'], required: true },
  department: { type: String },
  thrustArea: { type: String },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: String, unique: true },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
