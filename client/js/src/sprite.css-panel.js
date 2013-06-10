Sprite.View.CSSPanel = Backbone.View.extend({
    el: '.css-view-box',

    initialize: function() {
        this.cssScroll   = $( '.css-view-scroll' );
        this.cssInner    = $( '.css-view-inner' );
        this.cssDesc     = $( '.css-description' );
        this.workspace   = $( '.workspace' );
        this.cssBlurStop = false;
        this.sldCSSEl    = $( {} );

        $.browser.opera ?
            delete this.events[ 'keydown .css-element-field' ] :
            delete this.events[ 'keypress .css-element-field' ];
    },

    events: {
        'click .css-panel-state-left':  'setCSSPanelShortState',
        'click .css-panel-state-right': 'setCSSPanelDefaultState',
        'mousedown .css-element':       'onCSSElClick',
        'click .css-element-classname': 'createCSSField',
        'blur .css-element-field':      'onFieldBlur',
        'mouseenter .css-element':      'onElMouseEnter',
        'mouseleave .css-element':      'onElMouseLeave',
        'keypress .css-element-field':  'setNewElName',
        'keydown .css-element-field':   'setNewElName'
    },

    removeSelectedCSSEl: function() {
        var id = this.sldCSSEl.attr( 'data-id' ),
            elModel = Sprite.Collection.CanvasElements.get( id );

        Sprite.Collection.CanvasElements.remove( elModel );
        this.setCSSScrollPane();
    },

    onElMouseLeave: function( e ) {
        var el = $( e.currentTarget ), id = el.data( 'id' );
        el.removeClass( 'css-element-hover' );
        this.model.trigger( 'canvas_element_unhover', id );
    },

    onElMouseEnter: function( e ) {
        var el = $( e.currentTarget ), id = el.data( 'id');
        el.addClass( 'css-element-hover' );
        this.model.trigger( 'canvas_element_hover', id );
    },

    onFieldBlur: function( e ) {
        if ( !this.cssBlurStop ) {
            this.setCSSElClsName( e.currentTarget, null );
        }
    },

    setNewElName: function( e ) {
        if ( e.keyCode == 13 ) {
            var props = this.setCSSElClsName( e.currentTarget );
            this.changeCSSElClassName( props );
        } else if ( e.keyCode === 27 ) {
            this.setCSSElClsName( e.currentTarget, null );
        }

        e.stopPropagation();
    },

    createCSSField: function( e ) {
        var target = $( e.currentTarget ),
            title  = target.find( '.css-element-title' ),
            field  = $( '<input class="css-element-field">' );

        field.insertAfter( target );
        target.hide();
        field.val( title.text() ).focus();
    },

    setCSSElClsName: function( fieldNode, val ) {
        var field   = $( fieldNode ),
            cssEl   = field.closest( '.css-element' ),
            currVal = field.val(),
            target  = field.siblings( '.css-element-classname' ),
            name    = target.find( '.css-element-title' );

        target.show();
        this.cssBlurStop = true;
        field.remove();
        this.cssBlurStop = false;

        if ( val === undefined ) {
            name.text( currVal );
            return {
                val: currVal,
                modelId: cssEl.data( 'id' )
            };
        }
    },

    changeCSSElClassName: function( props ) {
        var elModel = Sprite.Collection.CanvasElements.get( props.modelId );
        elModel.set( 'name', props.val );
    },

    setCSSScrollHeight: function( h ) {
        this.cssScroll.height( h );
    },

    setCSSScrollPane: function() {
        this.cssScroll.jScrollPane({
            verticalGutter: 0,
            enableKeyboardNavigation: false
        });
    },

    setCSSPanelShortState: function() {
        this.$el.addClass( 'css-view-box-short' );
        this.workspace.addClass( 'workspace-short' );
        this.model.trigger( 'change_panel_state' );
        this.model.setDataToStorage( 'css_panel_state', 'short' );
        Sprite.Collection.CanvasElements.each( function( elModel ) {
            elModel.trigger( 'set_short_state' );
        });
        this.setCSSScrollPane();
    },

    setCSSPanelDefaultState: function() {
        this.$el.removeClass( 'css-view-box-short' );
        this.workspace.removeClass( 'workspace-short' );
        this.model.trigger( 'change_panel_state' );
        this.model.setDataToStorage( 'css_panel_state', 'default' );
        Sprite.Collection.CanvasElements.each( function( elModel ) {
            elModel.trigger( 'set_default_state' );
        });
        this.setCSSScrollPane();
    },

    onCSSElClick: function( e ) {
        var el = $( e.currentTarget ), id = el.data( 'id' );
        
        this.sldCSSEl.removeClass( 'css-element-selected' );
        this.sldCSSEl = el.addClass( 'css-element-selected' );
        this.model.trigger( 'select_canvas_el', id );
    },

    selectEl: function( id ) {
        this.sldCSSEl.removeClass( 'css-element-selected' );
        this.sldCSSEl = this.cssInner.find( '.css-element[data-id="' + id + '"]' ).addClass( 'css-element-selected' );
    },

    setHoverStateToEl: function( id ) {
        this.cssInner.find( '.css-element[data-id="' + id + '"]' ).addClass( 'css-element-hover' );
    },

    setUnhoverStateToEl: function( id ) {
        this.cssInner.find( '.css-element[data-id="' + id + '"]' ).removeClass( 'css-element-hover' );
    },

    appendEl: function( el ) {
        this.cssInner.append( el );
    }
});