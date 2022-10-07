const fs = require('fs');
const path = require('path');
const { exportMapping } = require('./constant');

function readExportsPath(packagePath, root = '') {
  const exportArray = [];
  const currentRoot = path.join(packagePath, root);
  const files = fs.readdirSync(currentRoot);
  const hasIndex = files.includes('index.js');

  exportArray.push(hasIndex ? [root, `${root}/index.js`] : [`${root}/*`, `${root}/*.js`]);

  files.forEach((fileName) => {
    const filePath = path.join(currentRoot, fileName);
    if (fs.statSync(filePath).isDirectory()) {
      exportArray.push(...readExportsPath(packagePath, path.join(root, fileName)));
    }
  });
  return exportArray;
}

function generateExports(pathList, exports = {}) {
  pathList.forEach(([path, exportPath]) => {
    const expportKey = path ? './' + path : '.';
    const mappingKeys = Object.keys(exportMapping);

    exports[expportKey.replace(/[\\|\/]+/g, '/')] = mappingKeys.reduce((obj, key) => ({
      ...obj,
      [key]: `./${exportMapping[key]}/${exportPath}`.replace(/[\\|\/]+/g, '/')
    }), {});
  });

  return exports;
}

function generatePackageTemplate(name, version, exports) {
  const packageJson = {
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
  if (!Object.keys(exports).length) {
    delete packageJson.exports;
  }
  return packageJson;
}

exports.generatePackage = function generatePackage(name, packageRoot, options = {}) {
  return () => {
    const exports = options.ignore ? {} : generateExports(readExportsPath(path.join(packageRoot, 'cjs')));
    const packageJson = generatePackageTemplate(name, '1.0.0', exports);
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify(packageJson, null, '\t'), { encoding: 'utf8' })
    return Promise.resolve(exports);
  };
}
