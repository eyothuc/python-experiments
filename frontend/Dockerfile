FROM node:18-alpine

# Install glibc for compatibility with SWC binary
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./ ./

EXPOSE 3000

CMD npm run dev
