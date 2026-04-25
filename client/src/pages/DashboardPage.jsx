import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <div style={{
        width: 36, height: 36,
        background: `${color}22`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div>
      <p style={{ fontSize: 36, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value ?? '—'}
      </p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
    </div>
  </div>
);

const ProgressBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{label.replace('-', ' ')}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 3, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          taskAPI.getStats(),
          taskAPI.getAll({ limit: 5, sortBy: 'createdAt', order: 'desc' }),
        ]);
        setStats(statsRes.data);
        setRecentTasks(tasksRes.data.tasks);
      } catch {
        // errors handled globally
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;

  const total = stats?.total || 0;
  const done = stats?.byStatus?.done || 0;
  const inProgress = stats?.byStatus?.['in-progress'] || 0;
  const todo = stats?.byStatus?.todo || 0;

  const statusColors = {
    todo: 'var(--todo)',
    'in-progress': 'var(--in-progress)',
    review: 'var(--review)',
    done: 'var(--done)',
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Here's what's happening with your tasks today.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tasks')}
          style={{ gap: 8 }}
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-4">
        <StatCard
          label="Total Tasks"
          value={total}
          icon={CheckSquare}
          color="var(--accent)"
          sub="all time"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          icon={Clock}
          color="var(--in-progress)"
          sub={total > 0 ? `${Math.round((inProgress / total) * 100)}% of total` : undefined}
        />
        <StatCard
          label="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          color="var(--danger)"
          sub="need attention"
        />
        <StatCard
          label="Done this week"
          value={stats?.completedThisWeek ?? 0}
          icon={TrendingUp}
          color="var(--success)"
          sub="great progress!"
        />
      </div>

      {/* Status breakdown + Priority breakdown */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>By Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['todo', 'in-progress', 'review', 'done'].map(s => (
              <ProgressBar
                key={s}
                label={s}
                value={stats?.byStatus?.[s] || 0}
                total={total}
                color={statusColors[s]}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>By Priority</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'urgent', color: 'var(--urgent)' },
              { key: 'high', color: 'var(--high)' },
              { key: 'medium', color: 'var(--medium)' },
              { key: 'low', color: 'var(--low)' },
            ].map(({ key, color }) => (
              <ProgressBar
                key={key}
                label={key}
                value={stats?.byPriority?.[key] || 0}
                total={total}
                color={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16 }}>Recent Tasks</h3>
          <button
            className="btn btn-ghost"
            onClick={() => navigate('/tasks')}
            style={{ fontSize: 13, gap: 4 }}
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <CheckSquare size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No tasks yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentTasks.map((task, i) => (
              <div
                key={task._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 0',
                  borderBottom: i < recentTasks.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: task.status === 'done' ? 'var(--done)' :
                    task.status === 'in-progress' ? 'var(--in-progress)' :
                    task.status === 'review' ? 'var(--review)' : 'var(--todo)',
                }} />
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {task.title}
                </span>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
