import * as THREE from 'three';
// import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { setupSimulation, updateSimulation } from './src/scene';

// Set up camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 5000 );
camera.position.set( 0, 2, 5 );

// Set up renderer
const renderer = new THREE.WebGLRenderer();
renderer.xr.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate ); // Start running animation loop

// Append DOM elements
document.body.appendChild( renderer.domElement );
// document.body.appendChild( VRButton.createButton( renderer ) );
document.body.appendChild( ARButton.createButton( renderer ) );


//
const scene = new THREE.Scene();
scene.background = null;
// const sphere = setupSimulation( scene );
const particles = setupSimulation( scene );

function animate() {
    // requestAnimationFrame( animate ); // ??
    // updateSimulation( sphere );
    updateSimulation( particles );
    renderer.render( scene, camera );
}

navigator.xr.isSessionSupported('immersive-ar').then(supported => {
    if (supported) {
        navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['plane-detection']
        }).then(session => {
            renderer.xr.setSession(session);
        }).catch(err => {
            console.warn("Feature not supported:", err);
        });
    }
});
