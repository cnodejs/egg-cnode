FROM node:8.9.4-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN npm i --production

# RUN npm i --production --registry=https://registry.npmmirror.com

COPY . /usr/src/app

RUN npm run assets

EXPOSE 7001

CMD npm run docker
