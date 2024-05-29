

THREE.OBJLoader = function ( manager ) {

    this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

    this.materials = null;

    this.regexp = {
        vertex_pattern           : /^v\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
        
        normal_pattern           : /^vn\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
        
        uv_pattern               : /^vt\s+([\d|\.|\+|\-|e|E]+)\s+([\d|\.|\+|\-|e|E]+)/,
        
        face_vertex              : /^f\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)(?:\s+(-?\d+))?/,
        
        face_vertex_uv           : /^f\s+(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+))?/,
        
        face_vertex_uv_normal    : /^f\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)\s+(-?\d+)\/(-?\d+)\/(-?\d+)(?:\s+(-?\d+)\/(-?\d+)\/(-?\d+))?/,
        
        face_vertex_normal       : /^f\s+(-?\d+)\/\/(-?\d+)\s+(-?\d+)\/\/(-?\d+)\s+(-?\d+)\/\/(-?\d+)(?:\s+(-?\d+)\/\/(-?\d+))?/,
        
        object_pattern           : /^[og]\s*(.+)?/,
        
        smoothing_pattern        : /^s\s+(\d+|on|off)/,
        
        material_library_pattern : /^mtllib /,
        
        material_use_pattern     : /^usemtl /
    };

};

THREE.OBJLoader.prototype = {

    constructor: THREE.OBJLoader,

    load: function ( url, onLoad, onProgress, onError ) {

        var scope = this;

        var loader = new THREE.FileLoader( scope.manager );
        loader.setPath( this.path );
        loader.load( url, function ( text ) {

            onLoad( scope.parse( text ) );

        }, onProgress, onError );

    },

    setPath: function ( value ) {

        this.path = value;

    },

    setMaterials: function ( materials ) {

        this.materials = materials;

    },

    _createParserState : function () {

        var state = {
            objects  : [],
            object   : {},

            vertices : [],
            normals  : [],
            uvs      : [],

            materialLibraries : [],

            startObject: function ( name, fromDeclaration ) {


                if ( this.object && this.object.fromDeclaration === false ) {

                    this.object.name = name;
                    this.object.fromDeclaration = ( fromDeclaration !== false );
                    return;

                }

                var previousMaterial = ( this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined );

                if ( this.object && typeof this.object._finalize === 'function' ) {

                    this.object._finalize( true );

                }

                this.object = {
                    name : name || '',
                    fromDeclaration : ( fromDeclaration !== false ),

                    geometry : {
                        vertices : [],
                        normals  : [],
                        uvs      : []
                    },
                    materials : [],
                    smooth : true,

                    startMaterial : function( name, libraries ) {

                        var previous = this._finalize( false );

                        if ( previous && ( previous.inherited || previous.groupCount <= 0 ) ) {

                            this.materials.splice( previous.index, 1 );

                        }

                        var material = {
                            index      : this.materials.length,
                            name       : name || '',
                            mtllib     : ( Array.isArray( libraries ) && libraries.length > 0 ? libraries[ libraries.length - 1 ] : '' ),
                            smooth     : ( previous !== undefined ? previous.smooth : this.smooth ),
                            groupStart : ( previous !== undefined ? previous.groupEnd : 0 ),
                            groupEnd   : -1,
                            groupCount : -1,
                            inherited  : false,

                            clone : function( index ) {
                                var cloned = {
                                    index      : ( typeof index === 'number' ? index : this.index ),
                                    name       : this.name,
                                    mtllib     : this.mtllib,
                                    smooth     : this.smooth,
                                    groupStart : 0,
                                    groupEnd   : -1,
                                    groupCount : -1,
                                    inherited  : false
                                };
                                cloned.clone = this.clone.bind(cloned);
                                return cloned;
                            }
                        };

                        this.materials.push( material );

                        return material;

                    },

                    currentMaterial : function() {

                        if ( this.materials.length > 0 ) {
                            return this.materials[ this.materials.length - 1 ];
                        }

                        return undefined;

                    },

                    _finalize : function( end ) {

                        var lastMultiMaterial = this.currentMaterial();
                        if ( lastMultiMaterial && lastMultiMaterial.groupEnd === -1 ) {

                            lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
                            lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
                            lastMultiMaterial.inherited = false;

                        }

                        
                        if ( end && this.materials.length > 1 ) {

                            for ( var mi = this.materials.length - 1; mi >= 0; mi-- ) {
                                if ( this.materials[mi].groupCount <= 0 ) {
                                    this.materials.splice( mi, 1 );
                                }
                            }

                        }

                        
                        if ( end && this.materials.length === 0 ) {

                            this.materials.push({
                                name   : '',
                                smooth : this.smooth
                            });

                        }

                        return lastMultiMaterial;

                    }
                };

               

                if ( previousMaterial && previousMaterial.name && typeof previousMaterial.clone === "function" ) {

                    var declared = previousMaterial.clone( 0 );
                    declared.inherited = true;
                    this.object.materials.push( declared );

                }

                this.objects.push( this.object );

            },

            finalize : function() {

                if ( this.object && typeof this.object._finalize === 'function' ) {

                    this.object._finalize( true );

                }

            },

            parseVertexIndex: function ( value, len ) {

                var index = parseInt( value, 10 );
                return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

            },

            parseNormalIndex: function ( value, len ) {

                var index = parseInt( value, 10 );
                return ( index >= 0 ? index - 1 : index + len / 3 ) * 3;

            },

            parseUVIndex: function ( value, len ) {

                var index = parseInt( value, 10 );
                return ( index >= 0 ? index - 1 : index + len / 2 ) * 2;

            },

            addVertex: function ( a, b, c ) {

                var src = this.vertices;
                var dst = this.object.geometry.vertices;

                dst.push( src[ a + 0 ] );
                dst.push( src[ a + 1 ] );
                dst.push( src[ a + 2 ] );
                dst.push( src[ b + 0 ] );
                dst.push( src[ b + 1 ] );
                dst.push( src[ b + 2 ] );
                dst.push( src[ c + 0 ] );
                dst.push( src[ c + 1 ] );
                dst.push( src[ c + 2 ] );

            },

            addVertexLine: function ( a ) {

                var src = this.vertices;
                var dst = this.object.geometry.vertices;

                dst.push( src[ a + 0 ] );
                dst.push( src[ a + 1 ] );
                dst.push( src[ a + 2 ] );

            },

            addNormal : function ( a, b, c ) {

                var src = this.normals;
                var dst = this.object.geometry.normals;

                dst.push( src[ a + 0 ] );
                dst.push( src[ a + 1 ] );
                dst.push( src[ a + 2 ] );
                dst.push( src[ b + 0 ] );
                dst.push( src[ b + 1 ] );
                dst.push( src[ b + 2 ] );
                dst.push( src[ c + 0 ] );
                dst.push( src[ c + 1 ] );
                dst.push( src[ c + 2 ] );

            },

            addUV: function ( a, b, c ) {

                var src = this.uvs;
                var dst = this.object.geometry.uvs;

                dst.push( src[ a + 0 ] );
                dst.push( src[ a + 1 ] );
                dst.push( src[ b + 0 ] );
                dst.push( src[ b + 1 ] );
                dst.push( src[ c + 0 ] );
                dst.push( src[ c + 1 ] );

            },

            addUVLine: function ( a ) {

                var src = this.uvs;
                var dst = this.object.geometry.uvs;

                dst.push( src[ a + 0 ] );
                dst.push( src[ a + 1 ] );

            },

            addFace: function ( a, b, c, d, ua, ub, uc, ud, na, nb, nc, nd ) {

                var vLen = this.vertices.length;

                var ia = this.parseVertexIndex( a, vLen );
                var ib = this.parseVertexIndex( b, vLen );
                var ic = this.parseVertexIndex( c, vLen );
                var id;

                if ( d === undefined ) {

                    this.addVertex( ia, ib, ic );

                } else {

                    id = this.parseVertexIndex( d, vLen );

                    this.addVertex( ia, ib, id );
                    this.addVertex( ib, ic, id );

                }

                if ( ua !== undefined ) {

                    var uvLen = this.uvs.length;

                    ia = this.parseUVIndex( ua, uvLen );
                    ib = this.parseUVIndex( ub, uvLen );
                    ic = this.parseUVIndex( uc, uvLen );

                    if ( d === undefined ) {

                        this.addUV( ia, ib, ic );

                    } else {

                        id = this.parseUVIndex( ud, uvLen );

                        this.addUV( ia, ib, id );
                        this.addUV( ib, ic, id );

                    }

                }

                if ( na !== undefined ) {

                    
                    var nLen = this.normals.length;
                    ia = this.parseNormalIndex( na, nLen );

                    ib = na === nb ? ia : this.parseNormalIndex( nb, nLen );
                    ic = na === nc ? ia : this.parseNormalIndex( nc, nLen );

                    if ( d === undefined ) {

                        this.addNormal( ia, ib, ic );

                    } else {

                        id = this.parseNormalIndex( nd, nLen );

                        this.addNormal( ia, ib, id );
                        this.addNormal( ib, ic, id );

                    }

                }

            },

            addLineGeometry: function ( vertices, uvs ) {

                this.object.geometry.type = 'Line';

                var vLen = this.vertices.length;
                var uvLen = this.uvs.length;

                for ( var vi = 0, l = vertices.length; vi < l; vi ++ ) {

                    this.addVertexLine( this.parseVertexIndex( vertices[ vi ], vLen ) );

                }

                for ( var uvi = 0, l = uvs.length; uvi < l; uvi ++ ) {

                    this.addUVLine( this.parseUVIndex( uvs[ uvi ], uvLen ) );

                }

            }

        };

        state.startObject( '', false );

        return state;

    },

    parse: function ( text ) {

        console.time( 'OBJLoader' );

        var state = this._createParserState();

        if ( text.indexOf( '\r\n' ) !== - 1 ) {

            
            text = text.replace( /\r\n/g, '\n' );

        }

        if ( text.indexOf( '\\\n' ) !== - 1) {

            
            text = text.replace( /\\\n/g, '' );

        }

        var lines = text.split( '\n' );
        var line = '', lineFirstChar = '', lineSecondChar = '';
        var lineLength = 0;
        var result = [];

        
        var trimLeft = ( typeof ''.trimLeft === 'function' );

        for ( var i = 0, l = lines.length; i < l; i ++ ) {

            line = lines[ i ];

            line = trimLeft ? line.trimLeft() : line.trim();

            lineLength = line.length;

            if ( lineLength === 0 ) continue;

            lineFirstChar = line.charAt( 0 );

            
            if ( lineFirstChar === '#' ) continue;

            if ( lineFirstChar === 'v' ) {

                lineSecondChar = line.charAt( 1 );

                if ( lineSecondChar === ' ' && ( result = this.regexp.vertex_pattern.exec( line ) ) !== null ) {

                    state.vertices.push(
                        parseFloat( result[ 1 ] ),
                        parseFloat( result[ 2 ] ),
                        parseFloat( result[ 3 ] )
                    );

                } else if ( lineSecondChar === 'n' && ( result = this.regexp.normal_pattern.exec( line ) ) !== null ) {

                    state.normals.push(
                        parseFloat( result[ 1 ] ),
                        parseFloat( result[ 2 ] ),
                        parseFloat( result[ 3 ] )
                    );

                } else if ( lineSecondChar === 't' && ( result = this.regexp.uv_pattern.exec( line ) ) !== null ) {


                    state.uvs.push(
                        parseFloat( result[ 1 ] ),
                        parseFloat( result[ 2 ] )
                    );

                } else {

                    throw new Error( "Unexpected vertex/normal/uv line: '" + line  + "'" );

                }

            } else if ( lineFirstChar === "f" ) {

                if ( ( result = this.regexp.face_vertex_uv_normal.exec( line ) ) !== null ) {

                    

                    state.addFace(
                        result[ 1 ], result[ 4 ], result[ 7 ], result[ 10 ],
                        result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
                        result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
                    );

                } else if ( ( result = this.regexp.face_vertex_uv.exec( line ) ) !== null ) {


                    state.addFace(
                        result[ 1 ], result[ 3 ], result[ 5 ], result[ 7 ],
                        result[ 2 ], result[ 4 ], result[ 6 ], result[ 8 ]
                    );

                } else if ( ( result = this.regexp.face_vertex_normal.exec( line ) ) !== null ) {

                   
                    state.addFace(
                        result[ 1 ], result[ 3 ], result[ 5 ], result[ 7 ],
                        undefined, undefined, undefined, undefined,
                        result[ 2 ], result[ 4 ], result[ 6 ], result[ 8 ]
                    );

                } else if ( ( result = this.regexp.face_vertex.exec( line ) ) !== null ) {

                    
                    state.addFace(
                        result[ 1 ], result[ 2 ], result[ 3 ], result[ 4 ]
                    );

                } else {

                    throw new Error( "Unexpected face line: '" + line  + "'" );

                }

            } else if ( lineFirstChar === "l" ) {

                var lineParts = line.substring( 1 ).trim().split( " " );
                var lineVertices = [], lineUVs = [];

                if ( line.indexOf( "/" ) === - 1 ) {

                    lineVertices = lineParts;

                } else {

                    for ( var li = 0, llen = lineParts.length; li < llen; li ++ ) {

                        var parts = lineParts[ li ].split( "/" );

                        if ( parts[ 0 ] !== "" ) lineVertices.push( parts[ 0 ] );
                        if ( parts[ 1 ] !== "" ) lineUVs.push( parts[ 1 ] );

                    }

                }
                state.addLineGeometry( lineVertices, lineUVs );

            } else if ( ( result = this.regexp.object_pattern.exec( line ) ) !== null ) {

                
                var name = ( " " + result[ 0 ].substr( 1 ).trim() ).substr( 1 );

                state.startObject( name );

            } else if ( this.regexp.material_use_pattern.test( line ) ) {

                // material

                state.object.startMaterial( line.substring( 7 ).trim(), state.materialLibraries );

            } else if ( this.regexp.material_library_pattern.test( line ) ) {

                // mtl file

                state.materialLibraries.push( line.substring( 7 ).trim() );

            } else if ( ( result = this.regexp.smoothing_pattern.exec( line ) ) !== null ) {

                

                var value = result[ 1 ].trim().toLowerCase();
                state.object.smooth = ( value === '1' || value === 'on' );

                var material = state.object.currentMaterial();
                if ( material ) {

                    material.smooth = state.object.smooth;

                }

            } else {

                if ( line === '\0' ) continue;

                throw new Error( "Unexpected line: '" + line  + "'" );

            }

        }

        state.finalize();

        var container = new THREE.Group();
        container.materialLibraries = [].concat( state.materialLibraries );

        for ( var i = 0, l = state.objects.length; i < l; i ++ ) {

            var object = state.objects[ i ];
            var geometry = object.geometry;
            var materials = object.materials;
            var isLine = ( geometry.type === 'Line' );

            if ( geometry.vertices.length === 0 ) continue;

            var buffergeometry = new THREE.BufferGeometry();

            buffergeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( geometry.vertices ), 3 ) );

            if ( geometry.normals.length > 0 ) {

                buffergeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( geometry.normals ), 3 ) );

            } else {

                buffergeometry.computeVertexNormals();

            }

            if ( geometry.uvs.length > 0 ) {

                buffergeometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( geometry.uvs ), 2 ) );

            }


            var createdMaterials = [];

            for ( var mi = 0, miLen = materials.length; mi < miLen ; mi++ ) {

                var sourceMaterial = materials[mi];
                var material = undefined;

                if ( this.materials !== null ) {

                    material = this.materials.create( sourceMaterial.name );

                    if ( isLine && material && ! ( material instanceof THREE.LineBasicMaterial ) ) {

                        var materialLine = new THREE.LineBasicMaterial();
                        materialLine.copy( material );
                        material = materialLine;

                    }

                }

                if ( ! material ) {

                    material = ( ! isLine ? new THREE.MeshPhongMaterial() : new THREE.LineBasicMaterial() );
                    material.name = sourceMaterial.name;

                }

                material.shading = sourceMaterial.smooth ? THREE.SmoothShading : THREE.FlatShading;

                createdMaterials.push(material);

            }


            var mesh;

            if ( createdMaterials.length > 1 ) {

                for ( var mi = 0, miLen = materials.length; mi < miLen ; mi++ ) {

                    var sourceMaterial = materials[mi];
                    buffergeometry.addGroup( sourceMaterial.groupStart, sourceMaterial.groupCount, mi );

                }

                mesh = ( ! isLine ? new THREE.Mesh( buffergeometry, createdMaterials ) : new THREE.LineSegments( buffergeometry, createdMaterials ) );

            } else {

                mesh = ( ! isLine ? new THREE.Mesh( buffergeometry, createdMaterials[ 0 ] ) : new THREE.LineSegments( buffergeometry, createdMaterials[ 0 ] ) );
            }

            mesh.name = object.name;

            container.add( mesh );

        }

        console.timeEnd( 'OBJLoader' );

        return container;

    }

};