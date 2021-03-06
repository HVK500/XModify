const {
  readFile,
  parse,
  getChangeTargetType,
  selectToRootAndRaw
} = require('./internals/helpers');
const xpath = require('xpath');
const getOperationFunction = require('./internals/operation-sets');

module.exports = (operation, sourceFilePaths) => {
  return new Promise((resolve) => {
    let select;
    let operationFunc;

    try {
      const targetType = getChangeTargetType(operation.select);
      select = selectToRootAndRaw(
        operation.select,
        targetType
      );
      operationFunc = getOperationFunction(
        operation.type,
        targetType
      );
    } catch (error) {
      console.log(error, operation);
      return resolve([]);
    }

    const targetFiles = sourceFilePaths.map((path) => {
      const fileContent = readFile(path);
      const parsedFileContent = parse(fileContent);

      return {
        path: path,
        content: fileContent,
        modContent: null,
        parsed: parsedFileContent,
        match: !!xpath.select1(select.root, parsedFileContent)
      };
    }).filter(fileInfo => fileInfo.match);

    if (targetFiles.length === 0) {
      return resolve([]);
    }

    resolve(targetFiles.map((fileInfo) => {
      return operationFunc(fileInfo, select.raw, operation.value);
    }).filter(i => i.modContent !== null));
  });
}