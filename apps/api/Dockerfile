FROM node:20-bookworm-slim As development

WORKDIR /usr/src/app/backend

COPY package.json yarn.lock ./

RUN yarn install \
  && yarn playwright install --with-deps chromium

COPY . .

# Expose port to access server
EXPOSE 8080

RUN yarn build

FROM node:20-bookworm-slim As production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app/backend

COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile \
  && yarn playwright install --with-deps chromium

COPY . .

COPY --from=development /usr/src/app/backend/dist ./dist

CMD ["node", "dist/src/main"]
