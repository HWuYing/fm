const gulp = require('gulp');
const ts = require('gulp-typescript');

const rootOutDir = '.';
// const rootOutDir = '../api/node_modules/@fm/';
const packages = ['di', 'shared', 'dynamic-builder', 'csr', 'ssr', 'server'];
// const packages = ['di','shared', 'csr', 'ssr', 'server'];
// const packages = ['dynamic-builder'];

const moduleMapping = { CommonJs: 'cjs', ES2015: 'esm', ESNext: "esm5" };
const targetMapping = { CommonJs: 'es5', ES2015: 'es2015', ESNext: 'es5' };

function g(packageName, moduleItem, stripInternal) {
  const [module, outDir, target = 'ESNext'] = moduleItem;
  return () => {
    const project = ts.createProject('tsconfig.json', { module, target });
    let source = gulp.src([`university/${packageName}/**/*`, 'typings/**/*']).pipe(project());
    source = stripInternal ? source.dts : source.js;
    return source.pipe(gulp.dest(`${rootOutDir}/${packageName}/${outDir}`));
  }
}

const tasks = [];
packages.forEach((packageName) => {
  const moduleKeys = Object.keys(moduleMapping);
  gulp.task(packageName, g(packageName, [moduleKeys[0], ''], true));
  tasks.push(packageName);

  moduleKeys.forEach((module) => {
    const moduleItem = [module, moduleMapping[module], targetMapping[module]];
    const taksName = `${packageName}-${module}`;
    gulp.task(taksName, g(packageName, moduleItem));
    tasks.push(taksName);
  });
});

gulp.task('default', gulp.series(tasks));