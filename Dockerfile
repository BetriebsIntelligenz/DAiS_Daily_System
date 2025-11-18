FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
