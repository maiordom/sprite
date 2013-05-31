Sprite.View.CSSElement = Backbone.View.extend({
    tagName: 'div',
    className: 'css-element',
    template: _.template( $( '#tmpl-css-element' ).html() ),

    initialize: function() {
        var self = this;
        this.model.on( 'dragmove', function() {
            var bgValue = self.model.get( 'x' ) + 'px ' + self.model.get( 'y' ) + 'px';
            self.bgValue.html( bgValue );
        });
    },

    render: function() {
        var dta = this.model.toJSON(),
            params = {};

        params.width  = dta.w + 'px';
        params.height = dta.h + 'px';
        params[ 'background-position' ] = dta.x + 'px ' + dta.y + 'px';
        dta[ 'id' ] = this.model.cid;
        dta[ 'props' ] = params;

        var tmpl = this.template( dta );
        this.el.innerHTML = tmpl;
        this.bgValue = this.$el.find( '.css-element-pair-background-position .css-element-value' );
        this.el.setAttribute( 'data-id', dta[ 'id' ] );
        return this;
    }
});

$( document ).ready( function() {
    Sprite.Collection.CanvasElements = new Sprite.Collection.CanvasElements();
    new Sprite.View.Document();
    new Sprite.View.Resize();
});