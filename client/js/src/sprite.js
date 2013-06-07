$( document ).ready( function() {
    Sprite.Global = new Sprite.Global;
    Sprite.Collection.CanvasElements = new Sprite.Collection.CanvasElements();
    new Sprite.View.Document({ model: Sprite.Global });
});