FROM node:18-alpine

WORKDIR /app


COPY package*.json ./


RUN npm install --production


COPY . .


EXPOSE 3001

# Health checkHEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/create-session', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "index.js"]