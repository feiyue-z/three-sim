import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.FogExp2(0xffffff, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer();
renderer.xr.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);

// Append DOM elements
document.body.appendChild( renderer.domElement );
document.body.appendChild( VRButton.createButton( renderer ) );

// Add Light
const spotLight = new THREE.SpotLight(0xffffff, 10, 50, Math.PI / 4, 0.3);
spotLight.position.set(0, 10, 5);
spotLight.target.position.set(0, 0, 0);
scene.add(spotLight);
scene.add(spotLight.target);

// Add Visible Object
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
const sphere = new THREE.Mesh(geometry, material);
sphere.position.set(0, 1, 0);
scene.add(sphere);

// if (navigator.xr) {
//     const session = await navigator.xr.requestSession( "immersive-ar", {
//         requiredFeatures: [ "plane-detection" ]
//     } ).then( (session) => {
//         console.log( 'Depth sensing enabled:', session );
//     } );    
// }

// const session = await navigator.xr.requestSession('immersive-ar', {
//     requiredFeatures: ['mesh-detection']
// }).then((session) => {
//     console.log('Scene Understanding Enabled!', session);
// });

// Animate
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

if ("xr" in window.navigator) {
    /* WebXR can be used! */
    console.log("a");
} else {
    /* WebXR isn't available */
    console.log("b");
}

try {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (supported) {
        const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['plane-detection'] })
            .catch(() => console.warn("Plane detection not supported on this device."));
        if (session) {
            console.log("XR session with plane detection started.");
        }
    } else {
        console.warn("XR immersive AR not supported on this device.");
    }
} catch (err) {
    console.error("Error checking XR support:", err);
}

// async function checkXRSupport() {
//     if (navigator.xr) {
//         try {
//             const supported = await navigator.xr.isSessionSupported('immersive-ar');
//             if (supported) {
//                 const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['plane-detection'] })
//                     .catch(() => console.warn("Plane detection not supported on this device."));
//                 if (session) {
//                     console.log("XR session with plane detection started.");
//                 }
//             } else {
//                 console.warn("XR immersive AR not supported on this device.");
//             }
//         } catch (err) {
//             console.error("Error checking XR support:", err);
//         }
//     } else {
//         console.warn("WebXR not supported in this browser.");
//     }
// }

// // Call this function in response to a user action (e.g., button click)
// document.getElementById("startXR").addEventListener("click", checkXRSupport);
