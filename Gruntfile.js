module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({

    //QUNIT
    qunit: {
      files: ['./test/qunit.html', './test/qunit.min.html']
    },

    //TYPESCRIPT
    ts: {
      default : {
        tsconfig: true
      }
    },

    //MINIFICATION
    uglify: {
      my_target: {
        files: {
          './dist/mathjax-parser.min.js': ['./dist/mathjax-parser.js']
        }
      }
    },

    //BUILDING ANGULAR SERVICE
    'template': {
      'process-html-template': {
        'options': {
          'data': {
            'parser': grunt.file.read('./dist/mathjax-parser.js')
          }
        },
        'files': {
          'dist/angular-mathjax-parser.js': ['./src/angular-mathjax-parser.js.tpl']
        }
      }
    }

  });

  // Load plugin
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-ts');

  // Task to run tests
  grunt.registerTask('test', 'qunit');
  grunt.registerTask('build', ['template', 'uglify']);

};