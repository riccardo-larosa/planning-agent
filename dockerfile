FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Create a volume for persisting plans
VOLUME /app/plans

# Define the entrypoint
ENTRYPOINT ["node", "dist/index.js"]

# Default command (show help)
CMD []