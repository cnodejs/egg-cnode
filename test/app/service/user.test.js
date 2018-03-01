'use strict';

const { app, assert } = require('egg-mock/bootstrap');


describe('user service', () => {

  it('should ok', function() {
    // 创建 ctx
    const ctx = app.mockContext();

    const result = ctx.service.user.makeGravatar('shyvo1987@gmail.com');
    assert(result === 'http://www.gravatar.com/avatar/31b9dfd78b6aa9cefb68129ea21af3bf?size=48');
  });

});
