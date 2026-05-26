FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV RUNTIME_READONLY_MODE=true
ENV RUNTIME_SAFE_MODE=true
ENV RUNTIME_CONTAINER_ROLE=gateway
ENV RUNTIME_GATEWAY_PUBLIC=false

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY . .

USER node
CMD ["node", "api/gateway/demo/runtime-api-gateway-demo.js"]
