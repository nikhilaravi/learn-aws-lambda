//npm modules
var AWS         = require('aws-sdk');
var gulp        = require('gulp');
var zip         = require('gulp-zip');
var install     = require('gulp-install');
var runSequence = require('run-sequence');
var fs          = require('fs');

//local files
var testEvent   = require('./lambda-testing/tests/data.json') || {};
var packageJson = require('./package.json');

// constants
var region      = 'us-east-1';
var functionName = 'LambdaTest';
var outputName = functionName + '.zip';

var IAMRole = 'arn:aws:iam::685330956565:role/lambda_basic_execution';
var filesToPack = ['./lambda-testing/functions/LambdaTest.js'];

/**
 * Adds the project files to the archive folder.
 */
gulp.task('js', function () {
  return gulp.src(filesToPack)
    .pipe(gulp.dest('dist/'));
});

/**
 * This task will copy all the required dependencies to
 * the dist folder.
 */
gulp.task('node-mods', function () {
  return gulp.src('./package.json')
    .pipe(gulp.dest('dist/'))
    .pipe(install({production: true}));
});

/**
 * Create an archive based on the dest folder.
 */
gulp.task('zip', function () {
  return gulp.src(['dist/**/**'], {base: 'dist'})
    .pipe(zip(outputName))
    .pipe(gulp.dest('./'));
});

/**
 *  update or create the lambda functon
 */
gulp.task('upload', function() {
  AWS.config.region = region;
  var lambda = new AWS.Lambda();
  var zipFile = './' + outputName;

  lambda.getFunction({ FunctionName: functionName }, function(err, data) {
    if (err) createFunction();
    else updateFunction();
  });

  function createFunction () {

    getZipFile(function (data) {
      var params = {
        Code: {
          ZipFile: data
        },
        FunctionName: functionName,
        Handler: 'LambdaTest.handler',
        Role: IAMRole,
        Runtime: 'nodejs'
      };

      lambda.createFunction (params, function (err, data) {
        console.log("CREATE CALLED");
        if (err) console.error(err);
        else console.log('Function ' + functionName + ' has been created.');
      });
    });

  }

  function updateFunction () {
    getZipFile(function (data) {

      var params = {
        FunctionName: functionName,
        ZipFile: data
      };

      lambda.updateFunctionCode(params, function(err, data) {
        console.log("UPDATE CALLED");
        if (err) console.log("FUNCTION NOT UPDATED", err);
        else console.log('Function ' + functionName + ' has been updated.');
      });
    });
  }

  function getZipFile (next) {
    fs.readFile(zipFile, function (err, data) {
          if (err) console.log(err);
          else {
            next(data);
          }
    });
  }

});

gulp.task('test-invoke', function() {
  var lambda = new AWS.Lambda();

  var params = {
    FunctionName: functionName,
    InvocationType: 'Event',
    LogType: 'Tail',
    Payload: JSON.stringify(testEvent)
  };

  lambda.getFunction({ FunctionName: functionName }, function(err, data) {
    if (err) console.log("FUNCTION NOT FOUND", err);
    else invokeFunction();
  });

  function invokeFunction() {
    lambda.invoke(params, function(err, data) {
      if (err) console.log(err, err.stack);
      else console.log(data);
    })
  }
})

gulp.task('deploy', function (callback) {
  return runSequence(
    ['js', 'node-mods'],
    ['zip'],
    ['upload'],
    callback
  );
});
