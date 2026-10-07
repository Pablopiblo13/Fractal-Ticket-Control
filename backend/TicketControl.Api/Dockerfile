# Etapa 1: Construir el Frontend de Angular
FROM node:18-alpine AS build-frontend
WORKDIR /app/frontend
COPY Frontend/ticket-control-app/package*.json ./
RUN npm install
COPY Frontend/ticket-control-app/ ./
RUN npm run build -- --configuration production

# Etapa 2: Construir el Backend de .NET
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-backend
WORKDIR /app
COPY . .
# Copiar los archivos compilados de Angular a la carpeta wwwroot del proyecto .NET
COPY --from=build-frontend /app/frontend/dist/ticket-control-app/browser/ ./backend/TicketControl.Api/wwwroot/
WORKDIR /app/backend/TicketControl.Api
RUN dotnet publish -c Release -o /out

# Etapa 3: Imagen final para ejecución
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build-backend /out ./
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "TicketControl.Api.dll"]