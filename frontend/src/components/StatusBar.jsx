import React from 'react';

const StatusBar = ({ connected, objectCount, trajectories, frameInfo }) => {
  // Count active and passive trajectories
  const activeCount = trajectories ? trajectories.filter(t => t.isActive).length : 0;
  const passiveCount = trajectories ? trajectories.filter(t => !t.isActive).length : 0;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 10,
      fontFamily: 'monospace'
    }}>
      <div>
        WebSocket: <span style={{ color: connected ? '#4CAF50' : '#F44336' }}>
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
      <div>
        Trajectories: <span style={{ color: '#4CAF50' }}>{activeCount} active</span>, <span style={{ color: '#AAAAAA' }}>{passiveCount} passive</span>
      </div>
      {frameInfo && (
        <>
          <div>Source: {frameInfo.sourceId || 'Unknown'}</div>
          <div>Resolution: {frameInfo.shape ? `${frameInfo.shape.width}x${frameInfo.shape.height}` : 'Unknown'}</div>
          <div>Time: {new Date(parseInt(frameInfo.timestampUtcMs)).toISOString()}</div>
        </>
      )}
    </div>
  );
};

export default StatusBar;
