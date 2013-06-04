Sprite.View.Document = Backbone.View.extend({
    el: '.canvas-box',
    events: {
        'dragover':  'nullfunc',
        'dragenter': 'nullfunc',
        'dragexit':  'nullfunc',
        'drop':      'onDropfunc',
    },

    initialize: function() {
        var self = this;
        this.cacheObjects();

        this.$el.append( this.InnerCanvas.el );
        this.$el.append( this.OuterCanvas.el );

        this.setElStartPoint();
        this.setElParams( this.model.get( 'width' ), this.model.get( 'height' ) );
        this.bindEvents();

        this.InnerCanvas.render();
        this.OuterCanvas.render();
        this.Resize.render();

        this.setCSSScrollParams( 350, this.win.height() - this.cssDesc.height() );
        this.setCSSScrollPane();

        this.model.readElsInStorage( function( modelData ) {
            var src = 'server/cache/' + modelData.token + '.png';
            self.createImg( src, function( img ) {
                _( modelData ).extend({
                    fileEntity: img,
                    fileContent: img.src
                });
                self.createElement( modelData );
            });
        });

        this.model.readParamsInStorage( function( w, h ) {
            self.setElParams( w, h );
            self.InnerCanvas.setElParams( w, h ).render();
            self.OuterCanvas.setElParams( w, h ).render();
            self.Resize.setElParams( w, h );
        });
    },

    cacheObjects: function() {
        this.InnerCanvas  = new Sprite.View.CanvasInner({ model: new Sprite.Model.CanvasInner });
        this.OuterCanvas  = new Sprite.View.CanvasOuter({ model: new Sprite.Model.CanvasOuter });
        this.Resize       = new Sprite.View.Resize({ model: this.model });

        this.win          = $( window );
        this.doc          = $( document );
        this.body         = $( 'body' );
        this.canvasElZone = $( '.canvas-elements-zone' );
        this.cssScroll    = $( '.css-view-scroll' );
        this.cssInner     = $( '.css-view-inner' );
        this.cssDesc      = $( '.css-description' );
        this.wrapper      = $( '.wrapper' );
        this.panel        = $( '.panel' );
        this.sldCanvasEl  = $( {} );
        this.sldCSSEl     = $( {} );

        this.rect = {
            x: null, y: null, w: null, h: null, xmax: null, ymax: null
        };

        this.dragObj = {
            mouseOffset: { x: null, y: null },
            elModel: null
        };
    },

    bindEvents: function() {
        var self = this;

        this.model.on( 'resize:canvas-box', function( w, h ) {
            self.setElParams( w, h );
            self.InnerCanvas.setElParams( w, h ).render();
            self.OuterCanvas.setElParams( w, h ).render();
            self.model.setParamsInStorage( w, h );
        });

        this.win.on( 'resize', _.bind( this.onWinResize, this ) );

        this.bindPanelEvents( this );
        this.bindCssInnerEvents( this );
        this.bindCanvasElEvents( this );
    },

    bindPanelEvents: function( self ) {
        this.panel.on( 'change', '.btn-upload', function( e ) {
            self.onSelectFiles( e );
        });

        this.panel.on( 'click', '.btn-download', function() {
            Sprite.Collection.CanvasElements.createSprite( self.rect.w, self.rect.h );
        });

        this.panel.on( 'click', '.btn-new-doc', function() {
            self.createNewDoc();
        });
    },

    bindCssInnerEvents: function( self ) {
        this.cssInner.on( 'mousedown', '.css-element', function() {
            self.onCSSElClick( this );
        });

        this.cssInner.on( 'mouseenter', '.css-element', function() {
            var el = $( this ), id = el.data( 'id');
            el.addClass( 'css-element-hover' );
            self.canvasElZone.find( '.canvas-element[data-id="' + id + '"]' ).addClass( 'canvas-element-hover' );
        });

        this.cssInner.on( 'mouseleave', '.css-element', function() {
            var el = $( this ), id = el.data( 'id' );
            el.removeClass( 'css-element-hover' );
            self.canvasElZone.find( '.canvas-element[data-id="' + id + '"]' ).removeClass( 'canvas-element-hover' );
        });
    },

    bindCanvasElEvents: function( self ) {
        this.$el.on( 'mousedown', '.canvas-element', function( e ) {
            self.onCanvasElClick( this );
            self.dragEngine( self.sldCanvasEl, e );
        });

        this.$el.on( 'click', '.canvas-element', function() {
            self.onCanvasElClick( this );
        });

        this.$el.on( 'mouseenter', '.canvas-element', function() {
            var el = $( this ), id = el.data( 'id');
            el.addClass( 'canvas-element-hover' );
            self.cssInner.find( '.css-element[data-id="' + id + '"]' ).addClass( 'css-element-hover' );
        });

        this.$el.on( 'mouseleave', '.canvas-element', function() {
            var el = $( this ), id = el.data( 'id' );
            el.removeClass( 'canvas-element-hover' );
            self.cssInner.find( '.css-element[data-id="' + id + '"]' ).removeClass( 'css-element-hover' );
        });
    },

    onCSSElClick: function( el ) {
        var $el = $( el ), id = $el.data( 'id' );
        
        this.sldCSSEl.removeClass( 'css-element-selected' );
        this.sldCSSEl = $el.addClass( 'css-element-selected' );

        this.sldCanvasEl.removeClass( 'canvas-element-selected' );
        this.sldCanvasEl = this.$el.find( '.canvas-element[data-id="' + id + '"]' ).addClass( 'canvas-element-selected' );
    }, 

    onCanvasElClick: function( el ) {
        var $el = $( el ), id = $el.data( 'id' );

        this.sldCanvasEl.removeClass( 'canvas-element-selected' );
        this.sldCanvasEl = $el.addClass( 'canvas-element-selected' );

        this.sldCSSEl.removeClass( 'css-element-selected' );
        this.sldCSSEl = this.cssInner.find( '.css-element[data-id="' + id + '"]' ).addClass( 'css-element-selected' );
    },

    setElStartPoint: function() {
        var rect = this.$el.offset();

        this.rect.x = rect.left;
        this.rect.y = rect.top;
    },

    setElParams: function( w, h ) {
        this.el.style.width  = w + 'px';
        this.el.style.height = h + 'px';

        this.model.setRectParams.apply( this, [ w, h ] );
        this.model.set( 'rect', _( this.rect ).clone() );
    },

    dragEngine: function( el, e ) {
        var modelId = el.data( 'id' );

        this.dragObj.elModel = Sprite.Collection.CanvasElements.get( modelId ),
        this.dragObj.mouseOffset = {
            x: e.pageX - this.rect.x - this.dragObj.elModel.get( 'x' ),
            y: e.pageY - this.rect.y - this.dragObj.elModel.get( 'y' )
        };

        this.onDragStart();
        this.doc.mousemove( _.bind( this.onDragMove, this ) );
        this.doc.mouseup( _.bind( this.onDragEnd, this ) );
    },

    onDragMove: function( e ) {
        this.dragMove( e, this.dragObj.mouseOffset, this.dragObj.elModel );
    },

    dragMove: function( e, mouseOffset, elModel ) {
        var rect = this.rect,
            x = e.pageX - rect.x - mouseOffset.x,
            y = e.pageY - rect.y - mouseOffset.y;

        if ( x < 0 ) x = 0;
        if ( y < 0 ) y = 0;
        if ( x + elModel.get( 'w' ) > rect.w ) x = rect.w - elModel.get( 'w' );
        if ( y + elModel.get( 'h' ) > rect.h ) y = rect.h - elModel.get( 'h' );

        elModel.set( 'x', x );
        elModel.set( 'y', y );
        elModel.trigger( 'dragmove' );

        e.preventDefault();
        e.stopPropagation();
    },

    onDragStart: function() {
        this.body[ 0 ].style.cursor = 'move';
        this.body.addClass( 'drag' );
        document.ondragstart = function() { return false };
        document.body.onselectstart = function() { return false };
    },

    onDragEnd: function() {
        this.dragObj.elModel.saveCoordsToStorage();
        this.doc.off( 'mouseup mousemove' );
        this.body.css( 'cursor', 'auto' ).removeClass( 'drag' );
        document.ondragstart = null;
        document.body.onselectstart = null;
    },

    onWinResize: function() {
        this.setCSSScrollParams( 350, this.win.height() - this.cssDesc.height() );
        this.setCSSScrollPane();
    },

    setCSSScrollParams: function( w, h ) {
        this.cssScroll.css({
            width: w,
            height: h
        });        
    },

    setCSSScrollPane: function() {
        this.cssScroll.jScrollPane({
            verticalGutter: 0
        });
    },

    createImg: function( src, callback, error ) {        
        var img = new Image();
        img.onload = function() {
            callback && callback( img );
        };
        img.onerror = function() {
            error && error( img );
        };
        img.src = src;
    },

    createElement: function( modelParams ) {
        var self = this,
            canvasElModel = new Sprite.Model.CanvasElement( modelParams ),
            canvasElView  = new Sprite.View.CanvasElement( { model: canvasElModel } ),
            cssElView     = new Sprite.View.CSSElement( { model: canvasElModel } );

        Sprite.Collection.CanvasElements.add( canvasElModel );

        if ( canvasElModel.isEntityFile() ) {
            canvasElModel.readFile();
            canvasElModel.on( 'onloadFile', function() {
                self.onLoadFile( canvasElView, cssElView );
            });          
        } else {
            this.onLoadFile( canvasElView, cssElView );
        }
    },

    onLoadFile: function( canvasElView, cssElView ) {
        canvasElView.render();
        cssElView.render();

        this.canvasElZone.append( canvasElView.el );
        this.cssInner.append( cssElView.el );
        this.setCSSScrollPane();
    },

    nullfunc: function( e ) {
        e.preventDefault();
        e.stopPropagation();
    },

    createNewDoc: function() {
        var w = this.model.get( 'width' ),
            h = this.model.get( 'height' );

        this.model.clearLocalStorage();
        this.setElParams( w, h );
        this.InnerCanvas.setElParams( w, h ).render();
        this.OuterCanvas.setElParams( w, h ).render();
        this.Resize.setElParams( w, h );
        Sprite.Collection.CanvasElements.remove( Sprite.Collection.CanvasElements.toArray() );
        this.setCSSScrollPane();
    },

    onSelectFiles: function( e ) {
        var self = this;
        this.model.readFiles( e.target.files, 0, 0, function( modelParams ) {
            self.createElement( modelParams );
        });

        e.target.value = '';
    },

    onDropfunc: function( e ) {
        var files = e.originalEvent.dataTransfer.files,
            self  = this,
            xPos  = Math.floor( e.originalEvent.clientX - this.rect.x ),
            yPos  = Math.floor( e.originalEvent.clientY - this.rect.y );

        this.nullfunc( e );
        this.model.readFiles( files, xPos, yPos, function( modelParams ) {
            slef.createElement( modelParams );
        });        
    }
});