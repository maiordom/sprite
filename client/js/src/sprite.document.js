Sprite.View.Document = Backbone.View.extend({
    el: '.canvas-box',
    events: {
        'dragover':  'nullfunc',
        'dragenter': 'nullfunc',
        'dragexit':  'nullfunc',
        'drop':      'onDropfunc',
        'mousedown .canvas-element': 'dragEngine',
        'click .canvas-element': 'selectCanvasEl',
        'mouseenter .canvas-element': 'setHoverStateToEl',
        'mouseleave .canvas-element': 'setUnhoverStateToEl'
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

        this.CSSPanel.setCSSScrollHeight( this.win.height() - this.CSSPanel.cssDesc.height() );
        this.CSSPanel.setCSSScrollPane();
        this.readStorage();
    },

    readStorage: function() {
        var self = this, queue = [];

        if ( this.model.getDataFromStorage( 'css_panel_state' ) === 'short' ) {
            this.CSSPanel.setCSSPanelShortState();
        }

        this.model.readElsFromStorage( function( modelData ) {
            queue.push( self.createSpriteElHandler( modelData ) );
        });

        this.readQueue( queue, function() {
            var selectedSpriteElUuid = self.model.getDataFromStorage( 'selected_sprite_el' );

            Sprite.Collection.CanvasElements.find( function( elModel ) {
                if ( elModel.get( 'uuid' ) === selectedSpriteElUuid ) {
                    self.selectCanvasElById( elModel.cid );
                    self.CSSPanel.selectEl( elModel.cid );
                }
            });
        });

        this.model.getBoxSize( function( w, h ) {
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
        this.CSSPanel     = new Sprite.View.CSSPanel({ model: this.model });

        this.win          = $( window );
        this.doc          = $( document );
        this.body         = $( 'body' );
        this.workspace    = $( '.workspace' );
        this.canvasElZone = $( '.canvas-elements-zone' );
        this.wrapper      = $( '.wrapper' );
        this.panel        = $( '.panel' );
        this.sldCanvasEl  = $( {} );

        this.rect = {
            x: null, y: null, w: null, h: null, xmax: null, ymax: null
        };

        this.dragObj = {
            mouseOffset: { x: null, y: null },
            elModel: null
        };
    },

    bindEvents: function() {
        this.bindGlobalEvents( this );
        this.bindPanelEvents( this );
    },

    bindGlobalEvents: function( self ) {
        this.model.on( 'resize:canvas-box',      _.bind( this.resizeSpriteWorkspace, this ) );
        this.model.on( 'select_canvas_el',       _.bind( this.selectCanvasElById,    this ) );
        this.model.on( 'canvas_element_hover',   _.bind( this.hoverCanvasElById,     this ) );
        this.model.on( 'canvas_element_unhover', _.bind( this.unhoverCanvasElById,   this ) );
        this.model.on( 'change_panel_state',     _.bind( this.recalcRectParams,      this ) );

        this.win.on( 'resize', _.bind( this.onWinResize, this ) );

        $( document ).on ( $.browser.opera ? 'keypress' : 'keydown', function( e ) {
            self.listenKeypress( e );
        });
    },

    bindPanelEvents: function( self ) {
        this.panel.on( 'change', '.btn-upload',  _.bind( this.onSelectFiles, this ) );
        this.panel.on( 'click', '.btn-download', _.bind( this.getSprite,     this ) );
        this.panel.on( 'click', '.btn-new-doc',  _.bind( this.createNewDoc,  this ) );
    },

    getSprite: function() {
        Sprite.Collection.CanvasElements.createSprite( this.rect.w, this.rect.h );
    },

    recalcRectParams: function() {
        this.setElStartPoint();
        this.setElParams( this.model.get( 'rect' ).w, this.model.get( 'rect' ).h );
    },

    hoverCanvasElById: function( id ) {
        this.canvasElZone.find( '.canvas-element[data-id="' + id + '"]' ).addClass( 'canvas-element-hover' );
    },

    unhoverCanvasElById: function( id ) {
        this.canvasElZone.find( '.canvas-element[data-id="' + id + '"]' ).removeClass( 'canvas-element-hover' );
    },

    listenKeypress: function( e ) {
        if ( !this.sldCanvasEl.length ) {
            return;
        }

        switch ( e.keyCode ) {
            case 46: this.CSSPanel.removeSelectedCSSEl();    break;
            case 37: this.moveCanvasElByKeypress( -1, 0  );  break;
            case 38: this.moveCanvasElByKeypress(  0, -1  ); break;
            case 39: this.moveCanvasElByKeypress(  1, 0  );  break;
            case 40: this.moveCanvasElByKeypress(  0, 1 );   break;
        }
    },

    resizeSpriteWorkspace: function( w, h ) {
        this.setElParams( w, h );
        this.InnerCanvas.setElParams( w, h ).render();
        this.OuterCanvas.setElParams( w, h ).render();
        this.model.setDataToStorage({
            width: w,
            height: h
        });
    },

    selectCanvasElById: function( id ) {
        this.sldCanvasEl.removeClass( 'canvas-element-selected' );
        this.sldCanvasEl = this.$el.find( '.canvas-element[data-id="' + id + '"]' ).addClass( 'canvas-element-selected' );
        this.model.setDataToStorage({
            selected_sprite_el: Sprite.Collection.CanvasElements.get( id ).get( 'uuid' )
        });
    },

    selectCanvasEl: function( e ) {
        var $el = $( e.currentTarget ), id = $el.data( 'id' );

        this.sldCanvasEl.removeClass( 'canvas-element-selected' );
        this.sldCanvasEl = $el.addClass( 'canvas-element-selected' );
        this.CSSPanel.selectEl( id );
        this.model.setDataToStorage({
            selected_sprite_el: Sprite.Collection.CanvasElements.get( id ).get( 'uuid' )
        });
    },

    setHoverStateToEl: function( e ) {
        var el = $( e.currentTarget ), id = el.data( 'id');
        el.addClass( 'canvas-element-hover' );
        this.CSSPanel.setHoverStateToEl( id );
    },

    setUnhoverStateToEl: function( e ) {
        var el = $( e.currentTarget ), id = el.data( 'id' );
        el.removeClass( 'canvas-element-hover' );
        this.CSSPanel.setUnhoverStateToEl( id );
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

    moveCanvasElByKeypress: function( offsetX, offsetY ) {
        var id = this.sldCanvasEl.attr( 'data-id' ),
            elModel = Sprite.Collection.CanvasElements.get( id ),
            x = elModel.get( 'x' ),
            y = elModel.get( 'y' );

        x += offsetX;
        y += offsetY;
        this.moveCanvasEl( x, y, elModel, this.rect );
    },

    dragEngine: function( e ) {
        var id = $( e.currentTarget ).data( 'id' );

        this.selectCanvasEl( e );
        this.dragObj.elModel = Sprite.Collection.CanvasElements.get( id );
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
            x    = e.pageX - rect.x - mouseOffset.x,
            y    = e.pageY - rect.y - mouseOffset.y;

        this.moveCanvasEl( x, y, elModel, rect );
        this.nullfunc( e );
    },

    moveCanvasEl: function( x, y, elModel, rect ) {
        if ( x < 0 ) x = 0;
        if ( y < 0 ) y = 0;
        if ( x + elModel.get( 'w' ) > rect.w ) x = rect.w - elModel.get( 'w' );
        if ( y + elModel.get( 'h' ) > rect.h ) y = rect.h - elModel.get( 'h' );

        elModel.set( 'x', x );
        elModel.set( 'y', y );
        elModel.trigger( 'dragmove' );
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
        this.CSSPanel.setCSSScrollHeight( this.win.height() - this.CSSPanel.cssDesc.height() );
        this.CSSPanel.setCSSScrollPane();
    },

    createSpriteElHandler: function( modelParams ) {
        return function() {
            modelParams.index = Sprite.Collection.CanvasElements.length;

            var self = this,
                def  = $.Deferred(),
                canvasElModel = new Sprite.Model.CanvasElement( modelParams ),
                canvasElView  = new Sprite.View.CanvasElement( { model: canvasElModel } ),
                cssElView     = new Sprite.View.CSSElement( { model: canvasElModel } );

            Sprite.Collection.CanvasElements.add( canvasElModel );

            if ( canvasElModel.isEntityFile() ) {
                canvasElModel.readFile();
                canvasElModel.on( 'onUploadFileSuccess', function( json ) {
                    self.renderCanvasAndCSSEl( canvasElView, cssElView );
                    def.resolve();
                    console.log( json );
                });
                canvasElModel.on( 'onUploadFileError', function( json ) {
                    def.reject();
                    console.log( json );
                });
            } else {
                canvasElModel.loadFileFromStorage();
                this.renderCanvasAndCSSEl( canvasElView, cssElView );
                def.resolve();
            }

            return def.promise();
        }
    },

    renderCanvasAndCSSEl: function( canvasElView, cssElView ) {
        canvasElView.render();
        cssElView.render();

        this.canvasElZone.append( canvasElView.el );
        this.CSSPanel.appendEl( cssElView.el );

        if ( this.model.isCSSPanelStateShort() ) {
            cssElView.setShortState();
        }

        this.CSSPanel.setCSSScrollPane();
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
        this.CSSPanel.setCSSScrollPane();
    },

    onSelectFiles: function( e ) {
        var self = this, queue = [];
        this.model.readFiles( e.target.files, 0, 0, function( modelParams ) {
            queue.push( self.createSpriteElHandler( modelParams ) );
        }, this.onReadFileError );

        this.readQueue( queue );
        e.target.value = '';
    },

    onReadFileError: function( ans ) {
        console.log( ans );
    },

    readQueue: function( queue, callback ) {
        var self = this;

        if ( !queue.length ) {
            callback && callback();
            return false;
        }

        $.when( queue[ 0 ].apply( this ) ).always( function() {
            queue.splice( 0, 1 );
            self.readQueue( queue, callback );
        });
    },

    onDropfunc: function( e ) {
        var files = e.originalEvent.dataTransfer.files,
            queue = [],
            self  = this,
            xPos  = Math.floor( e.originalEvent.clientX - this.rect.x ),
            yPos  = Math.floor( e.originalEvent.clientY - this.rect.y );

        this.nullfunc( e );
        this.model.readFiles( files, xPos, yPos, function( modelParams ) {
            queue.push( self.createSpriteElHandler( modelParams ) );
        }, this.onReadFileError );

        this.readQueue( queue );
    }
});