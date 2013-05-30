Sprite.Model.CanvasElement = Backbone.Model.extend({
    defaults: {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        name: null,
        fileEntity: null,
        fileContent: null
    },

    initialize: function() {
        if ( this.get( 'fileEntity' ) + '' === '[object File]' ) {
            this.readFile();    
        }
    },

    sync: function() {
    },

    readFile: function() {
        var reader = new FileReader(), $this = this;
        
        reader.onload = function( e ) {
            var img = document.createElement( 'img' );
            img.onload = function( e ) {
                $this.set({
                    w: e.target.width,
                    h: e.target.height,
                    fileContent: this.src
                });
                $this.trigger( 'onloadFile' );
            };
            img.src = e.target.result;
        }

        reader.readAsDataURL( this.get( 'fileEntity' ) );
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
                    location.href = 'server/cache/' + json.file + '.png'
                }
                console.log( json );
            }
        });
    },

    prepareDataToCreateCanvas: function( canvasWidth, canvasHeight ) {
        var reqData = [], serializedData = [], tmp;

        this.each( function( elModel ) {
            tmp = elModel.toJSON();
            delete tmp.fileEntity;
            reqData.push( tmp );
        });

        serializedData.push( 'width='  + canvasWidth );
        serializedData.push( 'height=' + canvasHeight );

        _.each( reqData, function( reqDataItem, index ) {
            _.each( reqDataItem, function( value, key ) {
                serializedData.push( key + index + '=' + encodeURIComponent( value ) );
            });
        });

        return serializedData.join( '&' );
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
            self.$el.css({
                left: self.model.get( 'x' ),
                top:  self.model.get( 'y' )
            });
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