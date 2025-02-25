import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/Addons.js';
import { setupSimulation, updateSimulationVR, updateSimulationXR } from './src/Simulation';
import GradientSkydome from './src/GradientSkydome';

// Set up camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 5000 );
camera.position.set( 0, 2, 5 );

// Set up renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.xr.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animateVR ); // Start running animation loop

const sessionInit = { requiredFeatures: ["plane-detection"] };

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

const particles = setupSimulation( scene );
let simulationEnabled = true;

function animateVR() {
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

    setupXRSession( session );
} );

function setupXRSession( session ) {
    renderer.setAnimationLoop( ( timestamp, frame ) => {
        if ( frame && simulationEnabled ) {
            onXRFrame( timestamp, frame );
        }
        renderer.render( scene, camera );
    } );
}

function onXRFrame( timestamp, frame ) {
    const detectedPlanes = frame.detectedPlanes;
    const referenceSpace = renderer.xr.getReferenceSpace();

    detectedPlanes.forEach( plane => {
        if ( plane ) {
            const pose = frame.getPose( plane.planeSpace, referenceSpace );

            if ( pose ) {
                let position = pose.transform.position;
                console.log( `Plane detected at: x=${position.x}, y=${position.y}, z=${position.z}` );
                updateSimulationXR( plane, pose );
            }
        }
    } )
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

        // 
        // intersects[0].point: the exact 3D world coordinates where the ray hits the object
        // intersects[0].object.position: the position of the object’s origin
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
    mouseSelectedObject = null;
    simulationEnabled = true;
} );

// 
// VR CONTROLLER EVENTS
//

const controller = renderer.xr.getController( 0 ); // Get the first controller
scene.add( controller );

const controllerRaycaster = new THREE.Raycaster();
let controllerSelectedObject = null;
let controllerObjectOffset = new THREE.Vector3();
let controllerObjectDepth = 0;

// VR controller's equivalent of "mouse down"
controller.addEventListener( 'selectstart', ( event ) => {
    // Use controller position and direction to cast a ray
    controllerRaycaster.setFromMatrixPosition( controller.matrixWorld );

    // Check for intersections with objects
    const intersects = controllerRaycaster.intersectObjects( particles, true );
    if ( intersects.length > 0 ) {
        simulationEnabled = false;
        controllerSelectedObject = intersects[ 0 ].object;

        // Compute object offset and depth
        controllerObjectOffset.copy( intersects[ 0 ].point ).sub( controllerSelectedObject.position );
        controllerObjectDepth = controller.position.distanceTo( controllerSelectedObject.position );

        console.log( 'Controller grabbed:', controllerSelectedObject );
    }
} );

// VR controller's equivalent of "mouse move"
controller.addEventListener( 'squeezemove', () => {
    if ( controllerSelectedObject ) {
        const controllerIntersect = new THREE.Vector3();
        controllerRaycaster.setFromMatrixPosition( controller.matrixWorld );
        controllerRaycaster.ray.at( controllerObjectDepth, controllerIntersect );

        // Move object
        controllerSelectedObject.position.copy( controllerIntersect.sub( controllerObjectOffset ) );
    }
} );

// VR controller's equivalent of "mouse up"
controller.addEventListener( 'selectend', () => {
    controllerSelectedObject = null;
    simulationEnabled = true;
} );
