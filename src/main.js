// src/main.js
import * as THREE from 'three';
import { createScene } from './scene.js'; // Import our scene creation function
import { getRapier, initPhysicsFloor, addPhysicsSphere, updatePhysics } from './physics.js';

let scene, camera, renderer;
let sphere; // Keep a reference to the cube if you want to animate it
let sphere1;
let lastTime = 0;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
let originalMaterial = null;

async function init() {

    await getRapier(); // This pauses execution until Rapier is ready

    // --- 1. Renderer setup (Needs to be first if you use it for background texture, but okay here) ---
    const canvas = document.getElementById('webgl-canvas');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadow maps on the renderer
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: for softer shadows
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    // renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.toneMappingExposure = 1.0;

    // --- 2. Scene setup ---
    scene = createScene(); // Use our function to create and configure the scene
    initPhysicsFloor();
    // --- 3. Camera setup ---
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); // Slightly lift the camera and move it back
    camera.lookAt(0, 0, 0); // Make camera look at the origin

    // --- Add your test cube again (make it cast shadows) ---
    const radius = 0.25;
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Use StandardMaterial for lighting
    sphere = new THREE.Mesh(geometry, material); // Assign to 'cube' variable
    sphere.position.y = 1.5; // Lift it above the floor
    sphere.castShadow = true; // Make the sphere cast shadows
    scene.add(sphere);
    const geometry1 = new THREE.SphereGeometry(radius, 16, 16);
    const material1 = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Use StandardMaterial for lighting
    sphere1 = new THREE.Mesh(geometry1, material1); // Assign to 'cube' variable
    sphere1.position.x = 1.5; // Lift it above the floor
    sphere1.position.y = 1.5; // Lift it above the floor
    sphere1.castShadow = true; // Make the sphere cast shadows
    scene.add(sphere1);

    // --- Add a simple light for now so we can see the floor and cube correctly ---
    //const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    //scene.add(ambientLight);
    addPhysicsSphere(sphere, radius); //adiciona física a uma esfera (testando com cubo, ta errado)
    addPhysicsSphere(sphere1, radius); 

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White directional light
    directionalLight.position.set(5, 10, 5); // Position the light
    directionalLight.castShadow = true; // Make the light cast shadows
    scene.add(directionalLight);
    directionalLight.target.position.set(sphere.position.x, sphere.position.y, sphere.position.z);
    scene.add(directionalLight.target);

    // Configure shadow properties for the directional light
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 20;
    directionalLight.shadow.camera.left = -7;
    directionalLight.shadow.camera.right = 7;
    directionalLight.shadow.camera.top = 7;
    directionalLight.shadow.camera.bottom = -7;
    directionalLight.shadow.bias = -0.001; // Prevents light leaking
    directionalLight.shadow.normalBias = 0.02; // Prevents shadow acne on flat surfaces
    // Optional: Add a helper to visualize the light's shadow camera frustum
     const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
     scene.add( helper );


    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onMouseClick, false);

    // --- Start Animation ---
    animate(0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
}

function animate(time) {
    requestAnimationFrame(animate);

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    updatePhysics();

    renderer.render(scene, camera);
}

// Initialize the scene when the window loads
window.addEventListener('DOMContentLoaded', init);