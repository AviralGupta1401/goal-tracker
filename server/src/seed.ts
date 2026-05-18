import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { connectDB } from './lib/db.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goal-tracker';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});

  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  const admin = await User.create({
    name: 'HR Admin',
    email: 'admin@company.com',
    password: adminPassword,
    role: 'admin',
    department: 'HR',
    employeeId: 'EMP001',
  });

  const manager1 = await User.create({
    name: 'Sarah Manager',
    email: 'manager@company.com',
    password: managerPassword,
    role: 'manager',
    department: 'Engineering',
    employeeId: 'EMP002',
  });

  const manager2 = await User.create({
    name: 'John Lead',
    email: 'john.lead@company.com',
    password: managerPassword,
    role: 'manager',
    department: 'Marketing',
    employeeId: 'EMP003',
  });

  const employee1 = await User.create({
    name: 'Alice Employee',
    email: 'alice@company.com',
    password: employeePassword,
    role: 'employee',
    department: 'Engineering',
    managerId: manager1._id,
    thrustArea: 'Product Development',
    employeeId: 'EMP004',
  });

  const employee2 = await User.create({
    name: 'Bob Developer',
    email: 'bob@company.com',
    password: employeePassword,
    role: 'employee',
    department: 'Engineering',
    managerId: manager1._id,
    thrustArea: 'Engineering Excellence',
    employeeId: 'EMP005',
  });

  const employee3 = await User.create({
    name: 'Carol Analyst',
    email: 'carol@company.com',
    password: employeePassword,
    role: 'employee',
    department: 'Marketing',
    managerId: manager2._id,
    thrustArea: 'Growth Marketing',
    employeeId: 'EMP006',
  });

  console.log('Users seeded successfully');
  console.log('\nDemo Credentials:');
  console.log('Admin:     admin@company.com / admin123');
  console.log('Manager:   manager@company.com / manager123');
  console.log('Employee:  alice@company.com / employee123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(console.error);
