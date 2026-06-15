import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Elevator } from '../../types';
import { ELEVATOR_CONFIG, COLORS, BUILDING_CONFIG } from '../../config/constants';

interface ElevatorCarProps {
  elevator: Elevator;
  index: number;
}

export function ElevatorCar({ elevator, index }: ElevatorCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);
  const displayRef = useRef<THREE.Mesh>(null);
  
  const carColor = index === 0 ? COLORS.ELEVATOR_A : COLORS.ELEVATOR_B;
  const xOffset = (index - 0.5) * ELEVATOR_CONFIG.SHAFT_SPACING;
  
  const targetY = elevator.currentY + ELEVATOR_CONFIG.HEIGHT / 2;
  
  const displayTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 80px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(elevator.currentFloor.toString(), 128, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [elevator.currentFloor]);
  
  useFrame(() => {
    if (groupRef.current) {
      const currentY = groupRef.current.position.y;
      const newY = THREE.MathUtils.lerp(currentY, targetY, 0.15);
      groupRef.current.position.set(xOffset, newY, 0);
    }
    
    if (leftDoorRef.current && rightDoorRef.current) {
      const doorOffset = (elevator.doorProgress * ELEVATOR_CONFIG.WIDTH) / 2 + 0.05;
      leftDoorRef.current.position.x = -doorOffset;
      rightDoorRef.current.position.x = doorOffset;
    }
  });
  
  const carWidth = ELEVATOR_CONFIG.WIDTH;
  const carHeight = ELEVATOR_CONFIG.HEIGHT;
  const carDepth = ELEVATOR_CONFIG.DEPTH;
  const wallThickness = ELEVATOR_CONFIG.WALL_THICKNESS;
  
  return (
    <group ref={groupRef} position={[xOffset, targetY, 0]}>
      <mesh position={[0, 0, -carDepth / 2]}>
        <boxGeometry args={[carWidth, carHeight, wallThickness]} />
        <meshStandardMaterial color={COLORS.WALL} metalness={0.3} roughness={0.5} />
      </mesh>
      
      <mesh position={[0, carHeight / 2, 0]}>
        <boxGeometry args={[carWidth, wallThickness, carDepth]} />
        <meshStandardMaterial color={COLORS.WALL_LIGHT} metalness={0.3} roughness={0.5} />
      </mesh>
      
      <mesh position={[0, -carHeight / 2, 0]}>
        <boxGeometry args={[carWidth, wallThickness, carDepth]} />
        <meshStandardMaterial color={COLORS.WALL_LIGHT} metalness={0.3} roughness={0.5} />
      </mesh>
      
      <mesh position={[-carWidth / 2, 0, 0]}>
        <boxGeometry args={[wallThickness, carHeight, carDepth]} />
        <meshStandardMaterial color={COLORS.WALL} metalness={0.3} roughness={0.5} />
      </mesh>
      
      <mesh position={[carWidth / 2, 0, 0]}>
        <boxGeometry args={[wallThickness, carHeight, carDepth]} />
        <meshStandardMaterial color={COLORS.WALL} metalness={0.3} roughness={0.5} />
      </mesh>
      
      <mesh ref={leftDoorRef} position={[0, 0, carDepth / 2 - wallThickness / 2]}>
        <boxGeometry args={[carWidth / 2 - 0.02, carHeight - 0.1, wallThickness]} />
        <meshStandardMaterial color={carColor} metalness={0.6} roughness={0.2} emissive={carColor} emissiveIntensity={0.1} />
      </mesh>
      
      <mesh ref={rightDoorRef} position={[0, 0, carDepth / 2 - wallThickness / 2]}>
        <boxGeometry args={[carWidth / 2 - 0.02, carHeight - 0.1, wallThickness]} />
        <meshStandardMaterial color={carColor} metalness={0.6} roughness={0.2} emissive={carColor} emissiveIntensity={0.1} />
      </mesh>
      
      <mesh ref={displayRef} position={[0, carHeight / 2 - 0.25, carDepth / 2 - 0.06]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshBasicMaterial map={displayTexture} />
      </mesh>
      
      <pointLight position={[0, carHeight / 2 - 0.1, 0]} color={COLORS.LIGHT_ON} intensity={0.5} distance={3} />
      
      <mesh position={[-0.3, -carHeight / 2 + 0.3, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshStandardMaterial 
          color={elevator.direction === 'up' ? '#00ff88' : '#333'} 
          emissive={elevator.direction === 'up' ? '#00ff88' : '#000'}
          emissiveIntensity={elevator.direction === 'up' ? 0.5 : 0}
        />
      </mesh>
      
      <mesh position={[0.3, -carHeight / 2 + 0.3, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshStandardMaterial 
          color={elevator.direction === 'down' ? '#ff6b35' : '#333'} 
          emissive={elevator.direction === 'down' ? '#ff6b35' : '#000'}
          emissiveIntensity={elevator.direction === 'down' ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
}
