import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  });

  const loadAll = async () => {
    try {
      const [projRes, tasksRes, usersRes] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getByProject(id),
        authAPI.getUsers(),
      ]);
      setProject(projRes.data.data);
      setTasks(tasksRes.data.data);
      setUsers(usersRes.data.data);
    } catch {
      alert('Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const isProjectAdmin = () => {
    if (!project || !user) return false;
    if (user.role === 'admin') return true;
    if (project.owner?._id === user.id || project.owner === user.id) return true;
    const member = project.members?.find(
      (m) => (m.user?._id || m.user) === user.id && m.role === 'admin'
    );
    return !!member;
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.addMember(id, { email: memberEmail });
      setMemberEmail('');
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await tasksAPI.create({
        ...taskForm,
        project: id,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null,
      });
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
      });
      setShowTaskForm(false);
      loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await tasksAPI.update(taskId, { status });
      loadAll();
    } catch {
      alert('Failed to update task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      loadAll();
    } catch {
      alert('Failed to delete task.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!project) return <div className="alert alert-warning">Project not found.</div>;

  const projectMembers = project.members?.map((m) => m.user) || [];

  return (
    <div>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/projects">Projects</Link>
          </li>
          <li className="breadcrumb-item active">{project.name}</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1>{project.name}</h1>
          <p className="text-muted">{project.description || 'No description'}</p>
          <span className="badge bg-success">{project.status}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
          {showTaskForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card card-shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">Team Members</h5>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush mb-3">
                {project.members?.map((m) => (
                  <li key={m.user?._id || m.user} className="list-group-item d-flex justify-content-between px-0">
                    <span>{m.user?.name || 'Unknown'}</span>
                    <span className="badge bg-secondary">{m.role}</span>
                  </li>
                ))}
              </ul>
              {isProjectAdmin() && (
                <form onSubmit={handleAddMember}>
                  <div className="input-group input-group-sm">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="member@email.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-outline-primary">
                      Add
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {showTaskForm && (
            <div className="card card-shadow mb-4">
              <div className="card-body">
                <h5>Create Task</h5>
                <form onSubmit={handleCreateTask}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Title</label>
                      <input
                        className="form-control"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Assign To</label>
                      <select
                        className="form-select"
                        value={taskForm.assignedTo}
                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {projectMembers.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={taskForm.status}
                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success mt-3">
                    Create Task
                  </button>
                </form>
              </div>
            </div>
          )}

          <h4 className="mb-3">Tasks ({tasks.length})</h4>
          {tasks.length === 0 ? (
            <p className="text-muted">No tasks in this project yet.</p>
          ) : (
            tasks.map((task) => (
              <div key={task._id} className="d-flex gap-2 align-items-start">
                <div className="flex-grow-1">
                  <TaskCard task={task} onStatusChange={handleStatusChange} />
                </div>
                <button
                  className="btn btn-sm btn-outline-danger mt-2"
                  onClick={() => handleDeleteTask(task._id)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
