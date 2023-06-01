FROM node:18.16.0

LABEL maintainer="Alex Kirsten"

WORKDIR /app

COPY . .

RUN npm install

RUN npx playwright install-deps
