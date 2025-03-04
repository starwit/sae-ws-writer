import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { OrthographicView } from '@deck.gl/core';
import '../styles/TrajectoryVisualization.css';

const TrajectoryVisualization = ({ trajectories, frameInfo }) => {
  const [viewState, setViewState] = useState({
    // Initialize with dummy values
    target: [0, 0, 0],
    zoom: -1,
    minZoom: -5,
    maxZoom: 10
  });
  
  const [dimensions, setDimensions] = useState({
    width: 1000,  // Default initial values
    height: 1000
  });

  // Update view when frame info changes
  useEffect(() => {
    if (frameInfo && frameInfo.shape) {
      const { width, height } = frameInfo.shape;
      setDimensions({ width, height });
      
      // Calculate appropriate zoom level to fit the view
      const maxDim = Math.max(width, height);
      const zoom = Math.log2(1000 / maxDim);
      
      setViewState({
        target: [width / 2, height / 2, 0],
        zoom: zoom,
        minZoom: -5,
        maxZoom: 10
      });
    }
  }, [frameInfo]);

  const layers = [];
  
  if (trajectories && trajectories.length > 0) {
    // First, separate active and passive trajectories
    const activeTrajectories = trajectories.filter(t => t.isActive);
    const passiveTrajectories = trajectories.filter(t => !t.isActive);
    
    // Add paths for passive trajectories (render these first, so they appear below active ones)
    if (passiveTrajectories.length > 0) {
      layers.push(
        new PathLayer({
          id: 'passive-trajectory-paths',
          data: passiveTrajectories,
          getPath: d => d.path,
          getColor: d => d.color,
          getWidth: 1.5, // Slightly thinner than active trajectories
          widthUnits: 'pixels',
          pickable: true,
          jointRounded: true,
          capRounded: true,
          billboard: false,
          miterLimit: 2
        })
      );
    }
    
    // Add paths for active trajectories
    if (activeTrajectories.length > 0) {
      layers.push(
        new PathLayer({
          id: 'active-trajectory-paths',
          data: activeTrajectories,
          getPath: d => d.path,
          getColor: d => d.color,
          getWidth: 2, 
          widthUnits: 'pixels',
          pickable: true,
          jointRounded: true,
          capRounded: true,
          billboard: false,
          miterLimit: 2,
          onHover: info => {
            if (info.object) {
              console.log('Trajectory ID:', info.object.id);
            }
          }
        })
      );
      
      // Add points for the current positions (only for active trajectories)
      layers.push(
        new ScatterplotLayer({
          id: 'current-positions',
          data: activeTrajectories.map(t => ({ 
            position: t.path[t.path.length - 1], 
            color: t.color,
            id: t.id
          })),
          getPosition: d => d.position,
          getColor: [255, 255, 255], // White outline for all markers
          getFillColor: d => d.color,
          getRadius: 5,
          radiusUnits: 'pixels',
          stroked: true,
          lineWidthMinPixels: 1,
          pickable: true,
          onHover: info => {
            if (info.object) {
              console.log('Object ID:', info.object.id);
            }
          }
        })
      );
    }
  }

  const onViewStateChange = ({ viewState: newViewState }) => {
    setViewState(newViewState);
  };

  // Render a background layer to visualize the canvas area
  const backgroundLayer = new ScatterplotLayer({
    id: 'background',
    data: [
      { position: [0, 0], radius: 1 },
      { position: [dimensions.width, 0], radius: 1 },
      { position: [dimensions.width, dimensions.height], radius: 1 },
      { position: [0, dimensions.height], radius: 1 }
    ],
    getPosition: d => d.position,
    getRadius: 1,
    getFillColor: [0, 0, 0, 0], // Transparent
    getLineColor: [100, 100, 100], // Gray border
    stroked: true,
    filled: true,
    lineWidthMinPixels: 1
  });

  return (
    <DeckGL
      views={new OrthographicView({
        id: 'ortho',
        flipY: true // Y increases from top to bottom in image space
      })}
      viewState={viewState}
      controller={true}
      onViewStateChange={onViewStateChange}
      layers={[backgroundLayer, ...layers]}
      getCursor={({isDragging}) => isDragging ? 'grabbing' : 'default'}
      className="deckgl-container"
    >
      {/* Debug information */}
      {frameInfo && 
        <div className="debug-info">
          Canvas: {dimensions.width} × {dimensions.height}
        </div>
      }
    </DeckGL>
  );
};

export default TrajectoryVisualization;
