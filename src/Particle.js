import * as THREE from 'three';

export default class Particle extends THREE.Mesh {
    constructor( options = {} ) {
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
        this.offset = radius;
        this.color = color;
        this.velocity = velocity;
        this.boundingSphere = new THREE.Sphere( this.position, radius );
        this.frustumCulled = false;
    }

    updateColor( newColor ) {
        this.material.color.set( newColor );     
    }

    resetColor() {
        this.material.color.set( this.color );
    }

    collidesWith( rectangle ) {
        if ( !this.boundingSphere || !rectangle.boundingBox ) {
            console.warn( "Bounding volumes are undefined!" );
            return false;
        }

        return this.boundingSphere.intersectsBox( rectangle.boundingBox );
    }
}
