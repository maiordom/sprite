Sprite.View.Resize = Backbone.View.extend({
    el: '.canvas-resize',
    events: {
        'mousedown': 'dragEngine'
    },

    initialize: function() {
        this.$el.show();
        this.doc  = $( document );
        this.body = $( 'body' );
        this.fakeBox = $( '.canvas-box-fake' );
        this.rect = Sprite.Global.get( 'rect' );
        this.rect = _( this.rect ).clone();
        this.fakeBox.css({
            width: this.rect.w,
            height: this.rect.h
        });
    },

    dragEngine: function( e ) {
        var rect = this.rect, self = this;

        this.mouseOffset = {
            x: e.pageX - rect.xmax,
            y: e.pageY - rect.ymax
        };

        this.fakeBox.show();
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

        if ( x < 0 ) x = 0;
        if ( y < 0 ) y = 0;

        this.rect.xmax = this.rect.x + x;
        this.rect.ymax = this.rect.y + y;
        this.rect.w = x;
        this.rect.h = y;

        this.fakeBox[ 0 ].style.width  = x + 'px';
        this.fakeBox[ 0 ].style.height = y + 'px';

        e.preventDefault();
        e.stopPropagation();
    },

    onDragStart: function() {
        this.body[ 0 ].style.cursor = 'nw-resize';
        document.ondragstart = function() { return false };
        document.body.onselectstart = function() { return false };
    },

    onDragEnd: function() {
        this.body[ 0 ].style.cursor = 'auto';
        this.fakeBox.hide();
        this.doc.off( 'mouseup mousemove' );
        document.ondragstart = null;
        document.body.onselectstart = null;
        Sprite.Global.trigger( 'resize:canvas-box', this.rect.w, this.rect.h );
    }
});