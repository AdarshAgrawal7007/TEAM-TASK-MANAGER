import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, tasksAPI } from '../services/api';
import TaskCard from '../components/TaskCard';

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      const res = await dashboardAPI.get();
      setData(res.data.data);
    } catch {
      setError('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      loadDashboard();
    } catch {
      alert('Failed to update task status.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (error) return <div className="alert alert-danger">{error}</div>;

  const { stats, recentTasks, overdueTasks, myTasks } = data;

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card stat-card bg-primary text-white">
            <div className="card-body text-center">
              <h3>{stats.totalProjects}</h3>
              <p className="mb-0">Projects</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card bg-success text-white">
            <div className="card-body text-center">
              <h3>{stats.totalTasks}</h3>
              <p className="mb-0">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card bg-danger text-white">
            <div className="card-body text-center">
              <h3>{stats.overdueCount}</h3>
              <p className="mb-0">Overdue</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card bg-info text-white">
            <div className="card-body text-center">
              <h3>{stats.byStatus?.done || 0}</h3>
              <p className="mb-0">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card card-shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">Tasks by Status</h5>
            </div>
            <div className="card-body">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="d-flex justify-content-between mb-2">
                  <span>{label}</span>
                  <span className="badge bg-secondary">{stats.byStatus?.[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card card-shadow">
            <div className="card-header bg-white d-flex justify-content-between">
              <h5 className="mb-0 text-danger">Overdue Tasks</h5>
              <Link to="/projects" className="btn btn-sm btn-outline-primary">
                View Projects
              </Link>
            </div>
            <div className="card-body">
              {overdueTasks.length === 0 ? (
                <p className="text-muted mb-0">No overdue tasks. Great job!</p>
              ) : (
                overdueTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} compact />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card card-shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">My Tasks</h5>
            </div>
            <div className="card-body">
              {myTasks.length === 0 ? (
                <p className="text-muted mb-0">No tasks assigned to you.</p>
              ) : (
                myTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} compact />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card card-shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Tasks</h5>
            </div>
            <div className="card-body">
              {recentTasks.length === 0 ? (
                <p className="text-muted mb-0">No tasks yet. Create a project to get started.</p>
              ) : (
                recentTasks.map((task) => (
                  <TaskCard key={task._id} task={task} onStatusChange={handleStatusChange} compact />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
