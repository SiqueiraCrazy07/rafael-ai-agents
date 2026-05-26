FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV RUNTIME_READONLY_MODE=true
ENV RUNTIME_SAFE_MODE=true
ENV RUNTIME_CONTAINER_ROLE=runtime-core

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

USER node
CMD ["node", "runtime/distributed/demo/distributed-runtime-demo.js"]
