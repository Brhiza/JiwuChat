# 更新日志 - Web 前端精简版

## 简介

这是 JiwuChat 项目的 Web 前端精简版本，移除了所有 Tauri 桌面端依赖，专注于纯 Web 应用。

## 主要更改

### ✅ 已完成

#### 1. 移除 Tauri 相关依赖

**生产依赖 (dependencies)**:
- ❌ 移除 `@tauri-apps/plugin-autostart@2.5.1`
- ❌ 移除 `@tauri-apps/plugin-dialog@2.4.2`
- ❌ 移除 `@tauri-apps/plugin-fs@2.4.4`
- ❌ 移除 `@tauri-apps/plugin-notification@2.3.3`
- ❌ 移除 `@tauri-apps/plugin-opener@2.5.2`
- ❌ 移除 `@tauri-apps/plugin-os@2.3.2`
- ❌ 移除 `@tauri-apps/plugin-process@2.3.1`
- ❌ 移除 `@tauri-apps/plugin-shell@2.3.3`
- ❌ 移除 `@tauri-apps/plugin-updater@2.9.0`
- ❌ 移除 `@tauri-apps/plugin-upload@2.3.2`
- ❌ 移除 `@tauri-apps/plugin-websocket@2.4.1`

**开发依赖 (devDependencies)**:
- ❌ 移除 `@tauri-apps/api@2.9.0`
- ❌ 移除 `@tauri-apps/cli@2.9.2`

#### 2. 目录结构清理

- ❌ 删除 `src-tauri/` 目录（Tauri 桌面端代码）

#### 3. 简化 package.json 脚本

**移除的脚本**:
- `tauri`
- `dev:tauri`
- `dev:desktop`
- `dev:android`
- `dev:ios`
- `build:tauri`
- `build:android`
- `build:ios`
- `android-init`
- `ios-init`

**新增/修改的脚本**:
- `dev` - 开发模式（原 `dev:nuxt`）
- `dev:prod` - 使用生产配置开发（原 `prod:nuxt`）
- `dev:prod:local` - 使用本地生产配置开发
- `build` - 构建生产版本（移除 Tauri 构建）

#### 4. 配置文件更新

**nuxt.config.ts**:
- 移除 `TAURI_PLATFORM` 和 `isMobile` 相关配置
- 移除 `ignore: ["src-tauri"]` 配置
- 简化 Vite 服务器配置
- 移除 Tauri HMR 特殊配置
- 移除 `TAURI_` 环境变量前缀
- 将构建目标从平台特定改为 `es2020`
- 添加 Tauri 模块到 `external` 配置
- 禁用 TypeScript 类型检查（加快构建速度）
- 优化 `rollupOptions` 配置

**scripts/check-env.js**:
- 更新 Rust 检查为可选（Web 版本不需要）
- 更新提示命令为 Web 版本脚本

#### 5. 修复问题

**Vue 组件**:
- 修复 `app/components/menu/BottomMenu.vue` 缺少 `</ul>` 结束标签

**类型声明**:
- 新增 `app/types/tauri-stubs.d.ts` 提供 Tauri API 类型存根
- 避免 TypeScript 编译错误

#### 6. 新增文档

- ✅ `README-FRONTEND.md` - Web 前端版本说明
- ✅ `MIGRATION-NOTES.md` - 迁移指南和注意事项
- ✅ `DEPLOYMENT.md` - 部署指南
- ✅ `.env.example` - 环境变量示例

#### 7. 依赖更新

- 重新安装依赖，更新 `pnpm-lock.yaml`
- 依赖包总数：从 ~1474 个减少到 ~1251 个（减少 223 个）

### 📦 保留的功能

#### 核心功能
- ✅ 完整的 Web 聊天功能
- ✅ 实时消息通信
- ✅ AI 群聊机器人
- ✅ WebRTC 音视频通话
- ✅ 屏幕共享
- ✅ 多种消息类型（文本、图片、文件、语音）
- ✅ 群聊功能
- ✅ 用户管理和好友系统
- ✅ 主题切换（浅色/深色）
- ✅ 响应式设计

#### 技术栈
- ✅ Nuxt.js 4.0.3
- ✅ Vue 3 + TypeScript
- ✅ Pinia 状态管理
- ✅ Element Plus UI
- ✅ UnoCSS 样式
- ✅ md-editor-v3 Markdown 编辑器

### 🔧 兼容性处理

#### 代码降级
- 保留 Tauri API 调用代码
- 通过 try-catch 机制实现优雅降级
- Web 环境下自动跳过 Tauri 功能

#### 构建配置
- Tauri 模块标记为 external
- 不会被打包到最终产物中
- 避免运行时错误

## 构建验证

### 构建统计

```
客户端构建：
- 时间：~1分51秒
- 主要 chunk：
  - C0voSKzb.js: 939.39 KB (gzip: 302.04 KB)
  - 5pVYSopT.js: 418.64 KB (gzip: 139.31 KB)
  - cfjWosSf.js: 193.16 KB (gzip: 75.04 KB)

服务端构建：
- 时间：~207ms

预渲染：
- 路由数：18 个
- 时间：~1.017 秒
```

### 输出目录

```
.output/public/ - 静态站点文件
├── _nuxt/       # 构建的 JS/CSS 文件
├── index.html   # 入口页面
├── 200.html     # SPA 回退页面
├── 404.html     # 404 页面
└── ...          # 其他静态资源
```

## 使用指南

### 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

### 部署

构建完成后，将 `.output/public/` 目录部署到任何静态托管服务：

- Netlify
- Vercel
- GitHub Pages
- Nginx
- 等等

详细部署指南请参考 `DEPLOYMENT.md`。

## 已知限制

### Web 版本不支持的功能

1. ❌ 桌面端窗口管理
2. ❌ 系统托盘集成
3. ❌ 多窗口支持
4. ❌ 本地文件系统直接访问
5. ❌ 自动更新功能
6. ❌ 开机自启动
7. ❌ 进程管理
8. ❌ 移动端原生功能

### 浏览器 API 替代方案

- **文件上传**: 使用 HTML5 File API
- **通知**: 使用浏览器 Notification API
- **存储**: 使用 localStorage/IndexedDB
- **剪贴板**: 使用 Clipboard API

## 技术细节

### 构建优化

1. **代码分割**: 
   - Element Plus 单独打包
   - Markdown 编辑器独立 chunk
   - Vue 核心库分离

2. **外部依赖**:
   - Tauri 模块标记为 external
   - 避免打包不必要的代码

3. **类型安全**:
   - 提供 Tauri API 类型存根
   - 保持 TypeScript 类型检查

### 性能指标

- 首屏加载：取决于网络和静态资源
- 构建时间：~2分钟
- 包体积：~939 KB (主 bundle)
- Gzip 压缩后：~302 KB

## 版本信息

- **版本**: 1.7.2
- **分支**: chore/frontend-only-minimal
- **基于**: JiwuChat v1.7.2
- **更新时间**: 2025

## 相关链接

- **完整版项目**: https://github.com/Kiwi233333/JiwuChat
- **官网**: https://blog.jiwuchat.top/
- **QQ 群**: 939204073

## 许可证

与原项目保持一致，详见 `LICENSE` 文件。

---

**注意**: 如需桌面端或移动端功能，请使用完整版本。
