const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const ts = require('gulp-typescript');
const tsModel = require('typescript');
const replace = require('gulp-replace');
const { generatePackage } = require('./generate-package');

const builderMapping = [
  { outDir: 'esm5', target: 'es5', module: 'ESNext' },
  { outDir: 'esm', target: 'es2015', module: 'ES2015' },
  { outDir: 'cjs', target: 'es5', module: 'CommonJs' }
];

function clearPackage(packageRoot, packageConfig) {
  const { clearDir = [], ignore = ['.git'] } = packageConfig;
  if (!fs.existsSync(packageRoot)) {
    return Promise.resolve();
  }
  const dirList = fs.readdirSync(packageRoot).filter((dir) => clearDir ? clearDir.includes(dir) : !ignore.includes(dir));
  return Promise.all(dirList.map((filePath) => {
    const dirPath = path.join(packageRoot, filePath);
    return new Promise((resolve, reject) => {
      if (fs.existsSync(dirPath)) (fs.rm || fs.rmdir)(dirPath, { recursive: true }, (err) => err ? reject(err) : resolve())
    });
  }));
}

exports.buildPackage = function buildPackage(rootOutDir, packagesConfig, namespace = '@hwy-fm/') {
  const tasks = [];
  const replaceRegexp = namespace === '@hwy-fm/' ? namespace : /@hwy-fm\//ig;
  const packages = Object.keys(packagesConfig);
  const { config: { compilerOptions: { paths } } } = tsModel.readConfigFile(path.join(process.cwd(), 'tsconfig.json'), tsModel.sys.readFile);
  const tsPaths = {
    ...paths,
    ...Object.keys(paths).reduce((o, key) => ({ ...o, [key.replace(replaceRegexp, namespace)]: paths[key] }), {})
  };

  function buildTask([module, src, outDir, target = 'ESNext'], stripInternal) {
    return () => {
      const project = ts.createProject(outDir.indexOf('ts-tools') !== -1 ? 'ts-tools/tsconfig.json' : 'tsconfig.json', { module, target, paths: tsPaths });
      let source = gulp.src([`${src}/**/*`]).pipe(replace(replaceRegexp, namespace)).pipe(project());
      source = stripInternal ? source.dts : source.js;
      return source.pipe(gulp.dest(outDir));
    }
  }

  packages.forEach(packageName => {
    const packageRoot = path.join(rootOutDir, packageName);
    const { buildName, packageJson = true, ...others } = packagesConfig[packageName];
    const packageConfig = { ...others, buildName: buildName.replace(replaceRegexp, namespace) };
    const { src } = packageConfig;

    tasks.push([`${packageName}-clear`, () => clearPackage(packageRoot, packageConfig)]);
    tasks.push([packageName, buildTask(['ESNext', src, packageRoot], true)]);

    builderMapping.forEach(({ outDir, target, module }) => {
      tasks.push([`${packageName}-${module}`, buildTask([module, src, `${packageRoot}/${outDir}`, target])]);
    });

    if (packageJson) {
      tasks.push([`${packageName}-package`, generatePackage(packageRoot, packageConfig)]);
    }
  });

  return tasks;
}
