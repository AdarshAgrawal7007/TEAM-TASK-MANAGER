import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  const projectFilter =
    req.user.role === 'admin'
      ? {}
      : {
          $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
        };

  const projects = await Project.find(projectFilter).select('_id');
  const projectIds = projects.map((p) => p._id);

  const taskFilter = { project: { $in: projectIds } };
  const now = new Date();

  const [tasks, statusCounts, overdueTasks, myTasks] = await Promise.all([
    Task.find(taskFilter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort('-updatedAt')
      .limit(20),
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.find({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $ne: 'done' },
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort('dueDate'),
    Task.find({ ...taskFilter, assignedTo: req.user._id, status: { $ne: 'done' } })
      .populate('project', 'name')
      .limit(10),
  ]);

  const stats = {
    totalProjects: projectIds.length,
    totalTasks: statusCounts.reduce((sum, s) => sum + s.count, 0),
    byStatus: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
    overdueCount: overdueTasks.length,
  };

  res.json({
    success: true,
    data: {
      stats,
      recentTasks: tasks,
      overdueTasks,
      myTasks,
    },
  });
});

export default router;
