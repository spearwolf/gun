module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.initConfig({

        clean: [ "build/" ],

        browserify: {
            gun: {
                src: 'src/gun.js',
                dest: 'build/gun.js',
                options: {
                    bundleOptions: {
                        standalone: "gun"
                    },
                    transform: ['coffeeify']
                }
            }
        },

        uglify: {
            min: {
                //options: {
                //},
                files: {
                    'build/gun.min.js': [
                        'vendor/*.js',
                        'build/gun.js'
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
