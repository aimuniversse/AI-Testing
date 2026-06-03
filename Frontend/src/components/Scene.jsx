import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import TreeStages from "./TreeStages";
import Lighting from "./lighting";

const Scene = ({ progress }) => {
    return (
        <Canvas
            shadows
            onCreated={({ gl }) => {
                gl.shadowMap.type = THREE.PCFShadowMap;
            }}
            camera={{ position: [0, 2, 13], fov: 46 }}
            gl={{ 
                antialias: true, 
                alpha: true,
                powerPreference: "high-performance",
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.4
            }}
            style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
            <Suspense fallback={null}>
                <Lighting />
                <TreeStages progress={progress} />
                {/* Soft glowing ground shadow */}
                <ContactShadows 
                    position={[0, -2.5, 0]} 
                    opacity={0.35} 
                    scale={16} 
                    blur={3.5} 
                    far={6} 
                    color="#d80000"
                />
                {/* Subtle environment for richer reflections */}
                <Environment preset="sunset" background={false} />
                <OrbitControls 
                    enableZoom={false} 
                    enablePan={false} 
                    minPolarAngle={Math.PI / 2.8} 
                    maxPolarAngle={Math.PI / 2.1}
                    autoRotate
                    autoRotateSpeed={0.4}
                />
            </Suspense>
        </Canvas>
    );
};

export default Scene;
