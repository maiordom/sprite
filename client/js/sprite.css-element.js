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

        this.model.on( 'remove', function() {
            self.remove();
        });

        this.model.on( 'set_short_state', function() {
            self.setShortState();
        });

        this.model.on( 'set_default_state', function() {
            self.setDefaultState();
        });
    },

    setShortState: function() {
        this.$el.find( '.css-element-pair-width .css-element-key' ).text( 'w' );
        this.$el.find( '.css-element-pair-height .css-element-key' ).text( 'h' );
        this.$el.find( '.css-element-pair-background-position .css-element-key' ).text( 'bp' );
    },

    setDefaultState: function() {
        this.$el.find( '.css-element-pair-width .css-element-key' ).text( 'width' );
        this.$el.find( '.css-element-pair-height .css-element-key' ).text( 'height' );
        this.$el.find( '.css-element-pair-background-position .css-element-key' ).text( 'background-position' );
    },

    render: function() {
        var dta = this.model.toJSON(),
            params = {};

        params.width  = dta.w + 'px';
        params.height = dta.h + 'px';
        params[ 'background-position' ] = dta.x + 'px ' + dta.y + 'px';
        dta.id = this.model.cid;
        dta.props = params;

        var tmpl = this.template( dta );
        this.el.innerHTML = tmpl;
        this.bgValue = this.$el.find( '.css-element-pair-background-position .css-element-value' );
        this.el.setAttribute( 'data-id', dta.id );
        this.el.setAttribute( 'data-index', dta.index );
        return this;
    }
});