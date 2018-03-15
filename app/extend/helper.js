'use strict';

const MarkdownIt = require('markdown-it');
const validator = require('validator');
const jsxss = require('xss');
const moment = require('moment');
const bcrypt = require('bcryptjs');

moment.locale('zh-cn'); // 使用中文

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
  onIgnoreTagAttr(tag, name, value) {
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

exports.ago = function(date) {
  date = moment(date);

  return date.fromNow();
};

exports.validateId = str => {
  return /^[a-zA-Z0-9\-_]+$/i.test(str);
};

exports.bhash = str => {
  return bcrypt.hashSync(str, 10);
};

exports.bcompare = (str, hash) => {
  return bcrypt.compareSync(str, hash);
};
