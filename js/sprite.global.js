Sprite.Global = Backbone.Model.extend({
    defaults: {
        rect: {
            x: null, y: null, w: null, h: null, xmax: null, ymax: null
        }
    },

    readElsInStorage: function( callback ) {
        var data = localStorage[ 'sprite' ];
        data = data ? JSON.parse( data ) : {};

        for ( var i in data ) {
            callback( i, data[ i ] );
        }
    },

    readParamsInStorage: function( callback ) {
        var w = parseInt( localStorage[ 'width' ] ),
            h = parseInt( localStorage[ 'height' ] );

        w && h ? callback ( w, h ) : null;
    },

    setParamsInStorage: function( w, h ) {
        localStorage[ 'width' ]  = w;
        localStorage[ 'height' ] = h;
    }
});