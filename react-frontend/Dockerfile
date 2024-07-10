FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

RUN npm run build

CMD [ "npm", "run", "dev" ]