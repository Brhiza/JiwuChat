# JiwuChat - Web Frontend Only Version

这是 JiwuChat 的纯 Web 前端精简版本，移除了所有 Tauri 桌面端依赖。

## 主要变更

### 移除的功能
- ✖️ Tauri 桌面端支持（Windows/macOS/Linux）
- ✖️ Android/iOS 移动端支持
- ✖️ 系统托盘集成
- ✖️ 桌面通知
- ✖️ 多窗口管理
- ✖️ 本地文件系统访问
- ✖️ 自动更新功能

### 保留的功能
- ✅ 完整的 Web 聊天功能
- ✅ 实时消息通信
- ✅ AI 群聊机器人
- ✅ WebRTC 音视频通话
- ✅ 屏幕共享
- ✅ 多种消息类型（文本、图片、文件、语音）
- ✅ 群聊功能
- ✅ 主题切换（浅色/深色）
- ✅ 响应式设计

## 技术栈

- **框架**: Nuxt.js 4.0.3 (Vue 3 + TypeScript)
- **UI 组件**: Element Plus 2.11.2
- **样式**: UnoCSS + SCSS
- **状态管理**: Pinia 3.0.3
- **Markdown 编辑器**: md-editor-v3 5.8.4
- **图标**: @iconify/vue

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
# 开发模式（使用 .env.development.local 配置）
pnpm dev

# 使用生产配置开发
pnpm dev:prod

# 使用本地生产配置开发
pnpm dev:prod:local
```

### 构建生产版本

```bash
# 构建静态站点
pnpm build

# 预览构建结果
pnpm preview
```

### 代码检查

```bash
# 运行 ESLint 检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix
```

## 项目结构

```
├── app/                    # 应用源码目录
│   ├── components/        # Vue 组件
│   ├── pages/            # 页面路由
│   ├── composables/      # 组合式函数
│   ├── assets/           # 静态资源
│   ├── layouts/          # 布局组件
│   └── init/             # 初始化逻辑
├── config/               # 配置文件
├── public/               # 公共静态资源
├── nuxt.config.ts        # Nuxt 配置
├── uno.config.ts         # UnoCSS 配置
└── package.json          # 项目依赖
```

## 配置说明

### 环境变量

项目使用三个环境配置文件：

- `.env.development.local` - 开发环境配置
- `.env.production.local` - 生产环境配置
- `.env.test` - 测试环境配置

主要配置项：

```env
VITE_API_BASE_URL=your_api_url
NUXT_PUBLIC_NODE_ENV=development|production|test
```

## 部署

### 静态站点部署

项目构建后会生成 `.output/public/` 目录，可以部署到任何静态站点托管服务：

- Netlify
- Vercel
- GitHub Pages
- Nginx
- 等等

### Nginx 配置示例

项目包含了 `nginx.conf` 配置文件，可以参考使用。

## 开发规范

- 使用 **Vue Options API** 编写组件（非 Composition API）
- 遵循 **ESLint** 规则（基于 @antfu/eslint-config）
- 使用 **UnoCSS** 原子化 CSS 类名
- 使用 **TypeScript** 提供类型安全
- 提交前会自动运行 **lint-staged** 检查代码

## 许可证

查看 [LICENSE](LICENSE) 文件了解详情。

## 链接

- 原项目地址: [JiwuChat](https://github.com/Kiwi233333/JiwuChat)
- 官网: [https://blog.jiwuchat.top/](https://blog.jiwuchat.top/)
- QQ群: 939204073

---

**注意**: 这是一个精简的 Web 前端版本。如果你需要桌面端或移动端功能，请使用完整版本。
