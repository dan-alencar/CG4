// src/main.js
import * as THREE from 'three';
import { createScene } from './scene.js';
import { world, getRapier, initPhysicsFloor, addPhysicsSphere, updatePhysics, physicsObjects } from './physics.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let scene, camera, renderer;
let marble0;
let marble1;
let marble2;
let throwCounter = 0;
let nextSphere = [];
let spheres = [];
let lastTime = 0;

let glassMaterialProperties = {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05, 
        ior: 1.5,
        transmission: 1.0,
        transparent: true,
        opacity: 1.0,       
        envMapIntensity: 1.0,
        thickness: 1
};

let radius = 0.25;
let marbleGeometry = new THREE.SphereGeometry(radius, 32, 32);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let pickedMarble = null;
let pickedMarbleRigidBody = null;
let originalMarbleMaterial = null;


let RAPIER_LOADED = null;

async function init() { 
    RAPIER_LOADED = await getRapier();
    const rgbeLoader = new RGBELoader();
    
    const canvas = document.getElementById('webgl-canvas');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    scene = createScene();
    initPhysicsFloor();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5); 
    camera.lookAt(0, 0, 0);

    rgbeLoader.setPath('/assets/textures/');
    const environmentMap = await rgbeLoader.loadAsync('sky8k.hdr'); 

    environmentMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.environment = environmentMap;
    scene.background = environmentMap;    
    
    marble0 = createSphere(-1.5, 1.5, 0);    
    spheres[0] = marble0;
    marble1 = createSphere(0, 1.5, 0);
    spheres[1] = marble1;
    marble2 = createSphere(1.5, 1.5, 0);
    spheres[2] = marble2;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
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

    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(helper);

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', onMouseClick, false);
    window.addEventListener('keydown', onKeyDown, false);

    animate(0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseClick(event) {
    if (event.button !== 0) return;

    if (pickedMarble) {
        console.log("Dropping marble...");
        pickedMarble.material = originalMarbleMaterial;

        if (pickedMarbleRigidBody) {
            pickedMarbleRigidBody.setEnabled(true, true);
            pickedMarbleRigidBody.setTranslation(pickedMarble.position, true);
            pickedMarbleRigidBody.setLinvel(new RAPIER_LOADED.Vector3(0, 0, 0), true);
            pickedMarbleRigidBody.setAngvel(new RAPIER_LOADED.Vector3(0, 0, 0), true);
        }

        pickedMarble = null;
        pickedMarbleRigidBody = null;
        originalMarbleMaterial = null;
        console.log("Marble dropped.");

    } 
    
    else {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const interactableMeshes = physicsObjects.map(obj => obj.mesh);
        const intersects = raycaster.intersectObjects(interactableMeshes, true);

        if (intersects.length > 0) {
            const intersectedMesh = intersects[0].object;
            const physicsObj = physicsObjects.find(obj => obj.mesh === intersectedMesh);

            if (physicsObj) {
                pickedMarble = intersectedMesh;
                pickedMarbleRigidBody = physicsObj.rigidBody;
                originalMarbleMaterial = pickedMarble.material;

                pickedMarble.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                pickedMarbleRigidBody.setEnabled(false, false);
            }
        }
    }
}

function onKeyDown(event) {
    if (event.code === 'Space' && pickedMarble && pickedMarbleRigidBody && RAPIER_LOADED) {
        console.log("Attempting to throw marble...");
        const throwStrength = 1; 

        const throwDirection = new THREE.Vector3();
        camera.getWorldDirection(throwDirection);

        const rapierThrowVector = new RAPIER_LOADED.Vector3(
            throwDirection.x * throwStrength,
            throwDirection.y * throwStrength,
            throwDirection.z * throwStrength
        );

        pickedMarbleRigidBody.setEnabled(true, true);
        pickedMarbleRigidBody.applyImpulse(rapierThrowVector, true);
        const index = spheres.findIndex(marble => marble == pickedMarble);
        // console.log("tentei lançar a bila: ");
        // console.log(index);
        nextSphere.push(index);
        pickedMarble.material = originalMarbleMaterial;
        pickedMarble = null;
        pickedMarbleRigidBody = null;
        originalMarbleMaterial = null;

        console.log("Marble thrown!");
    }
    if (event.code === 'Enter' && RAPIER_LOADED && nextSphere.length > 0) {
        throwCounter = nextSphere.shift();
        console.log(throwCounter);
        switch (throwCounter){
            case 0:
                marble0 = replaceSphere(marble0, -1.5, 1.5, 0);
                spheres[0] = marble0;
                console.log("tentei marblo 0");
                break;
            
            case 1:
                marble1 = replaceSphere(marble1, 0, 1.5, 0);
                spheres[1] = marble1;
                console.log("tentei marblo 1");
                break;

            case 2:
                marble2 = replaceSphere(marble2, 1.5, 1.5, 0);
                spheres[2] = marble2;
                console.log("tentei marblo 2");
                break;

            default:
                break;
        }

        console.log("Marble replaced!");
    }
}

function animate(time) {
    requestAnimationFrame(animate);

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    updatePhysics();

    renderer.render(scene, camera);
}

function replaceSphere(oldMarble, x, y, z){

    removeEntity(oldMarble);
    const newMarble = createSphere(x, y, z);
    return newMarble;

}

function createSphere(x, y, z){

    const marbleMaterial = new THREE.MeshPhysicalMaterial({
        ...glassMaterialProperties, 
        color: randomColors(),
    });

    const marble = new THREE.Mesh(marbleGeometry, marbleMaterial);
    marble.position.x = x;
    marble.position.y = y;
    marble.position.z = z;
    marble.castShadow = true;
    marble.receiveShadow = true;
    scene.add(marble);
    addPhysicsSphere(marble, radius);
    return marble;
}

function removeEntity(object) {

    const index = physicsObjects.findIndex(obj => obj.mesh === object);
    scene.remove( object );
    const physicsObj = physicsObjects[index];
    world.removeRigidBody(physicsObj.rigidBody);
    physicsObjects.splice(index, 1);
    animate();
}

function randomColors(){

    const hexChars = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
  ];
  const hexIndices = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 16)
  );
  const hexCode = hexIndices.map((i) => hexChars[i]).join('');
  return `#${hexCode}`;
};

window.addEventListener('DOMContentLoaded', init);