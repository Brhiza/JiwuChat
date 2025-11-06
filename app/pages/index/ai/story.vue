<script lang="ts">
import { defineComponent, nextTick } from "vue";
import type { ScrollbarInstance } from "element-plus";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/composables/store/useUserStore";
import { useSettingStore } from "@/composables/store/useSettingStore";
import { XUN_FEI_APP_ID, XUN_FEI_WSS_URL } from "@/composables/utils/useBaseUrl";
import { appName } from "@/constants";
import { WsStatusEnum } from "~/types/chat/WsType";

const STORAGE_KEY = "jiwuchat_story_ai_settings";
const STREAM_RENDER_STEP = 3;

interface StoryCharacter {
  id: number;
  name: string;
  personality: string;
  goals?: string;
}

interface StoryChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  sender: string;
  content: string;
  timestamp: number;
}

interface CharacterFormState {
  name: string;
  personality: string;
  goals: string;
}

interface StorySettingsPayload {
  storyTitle: string;
  storyBackground: string;
  storyTone: string;
  characters: StoryCharacter[];
}

interface AiMessagePayload {
  role: "user" | "assistant";
  content: string;
}

interface AiRequestDto {
  header: {
    app_id: string;
    uid: string;
  };
  parameter: {
    chat: {
      domain: string;
      temperature: number;
      top_k: number;
      max_tokens: number;
    };
  };
  payload: {
    message: {
      text: AiMessagePayload[];
    };
  };
}

definePageMeta({
  key: route => route.fullPath,
});

useSeoMeta({
  title: `故事模式 - ${appName}`,
  description: `${appName} 故事模式 - 设定背景与角色，与 AI 共同创作沉浸式剧情。`,
});

