FROM node:20 as builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Debug: Check if build was successful
RUN ls -la dist/

FROM nginx:alpine

# Install curl for debugging
RUN apk add --no-cache curl

# Copy the built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Debug: Check contents of nginx directory
RUN ls -la /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
