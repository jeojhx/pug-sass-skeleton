'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');
const stripJsonComments = require('gulp-strip-json-comments');
const notify = require('gulp-notify');
const pug = require('gulp-pug');
const data = require('gulp-data');
const cssmin = require('gulp-cssmin');
const imagemin = require('gulp-imagemin');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const connect = require('gulp-connect');
var path = require('path');
var fs = require('fs');



// Source folder configuration
const SRC_DIR = {};
SRC_DIR.root = './src/';
SRC_DIR.assets = SRC_DIR.root + 'assets/';
SRC_DIR.img = SRC_DIR.root + 'images/';
SRC_DIR.js = SRC_DIR.root + 'js/';
SRC_DIR.sass = SRC_DIR.root + 'sass/';
SRC_DIR.pug = SRC_DIR.root + 'pug/';
SRC_DIR.data = SRC_DIR.root +'data/';

// Source file matchers, using respective directories
const SRC_FILES = {
    sass: [SRC_DIR.sass + '*.scss', SRC_DIR.sass + '*.sass'],
    pugTemplates: SRC_DIR.pug + 'templates/*.pug',
    pugData: SRC_DIR.data+'**/*.json',
    pug: SRC_DIR.pug + '*.pug',
    js: SRC_DIR.js + '**/*.js',
    images: SRC_DIR.img + '**/*',
    assets: SRC_DIR.assets + '**/*'
};

// Output directories
const PUB_DIR = {};
PUB_DIR.root = './public/';
PUB_DIR.js = PUB_DIR.root + 'js/';
PUB_DIR.css = PUB_DIR.root + 'css/';
PUB_DIR.cssFiles = PUB_DIR.root + 'css/style.css';
PUB_DIR.fnt = PUB_DIR.root + 'fonts/';
PUB_DIR.img = PUB_DIR.root + 'images/';


// TASKS

gulp.task('watch', () => {
    gulp.watch(SRC_FILES.sass, ['sass']);
    gulp.watch([SRC_FILES.pugData, SRC_FILES.pug, SRC_FILES.pugTemplates], ['pug']);
    gulp.watch(SRC_FILES.images, ['imagemin']);
    gulp.watch(SRC_FILES.assets.onlyCopy, ['copyAssets']);
});

gulp.task('jsmin', () =>
    gulp.src(SRC_FILES.js)
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(PUB_DIR.js))
    .pipe(connect.reload())
);

gulp.task('sass', () =>
    gulp.src(SRC_FILES.sass)
    .pipe(sass().on('error', err => console.log(err)))
    .pipe(gulp.dest(PUB_DIR.css))
    .pipe(cssmin())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(PUB_DIR.css))
    .pipe(connect.reload())
);

gulp.task('pug', () =>
    gulp.src(SRC_FILES.pug)
    .pipe(plumber())
    .pipe(stripJsonComments())
    .pipe(data(function(file) {
        return JSON.parse(fs.readFileSync(SRC_DIR.data + path.basename(file.path) + '.json'));
    }))
    .pipe(pug({
        //pretty: true // Comment this to get minified HTML
    }))
    .pipe(gulp.dest(file => {
        var pugIndex = file.base.lastIndexOf('pug');
        var relPath = file.base.substr(pugIndex + 4);
        return PUB_DIR.root + relPath;
    }))
    .pipe(notify("HTML renderizado"))
    .pipe(connect.reload())
);

gulp.task('imagemin', () =>
    gulp.src(SRC_FILES.images)
    .pipe(plumber())
    .pipe(imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
            plugins: [
                { removeViewBox: true },
                { cleanupIDs: false }
            ]
        })
    ]))
    .pipe(gulp.dest(PUB_DIR.img))
    .pipe(notify("Imagenes comprimidas"))
    .pipe(connect.reload())
);

gulp.task('copyAssets', () =>
    gulp.src(SRC_FILES.assets)
    .pipe(gulp.dest(PUB_DIR.root))
    .pipe(notify("Assets copiados"))
    .pipe(connect.reload())
);

gulp.task('webserver', () =>
    connect.server({
        root: 'public',
        livereload: true,
        port: 8000,
        host: 'localhost'
    })
);

gulp.task('default', ['sass', 'pug', 'imagemin', 'jsmin', 'copyAssets']);
gulp.task('server', ['default', 'webserver', 'watch']);
