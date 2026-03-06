import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ModelService } from "../services/ModelService";

type MessageHandler = (msg: any, context: vscode.ExtensionContext) => void;

let globalMessageHandler: MessageHandler | undefined;
let globalContext: vscode.ExtensionContext | undefined;

export class Live2DPanel {
  private static instance: Live2DPanel | undefined;
  private panel: vscode.WebviewPanel;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
  ) {
    this.panel = panel;
    this.context = context;

    this.panel.webview.html = this.buildHtml();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (msg) => {
        if (globalMessageHandler && globalContext) {
          globalMessageHandler(msg, globalContext);
        }
      },
      null,
      this.disposables
    );

    this.panel.onDidDispose(
      () => this.dispose(),
      null,
      this.disposables
    );

    // Send initial config on load
    setTimeout(() => {
      const cfg = vscode.workspace.getConfiguration("live2d-pet");
      this.postMessage({
        type: "init",
        config: this.readConfig(cfg),
        models: ModelService.models,
        modelBase: ModelService.base,
      });
    }, 1500);
  }

  static getOrCreate(context: vscode.ExtensionContext): Live2DPanel {
    globalContext = context;
    if (Live2DPanel.instance) {
      try {
        Live2DPanel.instance.panel.reveal(vscode.ViewColumn.Beside, true);
        return Live2DPanel.instance;
      } catch {
        Live2DPanel.instance = undefined;
      }
    }

    const panel = vscode.window.createWebviewPanel(
      "live2dPet",
      "🐾 Live2D 桌宠",
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "webview")),
        ],
      }
    );

    Live2DPanel.instance = new Live2DPanel(panel, context);
    return Live2DPanel.instance;
  }

  static onDidReceiveMessage(handler: MessageHandler, context: vscode.ExtensionContext) {
    globalMessageHandler = handler;
    globalContext = context;
  }

  postMessage(msg: object) {
    try {
      this.panel.webview.postMessage(msg);
    } catch {
      // panel disposed
    }
  }

  dispose() {
    Live2DPanel.instance = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }

  private readConfig(cfg: vscode.WorkspaceConfiguration) {
    return {
      model: cfg.get<string>("model", "shizuku-48"),
      modelUrl: cfg.get<string>("modelUrl", ""),
      modelWidth: cfg.get<number>("modelWidth", 300),
      modelHeight: cfg.get<number>("modelHeight", 380),
      position: cfg.get<string>("position", "right"),
      moveX: cfg.get<number>("moveX", 0),
      moveY: cfg.get<number>("moveY", 0),
      opacity: cfg.get<number>("opacity", 1),
      talk: cfg.get<boolean>("talk", true),
      tts: cfg.get<boolean>("tts", true),
      aiEnabled: cfg.get<boolean>("aiEnabled", true),
      pointerOverHidden: cfg.get<boolean>("pointerOverHidden", false),
      randomModel: cfg.get<boolean>("randomModel", false),
    };
  }

  private getUri(relativePath: string) {
    return this.panel.webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this.context.extensionPath, "webview", relativePath)
      )
    );
  }

  private buildHtml(): string {
    const styleUri = this.getUri("style/style.css");
    const speechUri = this.getUri("pet/speech.js");
    const actionsUri = this.getUri("pet/actions.js");
    const expressionsUri = this.getUri("pet/expressions.js");
    const dragUri = this.getUri("pet/drag.js");
    const chatUri = this.getUri("ai/chat.js");
    const petUri = this.getUri("pet/pet.js");
    const live2dUri = this.getUri("runtime/live2d.min.js");

    const csp = this.panel.webview.cspSource;

    // CDN versions — loaded at runtime from the internet
    const PIXI_CDN = "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js";
    const CUBISM_CDN = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";
    const LIVE2D_DISPLAY_CDN = "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.js";

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             img-src ${csp} https: data: blob:;
             script-src ${csp} 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cubism.live2d.com https://raw.githubusercontent.com;
             style-src ${csp} 'unsafe-inline';
             connect-src https: wss: data: blob:;
             font-src ${csp} https: data:;
             media-src https: blob:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live2D Pet</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <!-- 桌宠容器 -->
  <div id="pet-wrapper">
    <canvas id="pet-canvas"></canvas>
    <div id="speech-bubble" class="hidden">
      <div id="speech-text"></div>
    </div>
    <div id="pet-toolbar">
      <button id="btn-next-model" title="切换模型">🔄</button>
      <button id="btn-random-action" title="随机动作">🎭</button>
      <button id="btn-chat" title="和我说话">💬</button>
      <button id="btn-toggle-tts" title="语音开关">🔊</button>
    </div>
  </div>

  <!-- AI 对话面板 -->
  <div id="chat-panel" class="hidden">
    <div id="chat-header">
      <span>💬 AI 对话</span>
      <button id="chat-close">✖</button>
    </div>
    <div id="chat-messages"></div>
    <div id="chat-input-row">
      <input id="chat-input" type="text" placeholder="和我说点什么吧～" />
      <button id="chat-send">发送</button>
    </div>
  </div>

  <!-- 模型选择弹窗 -->
  <div id="model-picker" class="hidden">
    <div id="model-picker-header">
      <span>🎀 选择模型（共 <span id="model-count">0</span> 个）</span>
      <input id="model-search" type="text" placeholder="搜索模型..." />
      <button id="model-picker-close">✖</button>
    </div>
    <div id="model-list"></div>
  </div>

  <!-- Live2D CDN Libraries (loaded in order) -->
  <script src="${CUBISM_CDN}"></script>
  <script src="${PIXI_CDN}"></script>
  <script src="${live2dUri}"></script>

  <!-- Local Webview Scripts -->
  <script src="${speechUri}"></script>
  <script src="${actionsUri}"></script>
  <script src="${expressionsUri}"></script>
  <script src="${dragUri}"></script>
  <script src="${chatUri}"></script>
  <script src="${petUri}"></script>
</body>
</html>`;
  }
}
