FROM node:20-alpine As development

WORKDIR /usr/src/app/backend

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

# Expose port to access server
EXPOSE 8080

RUN yarn build

FROM node:20-alpine As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app/backend

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile

COPY . .

COPY --from=development /usr/src/app/backend/dist ./dist

CMD ["node", "dist/src/main"]
