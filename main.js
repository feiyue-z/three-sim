import * as THREE from 'three';
import { XRButton } from 'three/examples/jsm/Addons.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

import { setupSimulation, updateSimulationVR, updateSimulationXR, resetParticleHeight } from './src/simulation';
import { GradientSkydome, skydomeAnimate } from './src/gradientSkydome';
import { createControlPanel, preloadFont } from './src/ui';
import { initWebControl, onKeyDown } from './src/webControl';
import { initVrControl, createLaserBeam, handleControllerSelectMove } from './src/vrControl';
import { states } from './src/states';

const renderer = new THREE.WebGLRenderer( { antialias: true } );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 5000 );
const controller = renderer.xr.getController( 1 ); // Right controller
let scene = new THREE.Scene();

init();

function init() {
    ////
    // Set up camera & renderer
    ////

    camera.position.set( 0, 2, 5 );

    renderer.xr.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    setupWebSession(); // Start running animation loop

    ////
    // Set up WebXR
    ////

    const sessionInit = { requiredFeatures: [
        "plane-detection"
    ] };

    document.body.appendChild( renderer.domElement );
    document.body.appendChild( XRButton.createButton(
        renderer,
        sessionInit
    ) );

    ////
    // Set up scene
    ////

    const skydome = new GradientSkydome();
    scene.add( skydome );

    const light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    scene.add( controller );

    const [ plane, particles ] = setupSimulation( scene );
    const clickables = [ ...particles ];
    
    // Add controller model for XR
    const controllerModelFactory = new XRControllerModelFactory();
    const controllerGrip = renderer.xr.getControllerGrip( 1 );
    controllerGrip.add( controllerModelFactory.createControllerModel( controllerGrip ) );
    scene.add( controllerGrip );

    // Attach laser beam to controller
    const laser = createLaserBeam( controller );
    laser.visible = true;

    // Load font file
    preloadFont().then( () => {
        ////
        // Set up control panel
        ////

        const controlPanel = createControlPanel();
        controlPanel.position.set( 0, 3, -6);
    
        clickables.push( controlPanel.getObjectByName( "addButton" ) );
        clickables.push( controlPanel.getObjectByName( "minusButton" ) );
        scene.add( controlPanel );

        ////
        // Set up user interaction handlers
        ////

        initWebControl( camera, clickables, controlPanel );
        document.addEventListener( 'keydown', ( event ) => onKeyDown( event, camera ) );
        initVrControl( controller, clickables, resetParticleHeight, skydome, controlPanel );
    } );
}

function setupWebSession( session ) {
    renderer.setAnimationLoop( ( timestamp, frame ) => {
        if ( states.simulationEnabled ) {
            skydomeAnimate();
            updateSimulationVR();
        }

        renderer.render( scene, camera );
    } );
}

// Switch to XR session
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
        if ( states.controllerSelecting ) {
            handleControllerSelectMove( controller );
        }

        if ( frame && states.simulationEnabled ) {
            onXRFrame( timestamp, frame );
        }

        renderer.render( scene, camera );
    } );
}

function onXRFrame( timestamp, frame ) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const detectedPlanes = frame.detectedPlanes;

    if ( states.xrEnabled ) {
        updateSimulationXR( detectedPlanes, frame, referenceSpace );
    } else {
        updateSimulationVR();
    }
}
