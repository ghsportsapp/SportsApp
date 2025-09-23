# Use Node.js 20 as the base image
FROM node:20-alpine

# Install system dependencies (including curl for health checks)
RUN apk add --no-cache python3 make g++ postgresql-client curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies first (for better caching)
RUN npm install

# Copy Google Cloud credentials
COPY angad-project-472410-b656ceba9017.json ./

# Copy the rest of the application
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Start the application
CMD ["npm", "start"]
