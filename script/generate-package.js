const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const through = require('through2');
const PluginError = require('plugin-error');

const exportMapping = { node: 'cjs', require: 'cjs', es2015: 'esm', default: 'esm5' };
const package = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));

function readExportsPath(packagePath, root = '') {
  const exportArray = [];
  const currentRoot = path.join(packagePath, root);
  const files = fs.readdirSync(currentRoot);

  if (files.includes('index.js')) {
    exportArray.push([root, `${root}/index.js`]);
  }

  if (root) {
    exportArray.push([`${root}/*`, `${root}/*.js`]);
  }

  files.forEach((fileName) => {
    if (fs.statSync(path.join(currentRoot, fileName)).isDirectory()) {
      exportArray.push(...readExportsPath(packagePath, path.join(root, fileName)));
    }
  });
  return exportArray;
}

function generateExports(pathList, exports = {}) {
  pathList.forEach(([path, exportPath]) => {
    const exportKey = path ? './' + path : '.';
    const mappingKeys = Object.keys(exportMapping);

    exports[exportKey.replace(/[\\|\/]+/g, '/')] = mappingKeys.reduce((obj, key) => ({
      ...obj,
      [key]: `./${exportMapping[key]}/${exportPath}`.replace(/[\\|\/]+/g, '/')
    }), {});
  });

  return exports;
}

function generatePackageTemplate(name, version, exports, dependencies, generateDep) {
  const namespace = name.replace(/(@[^\/]+\/).*/, '$1');
  const packageDep = { ...package.dependencies, ...package.devDependencies };
  const keys = Object.keys(packageDep);
  const packageJson = {
    name,
    version,
    private: false,
    description: '',
    main: './cjs/index.js',
    module: './esm5/index.js',
    es2015: './esm/index.js',
    exports,
    scripts: {
      test: 'echo \'Error: no test specified\' && exit 1'
    },
    author: '',
    license: 'ISC',
    dependencies: {},
    devDependencies: {}
  };

  dependencies.sort().forEach((key) => {
    const typeKey = `@types/${key}`;
    key = key.replace(new RegExp(`(?<=${namespace}[^\\/]+)\\/.*`, 'g'), '');
    if (key.indexOf(namespace) !== -1) packageJson.dependencies[key] = `^${version}`;
    if (!generateDep) return;
    if (keys.includes(key)) packageJson.dependencies[key] = packageDep[key];
    if (keys.includes(typeKey)) packageJson.devDependencies[typeKey] = packageDep[typeKey];
  });

  if (!Object.keys(exports).length) delete packageJson.exports;
  if (!Object.keys(packageJson.dependencies).length) delete packageJson.dependencies;
  if (!Object.keys(packageJson.devDependencies).length) delete packageJson.devDependencies;

  return packageJson;
}

function collectDependencies(src) {
  const dependencies = [];
  const stream = gulp.src([`${src}/**/*`]).pipe(through.obj(function (file, enc, cb) {

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
      return cb();
    }

    if (!file.isNull() && file.isBuffer()) {
      const match = file.contents.toString(enc).match(/(?<=(import|export)\s+(.*?from\s+)?['"])[^\.\/][^'"]+/g) || [];
      dependencies.push(...match);
    }

    cb(null, file);
  }));

  return new Promise((resolve, reject) => {
    stream.on('data', () => { });
    stream.on('end', () => resolve(dependencies));
    stream.on('error', reject);
  });
}

exports.generatePackage = function generatePackage(packageRoot, { src, buildName: name, version, sideEffects = false, generateDep = sideEffects } = {}) {
  return () => collectDependencies(src).then((dependencies) => {
    const exports = generateExports(sideEffects ? [] : readExportsPath(path.join(packageRoot, 'cjs')));
    const packageJson = generatePackageTemplate(name, version, exports, dependencies, generateDep);
    if (!sideEffects) packageJson.sideEffects = ['*.effects.js'];
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify(packageJson, null, '\t'), 'utf-8')
    return exports;
  });
}
