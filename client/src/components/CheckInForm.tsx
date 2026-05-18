import { useState } from 'react';
import { Goal, CheckIn } from '@/types';
import { checkIns } from '@/lib/api';

export function CheckInForm({ goal, quarter, year, existingCheckIn, onUpdate }: {
  goal: Goal;
  quarter: string;
  year: number;
  existingCheckIn?: CheckIn;
  onUpdate: () => void;
}) {
  const [actualAchievement, setActualAchievement] = useState(existingCheckIn?.actualAchievement || '');
  const [progressStatus, setProgressStatus] = useState(existingCheckIn?.progressStatus || 'not_started');
  const [comment, setComment] = useState(existingCheckIn?.employeeComment || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await checkIns.create({
        goalId: goal._id,
        quarter,
        year,
        plannedTarget: goal.targetValue,
        actualAchievement,
        progressStatus,
        employeeComment: comment,
      });
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save check-in');
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = existingCheckIn?.isCompleted;

  return (
    <div className={`card ${isCompleted ? 'border-green-300 bg-green-50' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{goal.title}</h3>
          <div className="flex gap-3 text-xs text-slate-500 mt-1">
            <span>Target: {goal.targetValue}</span>
            <span>UoM: {goal.uom}</span>
            {existingCheckIn?.progressScore && <span className="font-medium text-blue-600">Score: {existingCheckIn.progressScore}%</span>}
            {isCompleted && <span className="text-green-600 font-medium">Check-in Completed</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Actual Achievement</label>
          <input
            value={actualAchievement}
            onChange={e => setActualAchievement(e.target.value)}
            placeholder="Enter actual value"
            disabled={isCompleted}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select value={progressStatus} onChange={e => setProgressStatus(e.target.value as any)} disabled={isCompleted}>
            <option value="not_started">Not Started</option>
            <option value="on_track">On Track</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Optional notes"
            disabled={isCompleted}
          />
        </div>
        <div className="flex items-end">
          <button onClick={handleSubmit} className="btn-primary w-full" disabled={loading || isCompleted || !actualAchievement}>
            {existingCheckIn ? 'Update' : 'Save'} Check-in
          </button>
        </div>
      </div>

      {existingCheckIn?.managerComment && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-600"><strong>Manager Feedback:</strong> {existingCheckIn.managerComment}</span>
        </div>
      )}
    </div>
  );
}
