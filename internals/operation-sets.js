const xpath = require('xpath');
const xjs = require('xml-js');

const removeWhitespace = (content) => {
  return content.trim().replace(/(?<=\>)\s{1,}(?=\<)/g, '');
};

const xformat = (content, spaces) => {
  return xjs.js2xml(
    xjs.xml2js(
      content, {
        compact: false,
        trim: true
      }
    ), {
      spaces: spaces != null ? spaces : 2,
      compact: false,
      fullTagEmptyElement: true
    });
};

const applyChanges = (source, original, modified) => {
  return xformat(source.replace(original, modified)).replace(/\&/g, '&amp;');
};

const setAttr = (fileInfo, query, value) => {
  const queryInfo = getAttrFromQuery(query);
  const element = xpath.select1(queryInfo.root, fileInfo.parsed);
  const before = element.outerHTML+'';
  element.setAttribute(queryInfo.attrName, value);
  const after = element.outerHTML;
  fileInfo.modContent = applyChanges(fileInfo.content, before, after);
  return fileInfo;
};

const getAttrFromQuery = (rawQuery) => {
  const [ root, attrNameTarget ] = rawQuery.split('|');
  return {
    root: root,
    attrName: attrNameTarget.replace(/\[\@|\]/g, '')
  };
};

const getInnerFromQuery = (rawQuery) => {
  return rawQuery.replace(/\>$/, '');
};

module.exports = {
  add: {
    attr: setAttr,
    inner: (fileInfo, query, value) => {
      const root = getInnerFromQuery(query);
      const element = xpath.select1(root, fileInfo.parsed);
      const before = element.innerHTML+'';
      const after = element.innerHTML + value;
      fileInfo.modContent = applyChanges(fileInfo.content, before, after);
      return fileInfo;
    }
  },
  edit: {
    attr: setAttr,
    inner: (fileInfo, query, value) => {
      const root = getInnerFromQuery(query);
      const element = xpath.select1(root, fileInfo.parsed);
      const before = element.innerHTML;
      const after = value;
      fileInfo.modContent = applyChanges(fileInfo.content, before, after);
      return fileInfo;
    }
  },
  remove: {
    attr: (fileInfo, query, value) => {
      const queryInfo = getAttrFromQuery(query);
      const element = xpath.select1(queryInfo.root, fileInfo.parsed);
      const before = element.outerHTML+'';
      element.removeAttribute(queryInfo.attrName);
      const after = element.outerHTML;
      fileInfo.modContent = applyChanges(fileInfo.content, before, after);
      return fileInfo;
    },
    inner: (fileInfo, query, value) => {
      const root = getInnerFromQuery(query);
      const element = xpath.select1(root, fileInfo.parsed);
      const before = element.innerHTML+'';
      const after = xformat(removeWhitespace(element.innerHTML), 0).replace(xformat(removeWhitespace(value), 0), '');
      fileInfo.modContent = applyChanges(fileInfo.content, before, after);
      return fileInfo;
    }
  }
};
