import React, { useState, useEffect } from 'react';
import { taskAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { X, Tag, Calendar } from 'lucide-react';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const TaskModal = ({ task, onClose, onSaved }) => {
  const editing = !!task?._id;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: task?.tags?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(err => ({ ...err, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length > 200) e.title = 'Max 200 characters';
    if (form.dueDate && isNaN(Date.parse(form.dueDate))) e.dueDate = 'Invalid date';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    try {
      let saved;
      if (editing) {
        const res = await taskAPI.update(task._id, payload);
        saved = res.data.task;
        toast.success('Task updated');
      } else {
        const res = await taskAPI.create(payload);
        saved = res.data.task;
        toast.success('Task created');
      }
      onSaved(saved, editing);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save task';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editing ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="What needs to be done?"
              autoFocus
              style={{ borderColor: errors.title ? 'var(--danger)' : undefined }}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Add more details…"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select value={form.status} onChange={set('status')}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={12} /> Due Date
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              style={{ borderColor: errors.dueDate ? 'var(--danger)' : undefined }}
            />
            {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Tag size={12} /> Tags
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={set('tags')}
              placeholder="design, frontend, urgent (comma-separated)"
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
