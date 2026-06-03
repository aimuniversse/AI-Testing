import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAX_DEPTH = 6;

// Premium Materials
const branchMaterial = new THREE.MeshStandardMaterial({ 
    color: "#5D4037",
    roughness: 0.65, 
    metalness: 0.08,
    flatShading: false 
});

const leafMaterial = new THREE.MeshStandardMaterial({
    color: "#43A047",
    side: THREE.DoubleSide,
    roughness: 0.45,
    metalness: 0.05,
    emissive: "#2E7D32",
    emissiveIntensity: 0.2
});

const appleMaterial = new THREE.MeshStandardMaterial({ 
    color: "#E53935", 
    roughness: 0.25, 
    metalness: 0.25,
    emissive: "#B71C1C",
    emissiveIntensity: 0.35
});

const seedMaterial = new THREE.MeshStandardMaterial({ 
    color: "#A1887F", 
    roughness: 0.6,
    metalness: 0.15,
    emissive: "#6D4C41",
    emissiveIntensity: 0.4
});

// High-fidelity Geometries
const branchGeometry = new THREE.CylinderGeometry(0.65, 1, 1, 18); 
branchGeometry.translate(0, 0.5, 0);

const leafShape = new THREE.Shape();
leafShape.moveTo(0, 0);
leafShape.bezierCurveTo(0.25, 0.12, 0.45, 0.5, 0, 1.0); 
leafShape.bezierCurveTo(-0.45, 0.5, -0.25, 0.12, 0, 0);
const leafGeometry = new THREE.ShapeGeometry(leafShape);

const appleGeometry = new THREE.SphereGeometry(0.22, 24, 24);
const seedGeometry = new THREE.IcosahedronGeometry(0.38, 2);

const easeOut = (t) => 1 - Math.pow(1 - t, 3); 
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Trunk height in local group space
const TRUNK_LENGTH = 3.2;

