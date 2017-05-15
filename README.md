# Nicss

(pronounced like `nice`)

Nicss is a css helper library that extracts exported stylesheets out of `node_modules` and symlinks them
into a seperate folder, so tools like [node-sass](https://github.com/sass/node-sass) can easily
bring in styles from external packages.

## How it works
As an unofficial standard, many popular packages are [adding a style field to their package.json
file](http://stackoverflow.com/questions/32037150/style-field-in-package-json) that links to their
compiled css. Nicss crawls through your dependency graph and finds packages with this `style`
property and symlinks each compiled css file to a given folder (the `--root` argument, or by
default, the `styles/` directory). Then, you can point your scss / less / stylus compiler at that
folder and easily bring in tyles from other packagesthe!

## Why not webpack?
Webpack is magic. Magic can be great when it works, but can be confusing and complicated. We've
opted to minimize our use of webpack so that we have a deep understanding of our build process.
