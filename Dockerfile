# Use Node.js 18 Alpine (lightweight)
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start dev server with hot reload
CMD ["pnpm", "run", "dev"]

##----- docker compose up --build
##----- docker build -t anyName .

