# SDLC Companion

SDLC Companion is a comprehensive tool designed to assist with the entire Software Development Life Cycle, from requirements gathering to CI/CD pipeline generation.

## Features

- Requirements management
- System architecture design
- Component diagrams
- Specification generation
- Code generation
- Test case generation
- CI/CD pipeline configuration
- Documentation generation
- AI-assisted development

## Local Installation

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL database (or Supabase account)
- OpenAI API key

### Setup Steps

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/sdlc-companion.git
   cd sdlc-companion
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Create a `.env.local` file in the root directory with the following variables:
   \`\`\`
   # Database Configuration
   POSTGRES_URL=postgres://postgres:password@localhost:5432/sdlc_companion
   POSTGRES_PRISMA_URL=postgres://postgres:password@localhost:5432/sdlc_companion?pgbouncer=true&connect_timeout=15
   POSTGRES_URL_NON_POOLING=postgres://postgres:password@localhost:5432/sdlc_companion
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DATABASE=sdlc_companion
   POSTGRES_HOST=localhost

   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # AI Services
   OPENAI_API_KEY=your-openai-api-key
   DEEPSEEK_API_KEY=your-deepseek-api-key

   # Application Configuration
   NEXT_PUBLIC_DOMAIN=http://localhost:3000
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your machine
- OpenAI API key
- Supabase account (optional)

### Using Docker Compose

1. Create a `docker-compose.yml` file in the root directory:

\`\`\`yaml
version: '3'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - POSTGRES_URL=${POSTGRES_URL}
      - POSTGRES_PRISMA_URL=${POSTGRES_PRISMA_URL}
      - POSTGRES_URL_NON_POOLING=${POSTGRES_URL_NON_POOLING}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DATABASE=${POSTGRES_DATABASE}
      - POSTGRES_HOST=${POSTGRES_HOST}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - NEXT_PUBLIC_DOMAIN=${NEXT_PUBLIC_DOMAIN}
    restart: always

  # Uncomment if you want to use a local PostgreSQL database
  # db:
  #   image: postgres:15
  #   ports:
  #     - "5432:5432"
  #   environment:
  #     - POSTGRES_USER=postgres
  #     - POSTGRES_PASSWORD=password
  #     - POSTGRES_DB=sdlc_companion
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   restart: always

# volumes:
#   postgres_data:
\`\`\`

2. Create a Dockerfile in the root directory:

```dockerfile
# Use Node.js as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct permissions
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Set the environment variable for the port
ENV PORT 3000

# Start the application
CMD ["node", "server.js"]
