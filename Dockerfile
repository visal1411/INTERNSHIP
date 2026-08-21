FROM node:18-slim

WORKDIR /app

# Install system dependencies for node-canvas or other native modules if ever needed
# RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3002

CMD ["node", "server.js"]
