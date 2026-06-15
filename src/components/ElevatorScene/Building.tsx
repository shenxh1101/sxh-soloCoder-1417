import { useMemo } from 'react';
import * as THREE from 'three';
import { BUILDING_CONFIG, COLORS, ELEVATOR_CONFIG } from '../../config/constants';

export function Building() {
  const numFloors = BUILDING_CONFIG.NUM_FLOORS;
  const floorHeight = BUILDING_CONFIG.FLOOR_HEIGHT;
  const buildingWidth = BUILDING_CONFIG.BUILDING_WIDTH;
  const buildingDepth = BUILDING_CONFIG.BUILDING_DEPTH;
  const wallThickness = BUILDING_CONFIG.WALL_THICKNESS;
  const totalHeight = numFloors * floorHeight;
  
  const floorLabels = useMemo(() => {
    const labels: { position: [number, number, number]; text: string }[] = [];
    for (let i = 0; i < numFloors; i++) {
      labels.push({
        position: [-buildingWidth / 2 - 0.5, i * floorHeight, 0],
        text: i.toString(),
      });
    }
    return labels;
  }, [numFloors, floorHeight, buildingWidth]);
  
  const floorGeometries = useMemo(() => {
    const geoms: THREE.InstancedMesh | null = null;
    return geoms;
  }, []);
  
  const labelTextures = useMemo(() => {
    return floorLabels.map((label) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 72px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 10;
      ctx.fillText(label.text, 64, 64);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return { position: label.position, texture };
    });
  }, [floorLabels]);
  
  return (
    <group>
      <mesh position={[0, totalHeight / 2 - floorHeight / 2, -buildingDepth / 2]}>
        <boxGeometry args={[buildingWidth, totalHeight, wallThickness]} />
        <meshStandardMaterial color={COLORS.WALL} metalness={0.2} roughness={0.6} />
      </mesh>
      
      {Array.from({ length: numFloors + 1 }).map((_, i) => (
        <mesh key={`floor-${i}`} position={[0, i * floorHeight - floorHeight / 2, 0]}>
          <boxGeometry args={[buildingWidth, wallThickness, buildingDepth]} />
          <meshStandardMaterial color={COLORS.WALL_LIGHT} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      
      <mesh position={[-buildingWidth / 2, totalHeight / 2 - floorHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, totalHeight, buildingDepth]} />
        <meshStandardMaterial color={COLORS.WALL} metalness={0.2} roughness={0.6} />
      </mesh>
      
      <mesh position={[buildingWidth / 2, totalHeight / 2 - floorHeight / 2, 0]}>
        <boxGeometry args={[wallThickness, totalHeight, buildingDepth]} />
        <meshStandardMaterial color={COLORS.WALL} metalness={0.2} roughness={0.6} />
      </mesh>
      
      {labelTextures.map(({ position, texture }, i) => (
        <mesh key={`label-${i}`} position={position} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.6, 0.6]} />
          <meshBasicMaterial map={texture} transparent />
        </mesh>
      ))}
      
      {Array.from({ length: numFloors }).map((_, i) => (
        <group key={`office-${i}`}>
          {[...Array(3)].map((_, j) => (
            <mesh 
              key={`light-${i}-${j}`} 
              position={[
                -buildingWidth / 2 + 2 + j * 2.5,
                i * floorHeight + 0.5,
                -buildingDepth / 2 + 0.1
              ]}
            >
              <planeGeometry args={[1.5, 0.8]} />
              <meshStandardMaterial 
                color={COLORS.LIGHT_ON} 
                emissive={COLORS.LIGHT_ON}
                emissiveIntensity={0.3}
                transparent
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
