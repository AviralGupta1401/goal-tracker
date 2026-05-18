import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { goals, checkIns } from '@/lib/api';
import { User, Goal, CheckIn, THRUST_AREAS, UOM_OPTIONS, QUARTERS } from '@/types';
import { Layout } from '@/components/Layout';
import { GoalForm } from '@/components/GoalForm';
import { GoalCard } from '@/components/GoalCard';
import { CheckInForm } from '@/components/CheckInForm';
import { LogoutButton } from '@/components/LogoutButton';
import { Target, Calendar, ClipboardList, TrendingUp } from 'lucide-react';

export default function EmployeeDashboard({ user, setUser }: { user: User; setUser: (u: User | null) => void }) {
  return (
    <Layout user={user} setUser={setUser}>
      <Routes>
        <Route path="/" element={<EmployeeGoals user={user} />} />
        <Route path="/goals/create" element={<CreateGoals user={user} />} />
        <Route path="/goals/edit/:id" element={<EditGoal user={user} />} />
        <Route path="/check-ins" element={<EmployeeCheckIns user={user} />} />
      </Routes>
    </Layout>
  );
}

function EmployeeGoals({ user }: { user: User }) {
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const { data } = await goals.getMy();
      setGoalsList(data.goals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalWeightage = goalsList.filter(g => g.status !== 'locked').reduce((sum, g) => sum + g.weightage, 0);
  const approvedCount = goalsList.filter(g => g.status === 'approved').length;
  const submittedCount = goalsList.filter(g => g.status === 'submitted').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Goals</h1>
          <p className="text-slate-600">Manage your goal sheet for {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/employee/check-ins')} className="btn-secondary flex items-center gap-2">
            <Calendar size={16} /> Quarterly Check-ins
          </button>
          {goalsList.filter(g => g.status === 'draft' || g.status === 'rejected').length > 0 && (
            <button onClick={() => navigate('/employee/goals/create')} className="btn-primary flex items-center gap-2">
              <Target size={16} /> {goalsList.length > 0 ? 'Edit Goals' : 'Create Goals'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-slate-600">Total Goals</div>
          <div className="text-2xl font-bold">{goalsList.length} / 8</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Total Weightage</div>
          <div className={`text-2xl font-bold ${totalWeightage === 100 ? 'text-green-600' : 'text-red-600'}`}>
            {totalWeightage}%
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Submitted</div>
          <div className="text-2xl font-bold text-blue-600">{submittedCount}</div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-8 text-slate-500">Loading goals...</div>
      ) : goalsList.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No goals yet</h3>
          <p className="text-slate-500 mb-4">Create your goal sheet to get started</p>
          <button onClick={() => navigate('/employee/goals/create')} className="btn-primary">
            Create Goals
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Goal Sheet</h2>
            {(goalsList.some(g => g.status === 'draft') || goalsList.some(g => g.status === 'rejected')) && (
              <button
                onClick={async () => {
                  try {
                    await goals.submitAll();
                    loadGoals();
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to submit');
                  }
                }}
                className="btn-success text-sm"
              >
                Submit All Goals
              </button>
            )}
          </div>
          <div className="space-y-3">
            {goalsList.map(goal => (
              <GoalCard key={goal._id} goal={goal} showEdit={goal.status === 'draft' || goal.status === 'rejected'} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateGoals({ user }: { user: User }) {
  const [existingGoals, setExistingGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    goals.getMy().then(({ data }) => {
      setExistingGoals(data.goals.filter((g: Goal) => g.status === 'draft' || g.status === 'rejected'));
      setLoading(false);
    });
  }, []);

  const handleSave = async (newGoals: any[]) => {
    try {
      if (existingGoals.length > 0) {
        for (const goal of existingGoals) {
          const match = newGoals.find(g => g._id === goal._id);
          if (match) {
            await goals.update(goal._id, match);
          }
        }
        const toCreate = newGoals.filter(g => !g._id);
        if (toCreate.length > 0) {
          await goals.create({ goals: toCreate });
        }
      } else {
        await goals.create({ goals: newGoals });
      }
      navigate('/employee');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save goals');
    }
  };

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate('/employee')} className="btn-secondary mb-4">Back to Goals</button>
      <GoalForm
        existingGoals={existingGoals}
        onSave={handleSave}
        onCancel={() => navigate('/employee')}
      />
    </div>
  );
}

function EditGoal({ user }: { user: User }) {
  const navigate = useNavigate();
  return <div><button onClick={() => navigate('/employee')} className="btn-secondary mb-4">Back</button>Editing...</div>;
}

function EmployeeCheckIns({ user }: { user: User }) {
  const [goalsList, setGoalsList] = useState<Goal[]>([]);
  const [checkInsList, setCheckInsList] = useState<CheckIn[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [selectedQuarter]);

  const loadData = async () => {
    try {
      const [goalsRes, checkInsRes] = await Promise.all([
        goals.getMy(),
        checkIns.getTeam({ quarter: selectedQuarter, year: new Date().getFullYear() }),
      ]);
      setGoalsList(goalsRes.data.goals.filter((g: Goal) => g.status === 'approved'));
      setCheckInsList(checkInsRes.data.checkIns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCheckInForGoal = (goalId: string) => {
    return checkInsList.find(ci => (ci.goalId as any)?._id === goalId || ci.goalId === goalId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quarterly Check-ins</h1>
          <p className="text-slate-600">Track your progress against approved goals</p>
        </div>
        <button onClick={() => navigate('/employee')} className="btn-secondary flex items-center gap-2">
          <Target size={16} /> Back to Goals
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => (
          <button
            key={q.value}
            onClick={() => setSelectedQuarter(q.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              selectedQuarter === q.value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {q.value}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : goalsList.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No approved goals yet. Goals must be approved before check-ins.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goalsList.map(goal => {
            const checkIn = getCheckInForGoal(goal._id);
            return (
              <CheckInForm
                key={goal._id}
                goal={goal}
                quarter={selectedQuarter}
                year={new Date().getFullYear()}
                existingCheckIn={checkIn}
                onUpdate={loadData}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
