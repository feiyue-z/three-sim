import * as THREE from 'three';
import Particle from './Particle';

const g = -9.81;    // Gravity acceleration
const dt = 0.016;   // Time step (~60 FPS)
const bounceBack = -0.4; // Bounce back factor for collision

let particles = [];
let plane;

function setupSimulation( scene ) {
    // Create particles
    for ( let x = 0; x < 10; x++ ) {
        for (let z = 0; z < 10; z++ ) {
            let p = new Particle( {
                position: [ -3 + x * 0.7 , 1, -5 + z * 0.7 ]
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

function updateSimulationVR() {
    particles.forEach( ( particle ) => {
        particle.velocity += g * dt;
        particle.position.y += particle.velocity * dt;
    
        // Collision detection
        const threshold = plane.position.y + particle.offset;
        if ( particle.position.y <= threshold ) {
            particle.position.y = threshold;
            particle.velocity *= bounceBack;
        }
    } );
}

function updateSimulationXR( planes, frame, referenceSpace ) {
    const groundY = getGroundY( planes, frame, referenceSpace );
    if ( groundY == Infinity ) {
        return;
    }

    particles.forEach ( ( particle ) => {
        particle.velocity += g * dt;
        particle.position.y += particle.velocity * dt;

        // Collision detection
        const threshold = groundY + particle.offset;
        if ( particle.position.y <= threshold ) {
            particle.position.y = threshold;
            particle.velocity *= bounceBack;
        }
    } );
}

function getPlaneHeightAtXZ( plane, pose, x, z ) {
    const position = pose.transform.position; // Centroid
    const orientation = pose.transform.orientation;
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

    console.log("----------------")
    console.log("plane.polygon = ", plane.polygon);

    // Check if (x, z) is inside the plane's bounds
    const halfWidth = plane.extentWidth / 2;
    const halfHeight = plane.extentHeight / 2;

    // console.log(`halfWidth = ${halfWidth}`)
    // console.log(`halfHeight = ${halfHeight}`)
    console.log(`localPoint.x = ${localPoint.x}`)
    console.log(`localPoint.y = ${localPoint.y}`)

    // if ( Math.abs( localPoint.x ) > halfWidth || Math.abs( localPoint.z ) > halfHeight ) {
    //     console.log("hihi");
    //     return null;
    // }

    if ( !isPointInsidePlane( plane, x, z ) ) {
        console.log( "uh-oh" );
        return null;
    }

    // Plane equation: Ax + By + Cz + D = 0
    // Solve for D: D = -(Ax + By + Cz)
    const D = -( normal.x * position.x + normal.y * position.y + normal.z * position.z );
    // Solve for y: y = (-D - Ax - Cz) / B
    const y = ( -D - normal.x * x - normal.z * z ) / normal.y;
    
    return y;
}

function isPointInsidePlane( plane, x, z ) {
    if ( !plane.polygon || plane.polygon.length < 3 ) {
        return false;
    }

    let inside = false;
    const vertices = plane.polygon;

    for ( let i = 0, j = vertices.length - 1; i < vertices.length; j = i++ ) {
        const xi = vertices[i].x, zi = vertices[i].z;
        const xj = vertices[j].x, zj = vertices[j].z;

        const intersect = ((zi > z) !== (zj > z)) &&
            (x < (xj - xi) * (z - zi) / (zj - zi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

function resetParticleHeight() {
    particles.forEach( ( particle ) => {
        particle.position.y = 1;
    } )
}

export { setupSimulation, updateSimulationVR, updateSimulationXR, resetParticleHeight };

function getClosestPlaneWithRespectToXZDistance( planes, frame, referenceSpace, targetX, targetZ ) {
    let closestPlane = null;
    let minDistance = Infinity;

    planes.forEach( ( plane ) => {
        if ( !plane ) {
            return;
        }

        const pose = frame.getPose( plane.planeSpace, referenceSpace );
        const x = pose.transform.position.x;
        const z = pose.transform.position.z;

        const distance = Math.pow( x - targetX, 2 ) + Math.pow( z - targetZ, 2 );
        if ( distance < minDistance ) {
            minDistance = distance;
            closestPlane = plane;
        }
    } )

    return closestPlane;
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
