const {
  targets: targetTypes
} = require('./types');
const fs = require('fs');
const jsDom = require('jsdom').JSDOM;
const pathing = require('path');
const xjs = require('xml-js');

module.exports = {
  readFile: (path) => {
    return fs.readFileSync(pathing.resolve(path), {
      encoding: 'utf8'
    });
  },
  parse: (content) => {
    return (new(new jsDom()).window.DOMParser()).parseFromString(content, 'text/xml');
  },
  getChangeTargetType: (select) => {
    switch (true) {
      case /\>$/.test(select):
        return targetTypes.INNER;
      case /\|\[\@[A-z]{1,}\]$/.test(select):
        return targetTypes.ATTR;
      default:
        throw 'No compatible target provided.';
    }
  },
  selectToRootAndRaw: (rawSelect, targetType) => {
    const select = rawSelect
      .replace('$', '')
      .replace(/(?=.)\>(?=.)/g, '/');

    let splitOn;
    switch (targetType) {
      case targetTypes.ATTR:
        splitOn = '|';
        break;
      case targetTypes.INNER:
        splitOn = '>';
        break;
      default:
        throw 'No compatible target provided.';
    }

    return {
      root: select.split(splitOn)[0],
      raw: select
    }
  },
  createElement: (elementsString) => {
    const container = new jsDom().window.document.createElement('div');
    container.innerHTML = elementsString.trim();
    return container.firstChild;
  },
  applyChanges: (source, original, modified) => {
    return xjs.json2xml(
      xjs.xml2json(source.replace(original, modified)), {
        spaces: 2
      }
    ).replace(/\&/g, '&amp;');
  },
  selectToRootAndAttr: (rawSelect) => {
    const [root, attrNameTarget] = rawSelect.split('|');
    return {
      root: root,
      attrName: attrNameTarget.replace(/\[\@|\]/g, '')
    };
  },
  selectToRootInner: (rawSelect) => {
    return rawSelect.replace(/\>$/, '');
  },
  extractFirstTagName: (content) => {
    return /(?<=\<)\w+(?=\s*\w*.*\>)/.exec(content)[0];
  },
  doesFirstTagExist: (content, source) => {
    const tagWithAttr = /(?<=\<)(\w*(\s\w+\=\".*\")*)(?=[\s\/\>])/.exec(content)[0];
    const commentedTag = new RegExp(`<!--\s*<${tagWithAttr}`);
    return source.includes(tagWithAttr) && !commentedTag.test(source);
  }
}