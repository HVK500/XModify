const fs = require('fs');
const pathing = require('path');
const jsDom = require('jsdom').JSDOM;
const targetTypes = require('./target-types');

module.exports = {
  readFile: (path) => {
    return fs.readFileSync(pathing.resolve(path), { encoding: 'utf8' });
  },
  parse: (content) => {
    return new (new jsDom()).window.DOMParser().parseFromString(content, 'text/xml');
  },
  getChangeTarget: (query) => {
    switch(true) {
      case /\>$/.test(query):
        return targetTypes.INNER;
      case /\|\[\@[A-z]{1,}\]$/.test(query):
        return targetTypes.ATTR;
      default:
        throw 'No actual target specified!';
    }
  },
  getRootQueryFromRaw: (rawQuery, targetType) => {
    const query = rawQuery
      .replace('$', '')
      .replace(/(?=.)\>(?=.)/g, '/');

    let splitOn;
    switch(targetType) {
      case targetTypes.ATTR:
        splitOn = '|';
        break;
      case targetTypes.INNER:
        splitOn = '>';
        break;
    }

    const result = query.split(splitOn);
    return {
      root: result[0],
      attrName: result[1],
      raw: query
    }
  }
}
