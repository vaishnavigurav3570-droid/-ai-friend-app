# Stage 1: Prune the workspace for the backend
FROM node:22-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@antigravity/backend --docker

# Stage 2: Install dependencies and build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile and package.json's of isolated subworkspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source code of isolated subworkspace
COPY --from=pruner /app/out/full/ .

# Build the project
RUN npx turbo run build --filter=@antigravity/backend

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

# Set Node ENV to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy the built code
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
# We don't need to copy packages/shared/dist because it's just types and Zod schemas 
# that are already compiled into the backend if imported properly, or interpreted at runtime.
# Actually, since it uses TypeScript project references or NodeNext resolution, 
# let's just copy the shared source files just in case the compiled code references them.
COPY --from=builder /app/packages/shared/src ./packages/shared/src

# Set the PORT environment variable expected by Cloud Run
ENV PORT=8080
EXPOSE 8080

# Start the backend server
CMD ["node", "apps/backend/dist/index.js"]
