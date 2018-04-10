# cnode

[![powered by Egg.js][egg-image]][egg]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

[egg-image]: https://img.shields.io/badge/Powered%20By-Egg.js-ff69b4.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/cnodejs/egg-cnode.svg?style=flat-square
[travis-url]: https://travis-ci.org/cnodejs/egg-cnode
[codecov-image]: https://img.shields.io/codecov/c/github/cnodejs/egg-cnode.svg?style=flat-square
[codecov-url]: https://codecov.io/gh/cnodejs/egg-cnode
[david-image]: https://img.shields.io/david/cnodejs/egg-cnode.svg?style=flat-square
[david-url]: https://david-dm.org/cnodejs/egg-cnode
[snyk-image]: https://snyk.io/test/github/cnodejs/egg-cnode/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/github/cnodejs/egg-cnode

## QuickStart

<!-- add docs here for user -->

see [egg docs][egg] for more detail.

### Environment Dependencies

- [redis](https://redis.io/)
- [mongodb](https://www.mongodb.com/)

#### macOS Install

```bash
brew install redis mongodb
brew services start redis
brew services start mongodb
```

#### Linux Install

TBD

#### Windows Install

TBD

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7001/
```

### Deploy

```js 
// {app_root}/config/config.prod.js

exports.mini_assets = true;

exports.alinode = {
  // 从 `Node.js 性能平台` 获取对应的接入参数
  appid: process.env.EGG_ALINODE_APPID || '',
  secret: process.env.EGG_ALINODE_SECRET || '',
};
```

```bash
$ npm i --production
$ npm run assets
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.

### Tutorials

- [Develop / Deploy with Docker](tutorials/Docker.md)

[egg]: https://eggjs.org
