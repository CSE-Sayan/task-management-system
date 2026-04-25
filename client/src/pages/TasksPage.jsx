import React, { useState, useEffect, useCallback, useRef } from 'react';
import { taskAPI } from '../utils/api';
import toast from 'react-hot-toast';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Search, Filter, Trash2, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUSES = ['', 'todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];
const SORTS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'dueDate:asc', label: 'Due date (soon)' },
  { value: 'priority:desc', label: 'Priority' },
  { value: 'title:asc', label: 'Title A→Z' },
];

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', sort: 'createdAt:desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [page, setPage] = useState(1);

  const searchTimer = useRef(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const [sortBy, order] = filters.sort.split(':');
    try {
      const res = await taskAPI.getAll({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        search: search || undefined,
        sortBy,
        order,
        page,
        limit: 15,
      });
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
      setSelected([]);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters, search, page]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Debounce search
  const handleSearchChange = (v) => {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 400);
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', sort: 'createdAt:desc' });
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = filters.status || filters.priority || search;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      loadTasks();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} selected tasks?`)) return;
    try {
      await taskAPI.bulkDelete(selected);
      toast.success(`${selected.length} tasks deleted`);
      setSelected([]);
      loadTasks();
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await taskAPI.update(id, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === id ? res.data.task : t));
      toast.success(`Moved to ${newStatus}`);
    } catch {
      toast.error('Status update failed');
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelected(selected.length === tasks.length ? [] : tasks.map(t => t._id));
  };

  const handleSaved = (savedTask, editing) => {
    if (editing) {
      setTasks(prev => prev.map(t => t._id === savedTask._id ? savedTask : t));
    } else {
      loadTasks(); // reload to respect sort/filter
    }
  };

  const openCreate = () => { setEditTask(null); setModalOpen(true); };
  const openEdit = (task) => { setEditTask(task); setModalOpen(true); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>My Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {pagination.total} task{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Search + filters bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search tasks…"
            style={{ paddingLeft: 38, paddingRight: searchInput ? 38 : 14 }}
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          style={{ width: 'auto', minWidth: 130 }}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={filters.priority}
          onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}
          style={{ width: 'auto', minWidth: 130 }}
        >
          <option value="">All Priorities</option>
          {PRIORITIES.filter(Boolean).map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => { setFilters(f => ({ ...f, sort: e.target.value })); setPage(1); }}
          style={{ width: 'auto', minWidth: 160 }}
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        {hasActiveFilters && (
          <button className="btn btn-secondary" onClick={clearFilters} style={{ gap: 6 }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 16px',
          background: 'rgba(124,92,252,0.12)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <span style={{ fontSize: 14, color: 'var(--accent-light)', fontWeight: 600 }}>
            {selected.length} selected
          </span>
          <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleBulkDelete}>
            <Trash2 size={13} /> Delete selected
          </button>
          <button className="btn btn-ghost" onClick={() => setSelected([])} style={{ fontSize: 13 }}>
            Deselect all
          </button>
        </div>
      )}

      {/* Tasks list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <LoadingSpinner />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No tasks found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            {hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first task to get started.'}
          </p>
          {!hasActiveFilters && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Create Task
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Select all row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
            <input
              type="checkbox"
              checked={selected.length === tasks.length && tasks.length > 0}
              onChange={toggleSelectAll}
              style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select all on page</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                selected={selected.includes(task._id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 8 }}>
              <button
                className="btn btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '8px 14px' }}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page === pagination.pages}
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '8px 14px' }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <TaskModal
          task={editTask}
          onClose={() => { setModalOpen(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default TasksPage;
