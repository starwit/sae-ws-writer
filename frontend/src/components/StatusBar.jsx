import React from 'react';
import '../styles/StatusBar.css';

const StatusBar = ({ connected, objectCount, trajectories, frameInfo }) => {
  // Count active and passive trajectories
  const activeCount = trajectories ? trajectories.filter(t => t.isActive).length : 0;
  const passiveCount = trajectories ? trajectories.filter(t => !t.isActive).length : 0;
  
  return (
    <div className="status-bar">
      <div className="connection-status">
        WebSocket: <span className={connected ? "connection-active" : "connection-inactive"}>
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
      <div className="trajectory-info">
        Trajectories: <span className="active-count">{activeCount} active</span>, 
        <span className="passive-count"> {passiveCount} passive</span>
      </div>
      {frameInfo && (
        <div className="frame-info">
          <div className="frame-info-item">Source: {frameInfo.sourceId || 'Unknown'}</div>
          <div className="frame-info-item">
            Resolution: {frameInfo.shape ? `${frameInfo.shape.width}x${frameInfo.shape.height}` : 'Unknown'}
          </div>
          <div className="frame-info-item">
            Time: {new Date(parseInt(frameInfo.timestampUtcMs)).toISOString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBar;
