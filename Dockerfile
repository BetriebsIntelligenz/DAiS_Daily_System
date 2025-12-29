FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npx prisma generate --schema=src/pages/schema.prisma
RUN npm run build

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
