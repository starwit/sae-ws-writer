import React, { useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { OrthographicView } from '@deck.gl/core';
import '../styles/TrajectoryVisualization.css';

const TrajectoryVisualization = ({ trajectories, frameInfo }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: 1000,  // Default initial values
    height: 1000
  });

  const [viewState, setViewState] = useState({
    target: [0, 0, 0],
    zoom: -1,
    minZoom: -5,
    maxZoom: 10
  });

  // Function to calculate the viewport dimensions that maintain aspect ratio
  const calculateViewportDimensions = (containerWidth, containerHeight, frameWidth, frameHeight) => {
    if (!frameWidth || !frameHeight) return { width: containerWidth, height: containerHeight };
    
    const frameAspectRatio = frameWidth / frameHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let viewWidth, viewHeight;
    
    if (containerAspectRatio > frameAspectRatio) {
      // Container is wider than frame - constrain by height
      viewHeight = containerHeight;
      viewWidth = viewHeight * frameAspectRatio;
    } else {
      // Container is taller than frame - constrain by width
      viewWidth = containerWidth;
      viewHeight = viewWidth / frameAspectRatio;
    }
    
    return { width: viewWidth, height: viewHeight };
  };
  
  // Update view when window size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && frameInfo?.shape) {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        const { width: frameWidth, height: frameHeight } = frameInfo.shape;
        setDimensions({ width: frameWidth, height: frameHeight });
        
        // Calculate zoom level to fit view
        const { width: viewWidth, height: viewHeight } = calculateViewportDimensions(
          containerWidth, 
          containerHeight, 
          frameWidth, 
          frameHeight
        );
        
        // Calculate zoom to fit the frame dimensions to the viewport
        const scale = Math.min(
          viewWidth / frameWidth,
          viewHeight / frameHeight
        );
        
        const zoom = Math.log2(scale);
        
        setViewState({
          target: [frameWidth / 2, frameHeight / 2, 0],
          zoom,
          minZoom: -5,
          maxZoom: 10
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
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
    <div ref={containerRef} className="visualization-container">
      <DeckGL
        views={new OrthographicView({
          id: 'ortho',
          flipY: true // Y increases from top to bottom in image space
        })}
        viewState={viewState}
        controller={false}
        onViewStateChange={onViewStateChange}
        layers={[backgroundLayer, ...layers]}
        getCursor={({isDragging}) => isDragging ? 'grabbing' : 'default'}
        className="deckgl-container"
      />
    </div>
  );
};

export default TrajectoryVisualization;
