Sprite.Global = Backbone.Model.extend({
    defaults: {
        rect: {
            x: null, y: null, w: null, h: null, xmax: null, ymax: null
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