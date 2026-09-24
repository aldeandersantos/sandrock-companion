FROM node:22-alpine AS development
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
COPY data/ /app/data/
RUN npm run catalog:build
EXPOSE 80
CMD ["npm", "run", "dev"]

FROM development AS build
RUN npm run build

FROM nginx:1.29-alpine AS production
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
