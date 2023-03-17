const path = require('path');
const gulp = require('gulp');
const { buildPackage } = require('./script/build-source');

// const packages = ['di', 'shared', 'dynamic-builder', 'csr', 'ssr', 'server'];
const packages = ['di', 'shared', 'csr', 'ssr', 'server'];
// const packages = ['dynamic-builder'];

const rootOutDir = path.join(__dirname, './');
// const rootOutDir = path.join(__dirname, '../../api/node_modules/@fm/');

const packagesConfig = {
  di: { src: `university/di`, buildName: '@fm/di' },
  csr: { src: `university/csr`, buildName: '@fm/csr' },
  ssr: { src: `university/ssr`, buildName: '@fm/ssr' },
  shared: { src: `university/shared`, buildName: '@fm/shared' },
  server: { src: `university/server`, buildName: '@fm/server' },
  'dynamic-builder': { src: `university/dynamic-builder`, buildName: 'dynamic-builder', exportIgnore: true },
};

const tasks = [];
buildPackage(rootOutDir, packagesConfig).forEach(([taskName, gulpItem]) => {
  tasks.push(taskName);
  gulp.task(taskName, gulpItem);
});

gulp.task('default', gulp.series(tasks));
