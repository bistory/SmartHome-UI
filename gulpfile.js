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


// Cache template files of AngularJS
// =============================================================================

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
        return 'views/' + url;
      }
    }))
    .pipe(gulp.dest(buildPath));
});


// Build and compress code
// =============================================================================

gulp.task('build', ['js', 'scss', 'templatecache', 'copy'], () => {
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


// Copy static files to the build folder
// =============================================================================

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
