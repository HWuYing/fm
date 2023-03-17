const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const ts = require('gulp-typescript');
const rimraf = require('rimraf');
const { generatePackage } = require('./generate-package');

const builderMapping = {
  ESNext: { outDir: 'esm5', target: 'es5' },
  ES2015: { outDir: 'esm', target: 'es2015' },
  CommonJs: { outDir: 'cjs', target: 'es5' }
};

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

exports.buildPackage = function buildPackage(rootOutDir, packagesConfig) {
  const tasks = [];
  const packages = Object.keys(packagesConfig);
  function buildTask(packageName, moduleItem, stripInternal) {
    const [module, outDir, target = 'ESNext'] = moduleItem;
    return () => {
      const project = ts.createProject('tsconfig.json', { module, target });
      const sourceSrc = [`${packagesConfig[packageName].src}/**/*`, 'typings/**/*'];
      let source = gulp.src(sourceSrc).pipe(project());
      source = stripInternal ? source.dts : source.js;
      return source.pipe(gulp.dest(`${rootOutDir}/${packageName}/${outDir}`));
    }
  }

  packages.forEach(packageName => {
    const moduleKeys = Object.keys(builderMapping);
    const packageRoot = path.join(rootOutDir, packageName);
    const { buildName, exportIgnore } = packagesConfig[packageName];

    tasks.push([`${packageName}-clear`, () => clearPackage(packageRoot)]);
    tasks.push([packageName, buildTask(packageName, [moduleKeys[0], ''], true)]);

    moduleKeys.forEach((moduleKey) => {
      const moduleItem = [moduleKey, builderMapping[moduleKey].outDir, builderMapping[moduleKey].target];
      tasks.push([`${packageName}-${moduleKey}`, buildTask(packageName, moduleItem)]);
    });

    tasks.push([`package-${packageName}`, generatePackage(buildName, packageRoot, { ignore: exportIgnore })]);
  });

  return tasks;
}
