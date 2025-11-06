/**
 * Tauri API 类型声明（Web 前端版本的存根）
 * 这些模块在 Web 版本中不可用，但提供类型声明以避免 TypeScript 错误
 */

declare module "@tauri-apps/api/core" {
  export function invoke<T = any>(cmd: string, args?: any): Promise<T>;
}

declare module "@tauri-apps/api/dpi" {
  export class PhysicalPosition {
    constructor(x: number, y: number);
    toLogical(scaleFactor: number): LogicalPosition;
  }
  export interface LogicalPosition {
    x: number
    y: number
  }
}

declare module "@tauri-apps/api/event" {
  export function listen<T = any>(
    event: string,
    handler: (event: { payload: T }) => void
  ): Promise<() => void>;
}

declare module "@tauri-apps/api/path" {
  export function appDataDir(): Promise<string>;
}

declare module "@tauri-apps/api/window" {
  export class WebviewWindow {
    static getCurrent(): WebviewWindow;
    static getByLabel(label: string): Promise<WebviewWindow | null>;
    label: string;
    show(): Promise<void>;
    hide(): Promise<void>;
    isVisible(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    unminimize(): Promise<void>;
    setFocus(): Promise<void>;
    setPosition(position: any): Promise<void>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
    innerSize(): Promise<any>;
    scaleFactor(): Promise<number>;
    isFocused(): Promise<boolean>;
  }
  export class Window {
    constructor(label: string, options?: any);
  }
}

declare module "@tauri-apps/api/webviewWindow" {
  export class WebviewWindow {
    static getCurrent(): WebviewWindow;
    static getByLabel(label: string): Promise<WebviewWindow | null>;
    label: string;
    show(): Promise<void>;
    hide(): Promise<void>;
    isVisible(): Promise<boolean>;
    isMinimized(): Promise<boolean>;
    unminimize(): Promise<void>;
    setFocus(): Promise<void>;
    setPosition(position: any): Promise<void>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
    innerSize(): Promise<any>;
    scaleFactor(): Promise<number>;
    isFocused(): Promise<boolean>;
  }
}

declare module "@tauri-apps/plugin-autostart" {
  export function enable(): Promise<void>;
  export function disable(): Promise<void>;
  export function isEnabled(): Promise<boolean>;
}

declare module "@tauri-apps/plugin-dialog" {
  export function open(options?: any): Promise<string | string[] | null>;
  export function save(options?: any): Promise<string | null>;
}

declare module "@tauri-apps/plugin-fs" {
  export function readTextFile(path: string): Promise<string>;
  export function writeTextFile(path: string, content: string): Promise<void>;
  export function exists(path: string): Promise<boolean>;
  export function createDir(path: string, options?: any): Promise<void>;
  export function readDir(path: string): Promise<any[]>;
}

declare module "@tauri-apps/plugin-notification" {
  export function sendNotification(options: {
    title: string
    body?: string
  }): Promise<void>;
  export function isPermissionGranted(): Promise<boolean>;
  export function requestPermission(): Promise<string>;
}

declare module "@tauri-apps/plugin-opener" {
  export function openUrl(url: string, openWith?: string): Promise<void>;
  export function open(path: string): Promise<void>;
}

declare module "@tauri-apps/plugin-os" {
  export function platform(): string;
  export function type(): string;
  export function version(): string;
  export function arch(): string;
}

declare module "@tauri-apps/plugin-process" {
  export function exit(code?: number): Promise<void>;
}

declare module "@tauri-apps/plugin-shell" {
  export function open(path: string): Promise<void>;
  export class Command {
    constructor(program: string, args?: string[]);
    execute(): Promise<{ code: number; stdout: string; stderr: string }>;
  }
}

declare module "@tauri-apps/plugin-updater" {
  export function checkUpdate(): Promise<any>;
}

declare module "@tauri-apps/plugin-upload" {
  export function upload(options: any): Promise<any>;
}

declare module "@tauri-apps/plugin-websocket" {
  export class WebSocket {
    constructor(url: string);
    send(data: string): Promise<void>;
    close(): Promise<void>;
  }
}
