module.exports = function( grunt ) {
    grunt.initConfig({
        concat: {
            js_sprite: {
                src: [
                    'client/js/src/sprite.canvas.js',
                    'client/js/src/sprite.document.js',
                    'client/js/src/sprite.resize.js',
                    'client/js/src/sprite.canvas-element.js',
                    'client/js/src/sprite.global.js',
                    'client/js/src/sprite.css-element.js',
                    'client/js/src/sprite.css-panel.js',
                    'client/js/src/sprite.test.js',
                    'client/js/src/sprite.js'
                ],
                dest: 'client/bundle/sprite.all.js'
            }, 
            js_libs: {
                src: [
                    'client/js/libs/jquery-1.8.3.js',
                    'client/js/libs/underscore-1.4.4.js',
                    'client/js/libs/backbone-1.0.0.js',
                    'client/js/libs/scrollpane/jquery.jscrollpane.js',
                    'client/js/libs/scrollpane/jquery.mousewheel.js'
                ],
                dest: 'client/bundle/libs.all.js'
            },
            css: {
                src: [
                    'client/css/fontello.css',
                    'client/css/jquery.jscrollpane.css',
                    'client/css/sprite.css'
                ],
                dest: 'client/bundle/sprite.all.css'
            }
        },

        uglify: {
            js_sprite: {
                src: '<%= concat.js_sprite.dest %>',
                dest: 'client/bundle/sprite.min.js'
            },
            js_libs: {
                src: '<%= concat.js_libs.dest %>',
                dest: 'client/bundle/libs.min.js'
            }
        },

        cssmin: {
            minify: {
                src: '<%= concat.css.dest %>',
                dest: 'client/bundle/sprite.min.css'
            }
        }
    });

    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-contrib-cssmin' );

    grunt.registerTask( 'default', [ 'concat', 'uglify', 'cssmin' ] );
};