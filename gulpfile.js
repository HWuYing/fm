const path = require('path');
const gulp = require('gulp');
const { buildPackage } = require('./script/build-source');

const rootOutDir = path.join(__dirname, './');
// const rootOutDir = path.join(__dirname, '../api/node_modules/');
// const rootOutDir = path.join(__dirname, '../excelToConfig/node_modules/@fm/');
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
function pushTask(_rootOutDir, _packagesConfig) {
  buildPackage(_rootOutDir, _packagesConfig).forEach(([taskName, gulpItem]) => {
    tasks.push(taskName);
    gulp.task(taskName, gulpItem);
  });
}

// pushTask(path.join(__dirname, '../api/node_modules/@fm/'), {
//   di: { src: `university/di`, buildName: '@fm/di' },
//   core: { src: `university/core`, buildName: '@fm/core' },
  // csr: { src: `university/csr`, buildName: '@fm/csr' },
//   ssr: { src: `university/ssr`, buildName: '@fm/ssr' },
//   server: { src: `university/server`, buildName: '@fm/server' }
// });

// pushTask(path.join(__dirname, '../api/node_modules/@dynamic'), {
//   builder: { src: `university/dynamic-builder`, buildName: '@dynamic/builder', exportIgnore: true },
//   plugin: { src: `university/dynamic-plugin`, buildName: '@dynamic/plugin', exportIgnore: true }
// });

pushTask(rootOutDir, packagesConfig);
gulp.task('default', gulp.series(tasks));
