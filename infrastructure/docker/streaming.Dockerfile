FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV RUNTIME_READONLY_MODE=true
ENV RUNTIME_SAFE_MODE=true
ENV RUNTIME_CONTAINER_ROLE=streaming
ENV RUNTIME_STREAM_LOCAL_ONLY=true

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

USER node
CMD ["node", "runtime/streaming/demo/runtime-streaming-demo.js"]