const TreeStages = ({ progress }) => {
    const groupRef = useRef();
    const branchMeshRef = useRef();
    const leafMeshRef = useRef();
    const appleMeshRef = useRef();
    const seedRef = useRef();
    const elapsedRef = useRef(0);

    const { branches, leaves, apples } = useMemo(() => {
        const generatedBranches = [];
        const generatedLeaves = [];
        const generatedApples = [];

        // Each level takes 8% progress. Trunk starts at 2% so:
        // depth 0 (trunk): 2–10%  (~6 sec into 5min)
        // depth 1:        ~6–14%
        // depth 2:        ~9–17%
        // depth 3:        ~13–21%  → leaves start appearing
        // depth 4+: 18–30%
        const BRANCH_DURATION = 8;

        function generateBranch(startPos, direction, length, thickness, depth, pStart) {
            const endPos = startPos.clone().add(direction.clone().multiplyScalar(length));
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

            const pEnd = Math.min(pStart + BRANCH_DURATION, 92); 

            generatedBranches.push({
                startPos, quaternion, length, thickness, pStart, pEnd, depth
            });

            if (depth < MAX_DEPTH) {
                const numChildren = depth === 0 ? 4 : depth <= 2 ? 3 : 2;
                const angleStep = (Math.PI * 2) / numChildren;
                const baseOffset = Math.random() * Math.PI * 2;

                for (let i = 0; i < numChildren; i++) {
                    const angle = baseOffset + i * angleStep;
                    const spread = 0.45 + depth * 0.28; 
                    
                    const rx = Math.sin(angle) * spread;
                    const rz = Math.cos(angle) * spread;

                    const childDir = direction.clone().applyEuler(new THREE.Euler(rx, 0, rz));
                    childDir.y += 0.25;
                    childDir.normalize();

                    const childLength = length * (0.7 + Math.random() * 0.12);
                    const childThickness = thickness * (0.58 + Math.random() * 0.06);
                    // Children start at 50% into the parent's grow time
                    const childPStart = pStart + BRANCH_DURATION * 0.5;
                    
                    if (childPStart < 88) {
                        generateBranch(endPos, childDir, childLength, childThickness, depth + 1, childPStart);
                    }
                }
            }

            // Leaves start appearing from depth 2 (much earlier)
            if (depth >= MAX_DEPTH - 4) {
                const numLeaves = depth === MAX_DEPTH ? 30 : depth >= MAX_DEPTH - 1 ? 18 : 10;
                for (let i = 0; i < numLeaves; i++) {
                    const t = 0.35 + Math.random() * 0.65;
                    const pos = startPos.clone().lerp(endPos, t);
                    
                    const leafOffset = new THREE.Vector3(
                        (Math.random() - 0.5) * 2.8,
                        (Math.random() - 0.5) * 2.5,
                        (Math.random() - 0.5) * 2.8
                    );
                    const leafPos = pos.add(leafOffset);
                    const leafRot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    const leafScale = 1.0 + Math.random() * 0.6;
                    
                    // Leaves start at branch pEnd, ensuring branches appear first
                    const leafPStart = Math.max(pEnd, pStart + (pEnd - pStart) * t);
                    const leafPEnd = Math.min(leafPStart + 10, 95);

                    generatedLeaves.push({
                        position: leafPos, rotation: leafRot, baseScale: leafScale, pStart: leafPStart, pEnd: leafPEnd
                    });

                    if (depth >= MAX_DEPTH - 2 && Math.random() > 0.6) {
                        const applePStart = 70 + Math.random() * 15;
                        const applePEnd = applePStart + 8;
                        generatedApples.push({
                            position: leafPos.clone().add(new THREE.Vector3(
                                (Math.random() - 0.5) * 0.4,
                                -0.2,
                                (Math.random() - 0.5) * 0.4
                            )),
                            pStart: applePStart, pEnd: applePEnd, baseScale: 1.0 + Math.random() * 0.5
                        });
                    }
                }
            }
        }

        // Trunk starts at progress=2 (very early — ~6 seconds into 5min timer)
        generateBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), TRUNK_LENGTH, 0.22, 0, 2);

        return { branches: generatedBranches, leaves: generatedLeaves, apples: generatedApples };
    }, []);

    const _tempVec = new THREE.Vector3();
    const _tempEuler = new THREE.Euler();
    const _tempMat = new THREE.Matrix4();
    const _tempQuat = new THREE.Quaternion();

    useFrame((state, delta) => {
        elapsedRef.current += delta;
        const t = elapsedRef.current;

        // Gentle organic sway
        if (groupRef.current) {
            groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.012;
        }

        // Seed: sits at GROUND LEVEL (y = 0.3), trunk grows UP out of it.
        // Seed fades as the trunk emerges from it — just like a real sprouting seed.
        if (seedRef.current) {
            // Seed stays at the base — gently bobs in place
            seedRef.current.position.y = 0.3 + Math.sin(t * 2.0) * 0.06;
            seedRef.current.rotation.y = t * 0.6;

            let sScale;
            if (progress < 1) {
                // Fade in immediately
                sScale = progress;
            } else if (progress < 3) {
                // Fully visible — seed is planted, about to sprout
                sScale = 1;
            } else if (progress < 8) {
                // Fade out as trunk shoots up through the seed
                sScale = Math.max(0, 1 - (progress - 3) / 5);
            } else {
                sScale = 0;
            }

            seedRef.current.scale.set(sScale, sScale, sScale);
        }

        if (branchMeshRef.current) {
            branches.forEach((b, i) => {
                let sY = 0;
                let sXZ = 0;
                if (progress >= b.pStart) {
                    const rawT = Math.min((progress - b.pStart) / (b.pEnd - b.pStart), 1);
                    const easedT = easeOut(rawT);
                    sY = easedT * b.length;
                    sXZ = (rawT * 0.8 + 0.2) * b.thickness;
                    
                    if (b.depth === 0 && progress > 40) {
                        sXZ *= (1 + (progress - 40) / 60);
                    }
                }
                _tempVec.set(sXZ, sY, sXZ);
                _tempMat.compose(b.startPos, b.quaternion, _tempVec);
                branchMeshRef.current.setMatrixAt(i, _tempMat);
            });
            branchMeshRef.current.instanceMatrix.needsUpdate = true;
        }

        if (leafMeshRef.current) {
            leaves.forEach((l, i) => {
                let scale = 0;
                if (progress >= l.pStart) {
                    const rawT = Math.min((progress - l.pStart) / (l.pEnd - l.pStart), 1);
                    scale = easeOut(rawT) * l.baseScale;
                }
                if (scale > 0) {
                    const flutter = Math.sin(t * 1.8 + i * 0.7) * 0.1;
                    const flutterZ = Math.cos(t * 1.3 + i * 0.5) * 0.06;
                    _tempEuler.set(l.rotation.x + flutter, l.rotation.y, l.rotation.z + flutterZ, 'XYZ');
                    _tempQuat.setFromEuler(_tempEuler);
                    _tempVec.set(scale, scale, scale);
                    _tempMat.compose(l.position, _tempQuat, _tempVec);
                } else {
                    _tempMat.identity().scale(_tempVec.set(0, 0, 0));
                }
                leafMeshRef.current.setMatrixAt(i, _tempMat);
            });
            leafMeshRef.current.instanceMatrix.needsUpdate = true;
        }

        if (appleMeshRef.current) {
            apples.forEach((a, i) => {
                let scale = 0;
                if (progress >= a.pStart) {
                    const rawT = Math.min((progress - a.pStart) / (a.pEnd - a.pStart), 1);
                    scale = easeOut(rawT) * a.baseScale;
                }
                if (scale > 0) {
                    const dangle = Math.sin(t * 0.9 + i * 1.1) * 0.05;
                    _tempVec.set(scale, scale, scale);
                    const dangledPos = a.position.clone().add(new THREE.Vector3(dangle, 0, dangle));
                    _tempMat.identity().setPosition(dangledPos);
                    _tempMat.scale(_tempVec);
                } else {
                    _tempMat.identity().scale(_tempVec.set(0, 0, 0));
                }
                appleMeshRef.current.setMatrixAt(i, _tempMat);
            });
            appleMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        // Group positioned so the trunk base is at the bottom of the canvas view
        <group ref={groupRef} position={[0, -5.5, 0]} scale={[0.75, 0.75, 0.75]}>
            {/* Seed at ground level — trunk grows straight UP from the seed */}
            <mesh ref={seedRef} geometry={seedGeometry} material={seedMaterial} position={[0, 0.3, 0]} scale={[0, 0, 0]} />
            <instancedMesh ref={branchMeshRef} args={[branchGeometry, branchMaterial, branches.length]} castShadow receiveShadow />
            <instancedMesh ref={leafMeshRef} args={[leafGeometry, leafMaterial, leaves.length]} castShadow />
            <instancedMesh ref={appleMeshRef} args={[appleGeometry, appleMaterial, apples.length]} castShadow />
        </group>
    );
};

export default TreeStages;
