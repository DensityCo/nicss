#!/usr/bin/env node
const fsp = require('fs-promise');
const path = require('path');
const mkdirp = require('mkdirp-promise');
const rimraf = require('rimraf-promise');
const minimist = require('minimist');

const NODE_MODULES_ROOT = 'node_modules/';


// Given a package.json location, return the value of the style property within.
function getPackageStyleSheet(packageJsonLocation) {
  return fsp.readFile(packageJsonLocation).then(data => {
    const package = JSON.parse(data);
    if (package.style) {
      return path.join(path.dirname(packageJsonLocation), package.style)
    } else {
      return false;
    }
  });
}

function normalizePackageName(packageJsonPath) {
  return packageJsonPath
    .replace(/^node_modules\//, '')
    .replace(/\/package.json$/, '');
}

function recurse(basePath, styles=[]) {
  return fsp.readdir(basePath).then(files => {
    // Loop through each file in the directory
    const all = files.map(file => {
      const packageJsonPath = path.join(basePath, file);
      return fsp.lstat(packageJsonPath).then(stat => {
        // Traverse further into directories
        if (stat.isDirectory()) {
          return recurse(packageJsonPath, styles);
        // And parse any file named `package.json`
        } else if (stat.isFile() && path.basename(packageJsonPath) === 'package.json') {
          return getPackageStyleSheet(packageJsonPath).then(style => {
            if (style) {
              styles.push({
                // Path to package.json, ie, `node_modules/normalize.css/package.json`
                name: packageJsonPath,
                // Path to css, ie, `node_modules/normalize.css/normalize.css`,
                style,
                // The name of the css file, ie, `normalize.css`
                normalized: normalizePackageName(packageJsonPath),
              })
            }
          })
        }
      });
    });

    return Promise.all(all).then(() => styles);
  });
}

const argv = minimist(process.argv.slice(2));
const root = argv.root || 'styles/';
const extension = argv.ext || 'css';

if (argv.help || argv.h || argv['?']) {
  console.log(`Usage: nicss [--root] [--clean] [--ext]`);
  console.log();
  console.log(`Options:`);
  console.log();
  console.log('--root dir ........ path to the directory to symlink styles within, defaults to `styles/`');
  console.log('--clean ........... instead of installing dependencies, remove all dependencies.');
  console.log('--ext scss ........ extension to give to all linked styles, defaults to `css`');
  console.log();
  console.log(`Examples:`);
  console.log();
  console.log(`$ nicss`);
  console.log(`🔗  Symlinking styles to styles/`);
  console.log(`styles/_normalize.css => ../node_modules/normalize.css/normalize.css`);
  console.log(`✅  Linked 1 style(s) into styles/`);
  console.log(`$ nicss --ext scss`);
  console.log(`🔗  Symlinking styles to styles/`);
  console.log(`styles/_normalize.scss => ../node_modules/normalize.css/normalize.scss`);
  console.log(`✅  Linked 1 style(s) into styles/`);
  console.log(`$ nicss --clean`);
  console.log(`Cleaned up styles in styles/`);
  process.exit(1)
}

if (argv.clean) {
  return rimraf(root).then(() => {
    console.log(`Cleaned up styles in ${root}.`);
  });
} else {
  // Install styles:
  // 1. Recursively move through all dependencies to find packages that have a `style` key in the
  // package.json
  // 2. Create a folder to link all styles.
  // 3. Symlink all styles into the styles folder.
  console.log(`🔗  Symlinking styles to ${root}`);
  recurse(NODE_MODULES_ROOT).then(styles => {
    return rimraf(root).then(() => {
      return mkdirp(root);
    }).then(() => {
      const all = styles.map(style => {
        const target = path.join('..', style.style);

        // Given a file extension, determine the name for the stylesheet
        const normalizedStylesheetName = style.normalized.replace(/.css$/, '').replace(/\//, '-');
        let styleSheetName;
        if (extension === 'scss') {
          styleSheetName = `_${normalizedStylesheetName}.scss`
        } else {
          styleSheetName = `${normalizedStylesheetName}.${extension}`
        }

        const source = path.join('styles', styleSheetName);
        console.log(source, "=>", target);
        return fsp.lstat(source).then(exists => {
          if (!exists) {
            return fsp.symlink(target, source).catch(err => {
              console.log("Error symlinking:", err);
            });
          } else {
            console.warn(`NOTE: ${source} already exists, not symlinking over it...`);
          }
        });
      });

      return Promise.all(all);
    }).then(resp => {
      console.log(`✅  Linked ${resp.length} style(s) into ${root}`);
    });
  }).catch(e => console.trace(e))
}
