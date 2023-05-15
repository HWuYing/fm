const path = require('path');
const gulp = require('gulp');
const { buildPackage } = require('./script/build-source');

const rootOutDir = path.join(__dirname, './');
// const rootOutDir = path.join(__dirname, '../api/node_modules/');

const packagesConfig = {
  di: { src: `university/di`, buildName: '@fm/di' },
  core: { src: `university/core`, buildName: '@fm/core' },
  csr: { src: `university/csr`, buildName: '@fm/csr' },
  ssr: { src: `university/ssr`, buildName: '@fm/ssr' },
  server: { src: `university/server`, buildName: '@fm/server' },
  'dynamic-builder': { src: `university/dynamic-builder`, buildName: '@dynamic/builder', exportIgnore: true },
  'dynamic-plugin': { src: `university/dynamic-plugin`, buildName: '@dynamic/plugin', exportIgnore: true }
};

const tasks = [];
buildPackage(rootOutDir, packagesConfig).forEach(([taskName, gulpItem]) => {
  tasks.push(taskName);
  gulp.task(taskName, gulpItem);
});

gulp.task('default', gulp.series(tasks));
