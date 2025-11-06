# 迁移说明 - Web 前端精简版

本文档说明了从完整版（Tauri + Web）迁移到纯 Web 前端版本的注意事项。

## 主要变更

### 1. 依赖移除

以下 Tauri 相关依赖已被移除：

**生产依赖 (dependencies)**:
- `@tauri-apps/plugin-autostart`
- `@tauri-apps/plugin-dialog`
- `@tauri-apps/plugin-fs`
- `@tauri-apps/plugin-notification`
- `@tauri-apps/plugin-opener`
- `@tauri-apps/plugin-os`
- `@tauri-apps/plugin-process`
- `@tauri-apps/plugin-shell`
- `@tauri-apps/plugin-updater`
- `@tauri-apps/plugin-upload`
- `@tauri-apps/plugin-websocket`

**开发依赖 (devDependencies)**:
- `@tauri-apps/api`
- `@tauri-apps/cli`

### 2. 目录结构变更

- ✖️ `src-tauri/` - 已删除（Tauri 桌面端代码）

### 3. 配置文件变更

#### package.json
- 移除了所有 Tauri 相关的 npm 脚本
- 简化了开发和构建命令
- 保留了核心 Web 开发工具

#### nuxt.config.ts
- 移除了 `TAURI_PLATFORM` 和 `isMobile` 相关配置
- 移除了 `ignore: ["src-tauri"]` 配置
- 简化了 Vite 服务器配置
- 移除了 Tauri HMR 特殊配置
- 将构建目标从平台特定改为 `es2020`

### 4. 功能降级处理

项目中的代码已经包含了平台检测和错误处理，Web 版本会自动降级：

```typescript
// 示例：app/init/init.ts
try {
  const appPlatform = platform();
  if (!appPlatform)
    return;
  setting.appPlatform = appPlatform;
}
catch (error) {
  // Web 环境下会自动降级
  setting.appPlatform = "web";
  setting.osType = "web";
  return;
}
```

### 5. 不可用功能列表

在 Web 版本中，以下功能将不可用或被自动跳过：

1. **窗口管理**: 无法使用多窗口、窗口最小化、托盘等功能
2. **系统通知**: 浏览器原生通知需要用户授权
3. **文件系统**: 无法直接访问本地文件系统，需使用浏览器文件 API
4. **自动更新**: Web 版本通过重新部署更新
5. **托盘集成**: Web 应用无法集成到系统托盘
6. **开机自启**: Web 应用无法设置开机自启
7. **进程管理**: 无法访问系统进程

## 兼容性处理

### 代码中的 Tauri 引用

项目代码中仍然保留了对 Tauri API 的引用，但通过 try-catch 机制实现优雅降级：

```typescript
// 这些代码在 Web 环境下会被跳过
export async function userTauriInit() {
  const setting = useSettingStore();
  try {
    const appPlatform = platform();
    // ... Tauri 相关逻辑
  }
  catch (error) {
    // Web 环境下的降级处理
    setting.appPlatform = "web";
    setting.osType = "web";
    return;
  }
}
```

### 条件编译

在某些地方，代码使用平台检测来决定是否执行 Tauri 功能：

```typescript
// 只在桌面端执行
if (!["windows", "linux", "macos"].includes(platformName))
  return;
```

## 迁移步骤

如果你想将现有的完整版项目迁移为 Web 精简版：

1. **备份项目**
   ```bash
   git checkout -b backup-full-version
   ```

2. **移除 Tauri 目录**
   ```bash
   rm -rf src-tauri
   ```

3. **更新 package.json**
   - 移除所有 `@tauri-apps/*` 依赖
   - 简化 npm 脚本

4. **更新 nuxt.config.ts**
   - 移除 Tauri 相关配置
   - 简化 Vite 配置

5. **重新安装依赖**
   ```bash
   pnpm install --no-frozen-lockfile
   ```

6. **测试运行**
   ```bash
   pnpm dev
   ```

## 开发建议

### 1. 功能检测

在使用可能不可用的功能前，添加平台检测：

```typescript
const setting = useSettingStore();
if (setting.appPlatform === 'web') {
  // 使用 Web API 替代方案
} else {
  // 使用 Tauri API
}
```

### 2. 错误处理

所有 Tauri API 调用都应该包含错误处理：

```typescript
try {
  // Tauri API 调用
} catch (error) {
  // 降级处理
}
```

### 3. 条件导入

使用动态导入避免编译错误：

```typescript
// 不推荐
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

// 推荐（如果需要条件使用）
if (setting.appPlatform !== 'web') {
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
}
```

## 部署注意事项

### 1. 环境变量

确保在部署环境中正确配置：
- `VITE_API_BASE_URL` - API 服务器地址
- `NUXT_PUBLIC_NODE_ENV` - 运行环境

### 2. 路由模式

项目使用 SPA 模式 (`ssr: false`)，确保服务器配置正确处理前端路由。

### 3. 浏览器兼容性

目标浏览器: 支持 ES2020 的现代浏览器

## 常见问题

### Q: 为什么保留了 Tauri 相关的代码？
A: 代码通过 try-catch 机制实现了优雅降级，不影响 Web 版本运行，同时保持了代码的完整性。

### Q: 如何恢复完整版功能？
A: 切换到完整版分支，重新安装依赖即可。

### Q: Web 版本性能如何？
A: Web 版本移除了桌面端特性后，包体积更小，加载速度更快。

### Q: 可以同时维护两个版本吗？
A: 可以通过 Git 分支管理两个版本，但需要注意代码同步问题。

## 技术支持

- 原项目: https://github.com/Kiwi233333/JiwuChat
- QQ群: 939204073

---

最后更新: 2025
