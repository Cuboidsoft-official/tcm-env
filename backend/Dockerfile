FROM node:22-slim

WORKDIR /app

COPY package.json /app/package.json
RUN npm install --omit=dev --no-audit --no-fund

COPY . /app

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "src/server.js"]
