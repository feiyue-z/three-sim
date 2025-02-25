import * as THREE from 'three';
import Particle from './Particle';

const g = -9.81;    // Gravity acceleration
const dt = 0.016;   // Time step (~60 FPS)
const bounce = -0.3;

let particles = [];

function setupSimulation( scene ) {
    // Create particles
    for ( let x = 0; x < 10; x++ ) {
        for (let z = 0; z < 10; z++ ) {
            let p = new Particle( {
                position: [ -5 + x * 0.7 , 0, -5 + z * 0.7 ]
            } );
            scene.add( p );
            particles.push( p );
        }
    }

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry( 10, 10 );
    const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -1;
    // scene.add( plane );

    particles.forEach( ( p ) => {
        p.position.y = 5; // Initial height
    } )

    return particles;
}

function updateSimulationVR() {
    particles.forEach( ( p ) => {
        p.velocity += g * dt;
        p.position.y += p.velocity * dt;
    
        // Collision detection
        if ( p.position.y <= -0.95 ) {
            p.position.y = -0.95;
            p.velocity *= bounce;
        }
    } );
}

function updateSimulationXR( plane, pose ) {
    let hit = 0;

    particles.forEach( ( p ) => {
        console.log("================\n");
        p.velocity += g * dt;
        p.position.y += p.velocity * dt;
    
        // Collision detection
        const y = getPlaneHeightAtXZ( plane, pose, p.position.x, p.position.z );
        if ( y != null && p.position.y <= y + 0.05 ) {
            p.position.y = y + 0.05;
            p.velocity = 0;
            hit++;
        }
    } );

    console.log( `hit = ${hit}` )
}

function getPlaneHeightAtXZ( plane, pose, x, z ) {
    if ( !plane ) {
        return null;
    }

    const position = pose.transform.position; // Centroid
    const orientation = pose.transform.orientation;

    //
    const rotation = new THREE.Quaternion(
        orientation.x, orientation.y, orientation.z, orientation.w
    );

    // Get plane's normal
    const normal = new THREE.Vector3( 0, 1, 0 ); // Default Y-up normal
    normal.applyQuaternion( rotation );

    // Reject near-vertical plane
    if ( Math.abs( normal.y ) < 0.001 ) {
        return null;
    }

    // Transform (x, z) into the plane's local coordinate system
    const worldPoint = new THREE.Vector3( x, 0, z );
    const localPoint = worldPoint.clone().sub( position ).applyQuaternion( rotation.invert() );

    // Check if (x, z) is inside the plane's bounds
    const halfWidth = plane.extentWidth / 2;
    const halfHeight = plane.extentHeight / 2;
    if ( Math.abs( localPoint.x ) > halfWidth || Math.abs( localPoint.z ) > halfHeight ) {
        return null;
    }

    // Plane equation: Ax + By + Cz + D = 0
    // Solve for D: D = -(Ax + By + Cz)
    const D = -( normal.x * position.x + normal.y * position.y + normal.z * position.z );
    // Solve for y: y = (-D - Ax - Cz) / B
    const y = ( -D - normal.x * x - normal.z * z ) / normal.y;
    
    console.log("normal.y =", normal.y);
    console.log( `x=${x}, z=${z}, y is ${y}` );
    return y;
}

export { setupSimulation, updateSimulationVR, updateSimulationXR };
