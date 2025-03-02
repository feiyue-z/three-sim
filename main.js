import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/Addons.js';
import { setupSimulation, updateSimulationVR, updateSimulationXR, resetParticleHeight } from './src/Simulation';
import GradientSkydome from './src/GradientSkydome';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// Set up camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 5000 );
camera.position.set( 0, 2, 5 );

// Set up renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.xr.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animateWeb ); // Start running animation loop

const sessionInit = { requiredFeatures: [
    "plane-detection"
] };

// Append DOM elements
document.body.appendChild( renderer.domElement );
document.body.appendChild( XRButton.createButton(
    renderer,
    sessionInit
) );

//
const scene = new THREE.Scene();
const skydome = new GradientSkydome();
scene.add( skydome );

const light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( 1, 1, 1 );
scene.add( light );

const [ plane, particles ] = setupSimulation( scene );
let simulationEnabled = true;

function animateWeb() {
    if ( simulationEnabled ) {
        updateSimulationVR();
    }
    
    renderer.render( scene, camera );
}

renderer.xr.addEventListener('sessionstart', () => {
    console.log( "XR session started." );

    const session = renderer.xr.getSession();
    if ( !session ) {
        console.error( "No active XR session found." );
        return;
    }

    resetParticleHeight();
    setupXRSession( session );
} );

function setupXRSession( session ) {
    renderer.setAnimationLoop( ( timestamp, frame ) => {
        if ( controllerIsSelecting ) {
            handleControllerSelectMove();
        }

        if ( frame && simulationEnabled ) {
            onXRFrame( timestamp, frame );
        }
        renderer.render( scene, camera );
    } );
}

function onXRFrame( timestamp, frame ) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const detectedPlanes = frame.detectedPlanes;
    
    // showXRPlaneWireframe( frame, referenceSpace, detectedPlanes );  

    if ( xrEnabled ) {
        updateSimulationXR( detectedPlanes, frame, referenceSpace );
    } else {
        updateSimulationVR();
    }
}

// 
// MOUSE CONTROL EVENTS
//

const mouse = new THREE.Vector2();
const mouseRaycaster = new THREE.Raycaster();
let mouseSelectedObject = null;
let mouseObjectOffset = new THREE.Vector3();
let mouseObjectDepth = 0; // Depth from camera to intersected object

window.addEventListener( 'mousedown', ( event) => {
    // Convert mouse position to normalized device coordinates [-1, 1]
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    // Update the raycaster
    mouseRaycaster.setFromCamera( mouse, camera );

    // Check for intersections with objects
    const intersects = mouseRaycaster.intersectObjects( particles, true );
    if ( intersects.length > 0 ) {
        simulationEnabled = false;

        mouseSelectedObject = intersects[ 0 ].object;
        mouseSelectedObject.updateColor( 0x00ff00 );

        // Notes:
        // intersects[0].point: the exact 3D world coordinates where the ray hits the object
        // intersects[0].object.position: the position of the object’s origin

        //
        mouseObjectOffset.copy( intersects[0].point ).sub( mouseSelectedObject.position );

        mouseObjectDepth = camera.position.distanceTo( mouseSelectedObject.position );

        console.log( 'Mouse clicked on:', intersects[ 0 ].object );
    }
} );

window.addEventListener( 'mousemove', ( event) => {
    if ( mouseSelectedObject ) {
        // Convert mouse position to normalized device coordinates [-1, 1]
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

        //
        const mouseIntersect = new THREE.Vector3();
        mouseRaycaster.setFromCamera( mouse, camera );
        mouseRaycaster.ray.at( mouseObjectDepth, mouseIntersect );

        //
        mouseSelectedObject.position.copy( mouseIntersect.sub( mouseObjectOffset ) );
    }
} );

window.addEventListener( 'mouseup', () => {
    if ( mouseSelectedObject ) {
        mouseSelectedObject.resetColor();
        mouseSelectedObject = null;
    
        simulationEnabled = true;
    }
} );

// 
// VR CONTROLLER EVENTS
//

const controller = renderer.xr.getController( 1 ); // Right controller
scene.add( controller );

// Create visible controller model with a laser pointer
const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip = renderer.xr.getControllerGrip( 1 );
controllerGrip.add( controllerModelFactory.createControllerModel( controllerGrip ) );
scene.add( controllerGrip );

const laser = createLaserBeam( controller );
laser.visible = true;

const controllerRaycaster = new THREE.Raycaster();
let controllerSelectedObject = null;
let controllerObjectOffset = new THREE.Vector3();
let controllerObjectDepth = 0;
let controllerIsSelecting = false;

