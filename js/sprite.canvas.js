Sprite.View.AbstractCanvas = Backbone.View.extend({
    createCanvas: function( clsName, w, h ) {
        var el, ctx;
        el = document.createElement( 'canvas' );
        el.className = clsName;
        ctx = el.getContext( '2d' );

        return {
            node: el,
            ctx: ctx
        }
    },

    setElParams: function( w, h ) {
        this.options.width  = w;
        this.options.height = h;
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

Sprite.View.CanvasOuter = Sprite.View.AbstractCanvas.extend({
    options: {    
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
    },

    initialize: function() {
        el = this.createCanvas( 'canvas-outer' );
        this.el = el.node;
        this.ctx = el.ctx;
    },

    render: function() {
        this.offset         = Math.max( this.options.rulers.width, this.options.grid.width );
        this.rest           = Math.abs( this.options.rulers.width - this.options.grid.width );
        this.el.style.top   = - this.offset + 'px';
        this.el.style.left  = - this.offset + 'px';
        this.options.width  = this.options.width  + this.offset;
        this.options.height = this.options.height + this.offset;

        this.setCanvasParams( this.options.width, this.options.height );
        this.renderGrid();
        this.renderRulers();
    },

    renderRulers: function() {
        var stepX = this.options.rulers.x,
            stepY = this.options.rulers.y,
            w     = this.options.rulers.width,
            h     = this.options.rulers.height;

        this.ctx.strokeStyle = this.options.rulers.lineColor;

        for ( var i = stepX + this.offset; i <= this.options.width;  i += stepX ) {
            this.drawLine( i - 0.5, 0, i - 0.5, h );
        }

        for ( var j = stepY + this.offset; j <= this.options.height; j += stepY ) {
            this.drawLine( 0, j - 0.5, w, j - 0.5 );
        }
    },

    renderGrid: function() {
        var stepX = this.options.grid.x,
            stepY = this.options.grid.y,
            w     = this.options.grid.width,
            h     = this.options.grid.height,
            rest  = this.rest;

        this.ctx.strokeStyle = this.options.grid.lineColor;

        for ( var i = stepX + this.offset; i <= this.options.width;  i += stepX ) {
            this.drawLine( i - 0.5, rest, i - 0.5, rest + h );
        }

        for ( var j = stepY + this.offset; j <= this.options.height; j += stepY ) {
            this.drawLine( rest, j - 0.5, rest + w, j - 0.5 );
        }
    }
});

Sprite.View.CanvasInner = Sprite.View.AbstractCanvas.extend({
    options: {
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
    },

    initialize: function() {
        var el   = this.createCanvas( 'canvas-inner' );
        this.el  = el.node;
        this.ctx = el.ctx;
    },

    render: function() {
        this.setCanvasParams( this.options.width, this.options.height );
        this.fillCanvas();
        this.renderGrid( this.options.grid );
        this.renderGrid( this.options.rulers );
        this.renderRulers();
    },

    fillCanvas: function() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.options.fillStyle;
        this.ctx.fillRect( 0, 0, this.options.width, this.options.height );
    },

    renderGrid: function( params ) {
        var stepX = params.x,
            stepY = params.y,
            w     = this.options.width,
            h     = this.options.height;

        this.ctx.strokeStyle = params.lineColor;

        for ( var i = stepX - 1; i < w; i += stepX ) {
            this.drawLine( i + 0.5, 0, i + 0.5, h );
        }

        for ( i = stepY - 1; i < h; i += stepY ) {
            this.drawLine( 0, i + 0.5, w, i + 0.5 );
        }
    },

    renderRulers: function() {
        var stepX      = this.options.rulers.x,
            stepY      = this.options.rulers.y,
            halfWidth  = Math.floor( this.options.rulers.crossing.width  / 2 ),
            halfHeight = Math.floor( this.options.rulers.crossing.height / 2 );

        this.ctx.strokeStyle = this.options.rulers.crossing.lineColor;

        for ( var i = stepX; i <= this.options.width;  i += stepX )
        for ( var j = stepY; j <= this.options.height; j += stepY ) {
            //crossing
            this.drawLine( i - halfWidth - 1, j - 0.5, i + halfWidth, j - 0.5 );
            this.drawLine( i - 0.5, j - halfHeight - 1, i - 0.5, j + halfHeight );

            //border
            this.drawLine( i - 0.5, 0, i - 0.5, halfHeight );
            this.drawLine( 0, j - 0.5, halfWidth, j - 0.5 );
        }
    }
});