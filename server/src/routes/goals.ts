import express from 'express';
import { Goal } from '../models/Goal.js';
import { User } from '../models/User.js';
import { AuthRequest, authMiddleware, requireRole } from '../lib/auth.js';
import { createAuditLog } from '../lib/audit.js';

const router = express.Router();

const MIN_WEIGHTAGE = 10;
const MAX_GOALS = 8;
const REQUIRED_TOTAL_WEIGHTAGE = 100;

function calculateProgressScore(goal: any): number {
  if (goal.uom === 'zero') {
    return goal.achievementActual === 0 ? 100 : 0;
  }

  const target = parseFloat(goal.targetValue);
  const actual = parseFloat(goal.achievementActual);

  if (isNaN(target) || isNaN(actual) || target === 0) return 0;

  if (goal.uomDirection === 'max') {
    return Math.min((target / actual) * 100, 100);
  }
  return Math.min((actual / target) * 100, 100);
}

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { goals } = req.body;
    const employeeId = req.user!.id;
    const cycleYear = new Date().getFullYear();

    if (!Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ error: 'At least one goal is required' });
    }
    if (goals.length > MAX_GOALS) {
      return res.status(400).json({ error: `Maximum ${MAX_GOALS} goals allowed` });
    }

    let totalWeightage = 0;
    for (const goal of goals) {
      if (goal.weightage < MIN_WEIGHTAGE) {
        return res.status(400).json({ error: `Minimum weightage per goal is ${MIN_WEIGHTAGE}%` });
      }
      totalWeightage += goal.weightage;
    }
    if (totalWeightage !== REQUIRED_TOTAL_WEIGHTAGE) {
      return res.status(400).json({ error: `Total weightage must equal ${REQUIRED_TOTAL_WEIGHTAGE}% (currently ${totalWeightage}%)` });
    }

    const existingGoals = await Goal.find({ employeeId, cycleYear });
    if (existingGoals.length + goals.length > MAX_GOALS) {
      return res.status(400).json({ error: `Maximum ${MAX_GOALS} goals allowed for this cycle` });
    }

    const createdGoals = [];
    for (const goalData of goals) {
      const goal = await Goal.create({
        ...goalData,
        employeeId,
        cycleYear,
        status: 'draft',
      });
      await createAuditLog('goal', goal._id, 'created', employeeId, req.user!.name, goalData);
      createdGoals.push(goal);
    }

    res.status(201).json({ goals: createdGoals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goals' });
  }
});

router.post('/:id/submit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, employeeId: req.user!.id });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.status !== 'draft') return res.status(400).json({ error: 'Goal cannot be submitted' });

    const allGoals = await Goal.find({ employeeId: req.user!.id, cycleYear: goal.cycleYear, status: { $in: ['draft', 'submitted', 'rejected'] } });
    const totalWeightage = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeightage !== REQUIRED_TOTAL_WEIGHTAGE) {
      return res.status(400).json({ error: `Total weightage must equal ${REQUIRED_TOTAL_WEIGHTAGE}%` });
    }

    goal.status = 'submitted';
    await goal.save();
    await createAuditLog('goal', goal._id, 'submitted', req.user!.id, req.user!.name);

    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit goal' });
  }
});

router.post('/submit-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const cycleYear = new Date().getFullYear();
    const allGoals = await Goal.find({ employeeId: req.user!.id, cycleYear, status: { $in: ['draft', 'rejected'] } });

    if (allGoals.length === 0) {
      return res.status(400).json({ error: 'No goals to submit' });
    }

    const totalWeightage = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeightage !== REQUIRED_TOTAL_WEIGHTAGE) {
      return res.status(400).json({ error: `Total weightage must equal ${REQUIRED_TOTAL_WEIGHTAGE}%` });
    }

    for (const goal of allGoals) {
      goal.status = 'submitted';
      await goal.save();
      await createAuditLog('goal', goal._id, 'submitted', req.user!.id, req.user!.name);
    }

    res.json({ message: 'All goals submitted', count: allGoals.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit goals' });
  }
});

