Sprite.Model.CanvasElement = Backbone.Model.extend({
    defaults: {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        index: null,
        name: null,
        fileEntity: null,
        fileContent: null,
        token: null,
        uuid: null,
        xhr: {
            abort: function() {}
        }
    },

    initialize: function() {
        var self = this;
        this.on( 'remove', function() {
            self.get( 'xhr' ).abort();
        });
    },

    isEntityFile: function() {
        return this.get( 'fileEntity' ) + '' === '[object File]';
    },

    sync: function() {
    },

    hasUuid: function( callback ) {
        var uuid = this.get( 'uuid' );
        uuid ? callback && callback( uuid ) : null;
    },

    saveNameToStorage: function( name ) {
        this.setParamsToStorage({ name: name === undefined ? this.get( 'name' ) : name });
    },

    saveCoordsToStorage: function( x, y ) {
        this.setParamsToStorage({
            x: x === undefined ? this.get( 'x' ) : x,
            y: y === undefined ? this.get( 'y' ) : y
        });
    },

    setParamsToStorage: function( params ) {
        this.hasUuid( function( uuid ) {
            var data = localStorage[ 'sprite' ];
            data = data ? JSON.parse( data ) : {};
            data[ uuid ] ? null : data[ uuid ] = {};

            for ( var i in params ) {
                data[ uuid ][ i ] = params[ i ];
            }

            localStorage.setItem( 'sprite', JSON.stringify( data ) );
        });
    },

    save: function() {
        var self = this,
            xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if ( xhr.readyState === 4 ) {
                if ( xhr.status === 200 ) {
                    self.onSuccessSave( JSON.parse( xhr.responseText ) );
                }
            }
        };
        
        xhr.open( 'POST', '/api/create_image', true );
        xhr.send( this.prepareDataToCreateImage() );
        this.set( 'xhr', xhr );
    },

    onSuccessSave: function( json ) {
        this.set( 'token', json.token );
        this.set( 'uuid', json.uuid );        
        this.setParamsToStorage({
            uuid: json.uuid,
            token: json.token,
            index: this.get( 'index' ),
            w: this.get( 'w' ),
            h: this.get( 'h' )
        });
        this.saveCoordsToStorage();
        this.saveNameToStorage();
        this.trigger( 'onloadFile' );
        console.log( json );
    },

    onLocalLoadFile: function( e, img ) {
        this.set({
            w: e.target.width,
            h: e.target.height,
            fileContent: img.src
        });
    },

    readFile: function() {
        var reader = new FileReader(), self = this;
        
        reader.onload = function( e ) {
            var img = document.createElement( 'img' );
            img.onload = function() {
                self.setFileParams( this );
                self.save();
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL( this.get( 'fileEntity' ) );
    },

    setFileParams: function( img ) {
        this.set({
            w: img.width,
            h: img.height,
            fileContent: img.src
        });
    },

    prepareDataToCreateImage: function() {
        var modelData = this.toJSON(), formData = new FormData();
        
        formData.append( 'fileContent', modelData.fileContent );
        formData.append( 'w', modelData.w );
        formData.append( 'h', modelData.h );

        return formData;
    }
});

Sprite.Collection.CanvasElements = Backbone.Collection.extend({
    model: Sprite.Model.CanvasElement,

    createSprite: function( w, h ) {
        var reqData = this.prepareDataToCreateCanvas( w, h );

        $.ajax({
            data: reqData,
            url: 'api/create_sprite',
            method: 'POST',
            dataType: 'json',
            success: function( json ) {
                if ( json.result === 'RESULT_OK' ) {
                    location.href = 'server/zip/' + json.token + '.zip';
                }
                console.log( json );
            }
        });
    },

    prepareDataToCreateCanvas: function( canvasWidth, canvasHeight ) {
        var reqData = [], params = _( [ 'token', 'x', 'y', 'name', 'w', 'h' ] );

        this.each( function( elModel, index ) {
            params.each( function( value ) {
                reqData.push( value + index + '=' + elModel.get( value ) );
            });
        });

        reqData.push( 'width='  + canvasWidth );
        reqData.push( 'height=' + canvasHeight );

        return reqData.join( '&' );
    }
});

Sprite.View.CanvasElement = Backbone.View.extend({
    tagName: 'div',
    className: 'canvas-element',
    events: {
        'mousedown': 'mousedown'
    },

    initialize: function() {
        var self = this;
        this.model.on( 'dragmove', function() {
            self.el.style.left = self.model.get( 'x' ) + 'px';
            self.el.style.top  = self.model.get( 'y' ) + 'px';
        });

        this.model.on( 'remove', function() {
            self.remove();
        });
    },

    render: function() {
        var dta = this.model.toJSON();

        this.el.style.top    = dta.y + 'px';
        this.el.style.left   = dta.x + 'px';
        this.el.style.width  = dta.w + 'px';
        this.el.style.height = dta.h + 'px';
        this.el.style.backgroundImage = 'url(' + dta.fileContent + ')';
        this.el.setAttribute( 'data-id', this.model.cid );
    }
});