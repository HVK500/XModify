const {
  applyChanges,
  createElement,
  doesFirstTagExist,
  selectToRootAndAttr,
  extractFirstTagName,
  selectToRootInner
} = require('./helpers');
const {
  operations: operationTypes,
  targets: targetTypes
} = require('./types');
const xpath = require('xpath');

const operationSet = {
  add: {
    // Adds a attribute value by the given name
    attr: (fileInfo, select, value) => {
      const selectInfo = selectToRootAndAttr(select);
      const element = xpath.select1(selectInfo.root, fileInfo.parsed);

      if (!element || element.getAttribute(selectInfo.attrName) === value) return fileInfo;

      const before = element.outerHTML + '';
      element.setAttribute(selectInfo.attrName, value);
      const after = element.outerHTML;

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    },
    // Add to the existing selected elements structure
    inner: (fileInfo, select, value) => {
      const root = selectToRootInner(select);
      const valueElement = createElement(value);
      const element = xpath.select1(root, fileInfo.parsed);

      if (!element || doesFirstTagExist(value, element.innerHTML)) return fileInfo;

      const before = element.outerHTML + '';
      element.append(valueElement);
      const after = element.outerHTML
        .replace(/\sxmlns=\"http\:\/\/www\.w3\.org\/1999\/xhtml\"/g, '')
        .replace(new RegExp(`(?<=[\\/\\<])${valueElement.localName}`, 'g'), extractFirstTagName(value));

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    }
  },
  edit: {
    // Changes a attribute value by the given name
    attr: (fileInfo, select, value) => {
      const selectInfo = selectToRootAndAttr(select);
      const element = xpath.select1(selectInfo.root, fileInfo.parsed);

      if (!element) return fileInfo;

      const before = element.outerHTML + '';
      element.setAttribute(selectInfo.attrName, value);
      const after = element.outerHTML;

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    }
  },
  remove: {
    // Removes a targetted attribute
    attr: (fileInfo, select) => {
      const selectInfo = selectToRootAndAttr(select);
      const element = xpath.select1(selectInfo.root, fileInfo.parsed);

      if (!element) return fileInfo;

      const before = element.outerHTML + '';
      element.removeAttribute(selectInfo.attrName);
      const after = element.outerHTML;

      fileInfo.modContent = applyChanges(fileInfo.content, before, after);

      return fileInfo;
    },
    // Removes a targetted node(s)
    inner: (fileInfo, select) => {
      const root = selectToRootInner(select);
      const element = xpath.select1(root, fileInfo.parsed);

      if (!element) return fileInfo;

      fileInfo.modContent = applyChanges(fileInfo.content, element.outerHTML, '');

      return fileInfo;
    }
  }
};

module.exports = (operationType, targetType) => {
  switch (operationType) {
    case operationTypes.ADD:
      return operationSet.add[targetType];
    case operationTypes.REMOVE:
      return operationSet.remove[targetType];
    case operationTypes.EDIT:
      if (targetType === targetTypes.INNER) {
        throw 'Inner node edits are not supported.';
      }
      return operationSet.edit.attr;
    default:
      throw 'No compatible operation provided.';
  }
};