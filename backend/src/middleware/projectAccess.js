import Project from '../models/Project.js';

export const getProjectMembership = (project, userId) => {
  if (project.owner.toString() === userId.toString()) {
    return { isMember: true, projectRole: 'admin' };
  }
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  if (member) {
    return { isMember: true, projectRole: member.role };
  }
  return { isMember: false, projectRole: null };
};

export const requireProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const { isMember, projectRole } = getProjectMembership(project, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied to this project.' });
    }

    req.project = project;
    req.projectRole = projectRole || (req.user.role === 'admin' ? 'admin' : null);
    next();
  } catch {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const requireProjectAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const { isMember, projectRole } = getProjectMembership(project, req.user._id);
    const isGlobalAdmin = req.user.role === 'admin';
    const isProjectAdmin = projectRole === 'admin';

    if (!isGlobalAdmin && !isProjectAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only project admins can perform this action.',
      });
    }

    req.project = project;
    req.projectRole = projectRole;
    next();
  } catch {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
