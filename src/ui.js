import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { states } from './states';

export let loadedFont = null;

export function preloadFont() {
    return new Promise( (resolve, reject ) => {
        const loader = new FontLoader();
        loader.load(
            'fonts/helvetiker_regular.typeface.json',
            ( font ) => {
                loadedFont = font;
                resolve( font );
                console.log("loaded!")
            },
            undefined,
            ( error ) => reject( error )
        );
    } );
}

class RoundedRectangle extends THREE.Mesh {
    constructor( width, height, radius, options = {} ) {
        const {
            depth = 0.05,
            color = 0xffffff
        } = options;

        const shape = new THREE.Shape();
        shape.moveTo( -width / 2 + radius, -height / 2 );
        shape.lineTo( width / 2 - radius, -height / 2 );
        shape.quadraticCurveTo( width / 2, -height / 2, width / 2, -height / 2 + radius );
        shape.lineTo( width / 2, height / 2 - radius );
        shape.quadraticCurveTo( width / 2, height / 2, width / 2 - radius, height / 2 );
        shape.lineTo( -width / 2 + radius, height / 2 );
        shape.quadraticCurveTo( -width / 2, height / 2, -width / 2, height / 2 - radius );
        shape.lineTo( -width / 2, -height / 2 + radius );
        shape.quadraticCurveTo( -width / 2, -height / 2, -width / 2 + radius, -height / 2 );
    
        const geometry = new THREE.ExtrudeGeometry( shape, { depth, bevelEnabled: false } );
        const material = new THREE.MeshStandardMaterial( {
            color: 0xffffff,
            transparent: true,
            opacity: 0.75
        } );     
        
        super( geometry, material );
        this.color = color;
        this.frustumCulled = false;
        this.userData = {
            type: "ui"
        };
    }

    updateColor( color ) {
        this.material.color.set( color );     
    }

    resetColor() {
        this.material.color.set( this.color );
    }
}

class TextMesh extends THREE.Object3D {
    constructor( text, options = {} ) {
        const {
            color = 0x000000,
            size = 0.2,
            depth = 0.02
        } = options;

        if ( !loadedFont)  {
            console.error( "Font not loaded!" );
            return;
        }

        super();
        this.text = text;
        this.color = color;
        this.size = size;
        this.depth = depth;
        
        this.createTextMesh();
    }

    createTextMesh() {
        const textGeometry = new TextGeometry( this.text, {
            font: loadedFont,
            size: this.size,
            depth: this.depth
        } );
        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial( { color: this.color } );
        this.mesh = new THREE.Mesh( textGeometry, textMaterial );

        this.add( this.mesh );
    }

    setText( text ) {
        this.text = text;

        if ( this.mesh ) {
            this.remove( this.mesh ); // Remove old mesh from the scene
            this.mesh.geometry.dispose(); // Free up memory
            this.mesh.material.dispose(); // Free up memory
        }
        this.createTextMesh();
    }
}

class Board extends RoundedRectangle {
    constructor( width, height, text ) {
        super( width, height, 0.2 );

        this.textMesh = new TextMesh( text );
        this.textMesh.position.set( 0, 0, 0.1 );
        this.textMesh.raycast = () => {};
        this.add( this.textMesh );
    }

    setText( text ) {
        this.textMesh.setText( text );
    }
}

class AddButton extends RoundedRectangle {
    constructor( width, height ) {
        super( width, height, 0.12 );

        this.textMesh = new TextMesh( "+" );
        this.textMesh.position.set( 0, 0, 0.1 );
        this.textMesh.raycast = () => {};
        this.add( this.textMesh );

        this.userData = {
            type: "button"
        };
    }

    onClick( board ) {
        states.g += 1;
        board.setText( `g = ${states.g.toFixed(1)}` );
    }
}

class MinusButton extends RoundedRectangle {
    constructor( width, height ) {
        super( width, height, 0.12 );
        
        this.textMesh = new TextMesh( "-" );
        this.textMesh.position.set( 0, 0, 0.1 );
        this.textMesh.raycast = () => {};
        this.add( this.textMesh );

        this.userData = {
            type: "button"
        };
    }

    onClick( board ) {
        if ( states.g > 1) {
            states.g -= 1;
            board.setText( `g = ${states.g.toFixed(1)}` );
        }
    }
}

export function createControlPanel() {
    const controlPanel = new THREE.Group();

    const board = new Board(2, 1, "g = 9.8" );
    const addButton = new AddButton( 0.4, 0.4 );
    const minusButton = new MinusButton( 0.4, 0.4 );

    board.name = "board";
    addButton.name = "addButton";
    minusButton.name = "minusButton";

    addButton.position.set( 1.3, 0, 0 );
    minusButton.position.set( -1.3, 0, 0 );

    controlPanel.add( board );
    controlPanel.add( addButton );
    controlPanel.add( minusButton );

    return controlPanel;
}