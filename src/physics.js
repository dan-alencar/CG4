// src/physics.js

let RAPIER = null;
export let world = null;
export const physicsObjects = [];

const rapierInitPromise = import('@dimforge/rapier3d').then(rapierModule => {
    RAPIER = rapierModule;
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    world = new RAPIER.World(gravity);

    console.log("Rapier physics world initialized.");
    return RAPIER;
}).catch(error => {
    console.error("Failed to load Rapier.js:", error);
});

export function getRapier() {
    return rapierInitPromise;
}

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

export function addPhysicsSphere(mesh, radius, density = 1.0) {
    if (!world || !RAPIER) {
        console.error("Physics world not initialized yet. Call addPhysicsSphere after Rapier loads.");
        return null;
    }

    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
    const rigidBody = world.createRigidBody(rigidBodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(radius);
    colliderDesc.setRestitution(1);
    //colliderDesc.setFriction(0.5);

    world.createCollider(colliderDesc, rigidBody);

    physicsObjects.push({ mesh, rigidBody });

    console.log(`Added physics sphere at ${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z}`);
    return rigidBody;
}

export function updatePhysics() {
    if (!world) {
        return;
    }
    world.step();
    physicsObjects.forEach(({ mesh, rigidBody }) => {
        const position = rigidBody.translation();
        const rotation = rigidBody.rotation();

        mesh.position.set(position.x, position.y, position.z);
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    });
}