router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const cycleYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const goals = await Goal.find({ employeeId: req.user!.id, cycleYear }).sort({ createdAt: 1 });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.get('/team', authMiddleware, requireRole('manager', 'admin'), async (req: AuthRequest, res) => {
  try {
    const cycleYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const employeeId = req.query.employeeId as string;

    let query: any = { cycleYear };
    if (employeeId) {
      query.employeeId = employeeId;
    } else if (req.user!.role === 'manager') {
      const employees = await User.find({ managerId: req.user!.id });
      const employeeIds = employees.map(e => e._id);
      query.employeeId = { $in: [req.user!.id, ...employeeIds] };
    }

    const goals = await Goal.find(query).populate('employeeId', 'name email department').sort({ createdAt: 1 });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team goals' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const isOwner = goal.employeeId.toString() === req.user!.id;
    const isManager = req.user!.role === 'manager' && (goal as any).employeeId?.managerId?.toString() === req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    if (goal.status === 'locked' && !isAdmin) {
      return res.status(403).json({ error: 'Goal is locked. Contact admin to unlock.' });
    }

    if (goal.status === 'approved' && !isManager && !isAdmin) {
      return res.status(403).json({ error: 'Goal is approved. Cannot edit.' });
    }

    if (goal.status === 'submitted' && !isManager && !isAdmin) {
      return res.status(403).json({ error: 'Goal is submitted. Cannot edit.' });
    }

    if (isOwner && goal.status === 'draft') {
      if (goal.isShared && goal.sharedGoalId) {
        const { weightage, ...rest } = req.body;
        Object.assign(goal, rest);
        if (weightage) goal.weightage = weightage;
      } else {
        Object.assign(goal, req.body);
      }
    } else if ((isManager || isAdmin) && (goal.status === 'draft' || goal.status === 'submitted' || goal.status === 'approved')) {
      Object.assign(goal, req.body);
    } else {
      return res.status(403).json({ error: 'Cannot edit this goal' });
    }

    const changes = req.body;
    await goal.save();
    await createAuditLog('goal', goal._id, 'updated', req.user!.id, req.user!.name, changes);

    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.post('/:id/approve', authMiddleware, requireRole('manager', 'admin'), async (req: AuthRequest, res) => {
  try {
    const goal = await Goal.findById(req.params.id).populate('employeeId');
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.status !== 'submitted') return res.status(400).json({ error: 'Goal must be submitted first' });

    const { managerComment, targetValue, weightage } = req.body;

    const previousValues = { targetValue: goal.targetValue, weightage: goal.weightage, status: goal.status };
    
    goal.status = 'approved';
    if (managerComment) goal.managerComment = managerComment;
    if (targetValue !== undefined) goal.targetValue = targetValue;
    if (weightage !== undefined) goal.weightage = weightage;
    await goal.save();

    await createAuditLog('goal', goal._id, 'approved', req.user!.id, req.user!.name, { managerComment, targetValue, weightage }, previousValues, { status: 'approved' });

    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve goal' });
  }
});

router.post('/:id/reject', authMiddleware, requireRole('manager', 'admin'), async (req: AuthRequest, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.status !== 'submitted') return res.status(400).json({ error: 'Goal must be submitted first' });

    const { managerComment } = req.body;
    goal.status = 'rejected';
    goal.managerComment = managerComment || 'Returned for rework';
    await goal.save();

    await createAuditLog('goal', goal._id, 'rejected', req.user!.id, req.user!.name, { managerComment });

    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject goal' });
  }
});

router.post('/share', authMiddleware, requireRole('admin', 'manager'), async (req: AuthRequest, res) => {
  try {
    const { title, description, thrustArea, uom, uomDirection, targetValue, weightage, employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ error: 'At least one employee must be selected' });
    }

    const createdGoals = [];
    for (const empId of employeeIds) {
      const goal = await Goal.create({
        employeeId: empId,
        cycleYear: new Date().getFullYear(),
        title,
        description,
        thrustArea,
        uom,
        uomDirection,
        targetValue,
        weightage,
        status: 'approved',
        isShared: true,
        sharedBy: req.user!.id,
      });
      await createAuditLog('goal', goal._id, 'shared', req.user!.id, req.user!.name, { employeeIds });
      createdGoals.push(goal);
    }

    res.status(201).json({ goals: createdGoals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share goals' });
  }
});

router.get('/all', authMiddleware, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const cycleYear = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    const goals = await Goal.find({ cycleYear }).populate('employeeId', 'name email department');
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

export default router;
