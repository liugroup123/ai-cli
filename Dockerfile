# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ai-cli -u 1001

# Create config directory
RUN mkdir -p /home/ai-cli/.ai-cli && \
    chown -R ai-cli:nodejs /home/ai-cli/.ai-cli

# Switch to non-root user
USER ai-cli

# Set environment variables
ENV NODE_ENV=production
ENV AI_CLI_CONFIG_DIR=/home/ai-cli/.ai-cli

# Expose port (if needed for future web interface)
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["node", "dist/index.js"]

# Default command
CMD ["--help"]
