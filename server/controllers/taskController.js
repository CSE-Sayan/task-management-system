const { validationResult } = require('express-validator');
const Task = require('../models/Task');

// GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter),
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/stats
exports.getStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const overdue = await Task.countDocuments({
      owner: req.user._id,
      dueDate: { $lt: new Date() },
      status: { $ne: 'done' },
    });

    const completedThisWeek = await Task.countDocuments({
      owner: req.user._id,
      status: 'done',
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const statusMap = {};
    stats.forEach(s => { statusMap[s._id] = s.count; });

    const priorityMap = {};
    priorityStats.forEach(p => { priorityMap[p._id] = p.count; });

    res.json({
      byStatus: statusMap,
      byPriority: priorityMap,
      overdue,
      completedThisWeek,
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('assignedTo', 'name email');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
    }

    const { title, description, status, priority, dueDate, tags, assignedTo } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags: tags || [],
      assignedTo,
      owner: req.user._id,
    });

    const populated = await task.populate('assignedTo', 'name email');
    res.status(201).json({ message: 'Task created', task: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
    }

    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'tags', 'assignedTo'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    const populated = await task.populate('assignedTo', 'name email');
    res.json({ message: 'Task updated', task: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks (bulk delete)
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }
    const result = await Task.deleteMany({ _id: { $in: ids }, owner: req.user._id });
    res.json({ message: `${result.deletedCount} tasks deleted` });
  } catch (err) {
    next(err);
  }
};
