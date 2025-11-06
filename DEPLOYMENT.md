# 部署指南 - Web 前端版本

本文档介绍如何部署 JiwuChat Web 前端版本到各种托管平台。

## 构建

### 开发环境构建

```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm build
```

构建完成后，静态文件将生成在 `.output/public/` 目录。

### 环境配置

在构建前，确保配置正确的环境变量：

```bash
# .env.production.local
VITE_API_BASE_URL=https://your-api-domain.com/
NUXT_PUBLIC_NODE_ENV=production
```

## 部署到 Netlify

### 方式一：通过 Git 集成

1. 在 Netlify 创建新站点
2. 连接你的 Git 仓库
3. 配置构建设置：
   - **Build command**: `pnpm build`
   - **Publish directory**: `.output/public`
   - **Node version**: 20.x 或更高

4. 设置环境变量：
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/
   NUXT_PUBLIC_NODE_ENV=production
   ```

5. 部署！

### 方式二：手动部署

```bash
# 构建
pnpm build

# 使用 Netlify CLI 部署
npx netlify-cli deploy --prod --dir=.output/public
```

### Netlify 配置文件

创建 `netlify.toml`：

```toml
[build]
  command = "pnpm build"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

## 部署到 Vercel

### 方式一：通过 Git 集成

1. 导入项目到 Vercel
2. Vercel 会自动检测 Nuxt.js 项目
3. 设置环境变量：
   ```
   VITE_API_BASE_URL=https://your-api-domain.com/
   NUXT_PUBLIC_NODE_ENV=production
   ```
4. 部署！

### 方式二：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Vercel 配置文件

创建 `vercel.json`：

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".output/public",
  "framework": "nuxtjs",
  "installCommand": "pnpm install",
  "devCommand": "pnpm dev"
}
```

## 部署到自己的服务器（Nginx）

### 1. 构建项目

```bash
pnpm build
```

### 2. 上传文件

将 `.output/public/` 目录中的所有文件上传到服务器。

### 3. 配置 Nginx

参考项目中的 `nginx.conf` 文件，或使用以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/jiwuchat;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理（可选）
    location /api {
        proxy_pass http://your-backend-server:9090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 启用 HTTPS（推荐）

使用 Certbot 获取免费的 SSL 证书：

```bash
sudo certbot --nginx -d your-domain.com
```

## 部署到 GitHub Pages

### 1. 修改 nuxt.config.ts

```typescript
export default defineNuxtConfig({
  app: {
    baseURL: '/your-repo-name/', // GitHub Pages 子路径
  },
  // ... 其他配置
})
```

### 2. 构建并部署

```bash
# 构建
pnpm build

# 添加 .nojekyll 文件（防止 GitHub Pages 忽略下划线开头的文件）
touch .output/public/.nojekyll

# 部署到 gh-pages 分支
npx gh-pages -d .output/public
```

### 3. 配置 GitHub Pages

在仓库设置中，将 Pages 源设置为 `gh-pages` 分支。

## 部署到 Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 生产镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/.output/public /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t jiwuchat-web .

# 运行容器
docker run -d -p 80:80 --name jiwuchat jiwuchat-web
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

## 部署检查清单

- [ ] 环境变量已正确配置
- [ ] API 地址指向生产环境
- [ ] 构建成功且无错误
- [ ] 静态资源路径正确
- [ ] SPA 路由配置正确
- [ ] CORS 配置正确（如果需要）
- [ ] HTTPS 已启用（推荐）
- [ ] Gzip 压缩已启用
- [ ] 静态资源缓存已配置
- [ ] 安全头部已配置
- [ ] 监控和日志已设置

## 性能优化建议

1. **启用 CDN**: 将静态资源托管到 CDN
2. **压缩**: 启用 Gzip/Brotli 压缩
3. **缓存**: 配置适当的缓存策略
4. **HTTP/2**: 使用 HTTP/2 协议
5. **懒加载**: Nuxt 已自动实现代码分割和懒加载
6. **图片优化**: 使用 WebP 格式，适当压缩

## 常见问题

### Q: 刷新页面出现 404

A: 确保服务器配置了 SPA 路由重写，所有路径都指向 `index.html`。

### Q: 环境变量不生效

A: 环境变量需要在**构建时**设置，不能在运行时修改。

### Q: 静态资源加载失败

A: 检查 `baseURL` 配置是否正确，特别是部署到子目录时。

### Q: API 跨域问题

A: 配置服务器端 CORS，或使用 Nginx 反向代理。

## 技术支持

- 原项目: https://github.com/Kiwi233333/JiwuChat
- QQ群: 939204073

---

最后更新: 2025
