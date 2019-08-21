const fs = require('fs');
const pathing = require('path');
const glob = require('glob');
const mkdirp = require('mkdirp');

const createPath = (path) => {
  const directory = pathing.dirname(path);
  // If the directory does not exist, create it
  mkdirp.sync(directory);
  return path;
};

module.exports = {
  isEqual: (value1, value2) => {
    return JSON.stringify(value1) === JSON.stringify(value2);
  },
  formatTimeStamp:() => {
    const timeStamp = new Date();
    return `${timeStamp.getFullYear()}-${timeStamp.getMonth()+1}-${timeStamp.getDate()}-${timeStamp.getHours()}-${timeStamp.getMinutes()}`;
  },
  readFile: (path, parse) => {
    path = pathing.resolve(path);
    const result = fs.readFileSync(path, { encoding: 'utf8' });
    return !parse ? result : JSON.parse(result);
  },
  writeFile: (path, data, parse) => {
    data = !parse ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(createPath(path), data);
  },
  getFileName: (path) => {
    return pathing.basename(path, pathing.extname(path));
  },
  getFilePaths: (sourceFolder, search) => {
    return glob.sync(search, {
      cwd: sourceFolder,
      nosort: true,
      absolute: true
    });
  }
}
