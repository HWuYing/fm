const gulp = require('gulp');
const ts = require('gulp-typescript');
const { generatePackage } = require('./generate-package');
const { moduleMapping, targetMapping } = require('./constant');

const rootOutDir = '.';
// const rootOutDir = '../api/node_modules/@fm/';

function buildTask(packageName, moduleItem, stripInternal) {
  const [module, outDir, target = 'ESNext'] = moduleItem;
  return () => {
    const project = ts.createProject('tsconfig.json', { module, target });
    let source = gulp.src([`university/${packageName}/**/*`, 'typings/**/*']).pipe(project());
    source = stripInternal ? source.dts : source.js;
    return source.pipe(gulp.dest(`${rootOutDir}/${packageName}/${outDir}`));
  }
}

exports.buildPackage = function buildPackage(packages) {
  const tasks = [];
  packages.forEach(packageName => {
    const moduleKeys = Object.keys(moduleMapping);
    const ignore = packageName === 'dynamic-builder';
    tasks.push([packageName, buildTask(packageName, [moduleKeys[0], ''], true)]);

    moduleKeys.forEach((module) => {
      const moduleItem = [module, moduleMapping[module], targetMapping[module]];
      tasks.push([`${packageName}-${module}`, buildTask(packageName, moduleItem)]);
    });

    tasks.push([`g-${packageName}`, generatePackage(ignore ? packageName : `@fm/${packageName}`, packageName, { ignore })]);
  });

  return tasks;
}
