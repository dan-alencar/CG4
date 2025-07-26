// src/main.js
import * as THREE from 'three';
import { createScene } from './scene.js';
import { getRapier, initPhysicsFloor, addPhysicsSphere, updatePhysics, physicsObjects } from './physics.js';

let scene, camera, renderer;
let marble;
let lastTime = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let pickedMarble = null;
let pickedMarbleRigidBody = null;
let originalMarbleMaterial = null;

let RAPIER_LOADED = null; // Declare a local variable to hold the RAPIER module once loaded

async function initializeApp() {
    RAPIER_LOADED = await getRapier(); // Assign the loaded RAPIER module here

    // --- Renderer setup ---
    const canvas = document.getElementById('webgl-canvas');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // --- Scene setup ---
    scene = createScene();

    // --- Camera setup ---
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    initPhysicsFloor();

    // --- Create a single marble ---
    const marbleGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const marbleMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.8 });
    marble = new THREE.Mesh(marbleGeometry, marbleMaterial);
    marble.position.y = 5;
    marble.castShadow = true;
    scene.add(marble);
    addPhysicsSphere(marble, 0.5);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.001;
    directionalLight.shadow.normalBias = 0.02;

    const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    scene.add(helper);

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('keydown', onKeyDown, false);

    // --- Start Animation Loop ---
    animate(0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
    if (pickedMarble) {
        pickedMarble.material = originalMarbleMaterial;
        pickedMarbleRigidBody.setEnabled(true, true);
        pickedMarble = null;
        pickedMarbleRigidBody = null;
        console.log("Marble deselected (dropped).");
        return;
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const interactableMeshes = physicsObjects.map(obj => obj.mesh);
    const intersects = raycaster.intersectObjects(interactableMeshes, false);

    if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;
        const physicsObj = physicsObjects.find(obj => obj.mesh === intersectedMesh);

        if (physicsObj) {
            pickedMarble = intersectedMesh;
            pickedMarbleRigidBody = physicsObj.rigidBody;
            originalMarbleMaterial = pickedMarble.material;

            pickedMarble.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            pickedMarbleRigidBody.setEnabled(false, false);
            console.log('Marble picked:', pickedMarble.uuid);
        }
    }
}

function onKeyDown(event) {
    // Use the locally stored RAPIER_LOADED variable
    if (event.code === 'Space' && pickedMarble && pickedMarbleRigidBody && RAPIER_LOADED) {
        console.log("Attempting to throw marble...");
        const throwStrength = 15;

        const throwDirection = new THREE.Vector3();
        camera.getWorldDirection(throwDirection);

        // Use RAPIER_LOADED.Vector3 instead of window.RAPIER.Vector3
        const rapierThrowVector = new RAPIER_LOADED.Vector3( // <--- HERE IS THE FIX
            throwDirection.x * throwStrength,
            throwDirection.y * throwStrength,
            throwDirection.z * throwStrength
        );

        pickedMarbleRigidBody.setEnabled(true, true);
        pickedMarbleRigidBody.applyImpulse(rapierThrowVector, true);

        pickedMarble.material = originalMarbleMaterial;
        pickedMarble = null;
        pickedMarbleRigidBody = null;
        console.log("Marble thrown!");
    }
}

function animate(time) {
    requestAnimationFrame(animate);

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    // Optional: Keep picked marble in front of camera
    if (pickedMarble && pickedMarbleRigidBody && !pickedMarbleRigidBody.isEnabled()) {
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        pickedMarble.position.copy(camera.position).add(cameraForward.multiplyScalar(2));
    }

    updatePhysics();

    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', initializeApp);