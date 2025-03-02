import * as THREE from 'three';

export default class Rectangle extends THREE.Mesh {
    constructor( options = {} ) {
        const {
            position = [0, 0, 0],
            width = 5,
            height = 5,
            color = 0xff0000
        } = options;

        // const geometry = new THREE.PlaneGeometry( width, height );
        const geometry = new THREE.BoxGeometry(width, 0.1, height);
        const material = new THREE.MeshStandardMaterial( {
            color,
            side: THREE.DoubleSide
        } )
        
        super( geometry, material );
        // this.rotation.x = -Math.PI / 2; // Rotate to lie flat on the XZ plane (horizontal)
        this.position.set( ...position );
        this.color = color;

        this.boundingBox = new THREE.Box3().setFromObject( this );
    }

    updateColor( newColor ) {
        this.material.color.set( newColor );     
    }

    resetColor() {
        this.material.color.set( this.color );
    }
}
