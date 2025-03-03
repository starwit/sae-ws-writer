class ObjectTracker {
  constructor(maxTrajectoryPoints = 500) {
    this.trajectories = new Map(); // Map of objectId -> array of points (active trajectories)
    this.passiveTrajectories = []; // Array of passive trajectory paths
    this.maxTrajectoryPoints = maxTrajectoryPoints;
    this.activeColor = [0, 128, 255, 255]; // Blue for active trajectories
    this.passiveColor = [150, 150, 150, 200]; // Grey with some transparency for passive trajectories
    this.activeTTL = 2000; // Time to live in milliseconds before becoming passive (2 seconds)
  }
  
  // Convert base64 objectId to hex string
  static objectIdToHex(base64Id) {
    try {
      const binaryString = atob(base64Id);
      let hexString = '';
      
      for (let i = 0; i < binaryString.length; i++) {
        const hex = binaryString.charCodeAt(i).toString(16).padStart(2, '0');
        hexString += hex;
      }
      
      return hexString;
    } catch (error) {
      console.error('Error converting objectId to hex:', error);
      return base64Id; // Return original if conversion fails
    }
  }

  // Process new detections and update trajectories
  updateTrajectories(detections, frameInfo) {
    const { width, height } = frameInfo.shape;
    const currentTime = parseInt(frameInfo.timestampUtcMs);
    
    // Process new detections
    detections.forEach(detection => {
      const { objectId, boundingBox } = detection;
      const hexId = ObjectTracker.objectIdToHex(objectId);
      
      // Calculate center point of the bounding box
      const centerX = ((boundingBox.minX + boundingBox.maxX) / 2) * width;
      const centerY = ((boundingBox.minY + boundingBox.maxY) / 2) * height;
      
      // Create a new point
      const point = {
        x: centerX,
        y: centerY,
        timestamp: currentTime,
        objectClass: detection.classId,
        confidence: detection.confidence
      };
      
      // Update trajectory for this object
      if (!this.trajectories.has(hexId)) {
        this.trajectories.set(hexId, [point]);
      } else {
        const trajectory = this.trajectories.get(hexId);
        
        // Add the new point
        trajectory.push(point);
        
        // Truncate if exceeding max points
        if (trajectory.length > this.maxTrajectoryPoints) {
          trajectory.shift();
        }
      }
    });

    // Convert stale trajectories to passive ones and remove very old ones
    this.processStaleTrajectories(currentTime);
    
    return this.getAllTrajectoryData();
  }
  
  // Process trajectories that haven't been updated recently
  processStaleTrajectories(currentTimestamp) {
    const activeTTL = this.activeTTL;
    
    // Check active trajectories
    this.trajectories.forEach((points, objectId) => {
      if (points.length < 2) return; // Skip single-point trajectories
      
      const lastPointTime = parseInt(points[points.length - 1].timestamp);
      const age = currentTimestamp - lastPointTime;
      
      // If trajectory is stale, convert to passive and remove from active
      if (age > activeTTL) {
        // Create a passive trajectory object
        const passiveTrajectory = {
          path: points.map(p => [p.x, p.y]),
          color: this.passiveColor,
          timestamps: points.map(p => p.timestamp),
          lastUpdate: lastPointTime
        };
        
        this.passiveTrajectories.push(passiveTrajectory);
        this.trajectories.delete(objectId);
      }
    });
    
    // Limit the number of passive trajectories (optional)
    if (this.passiveTrajectories.length > 100) {
      // Remove oldest passive trajectories if we have too many
      this.passiveTrajectories.splice(0, this.passiveTrajectories.length - 100);
    }
  }
  
  // Get active trajectory data in a format suitable for deck.gl
  getActiveTrajectoryData() {
    const trajectoryData = [];
    
    this.trajectories.forEach((points, objectId) => {
      // Only include trajectories with at least 2 points
      if (points.length >= 2) {
        trajectoryData.push({
          id: objectId,
          path: points.map(p => [p.x, p.y]),
          timestamps: points.map(p => p.timestamp),
          color: this.activeColor,
          lastPoint: points[points.length - 1],
          isActive: true
        });
      }
    });
    
    return trajectoryData;
  }
  
  // Get passive trajectory data
  getPassiveTrajectoryData() {
    return this.passiveTrajectories.map((traj, index) => ({
      id: `passive-${index}`,
      path: traj.path,
      timestamps: traj.timestamps,
      color: traj.color,
      isActive: false
    }));
  }
  
  // Get all trajectory data (both active and passive)
  getAllTrajectoryData() {
    return [
      ...this.getActiveTrajectoryData(),
      ...this.getPassiveTrajectoryData()
    ];
  }
  
  // Clear all trajectories (both active and passive)
  clearTrajectories() {
    this.trajectories.clear();
    this.passiveTrajectories = [];
  }
}

export default ObjectTracker;
