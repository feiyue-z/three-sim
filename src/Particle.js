import * as THREE from 'three';

export default class Particle extends THREE.Mesh {
    constructor( options = {} ) {
        // Default options that can be overridden
        const {
            position = [0, 0, 0],
            radius = 0.05,
            color = 0xff0000,
            velocity = 0,
        } = options;

        const geometry = new THREE.SphereGeometry( radius, 32, 32 );
        const material = new THREE.MeshStandardMaterial( {
            color,
            roughness: 0.5,
            metalness: 0,
        } );
        
        super( geometry, material );
        this.position.set( ...position );
        this.velocity = velocity;
    }
}