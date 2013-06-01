Sprite.Global = Backbone.Model.extend({
    readStorage: function( callback ) {
        var data = localStorage[ 'sprite' ];
        data = data ? JSON.parse( data ) : {};

        for ( var i in data ) {
            callback( i, data[ i ] );
        }
    }
});