import * as THREE from 'three';

let y = 5;          // Initial height
let v = 0;          // Initial velocity
const g = -9.81;    // Gravity acceleration
const dt = 0.016;   // Time step (~60 FPS)

function setupSimulation( scene ) {
    const geometry = new THREE.SphereGeometry( 0.5, 32, 32 );
    const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    const sphere = new THREE.Mesh( geometry, material );
    scene.add( sphere);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry( 10, 10 );
    const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    scene.add( plane );

    sphere.position.y = y;
    return sphere;
}

// Update physics simulation
function updateSimulation( sphere ) {
    v += g * dt;
    y += v * dt;

    // Collision detection
    if ( y <= 0.5 ) { // Adjust for sphere radius
        y = 0.5;
        v = 0; // Stop falling
    }

    sphere.position.y = y;
}

export { setupSimulation, updateSimulation };
