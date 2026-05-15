import express from 'express';
import { body, validationResult } from 'express-validator';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import {
  requireProjectMember,
  requireProjectAdmin,
  getProjectMembership,
} from '../middleware/projectAccess.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  const filter =
    req.user.role === 'admin'
      ? {}
      : {
          $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
        };

  const projects = await Project.find(filter)
    .populate('owner', 'name email')
    .populate('members.user', 'name email role')
    .sort('-updatedAt');

  res.json({ success: true, data: projects });
});

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const project = await Project.create({
      name: req.body.name,
      description: req.body.description || '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await project.populate('owner', 'name email');
    res.status(201).json({ success: true, data: project });
  }
);

router.get('/:id', requireProjectMember, async (req, res) => {
  await req.project.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members.user', select: 'name email role' },
  ]);
  res.json({ success: true, data: req.project });
});

router.put('/:id', requireProjectAdmin, async (req, res) => {
  const { name, description, status } = req.body;
  if (name) req.project.name = name;
  if (description !== undefined) req.project.description = description;
  if (status) req.project.status = status;
  await req.project.save();
  await req.project.populate([
    { path: 'owner', select: 'name email' },
    { path: 'members.user', select: 'name email role' },
  ]);
  res.json({ success: true, data: req.project });
});

router.delete('/:id', requireProjectAdmin, async (req, res) => {
  await Task.deleteMany({ project: req.project._id });
  await req.project.deleteOne();
  res.json({ success: true, message: 'Project deleted.' });
});

router.post(
  '/:id/members',
  requireProjectAdmin,
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { isMember } = getProjectMembership(req.project, user._id);
    if (isMember) {
      return res.status(400).json({ success: false, message: 'User is already a member.' });
    }

    req.project.members.push({
      user: user._id,
      role: req.body.role || 'member',
    });
    await req.project.save();
    await req.project.populate('members.user', 'name email role');

    res.json({ success: true, data: req.project });
  }
);

router.delete('/:id/members/:userId', requireProjectAdmin, async (req, res) => {
  if (req.project.owner.toString() === req.params.userId) {
    return res.status(400).json({ success: false, message: 'Cannot remove project owner.' });
  }

  req.project.members = req.project.members.filter(
    (m) => m.user.toString() !== req.params.userId
  );
  await req.project.save();
  res.json({ success: true, data: req.project });
});

export default router;
