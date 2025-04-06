import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

interface FlowCanvas3DProps {
  animationMode?: 'orbit' | 'zoom' | 'none';
}

// Custom TextSprite class (instead of extending THREE)
class TextSprite {
  object: THREE.Object3D;
  
  constructor(options: any) {
    this.object = new THREE.Object3D();
    
    // Create a canvas texture for the text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = 256;
      canvas.height = 128;
      
      // Draw text on canvas
      context.font = `${options.fontSize || 24}px ${options.fontFamily || 'Arial'}`;
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(options.text || '', canvas.width / 2, canvas.height / 2);
      
      // Create sprite from canvas
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true 
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(30, 15, 1);
      
      this.object.add(sprite);
    }
  }
  
  // Position getter/setter to match Three.js API
  get position() {
    return this.object.position;
  }
  
  set position(value) {
    this.object.position.copy(value);
  }
}

export default function FlowCanvas3D({ animationMode = 'none' }: FlowCanvas3DProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const data = {
    nodes: [
      { id: 'Start', group: 1, label: 'Start' },
      { id: 'Process', group: 2, label: 'Process Data' },
      { id: 'End', group: 3, label: 'End' },
      // Additional nodes for visualization richness
      { id: 'Validate', group: 2, label: 'Validate Input' },
      { id: 'Transform', group: 2, label: 'Transform Data' },
      { id: 'Error', group: 4, label: 'Error Handler' },
      { id: 'Log', group: 5, label: 'Logger' },
      { id: 'API', group: 3, label: 'API Gateway' },
      { id: 'Database', group: 6, label: 'Database' },
      { id: 'Cache', group: 6, label: 'Cache Layer' },
      { id: 'Auth', group: 7, label: 'Authentication' },
      { id: 'Format', group: 2, label: 'Format Output' },
      { id: 'Notify', group: 5, label: 'Notifications' }
    ],
    links: [
      { source: 'Start', target: 'Process', value: 5 },
      { source: 'Process', target: 'Validate', value: 3 },
      { source: 'Validate', target: 'Transform', value: 2 },
      { source: 'Transform', target: 'Format', value: 2 },
      { source: 'Format', target: 'End', value: 5 },
      { source: 'Validate', target: 'Error', value: 1 },
      { source: 'Process', target: 'Log', value: 1 },
      { source: 'Error', target: 'Log', value: 3 },
      { source: 'Process', target: 'API', value: 4 },
      { source: 'API', target: 'Auth', value: 2 },
      { source: 'Auth', target: 'Database', value: 3 },
      { source: 'Database', target: 'Cache', value: 2 },
      { source: 'Cache', target: 'Transform', value: 3 },
      { source: 'Transform', target: 'Notify', value: 1 },
      { source: 'Error', target: 'Notify', value: 2 }
    ],
  };

  const fgRef = useRef<any>();
  const intervalRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Update container size
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    // Initial size measurement
    updateDimensions();
    
    // Setup resize observer for container size changes
    resizeObserverRef.current = new ResizeObserver(updateDimensions);
    resizeObserverRef.current.observe(containerRef.current);
    
    return () => {
      if (resizeObserverRef.current && containerRef.current) {
        resizeObserverRef.current.unobserve(containerRef.current);
      }
    };
  }, []);

  // Function to create custom node objects
  const createNodeObject = (node: any) => {
    const group = node.group || 1;
    
    // Create a sphere for the node
    const geometry = new THREE.SphereGeometry(7, 16, 16);
    
    // Create material with glow effect
    const material = new THREE.MeshBasicMaterial({
      color: getGroupColor(group),
      transparent: true,
      opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(9, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: getGroupColor(group),
      transparent: true,
      opacity: 0.1
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh);
    
    // Add node label using our custom TextSprite
    if (node.label) {
      const textSprite = new TextSprite({
        text: node.label,
        fontFamily: 'Arial, sans-serif',
        fontSize: 8,
      });
      textSprite.position.y = 12;
      mesh.add(textSprite.object);
    }
    
    return mesh;
  };

  // Color scheme for node groups
  const getGroupColor = (group: number): string => {
    const colors = [
      '#00FFD0', // Primary teal
      '#5D5DFF', // Purple
      '#FFD166', // Yellow
      '#EF476F', // Pink
      '#06D6A0', // Green
      '#118AB2', // Blue
      '#073B4C'  // Dark blue
    ];
    
    return colors[((group - 1) % colors.length)];
  };

  // Function to automatically fit view to show the entire graph
  const fitView = () => {
    if (!fgRef.current) return;
    
    const graph = fgRef.current;
    
    // Calculate a dynamic view distance based on the container size
    const viewDistance = Math.max(300, Math.min(containerSize.width, containerSize.height) * 0.8);
    
    // Set camera position to have a broad view of the graph
    graph.cameraPosition(
      { x: 0, y: 0, z: viewDistance },  // Camera position
      { x: 0, y: 0, z: 0 },             // Look-at position (center of graph)
      1500                              // Transition duration
    );
  };

  useEffect(() => {
    // Initial camera position adjustments
    const fg = fgRef.current;
    if (fg) {
      // Use a wider initial view distance to ensure everything is visible
      fg.cameraPosition({ z: 400 }, { x: 0, y: 0, z: 0 }, 0);
      
      // Call the fit view function to further adjust the camera
      setTimeout(fitView, 500);
    }
    
    // Clear any previous animation interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Handle animation modes
    if (animationMode !== 'none' && fg) {
      if (animationMode === 'orbit') {
        // Orbit animation
        let angle = 0;
        intervalRef.current = window.setInterval(() => {
          const distance = 400;
          const x = distance * Math.sin(angle);
          const z = distance * Math.cos(angle);
          fg.cameraPosition({ x, y: 50, z });
          angle += 0.01;
        }, 30);
      } else if (animationMode === 'zoom') {
        // Zoom animation
        let distance = 400;
        let direction = -1; // -1 = zoom in, 1 = zoom out
        intervalRef.current = window.setInterval(() => {
          distance += direction * 2;
          if (distance < 150) direction = 1;
          if (distance > 450) direction = -1;
          fg.cameraPosition({ z: distance });
        }, 30);
      }
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [animationMode]);

  // Re-fit view when container size changes
  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      setTimeout(fitView, 100);
    }
  }, [containerSize]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        background: 'rgba(13, 15, 26, 0.95)',
        position: 'relative'
      }}
    >
      {containerSize.width > 0 && containerSize.height > 0 && (
        <ForceGraph3D
          ref={fgRef}
          width={containerSize.width}
          height={containerSize.height}
          graphData={data}
          nodeAutoColorBy="group"
          linkOpacity={0.5}
          linkWidth={(link) => (link.value || 1) * 0.5}
          backgroundColor="rgba(0,0,0,0)"
          nodeLabel={(node) => `${node.label || node.id} (Group: ${node.group})`}
          linkColor={() => 'rgba(0, 255, 208, 0.5)'}
          nodeColor={(node) => getGroupColor(node.group || 1)}
          nodeRelSize={6}
          linkDirectionalParticles={(link) => (link.value || 1)}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={(link) => (link.value || 1) * 0.5 + 0.5}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          d3AlphaDecay={0.02}
          cooldownTime={1500}  // Increased for better initial stabilization
          nodeThreeObject={createNodeObject}
          nodeThreeObjectExtend={false}
          enableNodeDrag={true}
          enableNavigationControls={true}
          controlType="orbit"
          onEngineStop={fitView}  // Fit view when the force simulation stops
        />
      )}
    </div>
  );
}