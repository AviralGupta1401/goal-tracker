export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  department?: string;
  managerId?: string;
  thrustArea?: string;
  employeeId?: string;
}

export interface Goal {
  _id: string;
  employeeId: string | User;
  cycleYear: number;
  title: string;
  description: string;
  thrustArea: string;
  uom: 'numeric' | 'percentage' | 'timeline' | 'zero';
  uomDirection?: 'min' | 'max';
  targetValue: string | number;
  weightage: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';
  managerComment?: string;
  isShared?: boolean;
  sharedBy?: string | User;
  achievementActual?: string | number;
  progressStatus?: 'not_started' | 'on_track' | 'completed';
  progressScore?: number;
  createdAt: string;
}

export interface CheckIn {
  _id: string;
  goalId: string | Goal;
  employeeId: string | User;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  plannedTarget: string | number;
  actualAchievement?: string | number;
  progressStatus: 'not_started' | 'on_track' | 'completed';
  progressScore: number;
  employeeComment?: string;
  managerComment?: string;
  isCompleted: boolean;
  checkInDate?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  changes?: any;
  timestamp: string;
}

export const THRUST_AREAS = [
  'Product Development',
  'Engineering Excellence',
  'Customer Success',
  'Growth Marketing',
  'Operational Efficiency',
  'Revenue Growth',
  'Quality Assurance',
  'Innovation & R&D',
];

export const UOM_OPTIONS = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'zero', label: 'Zero-based' },
];

export const QUARTERS = [
  { value: 'Q1', label: 'Q1 (Jul-Sep)', month: 7 },
  { value: 'Q2', label: 'Q2 (Oct-Dec)', month: 10 },
  { value: 'Q3', label: 'Q3 (Jan-Mar)', month: 1 },
  { value: 'Q4', label: 'Q4 (Mar-Apr)', month: 3 },
];
