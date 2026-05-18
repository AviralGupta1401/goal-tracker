import { useState } from 'react';
import { Goal, THRUST_AREAS, UOM_OPTIONS } from '@/types';
import { Trash2, Plus } from 'lucide-react';

interface GoalFormData {
  _id?: string;
  title: string;
  description: string;
  thrustArea: string;
  uom: string;
  uomDirection: string;
  targetValue: string;
  weightage: number;
}

export function GoalForm({ existingGoals, onSave, onCancel }: { existingGoals: Goal[]; onSave: (goals: GoalFormData[]) => void; onCancel: () => void }) {
  const [goalForms, setGoalForms] = useState<GoalFormData[]>(
    existingGoals.length > 0
      ? existingGoals.map(g => ({
          _id: g._id,
          title: g.title,
          description: g.description,
          thrustArea: g.thrustArea,
          uom: g.uom,
          uomDirection: g.uomDirection || 'min',
          targetValue: String(g.targetValue),
          weightage: g.weightage,
        }))
      : [{ title: '', description: '', thrustArea: THRUST_AREAS[0], uom: 'numeric', uomDirection: 'min', targetValue: '', weightage: 10 }]
  );
  const [error, setError] = useState('');

  const addGoal = () => {
    if (goalForms.length >= 8) {
      setError('Maximum 8 goals allowed');
      return;
    }
    setGoalForms([...goalForms, { title: '', description: '', thrustArea: THRUST_AREAS[0], uom: 'numeric', uomDirection: 'min', targetValue: '', weightage: 10 }]);
    setError('');
  };

  const removeGoal = (index: number) => {
    if (goalForms.length <= 1) return;
    setGoalForms(goalForms.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: string, value: any) => {
    const updated = [...goalForms];
    updated[index] = { ...updated[index], [field]: value };
    setGoalForms(updated);
    setError('');
  };

  const totalWeightage = goalForms.reduce((sum, g) => sum + (parseInt(String(g.weightage)) || 0), 0);

  const handleSubmit = () => {
    for (const goal of goalForms) {
      if (!goal.title.trim()) { setError('All goals must have a title'); return; }
      if (!goal.description.trim()) { setError('All goals must have a description'); return; }
      if (!goal.targetValue) { setError('All goals must have a target value'); return; }
      if (!goal.weightage || goal.weightage < 10) { setError('Each goal must have at least 10% weightage'); return; }
    }
    if (totalWeightage !== 100) {
      setError(`Total weightage must equal 100% (currently ${totalWeightage}%)`);
      return;
    }
    if (goalForms.length > 8) {
      setError('Maximum 8 goals allowed');
      return;
    }
    onSave(goalForms);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Goal Sheet</h1>
          <p className="text-slate-600">Define your goals for {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={addGoal} disabled={goalForms.length >= 8} className="btn-secondary flex items-center gap-2">
            <Plus size={16} /> Add Goal ({goalForms.length}/8)
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="card mb-4 bg-blue-50 border-blue-200">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Weightage: <span className={totalWeightage === 100 ? 'text-green-600' : 'text-red-600'}>{totalWeightage}%</span></span>
          <span className="text-sm text-slate-600">Must equal 100%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all ${totalWeightage === 100 ? 'bg-green-500' : totalWeightage > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(totalWeightage, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {goalForms.map((goal, index) => (
          <div key={index} className="card relative">
            {goalForms.length > 1 && (
              <button onClick={() => removeGoal(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            )}
            <h3 className="font-semibold mb-4 text-slate-700">Goal {index + 1}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title</label>
                <input value={goal.title} onChange={e => updateGoal(index, 'title', e.target.value)} placeholder="Enter goal title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thrust Area</label>
                <select value={goal.thrustArea} onChange={e => updateGoal(index, 'thrustArea', e.target.value)}>
                  {THRUST_AREAS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={goal.description} onChange={e => updateGoal(index, 'description', e.target.value)} rows={2} placeholder="Describe the goal" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unit of Measurement</label>
                <select value={goal.uom} onChange={e => updateGoal(index, 'uom', e.target.value)}>
                  {UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
                <select value={goal.uomDirection} onChange={e => updateGoal(index, 'uomDirection', e.target.value)}>
                  <option value="min">Higher is Better (Min type)</option>
                  <option value="max">Lower is Better (Max type)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Value</label>
                <input value={goal.targetValue} onChange={e => updateGoal(index, 'targetValue', e.target.value)} placeholder="e.g., 100, 95%, 2026-12-31, 0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weightage (%)</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={goal.weightage}
                  onChange={e => updateGoal(index, 'weightage', parseInt(e.target.value) || 0)}
                />
                {goal.weightage < 10 && <p className="text-xs text-red-500 mt-1">Minimum 10%</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} className="btn-primary">Save Goals</button>
      </div>
    </div>
  );
}
