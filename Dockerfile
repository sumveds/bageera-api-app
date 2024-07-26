################################
# BUILD FOR LOCAL DEVELOPMENT
################################

# Base image
FROM node:19-alpine As development

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY --chown=node:node package*.json ./

# Install app dependencies
RUN npm ci

# Bundle app source
COPY --chown=node:node . .

USER node

#########################
# BUILD FOR PRODUCTION
#########################

# Base image
FROM node:19-alpine As build

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Creates a "dist" folder with the production build
RUN npm run build

# To take advantage of the optimizations built in 
# when the NODE_ENV environment variable is set to production.
ENV NODE_ENV production

# Install app dependencies
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:19-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD [ "node", "dist/main.js" ]
