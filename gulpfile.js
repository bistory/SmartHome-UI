'use strict';


// Nodes Modules
// =============================================================================

const gulp = require('gulp');
const del = require('del');
const prefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const jade = require('gulp-jade');
const sourceMaps = require('gulp-sourcemaps');
const angularTemplatecache = require('gulp-angular-templatecache');
const ngAnnotate = require('gulp-ng-annotate');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const rename = require('gulp-rename');
const rev = require('gulp-rev');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const usemin = require('gulp-usemin');
const webserver = require('gulp-webserver');

// Configuration
// =============================================================================

const srcPath = 'src';
const buildPath = 'build';

// Compilations
// =============================================================================

gulp.task('scss', () => {
  return gulp.src(srcPath + '/app.scss')
    .pipe(sass())
    .pipe(prefixer({
      browsers: ['> 1%'],
      cascade: true
    }))
    .pipe(gulp.dest(buildPath));
});

gulp.task('js', () => {
  return gulp.src([srcPath + '/*.js', srcPath + '/**/*.js'], {
      base: srcPath
    })
    .pipe(gulp.dest(buildPath));
});

gulp.task('jade', () => {
  return gulp.src([srcPath + '/modules/**/*.jade', srcPath + '/index.jade', srcPath + '/views/*.jade'], {
      base: srcPath
    })
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest(buildPath));
});

gulp.task('templatecache', ['jade'], () => {
  return gulp.src([
      buildPath + '/modules/**/*.html',
      buildPath + '/views/**/*.html'
    ])
    .pipe(htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeRedundantAttributes: true,
      removeTagWhitespace: true,
      removeComments: true
    }))
    .pipe(angularTemplatecache('templates.js', {
      module: 'soprismApp.templates',
      standalone: true,
      transformUrl: url => {
        //return url.substr(url.indexOf('modules/'));
        return 'views/' + url;
      }
    }))
    .pipe(gulp.dest(buildPath));
});


// Build:Icons - Build Icons font
// =============================================================================

gulp.task('build:icons', () => {
  return gulp.src(srcPath + '/icons/**/*.svg')
    .pipe(iconfont({
      fontName: 'Icons',
      formats: ['svg', 'ttf', 'eot', 'woff'],
      normalize: true,
      fontHeight: 100,
      prependUnicode: true
    }))
    .on('glyphs', function(glyphs) {
      var options = {
        glyphs: glyphs.map(function(glyph) {
          // this line is needed because gulp-iconfont has changed the api from 2.0
          return { name: glyph.name, codepoint: glyph.unicode[0].charCodeAt(0) }
        }),
        fontName: 'Icons',
        fontPath: '../fonts/', // set path to font (from your CSS file if relative)
        prefix: 'icon-' // set class name in your CSS
      };
      gulp.src(srcPath + '/sass/templates/icons.scss.tpl')
        .pipe(consolidate('lodash', options))
        .pipe(rename('icons.scss'))
        .pipe(gulp.dest(srcPath + '/scss/components'));
    })
    .pipe(gulp.dest(srcPath + '/assets/fonts/Icons'));
});

gulp.task('build', ['clean', 'js', 'scss', 'templatecache', 'copy'], () => {
  return gulp.src(buildPath + '/index.html')
    .pipe(usemin({
      css: [
        () => {
          return cssnano({
            zindex: false
          });
        },
        rev
      ],
      js: [
        uglify,
        rev
      ],
      jsApp: [
        ngAnnotate,
        uglify,
        rev
      ],
      html: [
        htmlmin({
          collapseWhitespace: true,
          conservativeCollapse: true,
          removeRedundantAttributes: true,
          removeTagWhitespace: true,
          removeComments: true
        })
      ]
    }))
    .pipe(gulp.dest(buildPath));
});

gulp.task('copy', ['templatecache'], () => {
  return gulp.src([
      srcPath + '/bower_components/**/*',
      srcPath + '/assets/**/*',
      srcPath + '/static/**/*'
    ], {
      base: srcPath
    })
    .pipe(gulp.dest(buildPath));
});

gulp.task('clean', () => {
  return del([buildPath + '/**/*']);
});

gulp.task('watch', ['build'], () => {
  //gulp.watch([srcPath + '/app.scss', srcPath + '/modules/**/*.scss', srcPath + '/**/*.scss'], ['scss']);
  //gulp.watch(srcPath + '/**/*.jade', ['templatecache']);
  gulp.watch([srcPath + '/app.scss', srcPath + '/modules/**/*.scss', srcPath + '/**/*.scss', srcPath + '/**/*.jade'], ['build']);
});

gulp.task('webserver', ['watch'], () => {
  return gulp.src(buildPath).pipe(webserver({
    livereload: {
      enable: true,
      filter: filename => {
        if (filename.match(/node_modules/)) {
          return false;
        } else if (filename.match(/(\.js|\.scss|\.jade)$/)) {
          return false;
        } else {
          return true;
        }
      }
    },
    open: true
  }));
});
