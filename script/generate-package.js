const fs = require('fs');
const path = require('path');

const exportMapping = { node: 'cjs', require: 'cjs', es2015: 'esm', default: 'esm5' };

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

function generatePackageTemplate(name, version, exports, dependencies = {}) {
  return {
    name,
    version,
    private: false,
    description: '',
    main: './cjs/index.js',
    module: './esm5/index.js',
    es2015: './esm/index.js',
    exports,
    dependencies,
    scripts: {
      test: 'echo \'Error: no test specified\' && exit 1'
    },
    author: '',
    license: 'ISC'
  };
}

exports.generatePackage = function generatePackage(packageRoot, { buildName: name, version, dependencies, sideEffects = false } = {}) {
  return () => {
    const exports = sideEffects ? {} : generateExports(readExportsPath(path.join(packageRoot, 'cjs')));
    const packageJson = generatePackageTemplate(name, version, exports, dependencies);
    if (!sideEffects) packageJson.sideEffects = ['*.effects.js'];
    if (!Object.keys(exports).length) delete packageJson.exports;
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify(packageJson, null, '\t'), { encoding: 'utf8' })
    return Promise.resolve(exports);
  };
}