export default defineComponent({
  name: "AiStoryChatPage",
  data() {
    const defaultCharacters: StoryCharacter[] = [
      {
        id: 1,
        name: "林曦",
        personality: "冷静聪慧的天体物理学家，习惯以逻辑分析复杂局势",
        goals: "寻找失踪的导师，并解锁织梦之城的能量脉络",
      },
      {
        id: 2,
        name: "罗赫",
        personality: "热血幽默的飞行员，面对危机依旧保持乐观",
        goals: "守护联合舰队安全，帮助林曦完成探索任务",
      },
    ];

    return {
      userStore: useUserStore(),
      settingStore: useSettingStore(),
      storyTitle: "织梦之城",
      storyBackground: "公元2237年，人类踏足猎户臂边缘的织梦之城，这里是连接真实世界与记忆映像的能量枢纽。近来城市能量异常，居民逐渐陷入未完的梦境。",
      storyTone: "科幻冒险中带有浪漫与神秘",
      storyPrompt: "",
      characters: defaultCharacters,
      showCharacterForm: false,
      editingCharacterId: null as number | null,
      characterForm: {
        name: "",
        personality: "",
        goals: "",
      } as CharacterFormState,
      messages: [] as StoryChatMessage[],
      userInput: "",
      status: WsStatusEnum.CLOSE,
      ws: null as WebSocket | null,
      textBuffer: [] as string[],
      currentStreamMessageId: null as string | null,
      renderInterval: null as NodeJS.Timeout | null,
      aiDto: {
        header: {
          app_id: XUN_FEI_APP_ID,
          uid: "",
        },
        parameter: {
          chat: {
            domain: "general",
            temperature: 0.8,
            top_k: 4,
            max_tokens: 2048,
          },
        },
        payload: {
          message: {
            text: [],
          },
        },
      } as AiRequestDto,
      scrollRef: null as ScrollbarInstance | null,
    };
  },
  computed: {
    assistantDisplayName(): string {
      return "故事叙述者";
    },
    userDisplayName(): string {
      return this.userStore.userInfo.nickname || this.userStore.userInfo.username || "我";
    },
    isStreaming(): boolean {
      return this.status === WsStatusEnum.OPEN;
    },
    statusMessage(): string {
      if (!this.storyPrompt) {
        return "先完善故事设定，再开始与角色对话";
      }
      switch (this.status) {
        case WsStatusEnum.CONNECTION:
          return "正在连接 AI 模型...";
        case WsStatusEnum.OPEN:
          return "AI 正在根据故事设定创作...";
        case WsStatusEnum.SAFE_CLOSE:
          return "AI 回复完成";
        default:
          return "等待你的下一句台词";
      }
    },
    storyPreview(): string {
      return this.generateStoryPrompt();
    },
    sortedMessages(): StoryChatMessage[] {
      return [...this.messages].sort((a, b) => a.timestamp - b.timestamp);
    },
  },
  watch: {
    storyTitle() {
      this.saveSettingsDraft();
    },
    storyBackground() {
      this.saveSettingsDraft();
    },
    storyTone() {
      this.saveSettingsDraft();
    },
    characters: {
      handler() {
        this.saveSettingsDraft();
      },
      deep: true,
    },
  },
  mounted() {
    this.loadSavedSettings();
    this.ensureInitialAssistantMessage();
    nextTick(() => {
      this.scrollToBottom(false);
    });
    if (typeof window !== "undefined")
      window.addEventListener("beforeunload", this.cleanupSocket);
  },
  activated() {
    nextTick(() => {
      this.scrollToBottom(false);
    });
  },
  deactivated() {
    if (this.status === WsStatusEnum.OPEN)
      this.handleStop();
  },
  beforeUnmount() {
    this.cleanupSocket();
    this.stopRendering();
    if (typeof window !== "undefined")
      window.removeEventListener("beforeunload", this.cleanupSocket);
  },
  methods: {
    saveSettingsDraft() {
      if (typeof window === "undefined")
        return;

      const payload: StorySettingsPayload = {
        storyTitle: this.storyTitle,
        storyBackground: this.storyBackground,
        storyTone: this.storyTone,
        characters: this.characters,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
      catch (error) {
        console.warn("保存故事设定失败", error);
      }
    },
    loadSavedSettings() {
      if (typeof window === "undefined")
        return;

      try {
        const cache = localStorage.getItem(STORAGE_KEY);
        if (!cache)
          return;
        const parsed = JSON.parse(cache) as StorySettingsPayload;
        if (parsed.storyTitle)
          this.storyTitle = parsed.storyTitle;
        if (parsed.storyBackground)
          this.storyBackground = parsed.storyBackground;
        if (parsed.storyTone)
          this.storyTone = parsed.storyTone;
        if (Array.isArray(parsed.characters) && parsed.characters.length) {
          this.characters = parsed.characters.map((item, index) => ({
            id: typeof item.id === "number" ? item.id : Date.now() + index,
            name: item.name || `角色${index + 1}`,
            personality: item.personality || "",
            goals: item.goals || "",
          }));
        }
      }
      catch (error) {
        console.warn("解析故事设定缓存失败", error);
      }
      finally {
        this.storyPrompt = this.generateStoryPrompt();
      }
    },
    toggleCharacterForm() {
      this.showCharacterForm = !this.showCharacterForm;
      if (!this.showCharacterForm) {
        this.resetCharacterForm();
        this.editingCharacterId = null;
      }
    },
    resetCharacterForm() {
      this.characterForm = {
        name: "",
        personality: "",
        goals: "",
      };
    },
    editCharacter(character: StoryCharacter) {
      this.showCharacterForm = true;
      this.editingCharacterId = character.id;
      this.characterForm = {
        name: character.name,
        personality: character.personality,
        goals: character.goals || "",
      };
    },
    removeCharacter(id: number) {
      this.characters = this.characters.filter(item => item.id !== id);
      this.saveSettingsDraft();
    },
    addOrUpdateCharacter() {
      if (!this.characterForm.name.trim() || !this.characterForm.personality.trim()) {
        ElMessage.warning("请填写角色名称与性格描述");
        return;
      }

      if (this.editingCharacterId !== null) {
        this.characters = this.characters.map((character) => {
          if (character.id === this.editingCharacterId) {
            return {
              ...character,
              name: this.characterForm.name.trim(),
              personality: this.characterForm.personality.trim(),
              goals: this.characterForm.goals.trim(),
            };
          }
          return character;
        });
      }
      else {
        this.characters = [
          ...this.characters,
          {
            id: Date.now(),
            name: this.characterForm.name.trim(),
            personality: this.characterForm.personality.trim(),
            goals: this.characterForm.goals.trim(),
          },
        ];
      }

      this.saveSettingsDraft();
      this.toggleCharacterForm();
    },
    applyStorySettings() {
      if (this.isStreaming) {
        ElMessage.warning("请先结束当前对话，再更新故事设定");
        return;
      }

      if (!this.storyTitle.trim() && !this.storyBackground.trim()) {
        ElMessage.warning("请至少补充故事标题或背景");
        return;
      }

      this.storyPrompt = this.generateStoryPrompt();
      this.handleNewChat(true, true);
      this.messages.push({
        id: `system-${Date.now()}`,
        role: "system",
        sender: "故事设定",
        content: `故事设定《${this.storyTitle || "未命名故事"}》已更新。\n${this.storyPrompt}`,
        timestamp: Date.now(),
      });
      this.ensureInitialAssistantMessage();
      this.saveSettingsDraft();
      ElMessage.success("故事设定已更新");
      nextTick(() => {
        this.scrollToBottom(false);
      });
    },
    handleNewChat(force = false, skipWelcome = false) {
      if (this.isStreaming && !force) {
        ElMessage.warning("正在聊天中，请先结束当前对话！");
        return;
      }

      this.cleanupSocket();
      this.stopRendering();
      this.status = WsStatusEnum.CLOSE;
      this.textBuffer = [];
      this.currentStreamMessageId = null;
      this.messages = [];
      if (!skipWelcome)
        this.ensureInitialAssistantMessage();
      nextTick(() => {
        this.scrollToBottom(false);
      });
    },
    ensureInitialAssistantMessage() {
      const introIdPrefix = "intro-";
      this.messages = this.messages.filter(message => !message.id.startsWith(introIdPrefix));
      const content = this.storyPrompt
        ? `故事设定《${this.storyTitle || "未命名故事"}》已就绪。你可以与角色对话，推动剧情发展。`
        : "请先完善故事背景与角色设定，然后点击「应用故事设定」。";
      this.messages.push({
        id: `${introIdPrefix}${Date.now()}`,
        role: "assistant",
        sender: this.assistantDisplayName,
        content,
        timestamp: Date.now(),
      });
    },
    handleSend() {
      if (this.isStreaming) {
        ElMessage.warning("AI 正在回复，请稍候");
        return;
      }

      const content = this.userInput.trim();
      if (!content) {
        return;
      }

      if (!this.storyPrompt) {
        ElMessage.warning("请先应用故事设定");
        return;
      }

      const payload = this.buildAiPayload(content);
      this.messages.push({
        id: `user-${Date.now()}`,
        role: "user",
        sender: this.userDisplayName,
        content,
        timestamp: Date.now(),
      });
      this.userInput = "";
      this.openSocket(payload);
      nextTick(() => {
        this.scrollToBottom();
      });
    },
    buildAiPayload(latestUserMessage: string): AiMessagePayload[] {
      const payload: AiMessagePayload[] = [];
      const history = this.messages
        .filter((message): message is StoryChatMessage & { role: "user" | "assistant" } => message.role !== "system" && !message.id.startsWith("intro-"))
        .slice(-6);

      history.forEach((message) => {
        payload.push({
          role: message.role,
          content: message.content,
        });
      });

      payload.push({
        role: "user",
        content: this.composeUserMessage(latestUserMessage, history.length === 0),
      });

      return payload;
    },
    composeUserMessage(message: string, isFirstMessage: boolean): string {
      const lines: string[] = [];
      if (this.storyPrompt)
        lines.push(this.storyPrompt);

      lines.push("请严格遵循上述世界观与角色性格设定进行对话，保持中文输出，并辅以环境与情绪描写。");
      if (isFirstMessage)
        lines.push("开场时请主动描绘当前场景，并给出可推进剧情的引导。");
      lines.push(`玩家发言：${message}`);
      return lines.join("\n\n");
    },
    openSocket(payload: AiMessagePayload[]) {
      if (!payload.length)
        return;

      this.cleanupSocket();
      this.stopRendering();
      this.textBuffer = [];
      this.status = WsStatusEnum.CONNECTION;

      try {
        this.ws = new WebSocket(XUN_FEI_WSS_URL);
      }
      catch (error) {
        console.error("连接 AI 服务失败", error);
        ElMessage.error("无法连接到 AI 服务，请稍后重试");
        this.status = WsStatusEnum.CLOSE;
        return;
      }

      this.aiDto.header.uid = this.userStore.userInfo.id || this.userStore.userInfo.username || "guest";
      this.aiDto.payload.message.text = payload;

      this.ws.onopen = () => {
        try {
          this.status = WsStatusEnum.OPEN;
          this.ws?.send(JSON.stringify(this.aiDto));
          this.scrollToBottom();
        }
        catch (error) {
          console.error("发送 AI 请求失败", error);
          ElMessage.error("发送请求失败，请稍后再试");
          this.cleanupSocket();
        }
      };

      this.ws.onerror = () => {
        ElMessage.error("AI 回复异常，请稍后重试");
        this.cleanupSocket();
      };

      this.ws.onclose = () => {
        if (this.textBuffer.length > 0 && this.currentStreamMessageId) {
          const message = this.messages.find(item => item.id === this.currentStreamMessageId);
          if (message)
            message.content += this.textBuffer.join("");
        }
        this.stopRendering();
        this.textBuffer = [];
        this.currentStreamMessageId = null;
        this.status = WsStatusEnum.SAFE_CLOSE;
        this.ws = null;
        nextTick(() => {
          this.scrollToBottom();
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const textList = data?.payload?.choices?.text || [];
          const sid = data?.header?.sid;
          let chunkContent = "";

          textList.forEach((item: any) => {
            if (item?.role === "assistant" && item?.content)
              chunkContent += item.content;
          });

          if (!chunkContent || !sid)
            return;

          if (!this.currentStreamMessageId || this.currentStreamMessageId !== sid) {
            this.currentStreamMessageId = sid;
            this.appendAssistantMessage(sid);
          }

          this.textBuffer.push(chunkContent);
          this.startRendering();
        }
        catch (error) {
          console.error("解析 AI 数据失败", error);
        }
      };
    },
    appendAssistantMessage(id: string) {
      this.messages.push({
        id,
        role: "assistant",
        sender: this.assistantDisplayName,
        content: "",
        timestamp: Date.now(),
      });
      nextTick(() => {
        this.scrollToBottom();
      });
    },
    startRendering() {
      if (this.renderInterval || !this.currentStreamMessageId)
        return;

      this.renderInterval = setInterval(() => {
        if (!this.textBuffer.length || !this.currentStreamMessageId)
          return;

        const current = this.messages.find(message => message.id === this.currentStreamMessageId);
        if (!current)
          return;

        const chunk = this.textBuffer[0].slice(0, STREAM_RENDER_STEP);
        current.content += chunk;
        this.textBuffer[0] = this.textBuffer[0].slice(STREAM_RENDER_STEP);
        if (!this.textBuffer[0].length)
          this.textBuffer.shift();
        this.scrollToBottom();
      }, 30);
    },
    stopRendering() {
      if (this.renderInterval) {
        clearInterval(this.renderInterval);
        this.renderInterval = null;
      }
    },
    handleStop() {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        this.ws.close();
        this.status = WsStatusEnum.SAFE_CLOSE;
      }
    },
    cleanupSocket() {
      if (!this.ws)
        return;

      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
          this.ws.close();
      }
      catch (error) {
        console.error("关闭 AI 连接失败", error);
      }
      finally {
        this.ws = null;
      }
    },
    scrollToBottom(animate = true) {
      if (!this.scrollRef?.wrapRef)
        return;

      const wrap = this.scrollRef.wrapRef;
      if (animate && typeof wrap.scrollTo === "function") {
        wrap.scrollTo({
          top: wrap.scrollHeight + 40,
          behavior: "smooth",
        });
      }
      else if (typeof this.scrollRef.setScrollTop === "function") {
        this.scrollRef.setScrollTop(wrap.scrollHeight + 40);
      }
    },
    formatTimestamp(timestamp: number): string {
      try {
        return new Intl.DateTimeFormat("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(timestamp));
      }
      catch (error) {
        console.warn("时间格式化失败", error);
        return "";
      }
    },
    generateStoryPrompt(): string {
      const lines: string[] = [];
      if (this.storyTitle.trim())
        lines.push(`故事标题：${this.storyTitle.trim()}`);
      if (this.storyBackground.trim())
        lines.push(`故事背景：${this.storyBackground.trim()}`);
      if (this.storyTone.trim())
        lines.push(`故事基调：${this.storyTone.trim()}`);
      if (this.characters.length) {
        lines.push("角色设定：");
        this.characters.forEach((character, index) => {
          const details = [`性格：${character.personality}`];
          if (character.goals)
            details.push(`目标：${character.goals}`);
          lines.push(`${index + 1}. ${character.name}（${details.join("，")}）`);
        });
      }
      lines.push("请保持角色言行与故事世界观一致，适时推进剧情。支持通过对话描绘环境与情绪。");
      return lines.join("\n");
    },
  },
});
</script>

<template>
  <div class="story-ai-page h-full flex flex-col sm:(px-4 pb-4)">
    <div class="nav-padding-top-6 flex flex-col gap-4 px-4 sm:px-0">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-2 text-lg font-600 text-[var(--el-color-primary)]">
          <i class="i-solar:book-line-duotone text-xl" />
          AI 故事工坊
        </div>
        <div class="flex items-center gap-2">
          <el-button size="small" :disabled="isStreaming" @click="handleNewChat()">
            新建对话
          </el-button>
          <el-button
            size="small"
            type="danger"
            :disabled="!isStreaming"
            @click="handleStop"
          >
            结束生成
          </el-button>
        </div>
      </div>
      <div class="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        <section class="story-settings card-rounded-df border-default bg-color-2 shadow-sm">
          <header class="border-default-b p-4">
            <h3 class="flex items-center gap-2 text-base font-600">
              <i class="i-solar:magic-stick-bold-duotone text-lg" />
              故事设定
            </h3>
            <p class="mt-1 text-small text-small-color">
              设定故事背景与人物性格，AI 将基于这些设定展开沉浸式对话。
            </p>
          </header>
          <div class="flex flex-col gap-4 p-4">
            <el-form label-position="top" class="grid gap-3">
              <el-form-item label="故事标题">
                <el-input
                  v-model="storyTitle"
                  placeholder="例如：织梦之城"
                />
              </el-form-item>
              <el-form-item label="故事背景">
                <el-input
                  v-model="storyBackground"
                  type="textarea"
                  :autosize="{ minRows: 3, maxRows: 5 }"
                  placeholder="描述故事发生的时代、地点与主要矛盾"
                />
              </el-form-item>
              <el-form-item label="故事基调">
                <el-input
                  v-model="storyTone"
                  placeholder="轻松 / 悬疑 / 浪漫 / 热血"
                />
              </el-form-item>
            </el-form>

            <el-divider class="!my-2" />

            <div class="flex items-center justify-between">
              <span class="text-sm font-600">角色设定</span>
              <el-button
                v-if="!showCharacterForm"
                size="small"
                text
                type="primary"
                @click="toggleCharacterForm"
              >
                添加角色
              </el-button>
              <el-button
                v-else
                size="small"
                text
                type="primary"
                @click="toggleCharacterForm"
              >
                收起
              </el-button>
            </div>

            <div v-if="!characters.length" class="rounded bg-color-3 p-3 text-small text-small-color">
              暂无角色，请先新增一个角色。
            </div>
            <div v-else class="flex flex-col gap-3">
              <div
                v-for="character in characters"
                :key="character.id"
                class="rounded border-default bg-color-3 p-3 shadow-sm"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-600 text-color">{{ character.name }}</p>
                    <p class="mt-1 text-small text-default">
                      性格：{{ character.personality }}
                    </p>
                    <p v-if="character.goals" class="mt-1 text-small text-small-color">
                      目标：{{ character.goals }}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <el-button
                      text
                      size="small"
                      type="primary"
                      @click="editCharacter(character)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      text
                      size="small"
                      type="danger"
                      @click="removeCharacter(character.id)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <el-form
              v-if="showCharacterForm"
              label-position="top"
              class="grid gap-3 border-default-t pt-3"
              @submit.prevent
            >
              <el-form-item label="角色名称">
                <el-input
                  v-model="characterForm.name"
                  placeholder="角色名称"
                />
              </el-form-item>
              <el-form-item label="性格特质">
                <el-input
                  v-model="characterForm.personality"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 4 }"
                  placeholder="例如：冷静、谨慎、善于观察"
                />
              </el-form-item>
              <el-form-item label="人物目标 (选填)">
                <el-input
                  v-model="characterForm.goals"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 3 }"
                  placeholder="角色期望达成的目标"
                />
              </el-form-item>
              <div class="flex justify-end gap-2">
                <el-button size="small" @click="toggleCharacterForm">
                  取消
                </el-button>
                <el-button type="primary" size="small" @click="addOrUpdateCharacter">
                  {{ editingCharacterId ? "保存" : "添加" }}
                </el-button>
              </div>
            </el-form>

            <el-divider class="!my-2" />
            <div class="rounded bg-color-3 p-3 text-small leading-relaxed whitespace-pre-wrap">
              {{ storyPreview }}
            </div>
            <el-button type="primary" class="w-full" @click="applyStorySettings">
              应用故事设定
            </el-button>
          </div>
        </section>

        <section class="chat-area card-rounded-df border-default bg-color-2 shadow-sm flex min-h-[480px] flex-col">
          <el-scrollbar ref="scrollRef" class="flex-1">
            <div class="flex flex-col gap-3 p-4">
              <div
                v-for="message in sortedMessages"
                :key="message.id"
                class="message"
                :class="`message--${message.role}`"
              >
                <div class="message__meta">
                  <span class="message__sender">{{ message.sender }}</span>
                  <span class="message__time text-mini text-small-color">{{ formatTimestamp(message.timestamp) }}</span>
                </div>
                <div class="message__content">
                  {{ message.content }}
                </div>
                <div v-if="isStreaming && message.id === currentStreamMessageId" class="typing-dot">
                  <span class="dot" />
                  <span class="dot" />
                  <span class="dot" />
                </div>
              </div>
            </div>
          </el-scrollbar>
          <footer class="border-default-t bg-color-3 p-4">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-small text-default">
              <span>{{ statusMessage }}</span>
              <span v-if="storyPrompt" class="text-small-color">
                当前故事：{{ storyTitle || "未命名故事" }}
              </span>
            </div>
            <el-input
              v-model="userInput"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 6 }"
              :maxlength="1200"
              :disabled="isStreaming"
              placeholder="向角色说点什么……"
              @keydown.enter.prevent="handleSend"
            />
            <div class="mt-3 flex items-center justify-end gap-2">
              <el-button text size="small" @click="handleNewChat()">
                清空
              </el-button>
              <el-button
                type="primary"
                :disabled="isStreaming || !userInput.trim()"
                @click="handleSend"
              >
                {{ isStreaming ? "创作中..." : "发送" }}
              </el-button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.story-ai-page {
  --at-apply: "bg-transparent";
}

.story-settings {
  --at-apply: "overflow-hidden";
}

.chat-area {
  --at-apply: "overflow-hidden";
}

.message {
  --at-apply: "max-w-[90%] rounded-2 p-3 text-sm leading-relaxed shadow-sm";
  background: var(--el-bg-color-page);
  color: var(--el-text-color-regular);

  &__meta {
    --at-apply: "mb-1 flex items-center gap-2";
  }

  &__sender {
    --at-apply: "font-600 text-color";
  }

  &__content {
    white-space: pre-wrap;
  }

  &.message--user {
    --at-apply: "ml-auto bg-[var(--el-color-primary)] text-white";
  }

  &.message--assistant {
    --at-apply: "bg-color-2 border-default";
  }

  &.message--system {
    --at-apply: "mx-a border border-dashed border-default bg-color-3 text-small-color";
  }
}

.typing-dot {
  display: inline-flex;
  gap: 0.35rem;
  margin-top: 0.5rem;

  .dot {
    width: 0.4rem;
    height: 0.4rem;
    border-radius: 50%;
    background: var(--el-color-primary);
    animation: typingBlink 1s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typingBlink {
  0%,
  60%,
  100% {
    opacity: 0.2;
  }
  30% {
    opacity: 1;
  }
}
</style>
