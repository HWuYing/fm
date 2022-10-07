const gulp = require('gulp');
const { buildPackage } = require('./script/build-source');

const packages = ['di', 'shared', 'dynamic-builder', 'csr', 'ssr', 'server'];
// const packages = ['di','shared', 'csr', 'ssr', 'server'];
// const packages = ['dynamic-builder'];

const tasks = [];
buildPackage(packages).forEach(([taskName, gulpItem]) => {
  tasks.push(taskName);
  gulp.task(taskName, gulpItem);
});

gulp.task('default', gulp.series(tasks));