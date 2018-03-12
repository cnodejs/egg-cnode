# cnode

[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

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

#### Develop with docker
Setup redis / mongodb, requirements:

- docker
- docker-compose

```bash
# start
docker-compose -f docker-compose.dev.yml up

# stop 
docker-compose -f docker-compose.dev.yml down

# remove volume/cache
docker-compose -f docker-compose.dev.yml down -v
```

### Deploy

```bash
$ npm start
$ npm stop
```

### npm scripts

- Use `npm run lint` to check code style.
- Use `npm test` to run unit test.
- Use `npm run autod` to auto detect dependencies upgrade, see [autod](https://www.npmjs.com/package/autod) for more detail.


[egg]: https://eggjs.org
