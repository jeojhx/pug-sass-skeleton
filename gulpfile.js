'use strict';
//gulp and utils libraries
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const addsrc = require('gulp-add-src');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

const path = require('path');
const fs = require('fs');
const del = require("del");

//Sass compiler and minified css libs
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');

//Pug Templates compiler libs
const pug = require('gulp-pug');
const data = require('gulp-data');

//Concat and minfied mangle JS Libs
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');

//Images compression Libs
const imagemin = require('gulp-imagemin');
const imageminGifsicle = require("imagemin-gifsicle");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminOptipng = require("imagemin-optipng");
const imageminSvgo = require("imagemin-svgo");

//Server
const browserSync = require('browser-sync').create();

// Source folder configuration
const SRC_DIR = {};
SRC_DIR.root = './src/';
SRC_DIR.assets = SRC_DIR.root + 'assets/';
SRC_DIR.img = SRC_DIR.root + 'images/';
SRC_DIR.js = SRC_DIR.root + 'js/';
SRC_DIR.sass = SRC_DIR.root + 'sass/';
SRC_DIR.pug = SRC_DIR.root + 'pug/';
SRC_DIR.data = SRC_DIR.root + 'data/';

// Source file matchers, using respective directories
const SRC_FILES = {
    sass: SRC_DIR.sass + '*.scss',
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

//*****************TASKS*****************

//Adding Bootstrap Framework
//Sass compiler
gulp.task('sass', () =>
    gulp.src([
        'node_modules/bootstrap/scss/bootstrap.scss',
        SRC_FILES.sass
    ])
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', err => console.log(err)))
    .pipe(autoprefixer())
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('source-maps'))
    .pipe(gulp.dest(PUB_DIR.css))
    .pipe(notify("SASS and CSS finished"))
);

//Adding Bootstrap and JQuery
// JS minified
gulp.task('jsmin', () =>
    gulp.src('node_modules/jquery/dist/jquery.slim.js')
    .pipe(addsrc.append('node_modules/@popperjs/core/dist/umd/popper.js'))
    .pipe(addsrc.append('node_modules/bootstrap/dist/js/bootstrap.js'))
    .pipe(addsrc.append(SRC_FILES.js))
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets: ['@babel/preset-env']
    }))
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('source-maps'))
    .pipe(gulp.dest(PUB_DIR.js))
    .pipe(notify("Js finished"))
);

//Html render, pug files
gulp.task('pug', () =>
    gulp.src(SRC_FILES.pug)
    .pipe(plumber())
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
    .pipe(notify("HTML finished"))
);

//Image compression
gulp.task('imagemin', () =>
    gulp.src(SRC_FILES.images)
    .pipe(plumber())
    .pipe(imagemin([
        imageminGifsicle({interlaced: true}),
        imageminJpegtran({ quality: 75, progressive: true }),
        imageminOptipng({ optimizationLevel: 5 }),
        imageminSvgo({
            plugins: [
                { removeViewBox: true },
                { cleanupIDs: false }
            ]
        })
    ]))
    .pipe(gulp.dest(PUB_DIR.img))
    .pipe(notify("Iamges finished"))
);

// Copy Assets to public folder
gulp.task('copyAssets', () =>
    gulp.src(SRC_FILES.assets)
    .pipe(gulp.dest(PUB_DIR.root))
    .pipe(notify("Copied assets"))
);

// Server
gulp.task('webserver', () =>{
    //initialize browsersync
    browserSync.init({
        server: {
            baseDir: './public'
        }
    })
    gulp.watch(['./public/*.*','./public/**/*.*']).on('change', browserSync.reload)
});

// Watch Task
gulp.task('watch', () => {
    gulp.watch(SRC_FILES.sass, gulp.series('sass'));
    gulp.watch(SRC_FILES.js, gulp.series('jsmin'));
    gulp.watch(SRC_FILES.images, gulp.series('imagemin'));
    gulp.watch(SRC_FILES.assets, gulp.series('copyAssets'));
    gulp.watch([SRC_FILES.pugData, SRC_FILES.pug, SRC_FILES.pugTemplates], gulp.series('pug'));
});

// Remove existing docs in public folder
gulp.task('clean', del.bind(null, ['./public']));

gulp.task('default', gulp.series('clean','sass', 'jsmin', 'copyAssets', 'pug','imagemin'));
gulp.task('server', gulp.parallel('webserver', 'watch' ));
gulp.task('dev', gulp.series('clean', 'default', 'server'));
