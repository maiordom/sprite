Sprite.View.AbstractCanvas = Backbone.View.extend({
    createCanvas: function( clsName, w, h ) {
        var el, ctx;
        el = document.createElement( 'canvas' );
        el.className = clsName;
        ctx = el.getContext( '2d' );

        return {
            node: el,
            ctx: ctx
        };
    },

    setElParams: function( w, h ) {
        this.model.set( 'width', w );
        this.model.set( 'height', h );
        return this;
    },

    setCanvasParams: function( w, h ) {
        this.el.setAttribute( 'width',  w );
        this.el.setAttribute( 'height', h );
    },

    drawLine: function( fromX, fromY, toX, toY ) {
        var ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo( fromX, fromY );
        ctx.lineTo( toX, toY );
        ctx.stroke();
    }
});

Sprite.Model.CanvasOuter = Backbone.Model.extend({
    defaults: {
        offset: null,
        rest: null,
        widthWithOffset: null,
        heightWidthOffset: null,

        width: 400,
        height: 400,
        grid: {
            width: 5,
            height: 5,
            x: 5,
            y: 5,
            lineColor: 'rgba(185, 185, 185, 0.5)'
        },
        rulers: {
            width: 10,
            height: 10,
            x: 50,
            y: 50,
            lineColor: 'rgba(185, 185, 185, 0.8)'
        }
    }
});

Sprite.Model.CanvasInner = Backbone.Model.extend({
    defaults: {
        width: 400,
        height: 400,
        fillStyle: '#fff',
        rulersCrossing: {
            width: 5,
            height: 5,
            lineColor: 'rgba(185, 185, 185, 1)',
        },
        rulers: {
            x: 50,
            y: 50,
            lineColor: 'rgba(185, 185, 185, .1)',
            crossing: {
                width: 5,
                height: 5,
                lineColor: 'rgba(185, 185, 185, 1)'
            }
        },
        grid: {
            x: 5,
            y: 5,
            lineColor: 'rgba(185, 185, 185, .1)'
        }
    }
});

Sprite.View.CanvasOuter = Sprite.View.AbstractCanvas.extend({
    initialize: function() {
        var el   = this.createCanvas( 'canvas-outer' );
        this.el  = el.node;
        this.ctx = el.ctx;
    },

    render: function() {
        var o = this.model.toJSON();

        o.offset           = Math.max( o.rulers.width, o.grid.width );
        o.rest             = Math.abs( o.rulers.width - o.grid.width );
        this.el.style.top  = - o.offset + 'px';
        this.el.style.left = - o.offset + 'px';
        o.widthWithOffset  = o.width  + o.offset;
        o.heightWithOffset = o.height + o.offset;

        this.model.set( o );
        this.setCanvasParams( o.widthWithOffset, o.heightWithOffset );
        this.renderGrid();
        this.renderRulers();
    },

    renderRulers: function() {
        var o     = this.model.toJSON(),
            stepX = o.rulers.x,
            stepY = o.rulers.y,
            w     = o.rulers.width,
            h     = o.rulers.height;

        this.ctx.strokeStyle = o.rulers.lineColor;

        for ( var i = stepX + o.offset; i <= o.widthWithOffset;  i += stepX ) {
            this.drawLine( i - 0.5, 0, i - 0.5, h );
        }

        for ( var j = stepY + o.offset; j <= o.heightWithOffset; j += stepY ) {
            this.drawLine( 0, j - 0.5, w, j - 0.5 );
        }
    },

    renderGrid: function() {
        var o     = this.model.toJSON(),
            stepX = o.grid.x,
            stepY = o.grid.y,
            w     = o.grid.width,
            h     = o.grid.height,
            rest  = o.rest;

        this.ctx.strokeStyle = o.grid.lineColor;

        for ( var i = stepX + o.offset; i <= o.widthWithOffset;  i += stepX ) {
            this.drawLine( i - 0.5, rest, i - 0.5, rest + h );
        }

        for ( var j = stepY + o.offset; j <= o.heightWithOffset; j += stepY ) {
            this.drawLine( rest, j - 0.5, rest + w, j - 0.5 );
        }
    }
});

Sprite.View.CanvasInner = Sprite.View.AbstractCanvas.extend({
    initialize: function() {
        var el   = this.createCanvas( 'canvas-inner' );
        this.el  = el.node;
        this.ctx = el.ctx;
    },

    render: function() {
        var o = this.model.toJSON();
        this.setCanvasParams( o.width, o.height );
        this.fillCanvas();
        this.renderGrid( o.grid );
        this.renderGrid( o.rulers );
        this.renderRulers();
    },

    fillCanvas: function() {
        var o = this.model.toJSON();
        this.ctx.beginPath();
        this.ctx.fillStyle = o.fillStyle;
        this.ctx.fillRect( 0, 0, o.width, o.height );
    },

    renderGrid: function( params ) {
        var o     = this.model.toJSON(),
            stepX = params.x,
            stepY = params.y,
            w     = o.width,
            h     = o.height;

        this.ctx.strokeStyle = params.lineColor;

        for ( var i = stepX - 1; i < w; i += stepX ) {
            this.drawLine( i + 0.5, 0, i + 0.5, h );
        }

        for ( i = stepY - 1; i < h; i += stepY ) {
            this.drawLine( 0, i + 0.5, w, i + 0.5 );
        }
    },

    renderRulers: function() {
        var o          = this.model.toJSON(),
            stepX      = o.rulers.x,
            stepY      = o.rulers.y,
            halfWidth  = Math.floor( o.rulers.crossing.width  / 2 ),
            halfHeight = Math.floor( o.rulers.crossing.height / 2 );

        this.ctx.strokeStyle = o.rulers.crossing.lineColor;

        for ( var i = stepX; i <= o.width;  i += stepX )
        for ( var j = stepY; j <= o.height; j += stepY ) {
            //crossing
            this.drawLine( i - halfWidth - 1, j - 0.5, i + halfWidth, j - 0.5 );
            this.drawLine( i - 0.5, j - halfHeight - 1, i - 0.5, j + halfHeight );

            //border
            this.drawLine( i - 0.5, 0, i - 0.5, halfHeight );
            this.drawLine( 0, j - 0.5, halfWidth, j - 0.5 );
        }
    }
});