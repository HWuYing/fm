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
  function buildTask([module, src, outDir, target = 'ESNext'], stripInternal) {
    return () => {
      const project = ts.createProject('tsconfig.json', { module, target });
      let source = gulp.src([`${src}/**/*`]).pipe(project());
      source = stripInternal ? source.dts : source.js;
      return source.pipe(gulp.dest(outDir));
    }
  }

  packages.forEach(packageName => {
    const packageRoot = path.join(rootOutDir, packageName);
    const packageConfig = packagesConfig[packageName];
    const { src } = packageConfig;

    tasks.push([`${packageName}-clear`, () => clearPackage(packageRoot)]);
    tasks.push([packageName, buildTask(['ESNext', src, packageRoot], true)]);

    Object.keys(builderMapping).forEach((moduleKey) => {
      const { outDir, target } = builderMapping[moduleKey];
      tasks.push([`${packageName}-${moduleKey}`, buildTask([moduleKey, src, `${packageRoot}/${outDir}`, target])]);
    });

    tasks.push([`${packageName}-package`, generatePackage(packageRoot, packageConfig)]);
  });

  return tasks;
}
