import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 36 }) => {
  const spinner = (
    <div
      className="spinner"
      style={{ width: size, height: size, borderWidth: size > 24 ? 3 : 2 }}
    />
  );

  if (fullScreen) {
    return (
      <div className="fullscreen-loader">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {spinner}
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</span>
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
