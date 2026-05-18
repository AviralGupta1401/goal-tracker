import express from 'express';
import mongoose from 'mongoose';
import { CheckIn } from '../models/CheckIn.js';
import { Goal } from '../models/Goal.js';
import { User } from '../models/User.js';
import { AuthRequest, authMiddleware, requireRole } from '../lib/auth.js';
import { createAuditLog } from '../lib/audit.js';

const router = express.Router();

function calculateProgressScore(checkIn: any, goal: any): number {
  if (!checkIn.actualAchievement && checkIn.actualAchievement !== 0) return 0;

  if (goal.uom === 'zero') {
    return checkIn.actualAchievement === 0 ? 100 : 0;
  }

  if (goal.uom === 'timeline') {
    const deadline = new Date(goal.targetValue);
    const actual = new Date(checkIn.actualAchievement);
    if (actual <= deadline) return 100;
    return Math.max(0, 100 - Math.floor((actual.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const target = parseFloat(goal.targetValue);
  const actual = parseFloat(checkIn.actualAchievement);

  if (isNaN(target) || isNaN(actual) || target === 0) return 0;

  if (goal.uomDirection === 'max') {
    return Math.min((target / actual) * 100, 100);
  }
  return Math.min((actual / target) * 100, 100);
}

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { goalId, quarter, year, plannedTarget, actualAchievement, progressStatus, employeeComment } = req.body;

    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.employeeId.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Not your goal' });
    }

    let checkIn = await CheckIn.findOne({ goalId, quarter, year });

    if (checkIn) {
      checkIn.actualAchievement = actualAchievement;
      checkIn.progressStatus = progressStatus;
      checkIn.employeeComment = employeeComment;
      checkIn.progressScore = calculateProgressScore(checkIn, goal);
    } else {
      checkIn = await CheckIn.create({
        goalId,
        employeeId: req.user!.id,
        quarter,
        year,
        plannedTarget,
        actualAchievement,
        progressStatus,
        employeeComment,
        progressScore: calculateProgressScore({ actualAchievement }, goal),
      });
    }

    await createAuditLog('checkin', checkIn._id, 'created', req.user!.id, req.user!.name, { quarter, year });

    res.status(201).json({ checkIn });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create check-in' });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const checkIns = await CheckIn.find({ employeeId: req.user!.id, year }).populate('goalId', 'title description uom targetValue').sort({ quarter: 1 });
    res.json({ checkIns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

router.get('/team', authMiddleware, requireRole('manager', 'admin'), async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const quarter = req.query.quarter as string;
    const employeeId = req.query.employeeId as string;

    let query: any = { year };
    if (req.user!.role === 'manager') {
      const reports = await User.find({ managerId: req.user!.id });
      const reportIds = reports.map(r => r._id);
      
      if (employeeId) {
        query.employeeId = employeeId;
      } else {
        query.employeeId = { $in: [req.user!.id, ...reportIds] };
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (quarter) {
      query.quarter = quarter;
    }

    const checkIns = await CheckIn.find(query)
      .populate('employeeId', 'name email department')
      .populate('goalId', 'title description uom targetValue uomDirection')
      .populate('managerId', 'name')
      .sort({ quarter: 1 });

    res.json({ checkIns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team check-ins' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const checkIn = await CheckIn.findById(req.params.id);
    if (!checkIn) return res.status(404).json({ error: 'Check-in not found' });

    const goal = await Goal.findById(checkIn.goalId);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (req.user!.role === 'employee' && checkIn.employeeId.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Not your check-in' });
    }

    const { actualAchievement, progressStatus, employeeComment, managerComment, isCompleted } = req.body;

    if (req.user!.role === 'manager' || req.user!.role === 'admin') {
      if (managerComment !== undefined) checkIn.managerComment = managerComment;
      if (isCompleted !== undefined) {
        checkIn.isCompleted = isCompleted;
        if (isCompleted) {
          checkIn.managerId = new mongoose.Types.ObjectId(req.user!.id);
          checkIn.checkInDate = new Date();
        }
      }
    } else {
      if (actualAchievement !== undefined) checkIn.actualAchievement = actualAchievement;
      if (progressStatus !== undefined) checkIn.progressStatus = progressStatus;
      if (employeeComment !== undefined) checkIn.employeeComment = employeeComment;
      checkIn.progressScore = calculateProgressScore(checkIn, goal);
    }

    await checkIn.save();
    await createAuditLog('checkin', checkIn._id, 'updated', req.user!.id, req.user!.name, req.body);

    res.json({ checkIn });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update check-in' });
  }
});

router.get('/completion-status', authMiddleware, requireRole('manager', 'admin'), async (req: AuthRequest, res) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const quarter = req.query.quarter as string;

    let query: any = { year };
    if (quarter) query.quarter = quarter;

    if (req.user!.role === 'manager') {
      const reports = await User.find({ managerId: req.user!.id });
      const reportIds = [req.user!.id, ...reports.map(r => r._id.toString())];
      query.employeeId = { $in: reportIds };
    }

    const checkIns: any[] = await CheckIn.find(query).populate('goalId', 'title').populate('employeeId', 'name department');
    
    const grouped: any = {};
    for (const ci of checkIns) {
      const emp = ci.employeeId;
      const key = `${emp._id}-${ci.quarter}`;
      if (!grouped[key]) {
        grouped[key] = {
          employeeName: emp.name,
          department: emp.department,
          quarter: ci.quarter,
          completed: 0,
          total: 0,
        };
      }
      grouped[key].total++;
      if (ci.isCompleted) grouped[key].completed++;
    }

    res.json({ completionStatus: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completion status' });
  }
});

export default router;
