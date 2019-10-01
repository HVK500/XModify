const xpath = require('xpath');
const xjs = require('xml-js');
const { createElement } = require('./helpers');

const xformat = (content, spaces) => {
  return xjs.json2xml(
    xjs.xml2json(content),
    {
      spaces: spaces != null ? spaces : 2
    }
  );
};

const applyChanges = (source, original, modified) => {
  return xformat(source.replace(original, modified)).replace(/\&/g, '&amp;');
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

const getFirstTag = (content) => {
  return /(?<=\<)\w+(?=\s*\w*.*\>)/.exec(content)[0];
}

const firstTagExistInSource = (content, source) => {
  const tagWithAttr = /(?<=\<)(\w*(\s\w+\=\".*\")*)(?=[\s\/\>])/.exec(content)[0];
  const commentedTag = new RegExp(`<!--\s*<${tagWithAttr}`);
  return source.includes(tagWithAttr) && !commentedTag.test(source);
};

module.exports = {
  // Add to the existing selected elements structure
  add: {
    // Adds a attribute value by the given name
    attr: (fileInfo, query, value) => {
      const queryInfo = getAttrFromQuery(query);
      const element = xpath.select1(queryInfo.root, fileInfo.parsed);

      // TODO: log why?
      if (!element || element.getAttribute(queryInfo.attrName) === value) return fileInfo;

      const before = element.outerHTML+'';
      element.setAttribute(queryInfo.attrName, value);
      const after = element.outerHTML;

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    },
    inner: (fileInfo, query, value) => {
      // TODO: check value structure
      const root = getInnerFromQuery(query);
      const valueElement = createElement(value);
      const element = xpath.select1(root, fileInfo.parsed);

      // TODO: log why?
      if (!element || firstTagExistInSource(value, element.innerHTML)) return fileInfo;

      const before = element.outerHTML+'';
      element.append(valueElement);
      const after = element.outerHTML
        .replace(/\sxmlns=\"http\:\/\/www\.w3\.org\/1999\/xhtml\"/g, '')
        .replace(new RegExp(`(?<=[\\/\\<])${valueElement.localName}`, 'g'), getFirstTag(value));

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    }
  },
  edit: {
    // Changes a attribute value by the given name
    attr: (fileInfo, query, value) => {
      const queryInfo = getAttrFromQuery(query);
      const element = xpath.select1(queryInfo.root, fileInfo.parsed);

      // TODO: log why?
      if (!element) return fileInfo;

      const before = element.outerHTML+'';
      element.setAttribute(queryInfo.attrName, value);
      const after = element.outerHTML;

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    },
    // Slots in a given value in to selected element structure
    inner: (fileInfo, query, value) => {
      const root = getInnerFromQuery(query);
      const element = xpath.select1(root, fileInfo.parsed);

      // TODO: log why?
      if (!element) return fileInfo;

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

      // TODO: log why?
      if (!element) return fileInfo;

      const before = element.outerHTML+'';
      element.removeAttribute(queryInfo.attrName);
      const after = element.outerHTML;

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    },
    inner: (fileInfo, query) => {
      const root = getInnerFromQuery(query);
      const element = xpath.select1(root, fileInfo.parsed);

      // TODO: log why?
      if (!element) return fileInfo;

      const before = element.innerHTML+'';
      const after = '';

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    }
  }
};
