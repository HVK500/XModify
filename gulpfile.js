const gulp = require('gulp');
const xmj = require('xml-js');
const helpers = require('./internals/helpers');
const config = helpers.readFile('./config.json', true);

gulp.task('default', () => {
  const inputElements = xmj.xml2js(helpers.readFile(config.input.content)).elements;

  helpers.getFilePaths(config.input.dir, config.input.targetFiles).forEach((filepath, index) => {
    console.log('file', index, filepath);

    const target = xmj.xml2js(helpers.readFile(filepath));

    let returnIndex = null;
    const targetElements = target.elements[0].elements.find((node, index) => {
      returnIndex = index;
      return node.name === config.modeSettings.insert.node;
    }).elements;

    const nodesToAdd = [];
    inputElements.forEach((element) => {
      if (targetElements.includes((target) => (target.type === 'comment' && target.comment === element.comment) || target.name === element.name)) return;
      nodesToAdd.push(element);
    });

    const matchRegex = new RegExp(config.modeSettings.insert.match);
    let insertionIndex = targetElements.findIndex((node) => {
      switch(config.modeSettings.insert.nodeType) {
        case 'element':
          if (!node.attributes || !node.attributes.key) return false;
          return matchRegex.test(node.attributes.key);
        case 'comment':
        default:
          return matchRegex.test(node.comment);
      }
    });

    let modifier = 0;
    switch(config.modeSettings.insert.position) {
      case 'after':
        modifier = 1;
        break;
      case 'before':
        // Keep modifier at zero
        break;
      case 'first':
        insertionIndex = 0;
        break;
      case 'last':
      default:
        insertionIndex = targetElements.length;
        break;
    }

    if (insertionIndex === -1) {
      console.log('Insertion match was not found, skipping this file.');
      return;
    }

    const left = targetElements.slice(0, insertionIndex + modifier);
    const right = targetElements.slice(insertionIndex + modifier, targetElements.length);
    const merged = left.concat(nodesToAdd).concat(right);

    if (helpers.isEqual(merged, targetElements)) {
      console.log('Input content has been found in target content, skipping this file.');
      return;
    }

    target.elements[0].elements[returnIndex].elements = merged;
    helpers.writeFile(filepath, xmj.js2xml(target, config.output.formatting).replace(/\&/g, '&amp;'));
  });
});
