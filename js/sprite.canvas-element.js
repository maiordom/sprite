Sprite.Model.CanvasElement = Backbone.Model.extend({
    defaults: {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        name: null,
        fileEntity: null,
        fileContent: null,
        token: null
    },

    initialize: function() {
        if ( this.get( 'fileEntity' ) + '' === '[object File]' ) {
            this.readFile();    
        }
    },

    sync: function() {
    },

    saveParamsToStorage: function( x, y ) {
        var token = this.get( 'token' );

        if ( token === null ) { return false; }

        var data = localStorage[ 'sprite' ];
        data = data ? JSON.parse( data ) : {};
        data[ token ] = { 
            x: x === undefined ? this.get( 'x' ) : x, 
            y: y === undefined ? this.get( 'y' ) : y,
            name: this.get( 'name' )
        };
        localStorage.setItem( 'sprite', JSON.stringify( data ) );
    },

    save: function() {
        var self = this,      
            xhr = new XMLHttpRequest();    

        xhr.onreadystatechange = function() {
            if ( xhr.readyState === 4 ) {
                if ( xhr.status === 200 ) {
                    var json = JSON.parse( xhr.responseText );
                    self.set( 'token', json.token );
                    self.saveParamsToStorage();
                    console.log( json );
                }
            }
        };
        
        xhr.open( 'POST', '/api/create_image', true );
        xhr.send( this.prepareDataToCreateImage() );
    },

    onLocalLoadFile: function( e, img ) {
        this.set({
            w: e.target.width,
            h: e.target.height,
            fileContent: img.src
        });
        this.trigger( 'onloadFile' );
        this.save();
    },

    readFile: function() {
        var reader = new FileReader(), self = this;
        
        reader.onload = function( e ) {
            var img = document.createElement( 'img' );
            img.onload = function( e ) {
                self.onLocalLoadFile( e, this );    
            };
            img.src = e.target.result;
        }

        reader.readAsDataURL( this.get( 'fileEntity' ) );
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
                    location.href = 'server/zip/' + json.token + '.zip'
                }
                console.log( json );
            }
        });
    },

    prepareDataToCreateCanvas: function( canvasWidth, canvasHeight ) {
        var reqData = [];

        this.each( function( elModel, index ) {
            reqData.push( 'token' + index + '=' + elModel.get( 'token' ) );
            reqData.push( 'x'     + index + '=' + elModel.get( 'x' ) );
            reqData.push( 'y'     + index + '=' + elModel.get( 'y' ) );
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