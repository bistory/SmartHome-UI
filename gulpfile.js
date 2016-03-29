'use strict';


// Nodes Modules
// =============================================================================

const gulp = require('gulp');
const del = require('del');
const prefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const typescript = require('gulp-typescript');
const jade = require('gulp-jade');
const sourceMaps = require('gulp-sourcemaps');
const angularTemplatecache = require('gulp-angular-templatecache');
const ngAnnotate = require('gulp-ng-annotate');
const iconfont = require('gulp-iconfont');
const consolidate = require('gulp-consolidate');
const rev = require('gulp-rev');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const usemin = require('gulp-usemin');
const webserver = require('gulp-webserver');
const notify = require('gulp-notify');

// Configuration
// =============================================================================

const srcPath = 'src';
const buildPath = 'build';

// Compilations
// =============================================================================

gulp.task('sass', () => {
  return gulp.src('src/main/app.sass')
    .pipe(sass())
    .pipe(prefixer({
      browsers: ['> 1%', 'IE 8'],
      cascade: true
    }))
    .pipe(gulp.dest('build/dev'));
});

gulp.task('css', () => {
  return gulp.src('src/main/scss/main.scss')
    .pipe(sourceMaps.init())
    .pipe(sass())
    .pipe(prefixer({
      browsers: ['> 1%', 'IE 8'],
      cascade: true
    }))
    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest('build/dev/css'));
});

gulp.task('ts', () => {
  return gulp.src(['src/main/**/*.ts', '!src/main/_all.ts'], {
      base: 'src/main'
    })
    .pipe(typescript({
      target: 'ES5'
    }))
    .pipe(gulp.dest('build/dev'));
});

gulp.task('jade', () => {
  return gulp.src(['src/main/modules/**/*.jade', 'src/main/index.jade', 'src/main/views/*.jade'], {
      base: 'src/main'
    })
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('build/dev'));
});

gulp.task('templatecache', ['jade'], () => {
  return gulp.src([
      'build/dev/modules/**/*.html',
      'build/dev/views/**/*.html'
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
    .pipe(gulp.dest('build/dev'));
});


// Build:Icons - Build Icons font
// =============================================================================

gulp.task('build:icons', () => {
  return gulp.src('src/main/icons/**/*.svg')
    //.pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
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
      gulp.src('src/main/icons/**/*.svg')
        //.pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(consolidate('lodash', options))
        .pipe(rename('src/main/assets/fonts'))
        .pipe(gulp.dest('src/main/assets/fonts'));
    })
    .pipe(gulp.dest('build/dev/Icons'));
});

gulp.task('build:prod', ['clean:prod', 'sass', 'css', 'ts', 'templatecache', 'copy:prod'], () => {
  return gulp.src('build/dev/index.html')
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
        () => {
          return replace('http://localhost:8081', 'https://api-beta.soprism.com');
        },
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
    .pipe(gulp.dest('build/prod'));
});

gulp.task('copy:dev', () => {
  return gulp.src([
      'src/main/favicon.ico',
      'src/main/ie10-viewport-bug-workaround.js',
      'src/main/bower_components/**/*',
      'src/main/assets/**/*',
      'src/main/static/**/*'
    ], {
      base: 'src/main'
    })
    .pipe(gulp.dest('build/dev'));
});

gulp.task('copy:prod', ['templatecache'], () => {
  return gulp.src([
      'src/main/favicon.ico',
      'src/main/ie10-viewport-bug-workaround.js',
      'src/main/bower_components/**/*',
      'src/main/assets/**/*',
      'src/main/static/**/*'
    ], {
      base: 'src/main'
    })
    .pipe(gulp.dest('build/prod'));
});

gulp.task('clean:dev', () => {
  return del(['build/dev/**/*']);
});

gulp.task('clean:prod', () => {
  return del(['build/prod/**/*']);
});

gulp.task('watch', ['copy:dev', 'sass', 'css', 'ts', 'templatecache'], () => {
  gulp.watch('src/main/**/*.ts', ['ts']);
  gulp.watch(['src/main/app.sass', 'src/main/modules/**/*.sass', 'src/main/**/*.scss'], ['sass']);
  gulp.watch(['src/main/**/*.sass', 'src/main/**/*.scss'], ['css']);
  gulp.watch('src/main/**/*.jade', ['templatecache']);
});

gulp.task('webserver', ['watch'], () => {
  return gulp.src('build/dev').pipe(webserver({
    livereload: {
      enable: true,
      filter: filename => {
        if (filename.match(/node_modules/)) {
          return false;
        } else if (filename.match(/(\.ts|\.sass|\.jade)$/)) {
          return false;
        } else {
          return true;
        }
      }
    },
    open: true
  }));
});
