import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { goals, checkIns, admin } from '@/lib/api';
import { User, Goal, AuditLog } from '@/types';
import { Layout } from '@/components/Layout';
import { GoalCard } from '@/components/GoalCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard({ user, setUser }: { user: User; setUser: (u: User | null) => void }) {
  return (
    <Layout user={user} setUser={setUser}>
      <Routes>
        <Route path="/" element={<AdminOverview />} />
        <Route path="/users" element={<ManageUsers />} />
        <Route path="/goals" element={<AllGoals />} />
        <Route path="/audit" element={<AuditTrail />} />
        <Route path="/reports" element={<AchievementReports />} />
        <Route path="/share" element={<ShareGoals />} />
      </Routes>
    </Layout>
  );
}

function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    admin.getDashboard().then(({ data: d }) => {
      setData(d.dashboard);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="card">Loading...</div>;

  const statusColors = ['#059669', '#3b82f6', '#d97706', '#dc2626', '#6b7280'];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-slate-600">Total Employees</div>
          <div className="text-2xl font-bold">{data.totalEmployees}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Total Goals</div>
          <div className="text-2xl font-bold">{data.totalGoals}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{data.approvedGoals}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Submitted</div>
          <div className="text-2xl font-bold text-blue-600">{data.submittedGoals}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{data.pendingGoals}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Goals by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.goalsByStatus}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="count"
                nameKey="_id"
                label={({ _id, count }) => `${_id}: ${count}`}
              >
                {data.goalsByStatus.map((_: any, i: number) => (
                  <Cell key={i} fill={statusColors[i % statusColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Goals by Thrust Area</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.goalsByThrustArea}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => navigate('/admin/users')} className="btn-secondary">Manage Users</button>
          <button onClick={() => navigate('/admin/goals')} className="btn-secondary">View All Goals</button>
          <button onClick={() => navigate('/admin/audit')} className="btn-secondary">Audit Trail</button>
          <button onClick={() => navigate('/admin/reports')} className="btn-secondary">Reports</button>
        </div>
      </div>
    </div>
  );
}

function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee', department: '', managerId: '' });
  const navigate = useNavigate();

  useEffect(() => {
    admin.getUsers().then(({ data }) => {
      setUsers(data.users);
      setManagers(data.users.filter((u: any) => u.role === 'manager'));
    });
  }, []);

  const createUser = async () => {
    try {
      await admin.createUser(formData);
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', role: 'employee', department: '', managerId: '' });
      const { data } = await admin.getUsers();
      setUsers(data.users);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin')} className="btn-secondary">Back</button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">Add User</button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">Create New User</h3>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input placeholder="Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <input placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            <select value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})}>
              <option value="">Select Manager (optional)</option>
              {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createUser} className="btn-primary">Create User</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Department</th>
              <th className="table-header">Manager</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="hover:bg-slate-50">
                <td className="table-cell font-medium">{u.name}</td>
                <td className="table-cell">{u.email}</td>
                <td className="table-cell">
                  <span className={`badge ${u.role === 'admin' ? 'badge-approved' : u.role === 'manager' ? 'badge-submitted' : 'badge-draft'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="table-cell">{u.department || '-'}</td>
                <td className="table-cell">{u.managerId?.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllGoals() {
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    admin.getGoals().then(({ data }) => {
      setAllGoals(data.goals);
      setLoading(false);
    });
  }, []);

  const unlockGoal = async (id: string) => {
    if (!confirm('Unlock this goal? This will reset its status to draft.')) return;
    try {
      await admin.unlockGoal(id);
      const { data } = await admin.getGoals();
      setAllGoals(data.goals);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unlock');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Goals</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/share')} className="btn-primary">Share Goal</button>
          <button onClick={() => navigate('/admin')} className="btn-secondary">Back</button>
        </div>
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Goal</th>
                <th className="table-header">Thrust Area</th>
                <th className="table-header">UoM</th>
                <th className="table-header">Target</th>
                <th className="table-header">Weight</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allGoals.map(g => (
                <tr key={g._id} className="hover:bg-slate-50">
                  <td className="table-cell">{(g.employeeId as any)?.name || 'Unknown'}</td>
                  <td className="table-cell max-w-xs truncate">{g.title}</td>
                  <td className="table-cell text-sm">{g.thrustArea}</td>
                  <td className="table-cell text-sm">{g.uom}</td>
                  <td className="table-cell text-sm">{g.targetValue}</td>
                  <td className="table-cell font-medium">{g.weightage}%</td>
                  <td className="table-cell"><span className={`badge badge-${g.status}`}>{g.status}</span></td>
                  <td className="table-cell">
                    {g.status === 'approved' && (
                      <button onClick={() => unlockGoal(g._id)} className="text-sm text-blue-600 hover:underline">Unlock</button>
                    )}
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

function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    admin.getAuditLogs(200).then(({ data }) => {
      setLogs(data.logs);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <button onClick={() => navigate('/admin')} className="btn-secondary">Back</button>
      </div>

      {loading ? (
        <div className="card">Loading...</div>
      ) : (
        <div className="card">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Timestamp</th>
                <th className="table-header">User</th>
                <th className="table-header">Entity</th>
                <th className="table-header">Action</th>
                <th className="table-header">Changes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="table-cell text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="table-cell font-medium">{log.userName}</td>
                  <td className="table-cell text-sm">{log.entityType}</td>
                  <td className="table-cell"><span className="badge badge-draft">{log.action}</span></td>
                  <td className="table-cell text-xs text-slate-500 max-w-xs truncate">
                    {log.changes ? JSON.stringify(log.changes).slice(0, 100) : '-'}
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

function AchievementReports() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quarter, setQuarter] = useState('Q1');
  const navigate = useNavigate();

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await admin.getAchievementReport({ quarter, year: new Date().getFullYear() });
      setReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Employee', 'Email', 'Department', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weightage', 'Status', 'Score'];
    const rows = report.map(r => [
      r.employeeName, r.email, r.department, r.goalTitle, r.thrustArea, r.uom,
      r.targetValue, r.weightage, r.status, r.progressScore
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achievement-report-${quarter}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Achievement Report</h1>
        <div className="flex gap-3">
          <select value={quarter} onChange={e => setQuarter(e.target.value)} className="w-auto">
            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <button onClick={loadReport} className="btn-primary">Load Report</button>
          <button onClick={exportCSV} disabled={report.length === 0} className="btn-secondary">Export CSV</button>
          <button onClick={() => navigate('/admin')} className="btn-secondary">Back</button>
        </div>
      </div>

      {loading && <div className="card">Loading...</div>}

      {report.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Goal</th>
                <th className="table-header">Target</th>
                <th className="table-header">Weight</th>
                <th className="table-header">Status</th>
                <th className="table-header">Score</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="table-cell">{r.employeeName}<div className="text-xs text-slate-500">{r.department}</div></td>
                  <td className="table-cell max-w-xs truncate">{r.goalTitle}</td>
                  <td className="table-cell">{r.targetValue}</td>
                  <td className="table-cell">{r.weightage}%</td>
                  <td className="table-cell"><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td className="table-cell font-medium">{r.progressScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ShareGoals() {
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '', description: '', thrustArea: 'Product Development', uom: 'numeric', uomDirection: 'min',
    targetValue: '', weightage: '20', employeeIds: [] as string[]
  });
  const navigate = useNavigate();

  useEffect(() => {
    admin.getUsers().then(({ data }) => setUsers(data.users.filter((u: any) => u.role === 'employee')));
  }, []);

  const shareGoal = async () => {
    try {
      if (formData.employeeIds.length === 0) {
        alert('Select at least one employee');
        return;
      }
      await goals.share({ ...formData, targetValue: parseFloat(formData.targetValue), weightage: parseInt(formData.weightage) });
      alert('Goals shared successfully');
      navigate('/admin/goals');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to share');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Share Departmental Goal</h1>
        <button onClick={() => navigate('/admin/goals')} className="btn-secondary">Back</button>
      </div>

      <div className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Goal Title</label>
            <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Enter goal title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Enter description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thrust Area</label>
              <select value={formData.thrustArea} onChange={e => setFormData({...formData, thrustArea: e.target.value})}>
                {['Product Development', 'Engineering Excellence', 'Customer Success', 'Growth Marketing', 'Operational Efficiency', 'Revenue Growth'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
              <select value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})}>
                <option value="numeric">Numeric</option>
                <option value="percentage">Percentage</option>
                <option value="timeline">Timeline</option>
                <option value="zero">Zero-based</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Value</label>
              <input value={formData.targetValue} onChange={e => setFormData({...formData, targetValue: e.target.value})} placeholder="Enter target" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Weightage (%)</label>
              <input type="number" value={formData.weightage} onChange={e => setFormData({...formData, weightage: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Employees</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
              {users.map(u => (
                <label key={u._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.employeeIds.includes(u._id)}
                    onChange={e => {
                      const ids = e.target.checked
                        ? [...formData.employeeIds, u._id]
                        : formData.employeeIds.filter((id: string) => id !== u._id);
                      setFormData({...formData, employeeIds: ids});
                    }}
                  />
                  <span className="text-sm">{u.name} ({u.department})</span>
                </label>
              ))}
            </div>
          </div>
          <button onClick={shareGoal} className="btn-primary">Share Goals</button>
        </div>
      </div>
    </div>
  );
}
