FROM node:14.17.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p /usr/src/app/uploads && chown -R node:node /usr/src/app/uploads
EXPOSE 3001

CMD ["npm", "run", "dev"]