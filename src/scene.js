// src/scene.js
import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();

    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, opacity: 0.5, transparent: true });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;

    scene.add(floor);

    return scene;
}