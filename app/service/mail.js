'use strict';

const Service = require('egg').Service;
const mailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');


class MailService extends Service {
  async sendMail(data) {
    const { config, logger } = this;

    if (config.debug) {
      return;
    }

    const transporter = mailer.createTransport(smtpTransport(config.mail_opts));

    for (let i = 1; i < 6; i++) {
      try {
        await transporter.sendMail(data);
        logger.info('send mail success', data);
        break;
      } catch (err) {
        if (i === 5) {
          logger.error('send mail finally error', err, data);
          throw new Error(err);
        }
        logger.error('send mail error', err, data);
      }
    }
  }

  async sendActiveMail(who, token, name) {
    const { config } = this;
    const from = `${config.name} <${config.mail_opts.auth.user}>`;
    const to = who;
    const subject = config.name + '社区帐号激活';
    const html = '<p>您好：' + name + '</p>' +
    '<p>我们收到您在' + config.name + '社区的注册信息，请点击下面的链接来激活帐户：</p>' +
    '<a href  = "' + config.host + '/active_account?key=' + token + '&name=' + name + '">激活链接</a>' +
    '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
    '<p>' + config.name + '社区 谨上。</p>';

    await this.sendMail({
      from,
      to,
      subject,
      html,
    });
  }


  async sendResetPassMail(who, token, name) {
    const { config } = this;
    const from = `${config.name} <${config.mail_opts.auth.user}>`;
    const to = who;
    const subject = config.name + '社区密码重置';
    const html = '<p>您好：' + name + '</p>' +
    '<p>我们收到您在' + config.name + '社区重置密码的请求，请在24小时内单击下面的链接来重置密码：</p>' +
    '<a href="' + config.host + '/reset_pass?key=' + token + '&name=' + name + '">重置密码链接</a>' +
    '<p>若您没有在' + config.name + '社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>' +
    '<p>' + config.name + '社区 谨上。</p>';

    await this.sendMail({
      from,
      to,
      subject,
      html,
    });
  }
}

module.exports = MailService;

