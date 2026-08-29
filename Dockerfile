FROM node:22-bookworm-slim

# Install OpenSSL for Prisma and clean cache
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install project dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3002

# Push database schema migrations and launch Express server on startup
CMD ["sh", "-c", "npx prisma db push && node src/server.js"]







