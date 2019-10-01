const xpath = require('xpath');
const xbeauty = require('xml-beautifier');

const applyChanges = (source, original, modified) => {
  return xbeauty(source.replace(original, modified), '  ');
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
    attr: (fileInfo, query) => {
      const queryInfo = getAttrFromQuery(query);
      const element = xpath.select1(queryInfo.root, fileInfo.parsed);
      const before = element.outerHTML+'';
      element.removeAttribute(queryInfo.attrName);
      const after = element.outerHTML;
      fileInfo.modContent = applyChanges(fileInfo.content, before, after);
      return fileInfo;
    },
    inner: (fileInfo, query) => {
      const root = getInnerFromQuery(query);
      const element = xpath.select1(root, fileInfo.parsed);
      const before = element.innerHTML+'';
      const after = '';
      fileInfo.modContent = applyChanges(fileInfo.content, before, after);
      return fileInfo;
    }
  }
};
