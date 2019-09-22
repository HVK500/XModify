const gulp = require('gulp');
const xpath = require('xpath');
const jsDom = require('jsdom').JSDOM;
const { readFile, writeFile } = require('./internals/helpers');

gulp.task('main', () => {
  // Inputs
  const replacementValue = 'foo';
  const operationType = 'edit';
  const rawQuery = '$>configuration>system.webServer>httpProtocol>';//'$>>add[@name="foo"]|[@connectionString]';
  const xmlContent = readFile('./data/MockWeb.config');
  // Inputs


  // State values of what the query wants
  const targetInner = /\>$/.test(rawQuery);
  const targetAttr = /\|\[\@[A-z]{1,}\]$/.test(rawQuery);

  if (!targetInner && !targetAttr) {
    console.log('No actual target specified!');
    return;
  }

  // Convert jspath into a simple xpath string
  // Split to get the attribute target
  let processedQuery = rawQuery.replace('$', '').replace(/(?=.)\>(?=.)/g, '/');
  const document = new (new jsDom()).window.DOMParser().parseFromString(xmlContent, 'text/xml');
  let found;
  let oldFoundMarkup;
  let newMarkup;

  // TODO: Move to processor module
  // Attribute edit logic
  if (targetAttr) {
    let [ rootQuery, returnAttrNameTarget ] = processedQuery.split('|');
    returnAttrNameTarget = returnAttrNameTarget.replace(/\[\@|\]/g, '');

    found = xpath.select1(rootQuery, document);

    if (!found) {
      console.log('No result!');
      return;
    } else {
      oldFoundMarkup = found.outerHTML+'';
    }

    found.setAttribute(returnAttrNameTarget, replacementValue);

    newMarkup = found.outerHTML;
  }

  // TODO: Move to processor module
  // Inner xml content edit logic
  if (targetInner) {
    const rootQuery = processedQuery.replace(/\>$/, '');
    found = xpath.select1(rootQuery, document);

    if (!found) {
      console.log('No result!');
      return;
    }

    oldFoundMarkup = found.innerHTML;
    newMarkup = replacementValue;
  }

  writeFile('./_.xml', xmlContent.replace(oldFoundMarkup, newMarkup));
});
