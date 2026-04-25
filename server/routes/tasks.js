const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getTasks, getTask, getStats, createTask, updateTask, deleteTask, bulkDelete
} = require('../controllers/taskController');

const taskValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description max 2000 chars'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

router.use(authenticate);

router.get('/stats', getStats);
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', taskValidation, createTask);
router.put('/:id', taskValidation, updateTask);
router.delete('/bulk', bulkDelete);
router.delete('/:id', deleteTask);

module.exports = router;
