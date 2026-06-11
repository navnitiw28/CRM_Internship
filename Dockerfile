FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install --include=optional
COPY . .
WORKDIR /app/backend
RUN npm run build
WORKDIR /app/frontend
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5000 5173
CMD ["sh", "-c", "cd /app/backend && node dist/index.js"]
