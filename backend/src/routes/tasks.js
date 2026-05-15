import express from 'express';
import { body, validationResult } from 'express-validator';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';
import { getProjectMembership } from '../middleware/projectAccess.js';

const router = express.Router();

router.use(protect);

const canAccessProject = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) return { allowed: false, project: null };
  const { isMember } = getProjectMembership(project, user._id);
  const allowed = isMember || user.role === 'admin';
  return { allowed, project };
};

router.get('/project/:projectId', async (req, res) => {
  const { allowed } = await canAccessProject(req.params.projectId, req.user);
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const tasks = await Task.find({ project: req.params.projectId })
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort('-createdAt');

  res.json({ success: true, data: tasks });
});

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { allowed } = await canAccessProject(req.body.project, req.user);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || '',
      project: req.body.project,
      assignedTo: req.body.assignedTo || null,
      createdBy: req.user._id,
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null,
    });

    await task.populate(['assignedTo', 'createdBy'], 'name email');
    res.status(201).json({ success: true, data: task });
  }
);

router.get('/:id', async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'name');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const { allowed } = await canAccessProject(task.project._id, req.user);
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  res.json({ success: true, data: task });
});

router.put('/:id', async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const { allowed, project } = await canAccessProject(task.project, req.user);
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const { projectRole } = getProjectMembership(project, req.user._id);
  const isAdmin = req.user.role === 'admin' || projectRole === 'admin';
  const isAssignee = task.assignedTo?.toString() === req.user._id.toString();

  if (!isAdmin && !isAssignee && task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Cannot edit this task.' });
  }

  const fields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  await task.populate(['assignedTo', 'createdBy'], 'name email');
  res.json({ success: true, data: task });
});

router.delete('/:id', async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found.' });
  }

  const { allowed, project } = await canAccessProject(task.project, req.user);
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const { projectRole } = getProjectMembership(project, req.user._id);
  const isAdmin = req.user.role === 'admin' || projectRole === 'admin';

  if (!isAdmin && task.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Cannot delete this task.' });
  }

  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted.' });
});

export default router;
