Sprite.View.Resize = Backbone.View.extend({
    el: '.canvas-resize',
    options: {
        minHeight: 50,
        minWidth: 50    
    },
    events: {
        'mousedown': 'dragEngine',
        'mouseenter': 'showParams',
        'mouseleave': 'hideParams'
    },

    initialize: function() {
        this.$el.show();
        this.cacheObjects();
        this.fakeParams.text( this.rect.w + 'x' + this.rect.h );

        this.fakeBox.css({
            width: this.rect.w,
            height: this.rect.h
        });
    },

    cacheObjects: function() {
        this.doc        = $( document );
        this.body       = $( 'body' );
        this.fakeBox    = $( '.canvas-fake-box' );
        this.fakeBorder = $( '.canvas-fake-border' );
        this.fakeParams = $( '.canvas-fake-params' );
        this.isDragged  = false;
        this.isHover    = false;
        this.rect       = Sprite.Global.get( 'rect' );
        this.rect       = _( this.rect ).clone();
    },

    showParams: function() {
        this.isHover = true;
        this.fakeParams.show();
    },

    hideParams: function() {
        this.isHover = false;
        if ( !this.isDragged ) {
            this.fakeParams.hide();
        }
    },

    dragEngine: function( e ) {
        var rect = this.rect, self = this;

        this.isDragged = true;
        this.mouseOffset = {
            x: e.pageX - rect.xmax,
            y: e.pageY - rect.ymax
        };

        this.onDragStart();
        this.doc.mouseup( _.bind( this.onDragEnd, this ) );
        this.doc.mousemove( function( e ) {
            self.dragMove( e, self.mouseOffset );
        });
    },

    dragMove: function( e, mouseOffset ) {
        var rect = this.rect,
            x = e.pageX - rect.x - mouseOffset.x,
            y = e.pageY - rect.y - mouseOffset.y;

        if ( x < this.options.minWidth  ) x = this.options.minWidth;
        if ( y < this.options.minHeight ) y = this.options.minHeight;

        this.rect.xmax = this.rect.x + x;
        this.rect.ymax = this.rect.y + y;
        this.rect.w    = x;
        this.rect.h    = y;

        this.fakeBox[ 0 ].style.width  = x + 'px';
        this.fakeBox[ 0 ].style.height = y + 'px';
        this.fakeParams.text( x + 'x' + y );

        e.preventDefault();
        e.stopPropagation();
    },

    onDragStart: function() {
        this.fakeBox.addClass( 'canvas-fake-active' );
        this.fakeBorder.show();
        this.body[ 0 ].style.cursor = 'nw-resize';
        document.ondragstart = function() { return false };
        document.body.onselectstart = function() { return false };
    },

    onDragEnd: function() {
        !this.isHover ? this.fakeParams.hide() : null;
        this.fakeBox.removeClass( 'canvas-fake-active' );
        this.fakeBorder.hide();
        this.isDragged = false;
        this.body[ 0 ].style.cursor = 'auto';
        this.doc.off( 'mouseup mousemove' );
        document.ondragstart = null;
        document.body.onselectstart = null;
        Sprite.Global.trigger( 'resize:canvas-box', this.rect.w, this.rect.h );
    }
});