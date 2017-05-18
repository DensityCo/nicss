# Nicss

(pronounced like `nice`)

Nicss is a css helper library that extracts exported stylesheets out of `node_modules` and symlinks them
into a single `styles/` folder. This makes it easier to include the stylesheets of dependencies with css
post-processors.

## How it works
As an unofficial standard, many popular packages are [adding a style field to their package.json
file](http://stackoverflow.com/questions/32037150/style-field-in-package-json) that links to their
compiled css. Nicss crawls through your dependency graph and finds packages with this `style`
property and symlinks each compiled css file to a single `styles/` folder.

Here's an example project:
```
.
├── node_modules
│   ├── one
│   │   ├── package.json         // contains `"style": "./one-styles.css"`
│   │   └── one-styles.css       // contains `.one { color: red; }`
│   └── two
│       ├── package.json         // contains `"style": "./two-styles.css"`
│       └── two-styles.css       // contains `.two { color: blue; }`
├── index.js
└── package.json
```

When you run `nicss`, this is what happens:
```
.
├── node_modules
│   ├── one
│   │   ├── package.json         // contains `"style": "./one-styles.css"`
│   │   └── one-styles.css       // contains `.one { color: red; }`
│   └── two
│       ├── package.json         // contains `"style": "./two-styles.css"`
│       └── two-styles.css       // contains `.two { color: blue; }`
├── index.js
├── package.json
└── styles // nicss creates this folder...
    ├── one.css -> ../node_modules/one/one-styles.css // ... and symlinks each package's stylesheet inside.
    └── two.css -> ../node_modules/two/two-styles.css
```

Now, any package's defined stylesheet is accessible from within one folder:
```bash
$ # ie, cat styles/$PACKAGENAME.css
$ cat styles/one.css
.one { color: red; }
$ cat styles/two.css
.one { color: two; }
```

This is a format that tools like `node-sass` (using `includePaths`) and `less` (using `paths`) can
easily consume:

```javascript
// node-sass
// Note: run `nicss --ext scss` to output scss instead of css files for the below to work.
const sass = require('node-sass');
sass.render({
  data: '@import "one";',
  includePaths: ['./styles'],
}, function(err, output) {
  console.log(err, output)
});

// less
const less = require('less');
less.render('@import "one.css";', {
  paths: ['./styles']
}, function (e, output) {
  console.log(err, output);
});
```

## How to use
1. Install Nicss: `npm i -S @density/nicss`
2. Give it a try manually first: run `./node_modules/.bin/nicss`
3. Add a `postinstall` hook to your package, so that after running `npm install`, css dependencies
   are linked for you: `"postinstall": "nicss"`
4. Done. CSS dependencies will be automatically extracted when you run `npm install`.

## Why not webpack?
Webpack is magic. Magic can be great when it works, but can be confusing and complicated. We've
opted to minimize our use of webpack so that we have a deep understanding of our build process.
