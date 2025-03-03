import React, { useState, useEffect, useRef } from 'react';
import TrajectoryVisualization from './components/TrajectoryVisualization';
import StatusBar from './components/StatusBar';
import WebSocketService from './utils/websocketService';
import ObjectTracker from './utils/objectTracker';

const WS_URL = 'ws://localhost:12345';

function App() {
  const [connected, setConnected] = useState(false);
  const [trajectories, setTrajectories] = useState([]);
  const [frameInfo, setFrameInfo] = useState(null);
  const [objectTracker] = useState(() => new ObjectTracker(500)); // Increased to 500 points
  const [ws, setWs] = useState(null);
  const containerRef = useRef(null);

  // Handle incoming WebSocket messages
  const handleMessage = (data) => {
    if (!data || !data.frame || !data.detections) {
      console.warn('Invalid message format received:', data);
      return;
    }

    setFrameInfo(data.frame);
    const updatedTrajectories = objectTracker.updateTrajectories(data.detections, data.frame);
    setTrajectories(updatedTrajectories);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const webSocketService = new WebSocketService(WS_URL, handleMessage);
    webSocketService.connect();
    setWs(webSocketService);
    setConnected(true);

    return () => {
      if (webSocketService) {
        webSocketService.disconnect();
        setConnected(false);
      }
    };
  }, []);

  // Handle connection status
  useEffect(() => {
    if (ws) {
      setConnected(ws.isConnected);
    }
  }, [ws]);

  const clearTrajectories = () => {
    objectTracker.clearTrajectories();
    setTrajectories([]);
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <TrajectoryVisualization 
        trajectories={trajectories} 
        frameInfo={frameInfo}
      />
      <StatusBar 
        connected={connected} 
        objectCount={trajectories.filter(t => t.isActive).length}
        trajectories={trajectories}
        frameInfo={frameInfo}
      />
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10
      }}>
        <button 
          onClick={clearTrajectories}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Trajectories
        </button>
      </div>
    </div>
  );
}

export default App;
