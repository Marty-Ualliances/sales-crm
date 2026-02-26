FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build
RUN npm install -g tsx

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx tsx server/index.ts & exec npx next start -H 0.0.0.0"]
