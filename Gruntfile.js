module.exports = function( grunt ) {
    grunt.initConfig({
        concat: {
            js: {
                sprite: {
                    src: [
                        'js/src/sprite.canvas.js',
                        'js/src/sprite.document.js',
                        'js/src/sprite.resize.js',
                        'js/src/sprite.canvas-element.js',
                        'js/src/sprite.global.js',
                        'js/src/sprite.css-element.js',
                        'js/src/sprite.css-panel.js',
                        'js/src/sprite.test.js',
                        'js/src/sprite.js'
                    ],
                    dest: 'bundle/sprite.all.js'
                },
                libs: {
                    src: [
                        'js/libs/jquery-1.8.3.js',
                        'js/libs/underscore-1.4.4.js',
                        'js/libs/backbone-1.0.0.js',
                        'js/libs/scrollpane/jquery.jscrollpane.js',
                        'js/libs/scrollpane/jquery.mousewheel.js'
                    ],
                    dest: 'bundle/libs.all.js'
                }
            },
            css: {
                src: [
                    'css/fontello.css',
                    'css/jquery.jscrollpane.css',
                    'css/sprite.css'
                ],
                dest: 'bundle/sprite.all.css'
            }
        },

        uglify: {
            js: {
                src: '<%= concat.js.dest %>',
                dest: 'bundle/sprite.min.js'
            },
            css: {
                src: '<%= concat.css.dest %>',
                dest: 'bundle/sprite.min.css'
            }
        }
    });

    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );

    grunt.registerTask( 'default', [ 'concat', 'uglify' ] );
};