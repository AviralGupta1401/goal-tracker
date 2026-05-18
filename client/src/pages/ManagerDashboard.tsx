import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { goals, checkIns } from '@/lib/api';
import { User, Goal, CheckIn } from '@/types';
import { Layout } from '@/components/Layout';

export default function ManagerDashboard({ user, setUser }: { user: User; setUser: (u: User | null) => void }) {
  return (
    <Layout user={user} setUser={setUser}>
      <Routes>
        <Route path="/" element={<ManagerOverview user={user} />} />
        <Route path="/team" element={<TeamGoals user={user} />} />
        <Route path="/check-ins" element={<ManagerCheckIns user={user} />} />
      </Routes>
    </Layout>
  );
}

function ManagerOverview({ user }: { user: User }) {
  const navigate = useNavigate();
  const [teamGoals, setTeamGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    goals.getTeam().then(({ data }) => {
      setTeamGoals(data.goals);
      setLoading(false);
    });
  }, []);

  const pendingApproval = teamGoals.filter(g => g.status === 'submitted');
  const approved = teamGoals.filter(g => g.status === 'approved');
  const rejected = teamGoals.filter(g => g.status === 'rejected');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-slate-600">Total Team Goals</div>
          <div className="text-2xl font-bold">{teamGoals.length}</div>
        </div>
        <div className="card cursor-pointer hover:shadow-md transition" onClick={() => navigate('/manager/team')}>
          <div className="text-sm text-slate-600">Pending Approval</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingApproval.length}</div>
          {pendingApproval.length > 0 && <div className="text-xs text-slate-500 mt-1">Click to review</div>}
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{approved.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Returned</div>
          <div className="text-2xl font-bold text-red-600">{rejected.length}</div>
        </div>
      </div>

      {pendingApproval.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4 text-yellow-700">Goals Awaiting Your Approval</h2>
          <div className="space-y-3">
            {pendingApproval.map(goal => (
              <GoalCardInline key={goal._id} goal={goal} onDone={() => {
                goals.getTeam().then(({ data }) => setTeamGoals(data.goals));
              }} />
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => navigate('/manager/team')} className="btn-secondary">
            View Team Goals
          </button>
          <button onClick={() => navigate('/manager/check-ins')} className="btn-secondary">
            Team Check-ins
          </button>
          <button onClick={() => navigate('/manager/team')} className="btn-secondary">
            Approve Goals
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamGoals({ user }: { user: User }) {
  const [teamGoals, setTeamGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    goals.getTeam().then(({ data }) => {
      setTeamGoals(data.goals);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Goals</h1>
        <button onClick={() => navigate('/manager')} className="btn-secondary">Back to Dashboard</button>
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : teamGoals.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">No team goals found</div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Goal</th>
                <th className="table-header">Thrust Area</th>
                <th className="table-header">Weight</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamGoals.map(goal => (
                <tr key={goal._id} className="hover:bg-slate-50">
                  <td className="table-cell">
                    <div className="font-medium">{(goal.employeeId as any)?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{(goal.employeeId as any)?.department || ''}</div>
                  </td>
                  <td className="table-cell max-w-xs">
                    <div className="font-medium truncate">{goal.title}</div>
                    <div className="text-xs text-slate-500 truncate">{goal.description}</div>
                  </td>
                  <td className="table-cell text-sm">{goal.thrustArea}</td>
                  <td className="table-cell font-medium">{goal.weightage}%</td>
                  <td className="table-cell">
                    <span className={`badge badge-${goal.status}`}>{goal.status}</span>
                  </td>
                  <td className="table-cell">
                    {goal.status === 'submitted' && (
                      <div className="flex gap-2">
                        <ApproveButton goal={goal} onDone={() => {
                          goals.getTeam().then(({ data }) => setTeamGoals(data.goals));
                        }} />
                      </div>
                    )}
                    {goal.status !== 'submitted' && <span className="text-xs text-slate-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ManagerCheckIns({ user }: { user: User }) {
  const [checkInsList, setCheckInsList] = useState<CheckIn[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCheckIns();
  }, [selectedQuarter]);

  const loadCheckIns = async () => {
    try {
      const { data } = await checkIns.getTeam({ quarter: selectedQuarter, year: new Date().getFullYear() });
      setCheckInsList(data.checkIns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCheckIn = async (id: string, data: any) => {
    try {
      await checkIns.update(id, data);
      loadCheckIns();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Check-ins</h1>
        <button onClick={() => navigate('/manager')} className="btn-secondary">Back to Dashboard</button>
      </div>

      <div className="flex gap-2 mb-6">
        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
          <button
            key={q}
            onClick={() => setSelectedQuarter(q)}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              selectedQuarter === q ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : checkInsList.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">No check-ins found for this quarter</div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Goal</th>
                <th className="table-header">Target</th>
                <th className="table-header">Actual</th>
                <th className="table-header">Score</th>
                <th className="table-header">Status</th>
                <th className="table-header">Manager Comment</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {checkInsList.map(ci => (
                <tr key={ci._id} className="hover:bg-slate-50">
                  <td className="table-cell">{(ci.employeeId as any)?.name || 'Unknown'}</td>
                  <td className="table-cell">{(ci.goalId as any)?.title || 'N/A'}</td>
                  <td className="table-cell">{ci.plannedTarget}</td>
                  <td className="table-cell">{ci.actualAchievement || '-'}</td>
                  <td className="table-cell font-medium">{ci.progressScore}%</td>
                  <td className="table-cell">
                    <span className={`badge badge-${ci.progressStatus}`}>{ci.progressStatus.replace('_', ' ')}</span>
                  </td>
                  <td className="table-cell">
                    <input
                      type="text"
                      value={ci.managerComment || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCheckInsList(prev => prev.map(c => c._id === ci._id ? { ...c, managerComment: val } : c));
                      }}
                      className="text-sm"
                      placeholder="Add feedback..."
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateCheckIn(ci._id, { managerComment: ci.managerComment, isCompleted: true })}
                        className="btn-success text-xs"
                      >
                        {ci.isCompleted ? 'Completed' : 'Complete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GoalCardInline({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ targetValue: String(goal.targetValue), weightage: goal.weightage, managerComment: goal.managerComment || '' });
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await goals.approve(goal._id, editData);
      onDone();
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
      onDone();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold">{goal.title}</h3>
          <p className="text-sm text-slate-600">{goal.description}</p>
          <div className="text-xs text-slate-500 mt-1">
            {(goal.employeeId as any)?.name || 'Unknown'} • {(goal.employeeId as any)?.department || ''}
          </div>
          {goal.managerComment && (
            <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">
              <strong>Manager:</strong> {goal.managerComment}
            </div>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button onClick={() => setEditMode(!editMode)} className="btn-secondary text-xs">Edit</button>
          <button onClick={handleApprove} className="btn-success text-xs" disabled={loading}>Approve</button>
          <button onClick={handleReject} className="btn-danger text-xs" disabled={loading}>Reject</button>
        </div>
      </div>
      {editMode && (
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
            <input value={editData.targetValue} onChange={e => setEditData({ ...editData, targetValue: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Weightage (%)</label>
            <input type="number" value={editData.weightage} onChange={e => setEditData({ ...editData, weightage: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
            <input value={editData.managerComment} onChange={e => setEditData({ ...editData, managerComment: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

function ApproveButton({ goal, onDone }: { goal: Goal; onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await goals.approve(goal._id, {});
      onDone();
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
      onDone();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={handleApprove} className="btn-success text-xs" disabled={loading}>Approve</button>
      <button onClick={handleReject} className="btn-danger text-xs" disabled={loading}>Reject</button>
    </>
  );
}
