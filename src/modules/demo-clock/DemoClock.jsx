import React, { useState, useEffect } from 'react';

/**
 * DemoClock Module
 * Independent demonstration module for ALFRED workspace.
 * Displays real-time digital clock with configurable 12/24h format,
 * UTC view, seconds toggle, and session uptime counter.
 */
export default function DemoClock({ moduleId }) {
  const [time, setTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [isUTC, setIsUTC] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeString = () => {
    let hours = isUTC ? time.getUTCHours() : time.getHours();
    const minutes = isUTC ? time.getUTCMinutes() : time.getMinutes();
    const seconds = isUTC ? time.getUTCSeconds() : time.getSeconds();

    let ampm = '';
    if (!is24Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    const pad = (n) => String(n).padStart(2, '0');
    let str = `${pad(hours)}:${pad(minutes)}`;
    if (showSeconds) {
      str += `:${pad(seconds)}`;
    }
    return str + ampm;
  };

  const formatUptime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="alfred-module-demo-clock" data-testid="demo-clock-module">
      <div className="demo-clock-display">
        <div className="demo-clock-time" data-testid="demo-clock-time">
          {formatTimeString()}
        </div>
        <div className="demo-clock-subtext">
          {isUTC ? 'Coordinated Universal Time (UTC)' : 'Local System Time'}
        </div>
      </div>

      <div className="demo-clock-controls">
        <button
          type="button"
          className={`demo-clock-btn ${is24Hour ? 'active' : ''}`}
          onClick={() => setIs24Hour(!is24Hour)}
          title="Toggle 24h / 12h Format"
        >
          {is24Hour ? '24-Hour' : '12-Hour'}
        </button>

        <button
          type="button"
          className={`demo-clock-btn ${showSeconds ? 'active' : ''}`}
          onClick={() => setShowSeconds(!showSeconds)}
          title="Toggle Seconds"
        >
          {showSeconds ? 'Seconds ON' : 'Seconds OFF'}
        </button>

        <button
          type="button"
          className={`demo-clock-btn ${isUTC ? 'active' : ''}`}
          onClick={() => setIsUTC(!isUTC)}
          title="Toggle UTC Mode"
        >
          {isUTC ? 'UTC Active' : 'Switch to UTC'}
        </button>
      </div>

      <div className="demo-clock-stats">
        <div className="demo-clock-stat-card">
          <div className="demo-clock-stat-label">Widget Uptime</div>
          <div className="demo-clock-stat-val" data-testid="demo-clock-uptime">
            {formatUptime(sessionSeconds)}
          </div>
        </div>
        <div className="demo-clock-stat-card">
          <div className="demo-clock-stat-label">Timezone Offset</div>
          <div className="demo-clock-stat-val">
            {isUTC ? 'UTC+0' : `UTC${time.getTimezoneOffset() <= 0 ? '+' : '-'}${Math.abs(Math.floor(time.getTimezoneOffset() / 60))}`}
          </div>
        </div>
      </div>
    </div>
  );
}
