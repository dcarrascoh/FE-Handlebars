'use strict';

var gulp = require('gulp');
var path = require('path')
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var compass = require('gulp-compass');
var gutil = require('gutil');

// images
var imagemin = require('gulp-imagemin');

// js
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');

// static site
var assemble = require('assemble');
var app = assemble();

var paths = {
    src: 'src/',
    build: 'build/',
    images: 'src/images/**/*',
    pdf: 'src/pdf/*'
};

gulp.task('default', ['images', 'compass', 'js', 'pdf', 'assemble'], function() {

    browserSync.init({
        server: "./build"
    });

    gulp.watch(paths.src + 'scss/**/*.scss', ['compass']);
    gulp.watch(paths.src + 'js/**/*.js', ['js-watch']);
    gulp.watch(paths.images, ['images-watch']);
    gulp.watch(paths.src + 'views/**/*.hbs', ['assemble-watch']);

});

// create tasks that ensures the given task is complete before reloading

// js watch
gulp.task('js-watch', ['js'], browserSync.reload);

// html watch
gulp.task('assemble-watch', ['assemble'], browserSync.reload);

// images watch
gulp.task('images-watch', ['images'], browserSync.reload);

gulp.task('build', ['clean'], function() {
    gulp.run('default');
});

gulp.task('clean', function(cb) {
    var del = require('del');

    return del([paths.build + '**/*'], cb);
});

// Copy all static images
gulp.task('images', function() {
    return gulp.src(paths.images)
        .pipe(imagemin())
        .pipe(gulp.dest(paths.build + 'images'));
});

gulp.task('pdf', function() {
    return gulp.src(paths.pdf)
        .pipe(gulp.dest(paths.build+'pdf'));
});


gulp.task('compass', function() {
    return gulp.src(paths.src + 'scss/styles.scss')
        .pipe(compass({
            config_file: 'config.rb',
            css: process.env.PWD + '/' + paths.src + 'css',
            sass: process.env.PWD + '/' + paths.src + 'scss'
                //debug: true
        }))
        .pipe($.autoprefixer({
            browsers: ['last 8 versions', 'ie >= 9']
        }))
        .pipe(gulp.dest(paths.build + 'css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// Generate JS with browserify with source maps
gulp.task('js', function() {

    //gulp.src(paths.src + 'assets/js/libs/**/*.js').pipe(gulp.dest(paths.build + 'assets/js/libs'));
    gulp.src(paths.src + 'js/partials/**/*.js').pipe(gulp.dest(paths.build + 'js/partials'));
    //gulp.src(paths.src + 'assets/js/data/**/*').pipe(gulp.dest(paths.build + 'assets/js/data'));

    gulp.src(paths.src + 'js/main.js')
        .pipe(browserify({
            debug: false
        }))
        .on('error', function(err) {
            gutil.log('ERROR: ' + err.message);
            this.emit('end');
        })
        .pipe(uglify())
        //.pipe(rename('min.js'))
        .pipe(gulp.dest(paths.build + 'js'))
});

// Compress js
gulp.task('compressjs', ['js'], function() {
    gulp.src(paths.build + 'js/**/*.js')
        .pipe(uglify())
        .pipe(rename('min.js'))
        .pipe(gulp.dest(paths.build + 'js'))
});


// Assemble
app.helpers(paths.src+'helpers/**/*.js');


gulp.task('assemble', function(cb) {
    app.build(['views'], function(err) {
        if (err) return cb(err);
        console.log('Pages were build!');
        cb();
    });
});

app.task('views', function() {
    app.partials(paths.src+'views/partials/**/*.hbs');
    app.layouts(paths.src+'views/layouts/**/*.hbs');
    app.pages(paths.src+'views/pages/**/*.hbs');
    app.option('layout', paths.src+'views/layouts/default.hbs');
    app.option('page', paths.src+'views/pages/**/*.hbs');
    app.option('partial', paths.src+'views/partial/**/*.hbs');

    return app.toStream('pages')
        .pipe(app.toStream('partials'))
        .pipe(app.renderFile())
        .pipe(rename(function (path) {
            path.extname = ".html"
        }))
        .pipe(app.dest(paths.build))
        .pipe(browserSync.stream());
});

module.exports = app;



