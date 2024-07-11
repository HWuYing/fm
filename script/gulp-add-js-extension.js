const fs = require('fs');
const path = require('path');
const through = require('through2');
const PluginError = require('plugin-error');
const builtin = require('module').builtinModules;

const PLUGIN_NAME = 'gulp-add-js-extension';

function addJsExtension(outDir) {
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
      return cb();
    }

    if (file.isBuffer() && /es2020$/.test(outDir)) {
      let contents = file.contents.toString(enc);
      contents = contents.replace(/([import|export]\s+.*?\s+from\s+['"])(.*?)(['"])/g, (match, p1, p2, p3) => {
        if (builtin.find((item) => item === p2)) return `${p1}node:${p2}${p3}`;
        if (p2.endsWith('.js') || !p2.startsWith('.')) return match;
        const importPath = path.join(file.path.replace(/[^\/\\]+.js$/, ''), p2.replace(/.(js|ts)$/, ''));
        return `${p1}${p2}${fs.existsSync(importPath) ? '/index' : ''}.js${p3}`;
      });
      file.contents = Buffer.from(contents, enc);
    }

    cb(null, file);
  });
}

module.exports = addJsExtension;