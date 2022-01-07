'use strict'
const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs')
const path = require('path')

const jsdocConf = './jsdoc.conf.js'

/* output path */
const outputDir = './docs'

const getJsdocDataOptions = {
  /* same inpout path as jsdoc */
  files: require(jsdocConf).source.include,
  configure: './jsdoc.conf.js',
  'no-cache': true
}

const renderOptions = {
  'param-list-format': 'list'
}

fs.rmdirSync(outputDir, { recursive: true }) // clean docs dir
fs.mkdirSync(outputDir) // make docs dir

/* get template data */
const templateData = jsdoc2md.getTemplateDataSync(getJsdocDataOptions)

/* reduce templateData to an array of class names */
const classNames = templateData
  .filter(({ kind, access }) => kind === 'class' && access !== 'private')
  .map(({ name }) => name)

const moduleNames = templateData
  .filter(({ kind, access }) => kind === 'module' && access !== 'private')
  .map(({ name }) => name)

const rest = templateData
  .filter(({ name }) => !moduleNames.includes(name) && !classNames.includes(name))
  .filter(({ scope, access }) => scope === 'global' && access !== 'private')
  .map(({ id }) => id)

/* create a documentation file for each class */
for (const className of classNames) {
  const template = `{{#class name="${className}"}}{{>docs}}{{/class}}`
  console.log(`rendering ${className}, template: ${template}`)
  const output = jsdoc2md.renderSync({ ...renderOptions, data: templateData, template: template })
  fs.writeFileSync(path.resolve(outputDir, `${className}.md`), output)
}

/* create a documentation file for each module */
for (const moduleName of moduleNames) {
  const template = `{{#module name="${moduleName}"}}{{>docs}}{{/module}}`
  console.log(`rendering ${moduleName}, template: ${template}`)
  const output = jsdoc2md.renderSync({ ...renderOptions, data: templateData, template: template })
  fs.writeFileSync(path.resolve(outputDir, `${moduleName}.md`), output)
}

let template = ''
for (const id of rest) {
  template += `{{#identifier name="${id}"}}{{>docs}}{{/identifier}}\n`
}
console.log(`rendering globals, template: ${template}`)
const output = jsdoc2md.renderSync({ ...renderOptions, data: templateData, template: template })
fs.writeFileSync(path.resolve(outputDir, 'globals.md'), output)

// TODO rewrite links between files
