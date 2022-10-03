const gulp = require('gulp');
const ts = require('gulp-typescript');

const rootOutDir = '.';
// const rootOutDir = '../api/node_modules/@fm/';

function g(packageName, moduleItem, stripInternal) {
  const [module, outDir] = moduleItem;
  return () => {
    const project = ts.createProject('tsconfig.json', { module });
    let source = gulp.src([`university/${packageName}/**/*`, 'typings/**/*']).pipe(project());
    source = stripInternal ? source.dts : source.js;
    return source.pipe(gulp.dest(`${rootOutDir}/${packageName}/${outDir}`));
  }
}

const moduleMapping = { CommonJs: 'cjs', ES2015: 'esm', 'ESNext': "esm5" };
const packages = ['di', 'shared', 'dynamic-builder', 'csr', 'ssr', 'server'];
// const packages = ['di','shared', 'csr', 'ssr', 'server'];
// const packages = ['dynamic-builder'];
const tasks = [];
packages.forEach((packageName) => {
  const moduleKeys = Object.keys(moduleMapping);
  gulp.task(packageName, g(packageName, [moduleKeys[0], ''], true));
  tasks.push(packageName);

  moduleKeys.forEach((module) => {
    const moduleItem = [module, moduleMapping[module]];
    const taksName = `${packageName}-${module}`;
    gulp.task(taksName, g(packageName, moduleItem));
    tasks.push(taksName);
  });
});

gulp.task('default', gulp.series(tasks));