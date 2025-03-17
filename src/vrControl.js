import * as THREE from 'three';

import { states } from './states';

const controllerRaycaster = new THREE.Raycaster();
let controllerSelectedObject = null;
let controllerObjectOffset = new THREE.Vector3();
let controllerObjectDepth = 0;

export function initVrControl( controller, clickables, resetParticleHeight, skydome, controlPanel ) {
    // VR controller's equivalent of "mouse down"
    controller.addEventListener( 'selectstart', ( event ) => {
        // Use controller position and direction to cast a ray
        controllerRaycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
        controllerRaycaster.ray.direction.set( 0, 0, -1 ).applyQuaternion( controller.quaternion );

        // Check for intersections with objects
        const intersects = controllerRaycaster.intersectObjects( clickables, true );
        
        if ( intersects.length > 0 ) {
            states.simulationEnabled = false;

            controllerSelectedObject = intersects[ 0 ].object;

            // Compute object offset and depth
            controllerObjectOffset.copy( intersects[ 0 ].point ).sub( controllerSelectedObject.position );
            controllerObjectDepth = controller.position.distanceTo( controllerSelectedObject.position );

            if ( controllerSelectedObject.userData.type == "particle" ) {
                controllerSelectedObject.updateColor( 0x00ff00 );
            } else if ( controllerSelectedObject.userData.type == "button" ) {
                controllerSelectedObject.onClick( controlPanel.getObjectByName( "board" ) );
            }
        }

        states.controllerSelecting = true;
    } );

    // VR controller's equivalent of "mouse up"
    controller.addEventListener( 'selectend', () => {
        states.controllerSelecting = false;

        if ( controllerSelectedObject ) {
            if ( controllerSelectedObject.userData.type == "particle" ) {
                controllerSelectedObject.resetColor();
            }

            controllerSelectedObject = null;
            states.simulationEnabled = true;
        }
    } );

    // Triggered when the inner button is pressed
    controller.addEventListener( 'squeeze', () => {
        states.xrEnabled = !states.xrEnabled;
        resetParticleHeight();
    
        if ( states.xrEnabled ) {
            skydome.visible = false;
        } else {
            skydome.visible = true;
        }
    } );
}

// VR controller's equivalent of "mouse move"
export function handleControllerSelectMove( controller ) {
    if ( !controllerSelectedObject ) {
        return;
    }

    controllerRaycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
    controllerRaycaster.ray.direction.set( 0, 0, -1 ).applyQuaternion( controller.quaternion );

    // Calculate the new intersection point along the ray
    const controllerIntersect = new THREE.Vector3();
    controllerRaycaster.ray.at( controllerObjectDepth, controllerIntersect );

    // Move object
    if ( controllerSelectedObject.userData.type == "particle" ) {
        controllerSelectedObject.position.copy( controllerIntersect.sub( controllerObjectOffset ) );
    }
}

export function createLaserBeam( controller ) {
    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } ); // Red beam
    const points = [ new THREE.Vector3( 0, 0, 0), new THREE.Vector3( 0, 0, -1) ]; // Start & end
    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const laser = new THREE.Line( geometry, material );

    laser.scale.z = 5; // Length of the beam
    controller.add( laser );
    return laser;
}