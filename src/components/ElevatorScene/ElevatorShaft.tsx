import { BUILDING_CONFIG, COLORS, ELEVATOR_CONFIG } from '../../config/constants';

interface ElevatorShaftProps {
  index: number;
}

export function ElevatorShaft({ index }: ElevatorShaftProps) {
  const numFloors = BUILDING_CONFIG.NUM_FLOORS;
  const floorHeight = BUILDING_CONFIG.FLOOR_HEIGHT;
  const totalHeight = numFloors * floorHeight;
  const shaftWidth = ELEVATOR_CONFIG.WIDTH + 0.4;
  const shaftDepth = ELEVATOR_CONFIG.DEPTH + 0.4;
  const xOffset = (index - 0.5) * ELEVATOR_CONFIG.SHAFT_SPACING;
  
  return (
    <group position={[xOffset, totalHeight / 2 - floorHeight / 2, 0]}>
      <mesh position={[0, 0, -shaftDepth / 2]}>
        <boxGeometry args={[shaftWidth, totalHeight, 0.05]} />
        <meshStandardMaterial 
          color={COLORS.WALL} 
          metalness={0.5} 
          roughness={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      <mesh position={[-shaftWidth / 2, 0, 0]}>
        <boxGeometry args={[0.05, totalHeight, shaftDepth]} />
        <meshStandardMaterial 
          color={COLORS.WALL_LIGHT} 
          metalness={0.4} 
          roughness={0.4}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      <mesh position={[shaftWidth / 2, 0, 0]}>
        <boxGeometry args={[0.05, totalHeight, shaftDepth]} />
        <meshStandardMaterial 
          color={COLORS.WALL_LIGHT} 
          metalness={0.4} 
          roughness={0.4}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {Array.from({ length: numFloors }).map((_, i) => (
        <group key={`floor-indicator-${index}-${i}`}>
          <mesh position={[-shaftWidth / 2 + 0.1, i * floorHeight, -shaftDepth / 2 + 0.1]}>
            <boxGeometry args={[0.02, 0.15, 0.02]} />
            <meshStandardMaterial 
              color="#00ff88" 
              emissive="#00ff88" 
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
