const path = require('path');
const gulp = require('gulp');
const { buildPackage } = require('./script/build-source');

const packagesConfig = {
  di: { src: `university/di`, buildName: '@fm/di', dependencies: { 'reflect-metadata': '^0.2.1' } },
  core: { src: `university/core`, buildName: '@fm/core' },
  csr: { src: `university/csr`, buildName: '@fm/csr' },
  ssr: { src: `university/ssr`, buildName: '@fm/ssr' },
  server: { src: `university/server`, buildName: '@fm/server' },
  'dynamic-builder': { src: `university/dynamic-builder`, buildName: '@dynamic/builder', sideEffects: true },
  'dynamic-plugin': { src: `university/dynamic-plugin`, buildName: '@dynamic/plugin', sideEffects: true }
};

const tasks = [];
function pushTask(_rootOutDir, _packagesConfig) {
  buildPackage(_rootOutDir, _packagesConfig).forEach(([taskName, gulpItem]) => {
    tasks.push(taskName);
    gulp.task(taskName, gulpItem);
  });
}

// pushTask(path.join(__dirname, '../api/node_modules/@fm/'), {
//   di: packagesConfig.di,
//   core: packagesConfig.core,
//   csr: packagesConfig.csr,
//   ssr: packagesConfig.ssr,
//   server: packagesConfig.server
// });

// pushTask(path.join(__dirname, '../api/node_modules/@dynamic'), {
//   builder: packagesConfig['dynamic-builder'],
//   plugin: packagesConfig['dynamic-plugin']
// });

pushTask(path.join(__dirname, './'), packagesConfig);
gulp.task('default', gulp.series(tasks));
