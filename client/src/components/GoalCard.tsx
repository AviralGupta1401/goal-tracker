import { useState } from 'react';
import { Goal } from '@/types';
import { goals } from '@/lib/api';

export function GoalCard({ goal, showEdit, showActions, showManagerActions }: { goal: Goal; showEdit?: boolean; showActions?: boolean; showManagerActions?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ targetValue: goal.targetValue, weightage: goal.weightage, managerComment: goal.managerComment || '' });
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await goals.approve(goal._id, editData);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const comment = prompt('Reason for rejection:');
    if (!comment) return;
    setLoading(true);
    try {
      await goals.reject(goal._id, { managerComment: comment });
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await goals.update(goal._id, editData);
      setEditMode(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const empName = (goal.employeeId as any)?.name || 'Unknown';
  const empDept = (goal.employeeId as any)?.department || '';

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold">{goal.title}</h3>
            <span className={`badge badge-${goal.status}`}>{goal.status}</span>
            {goal.isShared && <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Shared</span>}
          </div>
          <p className="text-sm text-slate-600 mb-2">{goal.description}</p>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>Thrust: {goal.thrustArea}</span>
            <span>UoM: {goal.uom} ({goal.uomDirection === 'min' ? 'higher better' : 'lower better'})</span>
            <span>Target: {goal.targetValue}</span>
            <span>Weight: {goal.weightage}%</span>
            {goal.progressScore !== undefined && <span className="font-medium text-blue-600">Score: {goal.progressScore}%</span>}
          </div>
          {showManagerActions && empName && (
            <div className="text-xs text-slate-500 mt-1">Employee: {empName} ({empDept})</div>
          )}
          {goal.managerComment && (
            <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">
              <strong>Manager:</strong> {goal.managerComment}
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          {showActions && showManagerActions && goal.status === 'submitted' && (
            <>
              <button onClick={() => setEditMode(!editMode)} className="btn-secondary text-xs">Edit</button>
              <button onClick={handleApprove} className="btn-success text-xs" disabled={loading}>Approve</button>
              <button onClick={handleReject} className="btn-danger text-xs" disabled={loading}>Reject</button>
            </>
          )}
          {showEdit && (
            <button onClick={() => setEditMode(!editMode)} className="btn-secondary text-xs">Edit</button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Value</label>
              <input value={editData.targetValue} onChange={e => setEditData({...editData, targetValue: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weightage (%)</label>
              <input type="number" value={editData.weightage} onChange={e => setEditData({...editData, weightage: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
              <input value={editData.managerComment} onChange={e => setEditData({...editData, managerComment: e.target.value})} placeholder="Optional comment" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleUpdate} className="btn-primary text-xs" disabled={loading}>Save</button>
            <button onClick={() => setEditMode(false)} className="btn-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
