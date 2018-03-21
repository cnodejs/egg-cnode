# Docker

[![Docker Automated build][docker-build-image]][docker-build-url] [![Docker Stars][docker-star-image]][docker-star-url] [![Docker pulls][docker-pull-image]][docker-pull-url]

[docker-build-image]: https://img.shields.io/docker/automated/cnode/egg-cnode.svg
[docker-build-url]: https://github.com/cnode/egg-cnode/
[docker-star-image]: https://img.shields.io/docker/stars/cnode/egg-cnode.svg
[docker-star-url]: https://registry.hub.docker.com/v2/repositories/cnode/egg-cnode/stars/count/
[docker-pull-image]: https://img.shields.io/docker/pulls/cnode/egg-cnode.svg
[docker-pull-url]: https://registry.hub.docker.com/v2/repositories/cnode/egg-cnode/

## Requirements

- docker
- docker-compose

## Config

**Compose**

- docker-compose.dev.yml
- docker-compose.yml

**Modify Github Id/Secret**

```yml
version: '3'
services: 
  cnode:
    environment:
      - EGG_PASSPORT_GITHUB_CLIENT_ID=test
      - EGG_PASSPORT_GITHUB_CLIENT_SECRET=test
```

**Modify Alinode AppId/Secret**

```yml
version: '3'
services: 
  cnode:
    environment:
      - EGG_ALINODE_APPID=appid
      - EGG_ALINODE_SECRET=secret
```

> to disable alinode, modify config/plugin.prod.js

**Change Port**

```yml
version: '3'
services: 
  cnode:
    ports:
      - ${PORT}:7001
```

## Develop

Setup redis / mongodb / egg-cnode

```bash
# start
docker-compose -f docker-compose.dev.yml up

# stop
docker-compose -f docker-compose.dev.yml down

# remove volume/cache
docker-compose -f docker-compose.dev.yml down -v
```

**Develop**:

```bash
export EGG_REDIS_PASSWORD=egg_cnode
export EGG_MONGODB_URL=mongodb://egg_cnode:egg_cnode@127.0.0.1:27017/egg_cnode
export EGG_PASSPORT_GITHUB_CLIENT_ID=${id}
export EGG_PASSPORT_GITHUB_CLIENT_SECRET=${secret}

npm i
npm run dev
```

## Deploy

Modify docker-compose.yml

**Run / Stop**

```bash
# start
docker-compose up -d

# stop
docker-compose down

# remove volume/cache
docker-compose down -v
```
