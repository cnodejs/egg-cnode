'use strict';

const Service = require('egg').Service;
class AtService extends Service {
  /**
   * 从文本中提取出@username 标记的用户名数组
   * @param {String} text 文本内容
   * @return {Array} 用户名数组
   */
  fetchUsers(text) {
    if (!text) {
      return [];
    }

    const ignoreRegexs = [
      /```.+?```/g, // 去除单行的 ```
      /^```[\s\S]+?^```/gm, // ``` 里面的是 pre 标签内容
      /`[\s\S]+?`/g, // 同一行中，`some code` 中内容也不该被解析
      /^ {4}.*/gm, // 4个空格也是 pre 标签，在这里 . 不会匹配换行
      /\b\S*?@[^\s]*?\..+?\b/g, // somebody@gmail.com 会被去除
      /\[@.+?\]\(\/.+?\)/g, // 已经被 link 的 username
    ];

    ignoreRegexs.forEach(ignore_regex => {
      text = text.replace(ignore_regex, '');
    });

    const results = text.match(/@[a-z0-9\-_]+\b/gim);
    const names = [];
    if (results) {
      for (let i = 0, l = results.length; i < l; i++) {
        let s = results[i];
        // remove leading char @
        s = s.slice(1);
        names.push(s);
      }
    }
    return [
      ...new Set(names),
    ];
  }

  /*
   * 根据文本内容中读取用户，并发送消息给提到的用户
   * @param {String} text 文本内容
   * @param {String} topicId 主题ID
   * @param {String} authorId 作者ID
   * @param {String} type 回复类型
   * @param {String} reply_id 回复ID
   */
  async sendMessageToMentionUsers(text, topicId, authorId, reply_id = null) {
    let users = await this.service.user.getUsersByNames(this.fetchUsers(text));

    users = users.filter(user => {
      return !user._id.equals(authorId);
    });

    return Promise.all(
      users.map(user => {
        return this.service.message.sendAtMessage(
          user._id,
          authorId,
          topicId,
          reply_id
        );
      })
    );
  }

  /**
   * 根据文本内容，替换为数据库中的数据
   * @param {String} text 文本内容
   * @return {String} 替换后的文本内容
   */
  linkUsers(text) {
    const users = this.fetchUsers(text);
    for (let i = 0; i < users.length; i++) {
      const name = users[i];
      text = text.replace(
        new RegExp('@' + name + '\\b(?!\\])', 'g'),
        '[@' + name + '](/user/' + name + ')'
      );
    }
    return text;
  }
}

module.exports = AtService;
