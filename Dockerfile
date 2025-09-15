FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for tsx)
RUN npm ci && \
    npm cache clean --force

# Copy source code and necessary files
COPY src ./src
COPY src/locales ./src/locales
COPY src/assets ./src/assets
COPY tsconfig.json ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the bot with tsx
CMD ["npx", "tsx", "src/index.ts"]