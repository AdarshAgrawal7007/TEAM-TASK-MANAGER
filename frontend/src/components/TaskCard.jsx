const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const STATUS_COLORS = {
  todo: 'secondary',
  in_progress: 'primary',
  review: 'warning',
  done: 'success',
};

const PRIORITY_COLORS = {
  low: 'info',
  medium: 'secondary',
  high: 'danger',
};

export default function TaskCard({ task, onStatusChange, compact }) {
  const isOverdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date();

  return (
    <div className={`card card-shadow mb-2 ${isOverdue ? 'task-overdue' : ''}`}>
      <div className="card-body py-2 px-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="mb-1">{task.title}</h6>
            {!compact && task.description && (
              <p className="text-muted small mb-1">{task.description}</p>
            )}
            <small className="text-muted">
              {task.project?.name && <span className="me-2">📁 {task.project.name}</span>}
              {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
            </small>
          </div>
          <div className="text-end">
            <span className={`badge bg-${STATUS_COLORS[task.status]} status-badge me-1`}>
              {STATUS_LABELS[task.status]}
            </span>
            <span className={`badge bg-${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          {task.dueDate && (
            <small className={isOverdue ? 'text-danger fw-bold' : 'text-muted'}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && ' (Overdue)'}
            </small>
          )}
          {onStatusChange && task.status !== 'done' && (
            <select
              className="form-select form-select-sm w-auto"
              value={task.status}
              onChange={(e) => onStatusChange(task._id, e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