// VR controller's equivalent of "mouse down"
controller.addEventListener( 'selectstart', ( event ) => {
    // Use controller position and direction to cast a ray
    controllerRaycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    controllerRaycaster.ray.direction.set( 0, 0, -1 ).applyQuaternion( controller.quaternion );

    // Check for intersections with objects
    const intersects = controllerRaycaster.intersectObjects( particles, true );
    
    if ( intersects.length > 0 ) {
        simulationEnabled = false;

        controllerSelectedObject = intersects[ 0 ].object;
        controllerSelectedObject.updateColor( 0x00ff00 );

        // Compute object offset and depth
        controllerObjectOffset.copy( intersects[ 0 ].point ).sub( controllerSelectedObject.position );
        controllerObjectDepth = controller.position.distanceTo( controllerSelectedObject.position );
    }

    controllerIsSelecting = true;
} );

// VR controller's equivalent of "mouse move"
function handleControllerSelectMove() {
    if ( !controllerSelectedObject ) {
        return;
    }

    controllerRaycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    controllerRaycaster.ray.direction.set( 0, 0, -1 ).applyQuaternion( controller.quaternion );

    // Calculate the new intersection point along the ray
    const controllerIntersect = new THREE.Vector3();
    controllerRaycaster.ray.at( controllerObjectDepth, controllerIntersect );

    // Move object
    controllerSelectedObject.position.copy( controllerIntersect.sub( controllerObjectOffset ) );
}

// VR controller's equivalent of "mouse up"
controller.addEventListener( 'selectend', () => {
    controllerIsSelecting = false;

    if ( controllerSelectedObject ) {
        controllerSelectedObject.resetColor();
        controllerSelectedObject = null;
    
        simulationEnabled = true;
    }
} );

let xrEnabled = false;

controller.addEventListener( 'squeeze', () => {
    xrEnabled = !xrEnabled;
    resetParticleHeight();

    if ( xrEnabled ) {
        skydome.visible = false;
    } else {
        skydome.visible = true;
    }
} );

function createLaserBeam( controller ) {
    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } ); // Red beam
    const points = [ new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, 0, -1) ]; // Start & end
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const laser = new THREE.Line( geometry, material );

    laser.scale.z = 5; // Length of the beam
    controller.add( laser );
    return laser;
}

//
// DEBUG UTILITY
//

// Track planes already created
const planeMap = new Map();

function showXRPlaneWireframe( frame, referenceSpace, detectedPlanes ) {
    // Track which planes we've updated this frame
    const updatedPlanes = new Set();

    detectedPlanes.forEach(plane => {
        if ( !plane ) {
            return;
        }

        const pose = frame.getPose( plane.planeSpace, referenceSpace );
        if ( !pose ) {
            return;
        }

        // Use plane.planeSpace as a unique identifier
        const planeId = plane.planeSpace;
        updatedPlanes.add( planeId );

        if ( planeMap.has( planeId ) ) {
            // Update existing plane
            updatePlaneTransform( planeMap.get( planeId ), plane, pose );
        } else {
            // Create new plane and store it
            const visualPlane = createPlaneMeshFromXRPlane( plane, pose );
            scene.add( visualPlane );
            planeMap.set( planeId, visualPlane );
        }
    });

    // Remove planes that weren't updated this frame
    // (they might have disappeared from detection)
    planeMap.forEach( ( visualPlane, planeId ) => {
        if ( !updatedPlanes.has( planeId )) {
            scene.remove( visualPlane );
            planeMap.delete( planeId );
        }
    } );
}

function createPlaneMeshFromXRPlane( xrPlane, pose ) {
    // Get the plane dimensions
    const geometry = new THREE.PlaneGeometry( 1, 1 );
    
    const material = new THREE.MeshBasicMaterial( {
        color: 0x44FF44,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        wireframe: true
    } );
    
    const planeMesh = new THREE.Mesh( geometry, material );
    
    // Apply initial transform
    updatePlaneTransform( planeMesh, xrPlane, pose );
    
    return planeMesh;
}

function updatePlaneTransform( visualPlane, xrPlane, pose ) {
    // Extract position and orientation from pose
    const position = pose.transform.position;
    const orientation = pose.transform.orientation;
    
    // Update position
    visualPlane.position.set( position.x, position.y, position.z );
    
    // Update rotation from quaternion
    visualPlane.quaternion.set(
        orientation.x,
        orientation.y,
        orientation.z,
        orientation.w
    );
    
    // Apply any plane orientation corrections
    // XR planes are typically Y-up, but Three.js might expect Z-up
    visualPlane.rotateX( -Math.PI / 2 );
}

