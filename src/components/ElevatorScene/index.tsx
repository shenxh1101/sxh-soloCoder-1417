import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useElevatorStore } from '../../store/useElevatorStore';
import { Building } from './Building';
import { ElevatorCar } from './ElevatorCar';
import { ElevatorShaft } from './ElevatorShaft';
import { COLORS, BUILDING_CONFIG, ELEVATOR_CONFIG } from '../../config/constants';

function SceneUpdater() {
  const update = useElevatorStore(state => state.update);
  const isRunning = useElevatorStore(state => state.isRunning);
  const isPaused = useElevatorStore(state => state.isPaused);
  const processPassengerBoarding = useElevatorStore(state => state.processPassengerBoarding);
  const processPassengerAlighting = useElevatorStore(state => state.processPassengerAlighting);
  const elevators = useElevatorStore(state => state.elevators);
  
  const prevDoorStates = useRef<Record<string, boolean>>({});
  
  useFrame(() => {
    const currentTime = performance.now();
    update(currentTime);
    
    for (const elevator of elevators) {
      const prevDoorOpen = prevDoorStates.current[elevator.id] || false;
      
      if (elevator.doorOpen && !prevDoorOpen) {
        processPassengerAlighting(elevator.id);
        processPassengerBoarding(elevator.id);
      }
      
      prevDoorStates.current[elevator.id] = elevator.doorOpen;
    }
  });
  
  return null;
}

function CameraController() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(8, 5, 12);
    camera.lookAt(0, 3, 0);
  }, [camera]);
  
  return null;
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#4466aa" />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={0.8} 
        color="#ffffff"
        castShadow
      />
      <pointLight position={[0, BUILDING_CONFIG.NUM_FLOORS * BUILDING_CONFIG.FLOOR_HEIGHT, -3]} intensity={0.6} color="#aaccff" />
    </>
  );
}

function SceneContent() {
  const elevators = useElevatorStore(state => state.elevators);
  
  return (
    <>
      <Lighting />
      <CameraController />
      <SceneUpdater />
      <Building />
      <ElevatorShaft index={0} />
      <ElevatorShaft index={1} />
      {elevators.map((elevator, index) => (
        <ElevatorCar key={elevator.id} elevator={elevator} index={index} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0a1628" metalness={0.5} roughness={0.8} />
      </mesh>
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 3, 0]}
      />
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          intensity={0.5}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function ElevatorScene() {
  return (
    <Canvas
      camera={{ fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: COLORS.BACKGROUND }}
    >
      <fog attach="fog" args={[COLORS.BACKGROUND, 15, 40]} />
      <SceneContent />
    </Canvas>
  );
}
