FROM node:18-alpine As development

WORKDIR /usr/src/app/frontend

COPY package.json ./
COPY yarn.lock ./
COPY ./ ./

# Expose port to access server
EXPOSE 3000

RUN yarn

#Fix EACCESS: permissions error
RUN chown -R node.node /usr/src/app/frontend

CMD ["npm", "run", "start"]