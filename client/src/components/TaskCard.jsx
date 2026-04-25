import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Calendar, Tag, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

const priorityDot = { low: 'var(--low)', medium: 'var(--medium)', high: 'var(--high)', urgent: 'var(--urgent)' };
const statusLabel = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };

const TaskCard = ({ task, onEdit, onDelete, onStatusChange, selected, onSelect }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const dueDateColor = isOverdue ? 'var(--danger)' : isDueToday ? 'var(--warning)' : 'var(--text-muted)';

  const cycleSatus = () => {
    const order = ['todo', 'in-progress', 'review', 'done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    onStatusChange(task._id, next);
  };

  return (
    <div
      style={{
        background: selected ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'all 0.18s ease',
        cursor: 'default',
        position: 'relative',
        opacity: task.status === 'done' ? 0.75 : 1,
      }}
      onMouseEnter={e => !selected && (e.currentTarget.style.borderColor = 'var(--border-light)')}
      onMouseLeave={e => !selected && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Top row: checkbox + title + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Select checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(task._id)}
          style={{ marginTop: 3, accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}
        />

        {/* Status toggle */}
        <button
          onClick={cycleSatus}
          title={`Status: ${statusLabel[task.status]} — click to advance`}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: task.status === 'done' ? 'var(--done)' : 'var(--border-light)',
            marginTop: 1, flexShrink: 0,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
          onMouseLeave={e => e.currentTarget.style.color = task.status === 'done' ? 'var(--done)' : 'var(--border-light)'}
        >
          <CheckCircle2 size={20} />
        </button>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text-primary)',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {task.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            className="btn btn-ghost"
            style={{ padding: 6 }}
            onClick={() => onEdit(task)}
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: 6, color: 'var(--danger)' }}
            onClick={() => onDelete(task._id)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Footer meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingLeft: 54 }}>
        {/* Priority dot */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
          color: priorityDot[task.priority],
          fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityDot[task.priority], display: 'inline-block' }} />
          {task.priority}
        </span>

        {/* Status badge */}
        <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>

        {/* Due date */}
        {task.dueDate && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: dueDateColor }}>
            <Calendar size={11} />
            {isOverdue ? 'Overdue · ' : isDueToday ? 'Today · ' : ''}
            {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </span>
        )}

        {/* Tags */}
        {task.tags?.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <Tag size={11} />
            {task.tags.slice(0, 2).join(', ')}
            {task.tags.length > 2 && ` +${task.tags.length - 2}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
