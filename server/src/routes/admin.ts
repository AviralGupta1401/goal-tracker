import express from 'express';
import { Goal } from '../models/Goal.js';
import { User } from '../models/User.js';
import { CheckIn } from '../models/CheckIn.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest, authMiddleware, requireRole } from '../lib/auth.js';
import { createAuditLog } from '../lib/audit.js';

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('managerId', 'name email');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', async (req: AuthRequest, res) => {
  try {
    const bcrypt = await import('bcryptjs');
    const { name, email, password, role, department, managerId, employeeId, thrustArea } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role, department, managerId, employeeId, thrustArea });
    await createAuditLog('user', user._id, 'created', req.user!.id, req.user!.name, { role, name, email });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/goals', async (req, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const goals = await Goal.find({ cycleYear: year })
      .populate('employeeId', 'name email department')
      .populate('sharedBy', 'name')
      .sort({ createdAt: 1 });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.put('/goals/:id/unlock', async (req: AuthRequest, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    const previousStatus = goal.status;
    goal.status = 'draft';
    await goal.save();
    await createAuditLog('goal', goal._id, 'unlocked', req.user!.id, req.user!.name, { previousStatus, newStatus: 'draft' });
    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlock goal' });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(limit);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

router.get('/reports/achievements', async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const quarter = req.query.quarter as string;
    const department = req.query.department as string;

    let goalQuery: any = { cycleYear: year };
    if (department) {
      const employees = await User.find({ department });
      goalQuery.employeeId = { $in: employees.map(e => e._id) };
    }

    const goals = await Goal.find(goalQuery).populate('employeeId', 'name email department');
    
    let checkInQuery: any = { year };
    if (quarter) checkInQuery.quarter = quarter;
    if (department) {
      const employees = await User.find({ department });
      checkInQuery.employeeId = { $in: employees.map(e => e._id) };
    }

    const checkIns = await CheckIn.find(checkInQuery)
      .populate('goalId', 'title description uom targetValue uomDirection')
      .populate('employeeId', 'name email department');

    const report = goals.map(goal => {
      const matchingCheckIns = checkIns.filter(ci => ci.goalId._id.toString() === goal._id.toString());
      return {
        employeeName: (goal.employeeId as any)?.name,
        email: (goal.employeeId as any)?.email,
        department: (goal.employeeId as any)?.department,
        goalTitle: goal.title,
        thrustArea: goal.thrustArea,
        uom: goal.uom,
        targetValue: goal.targetValue,
        weightage: goal.weightage,
        status: goal.status,
        progressScore: goal.progressScore,
        checkIns: matchingCheckIns.map(ci => ({
          quarter: ci.quarter,
          plannedTarget: ci.plannedTarget,
          actualAchievement: ci.actualAchievement,
          progressStatus: ci.progressStatus,
          progressScore: ci.progressScore,
          employeeComment: ci.employeeComment,
          managerComment: ci.managerComment,
        })),
      };
    });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalGoals = await Goal.countDocuments({ cycleYear: year });
    const approvedGoals = await Goal.countDocuments({ cycleYear: year, status: 'approved' });
    const submittedGoals = await Goal.countDocuments({ cycleYear: year, status: 'submitted' });
    const pendingGoals = await Goal.countDocuments({ cycleYear: year, status: { $in: ['draft', 'rejected'] } });

    const goalsByThrustArea = await Goal.aggregate([
      { $match: { cycleYear: year } },
      { $group: { _id: '$thrustArea', count: { $sum: 1 } } },
    ]);

    const goalsByStatus = await Goal.aggregate([
      { $match: { cycleYear: year } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const goalsByUom = await Goal.aggregate([
      { $match: { cycleYear: year } },
      { $group: { _id: '$uom', count: { $sum: 1 } } },
    ]);

    const completionByManager = await Goal.aggregate([
      { $match: { cycleYear: year, status: 'approved' } },
      { $lookup: { from: 'users', localField: 'employeeId', foreignField: '_id', as: 'emp' } },
      { $unwind: '$emp' },
      { $group: { _id: '$emp.managerId', approved: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'manager' } },
      { $unwind: { path: '$manager', preserveNullAndEmptyArrays: true } },
    ]);

    res.json({
      dashboard: {
        totalEmployees,
        totalGoals,
        approvedGoals,
        submittedGoals,
        pendingGoals,
        goalsByThrustArea,
        goalsByStatus,
        goalsByUom,
        completionByManager,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
