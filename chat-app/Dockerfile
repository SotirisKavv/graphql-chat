FROM node:14
WORKDIR /chat-app
COPY package.json .
RUN yarn install
COPY . .
CMD yarn dev
