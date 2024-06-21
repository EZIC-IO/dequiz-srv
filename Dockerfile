### Base
FROM node:lts-alpine as base

# Add system libs
RUN apk --no-cache add tzdata curl

# Install pnpm
RUN npm install -g pnpm

# Set env for node
ENV NODE_ENV=development
# Create application folder
# WORKDIR can`t create folder with given user:group
# So, we will create it ourselves
RUN mkdir /app && chown -R node:node /app

# Open port
EXPOSE 3030

# Set default folder to /app
WORKDIR /app

# Node.js image comes with user node so let`s switch
USER node

# Copy dependencies describing files
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Install runtime dependencies
RUN pnpm i --frozen-lockfile


### Builder
FROM base as builder

# Copy application source code
COPY --chown=node:node . ./

# Build application
RUN pnpm build


### Runtime
FROM base as runtime
# Copy runtime dependencies
COPY --chown=node:node --from=base /app/node_modules ./node_modules
# Fix layer not found issue
RUN true
# Copy compiled application
COPY --chown=node:node --from=builder /app/dist ./dist

# Setup entry point
CMD [ "node", "dist/main.js" ]