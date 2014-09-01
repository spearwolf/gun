module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.initConfig({

        clean: [ "build/" ],

        browserify: {
            papa: {
                src: 'src/papa.js',
                dest: 'build/papa.js',
                options: {
                    bundleOptions: {
                        standalone: "papa"
                    },
                    transform: ['coffeeify']
                }
            }
        },

        uglify: {
            min: {
                files: {
                    'build/papa.min.js': [
                        'vendor/*.js',
                        'build/papa.js'
                    ]
                }
            }
        },

        copy: {
            build: {
                files: [
                    {
                        cwd: "build",
                        expand: true,
                        src: ['**/*.js'],
                        dest: "public/js/"
                    }
                ]
            }
        }

    });

    grunt.registerTask('build-scripts', ['browserify', 'uglify']);
    grunt.registerTask('build', ['build-scripts', 'copy']);
    grunt.registerTask('default', ['build']);
};
