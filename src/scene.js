// src/scene.js
import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();

    // --- 1. Background Plane (Sky) ---
    // Option A: Solid Sky Color (Simpler)
    scene.background = new THREE.Color(0x87CEEB); // A nice sky blue color

    // Option B: Skybox with a texture (More realistic, requires a texture image)
    // If you want to use a texture, you'll need an image (e.g., 'sky.jpg')
    // Place your sky.jpg inside CG4/public/assets/textures/
    /*
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load('/assets/textures/sky.jpg', () => {
        // Once the texture is loaded, set it as the background
        const rt = new THREE.WebGLCubeRenderTarget(skyTexture.image.height);
        rt.fromEquirectangularTexture(renderer, skyTexture); // Requires renderer to be passed or accessible
        scene.background = rt.texture;
    });
    */
    // Note on Skybox: A proper skybox often involves a CubeTextureLoader and 6 images,
    // or using an Equirectangular texture with a WebGLCubeRenderTarget.
    // For simplicity right now, a solid color or a large sphere with a texture is easier.
    // Let's stick to solid color for now, or a large sphere later if we want a texture.

    // --- 2. Floor ---
    // Geometry for the floor: a large plane
    const floorGeometry = new THREE.PlaneGeometry(100, 100); // Large enough to cover the scene

    // Material for the floor: A basic material for now. We'll add texture/lighting later.
    // We'll set it to receive shadows once lights are added.
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Greyish color
    //floorMaterial.receiveShadow = true; // IMPORTANT for receiving shadows

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
    floor.position.y = 0; // Position it slightly below the origin if your objects are at Y=0
    floor.receiveShadow = true;

    scene.add(floor);

    return scene;
}