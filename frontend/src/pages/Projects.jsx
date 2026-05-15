import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll();
      setProjects(res.data.data);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.create(form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      loadProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      loadProjects();
    } catch {
      alert('Failed to delete project.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card card-shadow mb-4">
          <div className="card-body">
            <h5>Create Project</h5>
            <form onSubmit={handleCreate}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-success">
                Create
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="row g-3">
        {projects.length === 0 ? (
          <p className="text-muted">No projects yet. Create your first project!</p>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="col-md-6 col-lg-4">
              <div className="card card-shadow h-100">
                <div className="card-body">
                  <h5 className="card-title">{project.name}</h5>
                  <p className="card-text text-muted small">{project.description || 'No description'}</p>
                  <p className="small mb-2">
                    <span className={`badge bg-${project.status === 'active' ? 'success' : 'secondary'}`}>
                      {project.status}
                    </span>
                    <span className="ms-2 text-muted">
                      {project.members?.length || 0} members
                    </span>
                  </p>
                  <div className="d-flex gap-2">
                    <Link to={`/projects/${project._id}`} className="btn btn-sm btn-primary">
                      Open
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(project._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
