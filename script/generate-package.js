const fs = require('fs');
const path = require('path');
const { exportMapping } = require('./constant');

function readExportsPath(packagePath, root = '') {
  const exportArray = [];
  const currentRoot = path.join(packagePath, root);
  const files = fs.readdirSync(currentRoot);
  if (files.includes('index.js')) {
    exportArray.push(root);
  }
  files.forEach((fileName) => {
    const filePath = path.join(currentRoot, fileName);
    if (fs.statSync(filePath).isDirectory()) {
      exportArray.push(...readExportsPath(packagePath, path.join(root, fileName)));
    }
  });
  return exportArray;
}

function generateExports(pathList, exports = {}) {
  pathList.forEach((path) => {
    const exportModel = path.replace(/[\\|\/]+/, '/');
    const expportKey = path ? './' + exportModel : '.';

    exports[expportKey] = Object.keys(exportMapping).reduce((obj, key) => ({
      ...obj,
      [key]: `./${exportMapping[key]}/${exportModel}/index.js`.replace(/[\/]+/ig, '/')
    }), {});
  });

  return exports;
}

function generatePackageTemplate(name, version, exports) {
  return {
    name,
    version,
    description: '',
    main: './cjs/index.js',
    module: './esm5/index.js',
    es2015: './esm/index.js',
    exports,
    dependencies: {},
    scripts: {
      test: 'echo \'Error: no test specified\' && exit 1'
    },
    author: '',
    license: 'ISC'
  };
}

exports.generatePackage = function generatePackage(name, packageName, options = {}) {
  const packageRoot = path.join(__dirname, '../', packageName);
  return () => {
    const exports = options.ignore ? {} : generateExports(readExportsPath(path.join(packageRoot, 'cjs')));
    const packageJson = generatePackageTemplate(name, '1.0.0', exports);
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify(packageJson, null, '\t'), { encoding: 'utf8' })
    return Promise.resolve(exports);
  };
}
