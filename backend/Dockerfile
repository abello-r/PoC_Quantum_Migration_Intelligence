FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache git openssl

FROM base AS deps
COPY package*.json ./
RUN npm install

FROM deps AS build
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache git wget
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
