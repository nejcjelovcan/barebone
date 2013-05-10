/*global module:false*/
module.exports = function(grunt) {
  "use strict";

  grunt.loadNpmTasks('grunt-volo');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
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
        src: ['<banner:meta.banner>', 'src/header.js', 'src/core.js', '<file_strip_banner:src/model.js>', 'src/footer.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
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
    uglify: {},
    server: {
      port: 8002,
      base: '.'
    }
  });

  grunt.registerTask("run", "server watch");

  grunt.registerTask("test", "link qunit");

  // Default task.
  grunt.registerTask("default", "concat min lint qunit");

};
