FROM node:18-alpine

# Install glibc for compatibility with SWC binary
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY ./ ./

ENV NEXT_PUBLIC_API_URL=http://localhost:8000
RUN npm run build

EXPOSE 3000

CMD npm start
