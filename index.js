const xpath = require('xpath');
const { readFile, parse, getChangeTarget, getRootQueryFromRaw } = require('./internals/helpers');
const operationType = require('./internals/operation-types');
const operationSet = require('./internals/operation-sets');

module.exports = (operation, sourceFilePaths)=> {
  return new Promise((resolve, reject) => {
    const targetType = getChangeTarget(operation.path);

    // Convert jspath into a simple xpath string
    const query = getRootQueryFromRaw(operation.path, targetType);

    let targetFiles = [...sourceFilePaths]
      .map((path) => {
        const fileContent = readFile(path);
        const parsedFileContent = parse(fileContent);

        return {
          path: path,
          content: fileContent,
          modContent: null,
          parsed: parsedFileContent,
          match: !!xpath.select1(query.root, parsedFileContent)
        };
      });

    switch(operation.type) {
      case operationType.ADD:
        targetFiles = targetFiles.filter(i => i.match);
        operationFunc = operationSet.add[targetType];
        break;
      case operationType.REMOVE:
        targetFiles = targetFiles.filter(i => i.match);
        operationFunc = operationSet.remove[targetType];
        break;
      case operationType.EDIT:
        targetFiles = targetFiles.filter(i => i.match);
        operationFunc = operationSet.edit[targetType];
        break;
      default:
        break;
    }

    resolve(targetFiles.map((file) => {
      return operationFunc(file, query.raw, operation.value);
    }));
  });
}