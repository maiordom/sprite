module.exports = function( grunt ) {
    grunt.initConfig({
        concat: {
            js: {
                src: [
                    'js/sprite.canvas.js',
                    'js/sprite.document.js',
                    'js/sprite.resize.js',
                    'js/sprite.canvas-element.js',
                    'js/sprite.global.js',
                    'js/sprite.css-element.js',
                    'js/sprite.test.js',
                    'js/sprite.js'
                ],
                dest: 'bundle/sprite.all.js'
            }
        },

        uglify: {
            js: {
                src: '<%= concat.js.dest %>',
                dest: 'bundle/sprite.min.js'
            }
        }
    });

    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );

    grunt.registerTask( 'default', [ 'concat', 'uglify' ] );
};