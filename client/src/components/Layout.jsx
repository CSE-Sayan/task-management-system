import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, CheckSquare, User, Shield, LogOut,
  Menu, X, Zap
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '11px 16px',
      borderRadius: 'var(--radius-sm)',
      color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
      background: isActive ? 'var(--accent-glow)' : 'transparent',
      fontWeight: isActive ? 600 : 400,
      fontSize: 14,
      border: isActive ? '1px solid rgba(124,92,252,0.3)' : '1px solid transparent',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
    })}
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const sidebarContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '24px 16px',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 4px',
        marginBottom: 36,
      }}>
        <div style={{
          width: 36, height: 36,
          background: 'var(--accent)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px var(--accent-glow)',
        }}>
          <Zap size={18} color="white" />
        </div>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
          TaskFlow
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '0 16px', marginBottom: 8 }}>
          Navigation
        </p>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setMobileOpen(false)} />
        <NavItem to="/tasks" icon={CheckSquare} label="My Tasks" onClick={() => setMobileOpen(false)} />
        <NavItem to="/profile" icon={User} label="Profile" onClick={() => setMobileOpen(false)} />
        {isAdmin && (
          <>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '16px 16px 8px', marginTop: 8, borderTop: '1px solid var(--border)' }}>
              Admin
            </p>
            <NavItem to="/admin" icon={Shield} label="User Management" onClick={() => setMobileOpen(false)} />
          </>
        )}
      </nav>

      {/* User profile at bottom */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: user?.role === 'admin' ? 'var(--accent)' : 'var(--success)',
              }} />
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 13 }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
        className="desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside style={{
        width: 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        top: 0, left: mobileOpen ? 0 : -280, bottom: 0,
        zIndex: 201,
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 240,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Mobile header */}
        <header style={{
          display: 'none',
          position: 'sticky', top: 0, zIndex: 50,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 20px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }} className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28,
              background: 'var(--accent)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={14} color="white" />
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16 }}>TaskFlow</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <Menu size={22} />
          </button>
        </header>

        <div style={{ flex: 1, padding: '32px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          main { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
