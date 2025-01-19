const path = require('path');
const gulp = require('gulp');
const { buildPackage } = require('./script/build-source');

const namespace = '@hwy-fm/';
const version = '0.0.1-beta.3';
const packagesConfig = {
  di: { src: `university/di`, buildName: `${namespace}di`, version, generateDep: true },
  core: { src: `university/core`, buildName: `${namespace}core`, version },
  csr: { src: `university/csr`, buildName: `${namespace}csr`, version },
  ssr: { src: `university/ssr`, buildName: `${namespace}ssr`, version },
  server: { src: `university/server`, buildName: `${namespace}server`, version },
  'dynamic-builder': { src: `university/dynamic-builder`, buildName: `${namespace}builder`, version, sideEffects: true },
  'dynamic-plugin': { src: `university/dynamic-plugin`, buildName: `${namespace}plugin`, version, sideEffects: true },
  "ts-tools/dist": { src: `ts-tools/tools`, buildName: `${namespace}ts-tools`, version, packageJson: false, sideEffects: true }
};

const tasks = [];
function pushTask(_rootOutDir, _packagesConfig) {
  buildPackage(_rootOutDir, _packagesConfig, namespace).forEach(([taskName, gulpItem]) => {
    tasks.push(taskName);
    gulp.task(taskName, gulpItem);
  });
}

// pushTask(path.join(__dirname, '../api/node_modules/@hwy-fm/'), {
//   di: packagesConfig.di,
//   core: packagesConfig.core,
//   csr: packagesConfig.csr,
//   ssr: packagesConfig.ssr,
//   server: packagesConfig.server
// });

// pushTask(path.join(__dirname, '../api/node_modules/@hwy-fm/'), {
//   builder: packagesConfig['dynamic-builder'],
//   plugin: packagesConfig['dynamic-plugin']
// });

// pushTask(path.join(__dirname, '../cyg/node_modules/@hwy-fm/'), {
//   'ts-tools/dist': packagesConfig['ts-tools/dist']
// });

pushTask(path.join(__dirname, './'), packagesConfig);
gulp.task('default', gulp.series(tasks));
