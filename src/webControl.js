import * as THREE from 'three';
import { gsap } from "gsap";

import { states } from './states';

const mouse = new THREE.Vector2();
const mouseRaycaster = new THREE.Raycaster();
let mouseSelectedObject = null;
let mouseObjectOffset = new THREE.Vector3();
let mouseObjectDepth = 0; // Depth from camera to intersected object

export function initWebControl( camera, clickables, controlPanel ) {
    window.addEventListener( 'mousedown', ( event ) => {
        // Convert mouse position to normalized device coordinates [-1, 1]
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    
        // Update the raycaster
        mouseRaycaster.setFromCamera( mouse, camera );
    
        // Check for intersections with objects
        const intersects = mouseRaycaster.intersectObjects( clickables, true );
        if ( intersects.length > 0 ) {
            states.simulationEnabled = false;
    
            mouseSelectedObject = intersects[ 0 ].object;
    
            // NOTES:
            // intersects[0].point: the exact 3D world coordinates where the ray hits the object
            // intersects[0].object.position: the position of the object’s origin
    
            //
            mouseObjectOffset.copy( intersects[0].point ).sub( mouseSelectedObject.position );
            mouseObjectDepth = camera.position.distanceTo( mouseSelectedObject.position );
    
            console.log( 'Mouse clicked on:', intersects[ 0 ].object );
    
            if ( mouseSelectedObject.userData.type == "particle" ) {
                mouseSelectedObject.updateColor( 0x00ff00 );
            } else if ( mouseSelectedObject.userData.type == "button" ) {
                mouseSelectedObject.onClick( controlPanel.getObjectByName( "board" ) );
            }
        }
    } );

    window.addEventListener( 'mousemove', ( event ) => {
        if ( mouseSelectedObject ) {
            // Convert mouse position to normalized device coordinates [-1, 1]
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    
            //
            const mouseIntersect = new THREE.Vector3();
            mouseRaycaster.setFromCamera( mouse, camera );
            mouseRaycaster.ray.at( mouseObjectDepth, mouseIntersect );
    
            if ( mouseSelectedObject.userData.type == "particle" ) {
                //
                mouseSelectedObject.position.copy( mouseIntersect.sub( mouseObjectOffset ) );
            }
        }
    } );
    
    window.addEventListener( 'mouseup', () => {
        if ( mouseSelectedObject ) {
            if ( mouseSelectedObject.userData.type == "particle" ) {
                mouseSelectedObject.resetColor();
            }
    
            mouseSelectedObject = null;   
            states.simulationEnabled = true;
        }
    } );
}

export function onKeyDown( event, camera ) {
    switch ( event.key ) {
        case 'w':
            gsap.to( camera.position, {
                duration: 0.5,
                z: camera.position.z - 3.0,
                ease: "power2.inOut" 
            } )
            break;
        case 's':
            gsap.to( camera.position, {
                duration: 0.5,
                z: camera.position.z + 3.0,
                ease: "power2.inOut" 
            } )
            break;
        case 'a':
            gsap.to( camera.position, {
                duration: 0.5,
                x: camera.position.x - 3.0,
                ease: "power2.inOut" 
            } )
            break;
        case 'd':
            gsap.to( camera.position, {
                duration: 0.5,
                x: camera.position.x + 3.0,
                ease: "power2.inOut" 
            } )
            break;
    }
}