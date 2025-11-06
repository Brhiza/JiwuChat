// 打包分包插件解决潜在循环依赖
// import { prismjsPlugin } from "vite-plugin-prismjs";
// import { pwa } from "./config/pwa";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { appDescription, appKeywords, appTitle } from "./app/constants/index";
import * as packageJson from "./package.json";
import "dayjs/locale/zh-cn";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isSSR = process.env.NUXT_PUBLIC_SPA;
const mode = process.env.NUXT_PUBLIC_NODE_ENV as "development" | "production" | "test";
const version = packageJson?.version;
// 打印
console.log(`mode:${mode} api_url:${BASE_URL} SSR:${isSSR}`);
export default defineNuxtConfig({
  ssr: false,
  router: {
    options: {
      scrollBehaviorType: "smooth",
    },
  },
  future: {
    compatibilityVersion: 4,
    typescriptBundlerResolution: true, // https://nuxtjs.org.cn/docs/guide/going-further/features#typescriptbundlerresolution
  },
  runtimeConfig: {
    public: {
      baseUrl: BASE_URL,
      mode,
      version,
    },
  },
  build: {
    transpile: ["popperjs/core", "resize-detector"],
    analyze: {
      analyzerMode: "static", // 或其他配置
      reportFilename: "report.html",
    },
  },
  // spa情况下loading状态 web端使用 "./app/spa-loading-template.html"，桌面端使用 "./app/desktop-loading-template.html"
  spaLoadingTemplate: "./spa-loading-template.html",
  // 模块
  modules: [
    // 工具
    "@vueuse/nuxt",
    "@nuxtjs/color-mode",
    // UI
    "@element-plus/nuxt",
    "@formkit/auto-animate/nuxt",
    "@unocss/nuxt", // 基础
    "@pinia/nuxt", // 状态管理
    "pinia-plugin-persistedstate/nuxt",
    "@nuxt/eslint",
  ],
  srcDir: "app/",
  unocss: {
    warn: false,
  },
  app: {
    // pageTransition: { name: "page", mode: "out-in" },
    // layoutTransition: { name: "layout", mode: "out-in" },
    head: {
      title: appTitle,
      viewport: "width=device-width,initial-scale=1",
      // 网站头部信息
      link: [
        { rel: "icon", href: "/logo.png", sizes: "any" },
        { rel: "apple-touch-icon", href: "/logo.png" },
      ],
      // 网站meta
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
        { name: "description", content: appDescription },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: appTitle },
        { name: "format-detection", content: "telephone=no" },
        { name: "msapplication-TileColor", content: "#ffffff" },
        { name: "theme-color", content: "#5324ff" },
        { name: "robots", content: "index,follow" },
        { name: "author", content: "Kiwi2333" },
        { name: "keywords", content: appKeywords },
        { charset: "utf-8" },
        { "http-equiv": "X-UA-Compatible", "content": "IE=edge" },
        // Open Graph
        { property: "og:title", content: appTitle },
        { property: "og:description", content: appDescription },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "/logo.png" },
        { property: "og:url", content: "https://jiwuchat.top" },
        { property: "og:site_name", content: appTitle },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: appTitle },
        { name: "twitter:description", content: appDescription },
        { name: "twitter:image", content: "/logo.png" },
      ],
    },
  },

  // https://blog.csdn.net/weixin_42553583/article/details/131372309
  experimental: {
    // https://nuxt.com.cn/docs/guide/going-further/experimental-features#inlinerouterules
    inlineRouteRules: true,
    payloadExtraction: false,
    renderJsonPayloads: true, //
    emitRouteChunkError: false, // https://nuxt.com.cn/docs/getting-started/error-handling#js-chunk-%E9%94%99%E8%AF%AF
    // viewTransition: true, // 支持View Transition API Chorme111 https://blog.csdn.net/weixin_42553583/article/details/130474259
    crossOriginPrefetch: true, // 使用 Speculation Rules API 启用跨源预取。
    // watcher: "parcel", // 使用 Parcel 作为文件监视器。
    // // treeshakeClientOnly: true, // 仅客户端打包时启用 treeshaking。
    noVueServer: true, // 禁用 Vue Server Renderer。
  },
  routeRules: {
    "/": { prerender: true },
    "/login": { prerender: true },
  },

  // 自动导入
  imports: {
    dirs: [
      // Scan top-level modules
      "composables/**",
      "types/**",
    ],
  },

  // css
  css: ["@/assets/styles/init.scss", "@/assets/styles/index.scss", "@/assets/styles/animate.scss"],
  nitro: {
    devProxy: {
      host: "127.0.0.1",
    },
  },
  // alias: {
  //   "~": "/<srcDir>",
  //   "@": "/<srcDir>",
  //   "~~": "/<rootDir>",
  //   "@@": "/<rootDir>",
  //   "assets": "/<srcDir>/assets",
  //   "public": "/<srcDir>/public",
  // },
  colorMode: {
    classSuffix: "",
  },
  // 3、elementPlus
  elementPlus: {
    icon: "ElIcon",
    importStyle: "scss",
    themes: ["dark"],
    defaultLocale: "zh-cn",
  },
  // pwa,
  devServer: {
    host: "localhost",
    port: 3000,
  },
  // nuxt开发者工具
  devtools: {
    enabled: false,
  },
  // hooks: {
  //   "vite:extend": function ({ config }) {
  //     if (config.server && config.server.hmr && config.server.hmr !== true) {
  //       config.server.hmr.protocol = "ws";
  //       config.server.hmr.host = "192.168.31.14";
  //       config.server.hmr.port = 3000;
  //     }
  //   },
  // },
  // vite
  vite: {
    clearScreen: false,
    envPrefix: ["VITE_"],
    plugins: [
      codeInspectorPlugin({
        bundler: "vite",
      }),
    ],
    server: {
      strictPort: true,
      watch: {
        ignored: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/.nuxt/**", "**/public/**", "**/.output/**"],
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api", "global-builtin"],
          additionalData: `
          @use "@/assets/styles/element/index.scss" as element;
          @use "@/assets/styles/element/dark.scss" as dark;
          @use "@/assets/styles/element-ui.scss" as element-ui;
          @use "@/assets/styles/var.scss" as *;
          `,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000, // chunk 大小警告的限制(kb)
      // minify: "terser", // 使用 esbuild 进行代码压缩
      // cssCodeSplit: true, // 是否将 CSS 代码拆分为单独的文件
      // cssMinify: false, // 压缩 CSS 代码
      commonjsOptions: {},
      target: "es2020",

      rollupOptions: {
        external: [
          /^@tauri-apps\//,
        ],
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("element-plus")) {
                return "element-plus";
              }
              if (id.includes("md-editor-v3") || id.includes("markdown-it")) {
                return "markdown";
              }
              if (id.includes("vue") || id.includes("@vue")) {
                return "vue";
              }
              return "vendor";
            }
          },
        },
      },
    },
  },
  typescript: {
    typeCheck: false,
  },
  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: false,
      },
    },
  },
  compatibilityDate: "2024-08-14",
});
