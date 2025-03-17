import * as THREE from 'three';

import { states } from './states';
import Particle from './particle';

const dt = 0.016; // Time step (~60 FPS)
const bounceBack = -0.4; // Bounce back factor for collision

let particles = [];
let plane;

export function setupSimulation( scene ) {
    // Create particles
    const gridSize = 8;
    const spacing = 0.7;
    const halfGridSize = ( gridSize - 1 ) * spacing / 2; // Centering offset

    for ( let x = 0; x < gridSize; x++ ) {
        for ( let z = 0; z < gridSize; z++ ) {
            let p = new Particle( {
                position: [ x * spacing - halfGridSize, 1, -5 + z * spacing ]
            } );
            scene.add( p );
            particles.push( p );
        }
    }

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry( 10, 10 );
    const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
    plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    // scene.add( plane );

    return [ plane, particles ];
}

export function updateSimulationVR() {
    particles.forEach( ( particle ) => {
        particle.velocity += -states.g * dt;
        particle.position.y += particle.velocity * dt;
    
        // Collision detection
        const threshold = plane.position.y + particle.offset;
        if ( particle.position.y <= threshold ) {
            particle.position.y = threshold;
            particle.velocity *= bounceBack;
        }
    } );
}

export function updateSimulationXR( planes, frame, referenceSpace ) {
    const groundY = getGroundY( planes, frame, referenceSpace );
    if ( groundY == Infinity ) {
        return;
    }

    particles.forEach ( ( particle ) => {
        particle.velocity += -states.g * dt;
        particle.position.y += particle.velocity * dt;

        // Collision detection
        const threshold = groundY + particle.offset;
        if ( particle.position.y <= threshold ) {
            particle.position.y = threshold;
            particle.velocity *= bounceBack;
        }
    } );
}

export function resetParticleHeight() {
    particles.forEach( ( particle ) => {
        particle.position.y = 1;
    } )
}

function getGroundY( planes, frame, referenceSpace ) {
    let lowestY = Infinity;

    planes.forEach( ( plane ) => {
        if ( !plane ) {
            return;
        }

        const pose = frame.getPose( plane.planeSpace, referenceSpace );
        const y = pose.transform.position.y;
        if ( y < lowestY ) {
            lowestY = y;
        }
    } )

    return lowestY;
}
