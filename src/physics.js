// src/physics.js

// Declare variables that will hold our Rapier objects.
// They will initially be null/undefined and get assigned once Rapier loads.
let RAPIER = null;
export let world = null;
export const physicsObjects = [];

// A promise that resolves once Rapier is loaded and the physics world is initialized.
// This is the cleanest way to manage asynchronous loading and subsequent initialization.
const rapierInitPromise = import('@dimforge/rapier3d').then(rapierModule => {
    RAPIER = rapierModule; // Assign the loaded Rapier module
    // Now that RAPIER is loaded, we can initialize the world
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    world = new RAPIER.World(gravity); // Assign the initialized world

    console.log("Rapier physics world initialized.");
    return RAPIER; // Return RAPIER for chaining if needed
}).catch(error => {
    console.error("Failed to load Rapier.js:", error);
    // Handle error, e.g., display a message to the user
});

// --- Function to get the RAPIER module (if needed in other modules) ---
export function getRapier() {
    return rapierInitPromise;
}

// --- Function to Initialize Physics for the Floor ---
// This function needs to be called *after* `rapierInitPromise` resolves,
// ensuring `world` is not null.
export function initPhysicsFloor() {
    if (!world || !RAPIER) {
        console.error("Physics world not initialized yet. Call initPhysicsFloor after Rapier loads.");
        return;
    }
    const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const groundColliderDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
    groundColliderDesc.setTranslation(0.0, 0.0, 0.0);
    const groundCollider = world.createCollider(groundColliderDesc, groundBody);

    console.log("Rapier ground collider created.");
}

// --- Function to Add a Sphere (Marble) to Physics World ---
export function addPhysicsSphere(mesh, radius, density = 1.0) {
    if (!world || !RAPIER) {
        console.error("Physics world not initialized yet. Call addPhysicsSphere after Rapier loads.");
        return null;
    }

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
                                .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(radius);
    colliderDesc.setRestitution(1);
    //colliderDesc.setFriction(0.5);

    world.createCollider(colliderDesc, rigidBody);

    physicsObjects.push({ mesh, rigidBody });

    console.log(`Added physics sphere at ${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z}`);
    return rigidBody;
}

// --- Function to Update Physics ---
export function updatePhysics() { // No need for deltaTime here if world.step() takes fixed step
    if (!world) {
        // This should not happen if called after init, but as a safeguard
        return;
    }
    world.step(); // Perform one physics step

    // Synchronize Three.js meshes with Rapier bodies
    physicsObjects.forEach(({ mesh, rigidBody }) => {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation();

        mesh.position.set(position.x, position.y, position.z);
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    });
}