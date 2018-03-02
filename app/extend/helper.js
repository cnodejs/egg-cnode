/* !
 * nodeclub - common/render_helpers.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

const MarkdownIt = require('markdown-it');
const validator = require('validator');
const jsxss = require('xss');

// Set default options
const md = new MarkdownIt();

md.set({
  html: false, // Enable HTML tags in source
  xhtmlOut: false, // Use '/' to close single tags (<br />)
  breaks: false, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable smartypants and other sweet transforms
});

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  let language = (token.info && 'language-' + token.info) || '';
  language = validator.escape(language);

  return (
    '<pre class="prettyprint ' +
    language +
    '">' +
    '<code>' +
    validator.escape(token.content) +
    '</code>' +
    '</pre>'
  );
};

md.renderer.rules.code_block = (tokens, idx /* , options */) => {
  const token = tokens[idx];

  return (
    '<pre class="prettyprint">' +
    '<code>' +
    validator.escape(token.content) +
    '</code>' +
    '</pre>'
  );
};

const myxss = new jsxss.FilterXSS({
  onIgnoreTagAttr(tag, name, value, isWhiteAttr) {
    // 让 prettyprint 可以工作
    if (tag === 'pre' && name === 'class') {
      return name + '="' + jsxss.escapeAttrValue(value) + '"';
    }
  },
});

exports.markdown = text => {
  return (
    '<div class="markdown-text">' +
    myxss.process(md.render(text || '')) +
    '</div>'
  );
};

exports.escapeSignature = signature => {
  return signature
    .split('\n')
    .map(p => {
      return validator.escape(p);
    })
    .join('<br>');
};

exports.staticFile = function(filePath) {
  if (filePath.indexOf('http') === 0 || filePath.indexOf('//') === 0) {
    return filePath;
  }
  return this.app.config.site_static_host + filePath;
};

exports.tabName = function(tab) {
  const pair = this.app.config.tabs.find(pair => {
    return pair[0] === tab;
  });
  if (pair) {
    return pair[1];
  }
};

exports.proxy = function(url) {
  return url;
  // 当 google 和 github 封锁严重时，则需要通过服务器代理访问它们的静态资源
  // return '/agent?url=' + encodeURIComponent(url);
};
