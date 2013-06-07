Sprite.Global = Backbone.Model.extend({
    defaults: {
        width: 400,
        height: 400,
        rect: {
            x: null, y: null, w: null, h: null, xmax: null, ymax: null
        }
    },

    /* only for .apply */
    setRectParams: function( w, h ) {
        this.rect.xmax = this.rect.x + w;
        this.rect.ymax = this.rect.y + h;
        this.rect.w = w;
        this.rect.h = h;
    },

    clearLocalStorage: function() {
        localStorage.removeItem( 'width'  );
        localStorage.removeItem( 'height' );
        localStorage.removeItem( 'sprite' );
    },

    readFiles: function( files, x, y, callback, error ) {
        var len = files.length, file, classname;

        for ( var i = 0; i < len; i++ ) {
            file = files[ i ];
            classname = file.name.split( '.' );
            classname.pop();
            classname = classname.join( '-' ).replace( / /, '-' );

            if ( classname.search( /^\d/ ) !== -1 ){
                classname = 'f-' + classname;
            }

            if ( file.type.search( 'png|gif|jpeg|jpg' ) === -1 ) {
                error && error({
                    fileName: file.name,
                    msg: 'You may upload file only with type image'
                });
                continue;
            } else if ( file.size / 1024 > 256 ) {
                error && error({
                    fileName: file.name,
                    msg: 'You may upload file only with size less then 256kb' 
                });
                continue;
            }

            callback && callback({
                x: x,
                y: y,
                fileEntity: file,
                name: classname
            });
        }
    },

    readElsInStorage: function( callback ) {
        var data = localStorage[ 'sprite' ];
        data = data ? JSON.parse( data ) : {};

        _( data ).each( function( item, key ) {
            item.uuid = key;
        });

        data = _( data ).toArray().sort( function( a, b ) {
            if ( a.index < b.index ) {
                return -1;
            } else if ( a.index > b.index ) {
                return 1;
            } else {
                return 0;
            }
        });

        _( data ).each( function( item ) {
            item.fileEntity  = new Image();
            item.fileContent = 'server/cache/' + item.token + '.png';
            callback( item );
        });
    },

    readParamsInStorage: function( callback ) {
        var w = parseInt( localStorage[ 'width' ] ),
            h = parseInt( localStorage[ 'height' ] );

        w >= 0 && h >= 0 ? callback ( w, h ) : null;
    },

    setParamsInStorage: function( w, h ) {
        localStorage[ 'width' ]  = w;
        localStorage[ 'height' ] = h;
    }
});