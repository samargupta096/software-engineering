[🏠 Home](./README.md) | [➡️ Kubernetes](./kubernetes/kubernetes-guide.md)

# Ultimate Docker Learning Guide

This guide provides a comprehensive, deep dive into Docker, Docker Compose, and Dockerfiles. It covers everything from core concepts to advanced production patterns.

---

## Table of Contents
1. [Introduction to Docker](#1-introduction-to-docker)
2. [Dockerfile Deep Dive](#2-dockerfile-deep-dive)
3. [Docker Compose Deep Dive](#3-docker-compose-deep-dive)
4. [Networking & Storage](#4-networking--storage)
5. [Best Practices & Optimization](#5-best-practices--optimization)
6. [Cheatsheet](#6-cheatsheet)

---

## 1. Introduction to Docker

### Core Concepts

*   **Container**: A lightweight, standalone, executable package of software that includes everything needed to run an application: code, runtime, system tools, system libraries, and settings. Think of it as a standardized "shipping container" for code.
*   **Image**: A read-only template with instructions for creating a Docker container. Often based on another image, with some additional customization.
*   **Docker Daemon (dockerd)**: The background service running on the host that manages Docker objects.
*   **Docker Client (docker)**: The command-line tool you use to talk to the Docker Daemon.
*   **Registry**: A repository for storing Docker images (e.g., Docker Hub, AWS ECR).

### Architecture
Docker uses a client-server architecture. The client talks to the daemon, which does the heavy lifting of building, running, and distributing your containers.

---

## 2. Dockerfile Deep Dive

A `Dockerfile` is a text document that contains all the commands a user could call on the command line to assemble an image.

### Syntax Reference

| Instruction | Description | Example |
| :--- | :--- | :--- |
| `FROM` | **Required**. Sets the Base Image. | `FROM node:18-alpine` |
| `WORKDIR` | Sets the working directory for subsequent instructions. | `WORKDIR /app` |
| `COPY` | Copies new files or directories from `<src>` to `<dest>`. | `COPY package.json .` |
| `ADD` | Similar to COPY but can also handle remote URLs and extract tarballs. | `ADD https://example.com/file.tar.gz .` |
| `RUN` | Executes commands *during the build process* (creates a new layer). | `RUN npm install` |
| `CMD` | *Default* command to run when the container starts. Can be overridden. | `CMD ["node", "app.js"]` |
| `ENTRYPOINT`| Configures a container that will run as an executable. Harder to override. | `ENTRYPOINT ["/bin/my-app"]` |
| `ENV` | Sets environment variables. | `ENV NODE_ENV=production` |
| `EXPOSE` | Informs Docker that the container listens on the specified port. | `EXPOSE 8080` |
| `USER` | Sets the user ID (UID) or user name to run the image as. | `USER node` |
| `VOLUME` | Creates a mount point with a specified name. | `VOLUME /data` |

### Multi-Stage Builds (Crucial for Production)
Drastically reduce image size by separating the build environment from the runtime environment.

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

---

## 3. Docker Compose Deep Dive

`docker-compose.yml` allows you to define and run multi-container Docker applications.

### Key Concepts
*   **Services**: The containers that make up your app (e.g., `web`, `database`).
*   **Networks**: How services talk to each other.
*   **Volumes**: Persistent data storage.

### Anatomy of `docker-compose.yml`

```yaml
version: '3.8'  # Optional in newer versions

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=secret
    depends_on:
      - postgres
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  db-data:
```

### Useful Compose Commands
*   `docker compose up -d`: Start services in detached mode (background).
*   `docker compose down`: Stop and remove containers, networks.
*   `docker compose logs -f`: Follow logs.
*   `docker compose exec app sh`: Shell into the 'app' service.
*   `docker compose build --no-cache`: Rebuild images from scratch.

---

## 4. Networking & Storage

### Networking Patterns
1.  **Bridge (Default)**: Private internal network on lines created by Docker. Containers on the same bridge network can reach each other by service name.
2.  **Host**: Removes network isolation between the container and the Docker host. `network_mode: host`.
3.  **None**: No networking.

### Storage: Volumes vs. Bind Mounts

| Type | Description | Use Case |
| :--- | :--- | :--- |
| **Volume** | Managed by Docker (`/var/lib/docker/volumes/...`). Persists after container deletion. | Databases, persistent app data. Preferred for production. |
| **Bind Mount** | A file or directory on the *host machine* is mounted into the container. | Development (live code reloading). |

**Bind Mount Example (in Compose):**
```yaml
services:
  app:
    volumes:
      - ./src:/app/src  # Syncs local ./src to container /app/src
```

---

## 5. Best Practices & Optimization

1.  **Use `.dockerignore`**: Exclude `node_modules`, `.git`, temporary files to speed up builds and reduce context size.
    ```text
    node_modules
    .git
    Dockerfile
    .env
    ```

2.  **Order Matters (Layer Caching)**: Put instructions that change less frequently (installing dependencies) *before* instructions that change often (copying source code).
    *   *Bad*:
        ```dockerfile
        COPY . .
        RUN npm install
        ```
    *   *Good*:
        ```dockerfile
        COPY package.json .
        RUN npm install
        COPY . .
        ```

3.  **Least Privilege**: Don't run as `root`. Create a user or use built-in users (like `node` in Node images).
    ```dockerfile
    USER node
    ```

4.  **Pin Versions**: Never use `latest` tag in production. Use specific versions (e.g., `node:18.16.0-alpine`) to ensure reproducibility.

5.  **Healthchecks**: Define how Docker checks if your container is healthy.
    ```yaml
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    ```

---

## 6. Cheatsheet

### Images
*   `docker build -t myapp:1.0 .`: Build an image.
*   `docker images`: List images.
*   `docker rmi <image_id>`: Remove an image.
*   `docker system prune`: Clean up unused images, containers, and networks.

### Containers
*   `docker run -p 8080:80 -d myapp`: Run mapped port 8080, detached.
*   `docker ps`: List running containers.
*   `docker ps -a`: List all containers (including stopped).
*   `docker stop <container_id>`: Stop a container.
*   `docker rm <container_id>`: Remove a container.
*   `docker logs <container_id>`: View logs.
*   `docker exec -it <container_id> /bin/bash`: Interactive shell inside container.

### Debugging
*   `docker inspect <id>`: Low-level info (IP address, mounts, env vars).
*   `docker stats`: Live stream of CPU/Memory usage.
