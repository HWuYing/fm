const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const ts = require('gulp-typescript');
const rimraf = require('rimraf');
const { generatePackage } = require('./generate-package');
const { moduleMapping, targetMapping } = require('./constant');

// const rootOutDir = path.join(__dirname, '../');
const rootOutDir = path.join(__dirname, '../../api/node_modules/@fm/');

function clearPackage(packageRoot) {
  const ignore = ['.git'];
  if (!fs.existsSync(packageRoot)) {
    return Promise.resolve();
  }
  const dirList = fs.readdirSync(packageRoot).filter((dir) => !ignore.includes(dir));
  return Promise.all(dirList.map((filePath) => {
    const dirPath = path.join(packageRoot, filePath);
    return new Promise((resolve, reject) => {
      rimraf(dirPath, {}, (err) => err ? reject(err) : resolve())
    });
  }));
}

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
    const packageRoot = path.join(rootOutDir, packageName);
    const buildName = ignore ? packageName : `@fm/${packageName}`;

    tasks.push([`${packageName}-clear`, () => clearPackage(packageRoot)]);
    tasks.push([packageName, buildTask(packageName, [moduleKeys[0], ''], true)]);

    moduleKeys.forEach((module) => {
      const moduleItem = [module, moduleMapping[module], targetMapping[module]];
      tasks.push([`${packageName}-${module}`, buildTask(packageName, moduleItem)]);
    });

    tasks.push([`package-${packageName}`, generatePackage(buildName, packageRoot, { ignore })]);
  });

  return tasks;
}
