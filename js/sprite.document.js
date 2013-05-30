Sprite.View.Document = Backbone.View.extend({
    el: '.canvas-box',
    events: {
        'dragover':  'nullfunc',
        'dragenter': 'nullfunc',
        'dragexit':  'nullfunc',
        'drop':      'onDropfunc',
    },

    initialize: function() {
        this.cacheObjects();

        this.$el.append( this.InnerCanvas.el );
        this.$el.append( this.OuterCanvas.el );

        this.InnerCanvas.render();
        this.OuterCanvas.render();

        this.setCSSScrollParams( 350, this.win.height() - this.cssDesc.height() );
        this.setCSSScrollPane();

        this.setElStartPoint();
        this.setElParams( this.$el.width(), this.$el.height() );        
        this.bindEvents();
    },

    cacheObjects: function() {
        this.InnerCanvas  = new Sprite.View.CanvasInner();
        this.OuterCanvas  = new Sprite.View.CanvasOuter();
        this.win          = $( window );
        this.doc          = $( document );
        this.body         = $( 'body' );
        this.canvasElZone = $( '.canvas-elements-zone' );
        this.cssScroll    = $( '.css-view-scroll' );
        this.cssInner     = $( '.css-view-inner' );
        this.cssDesc      = $( '.css-description' );
        this.wrapper      = $( '.wrapper' );
        this.panel        = $( '.panel' );
        this.sldEl        = $( {} );

        this.rect = {
            x: null, y: null, w: null, h: null, xmax: null, ymax: null
        },
        this.dragObj = {
            mouseOffset: { x: null, y: null },
            elModel: null
        };
    },

    bindEvents: function() {
        var self = this;

        Sprite.Global.on( 'resize:canvas-box', function( w, h ) {
            self.setElParams( w, h );
            self.InnerCanvas.setElParams( w, h );
            self.OuterCanvas.setElParams( w, h );
            self.InnerCanvas.render();
            self.OuterCanvas.render();
        });

        this.win.on( 'resize', _.bind( this.onWinResize, this ) );

        this.panel.on( 'change', '.btn-upload', function( e ) {
            self.onSelectFiles( e );
        });

        this.panel.on( 'click', '.btn-download', function() {
        	Sprite.Collection.CanvasElements.createSprite( self.rect.w, self.rect.h );
        });

        this.$el.on( 'mousedown', '.canvas-element', function( e ) {
            self.sldEl.removeClass( 'canvas-element-selected' );
            self.sldEl = $( this ).addClass( 'canvas-element-selected' );
            self.dragEngine( self.sldEl, e );
        });

        this.$el.on( 'click', '.canvas-element', function() {
            self.sldEl.removeClass( 'canvas-element-selected' );
            self.sldEl = $( this ).toggleClass( 'canvas-element-selected' );
        });

        this.$el.on( 'mouseenter', '.canvas-element', function() {
            $( this ).addClass( 'canvas-element-hover' );
        });

        this.$el.on( 'mouseleave', '.canvas-element', function() {
            $( this ).removeClass( 'canvas-element-hover' );
        });
    },

    setElStartPoint: function() {
        var rect = this.$el.offset();

        this.rect = {
            x: rect.left,
            y: rect.top
        };
    },

    setElParams: function( w, h ) {
        this.rect.xmax = this.rect.x + w;
        this.rect.ymax = this.rect.y  + h;
        this.rect.w = w;
        this.rect.h = h;

        this.el.style.width  = w + 'px';
        this.el.style.height = h + 'px';

        Sprite.Global.set( 'rect', this.rect );
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

    createElement: function( modelParams ) {
        var self = this,
            canvasElModel = new Sprite.Model.CanvasElement( modelParams ),
            canvasElView  = new Sprite.View.CanvasElement( { model: canvasElModel } ),
            cssElView     = new Sprite.View.CSSElement( { model: canvasElModel } );

        Sprite.Collection.CanvasElements.add( canvasElModel );

        canvasElModel.on( 'onloadFile', function() {
            canvasElView.render();
            cssElView.render();

            self.canvasElZone.append( canvasElView.el );
            self.cssInner.append( cssElView.el );
            self.setCSSScrollPane();
        });
    },

    nullfunc: function( e ) {
        e.preventDefault();
        e.stopPropagation();
    },

    readFiles: function( files, x, y ) {
        var len = files.length, file, classname;

        for ( var i = 0; i < len; i++ ) {
            file = files[ i ];
            classname = file.name.split( '.' );
            classname.pop();
            classname = classname.join( '_' ).replace( / /, '-' );

            if ( classname.search( /^\d/ ) !== -1 ){
                classname = 'f-' + classname;
            }

            this.createElement({
                name: classname,
                fileEntity: file,
                x: x,
                y: y
            });
        }
    },

    onSelectFiles: function( e ) {
        this.readFiles( e.target.files, 0, 0 );
    },

    onDropfunc: function( e ) {
        var files = e.originalEvent.dataTransfer.files,
            $target = $( e.target ),
            xPos = Math.floor( e.originalEvent.clientX - $target.offset().left ),
            yPos = Math.floor( e.originalEvent.clientY - $target.offset().top );

        this.nullfunc( e );
        this.readFiles( files, xPos, yPos );        
    }
});