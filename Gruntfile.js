/*global module:false*/
module.exports = function(grunt) {
  "use strict";
  //var _ = require('underscore');

  //grunt.loadNpmTasks('grunt-volo');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  var pkg = grunt.file.readJSON('package.json'),
    ext_files = [];
  Object.keys(pkg.dependencies).map(function (key) {
    ext_files.push('ext/'+key+'.js');
  });

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      files: ['grunt.js', 'dist/barebone.js']//, 'test/**/*.js']
    },
    qunit: {
      files: ['test/**/*.html']
    },
    concat: {
      dist: {
        src: /*ext_files*/([]).concat(['<banner:meta.banner>', 'src/header.js', 'src/core.js', 'src/model.js', 
          'src/sync_api.js', 'src/footer.js']),
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        },
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'qunit'
    },
    jshint: {
      options: {
        forin: true,
        eqeqeq: true,

        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        undef: true,
        eqnull: true,
        nonew: true,
        unused: true,
        trailing: true,
        boss: true,
        strict: true,
        expr: true, // a || (a = 1)

        browser: true,
        jquery: true
      },
      globals: {
        _: false,
        Backbone: false,
        jQuery: false
        //console: true
        //ActiveXObject: false,
        //viidea: true
      }
    },
    connect: {
      server: {
        options: {
          port: 8002,
          base: '.'
        }
      }
    }
  });

  grunt.registerTask("run", ["connect", "watch"]);

  grunt.registerTask("test", ["lint", "qunit"]);

  // Default task.
  grunt.registerTask("default", ["concat", "uglify", "lint", "qunit"]);

};
