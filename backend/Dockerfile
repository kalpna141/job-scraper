FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN node --max-old-space-size=256 $(which npm) install --omit=dev
COPY . .

EXPOSE 6000
CMD ["node", "--max-old-space-size=256", "server.js"]
