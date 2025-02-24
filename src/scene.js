import * as THREE from 'three';
import Particle from './Particle';

const g = -9.81;    // Gravity acceleration
const dt = 0.016;   // Time step (~60 FPS)

let particles = [];

function setupSimulation( scene ) {
    for (let i = 0; i < 10; i++) {
        let p = new Particle( {position: [ i * 0.5, 0, 1 ] } );
        scene.add( p );
        particles.push( p );
    }

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry( 10, 10 );
    const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    scene.add( plane );

    particles.forEach( ( p ) => {
        p.position.y = 5; // Initial height
    } )

    return particles;
}

// Update physics simulation
function updateSimulation( particles ) {
    particles.forEach( ( p ) => {
        p.velocity += g * dt;
        p.position.y += p.velocity * dt;
    
        // Collision detection
        if ( p.position.y <= -0.95 ) {
            p.position.y = -0.95;
            p.velocity = 0;
        }
    } );
}

export { setupSimulation, updateSimulation };
