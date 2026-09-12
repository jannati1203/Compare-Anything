# Stage 1: Build ASP.NET Core 10 Web API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["backend/backend.csproj", "backend/"]
RUN dotnet restore "backend/backend.csproj"

# Copy backend source files
COPY backend/ backend/
WORKDIR "/src/backend"

# Build and publish Release artifacts
RUN dotnet publish "backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Production Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Render injects $PORT (default to 8080)
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "CompareAnything.Backend.dll"]
