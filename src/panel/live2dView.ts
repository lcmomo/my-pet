import * as vscode from "vscode";
import * as path from "path";
import { ModelService } from "../services/ModelService";

type MessageHandler = (msg: any, context: vscode.ExtensionContext) => void;

let globalMessageHandler: MessageHandler | undefined;

/**
 * WebviewViewProvider — renders the Live2D pet inside a VS Code sidebar panel.
 * The pet DOM uses `position: fixed; right: 0; bottom: 0` so it floats in the
 * bottom-right corner of the sidebar viewport regardless of panel height.
 */
export class Live2DViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "live2dPetView";

  public static modelBaseUrl = "http://localhost:3200";
  private _view?: vscode.WebviewView;
  private readonly _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  /** Register the global message handler (called from extension.ts). */
  static onDidReceiveMessage(handler: MessageHandler): void {
    globalMessageHandler = handler;
  }

  // ── vscode.WebviewViewProvider ──────────────────────────────────────────
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _resolveContext: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this._context.extensionPath, "webview")),
      ],
    };

    webviewView.webview.html = this.buildHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (globalMessageHandler) {
        globalMessageHandler(msg, this._context);
      }
    });

    // Send initial config once the webview has had time to load scripts.
    setTimeout(() => {
      const cfg = vscode.workspace.getConfiguration("live2d-pet");
      const enabled = cfg.get<boolean>("enabled", true);
      this.postMessage({
        type: "init",
        visible: enabled,
        config: this.readConfig(cfg),
        models: ModelService.getModelNames(),
        modelUrlMap: ModelService.getAllModels(),
        modelBase: ModelService.base,
      });
    }, 1000);
  }

  // ── Public API ──────────────────────────────────────────────────────────
  postMessage(msg: object): void {
    this._view?.webview.postMessage(msg);
  }

  // ── Private helpers ─────────────────────────────────────────────────────
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

  private getUri(webview: vscode.Webview, relativePath: string): vscode.Uri {
    return webview.asWebviewUri(
      vscode.Uri.file(
        path.join(this._context.extensionPath, "webview", relativePath)
      )
    );
  }

  private buildHtml(webview: vscode.Webview): string {
    const g = (p: string) => this.getUri(webview, p);
    const csp = webview.cspSource;

    const styleUri        = g("style/style.css");
    const speechUri       = g("pet/speech.js");
    const actionsUri      = g("pet/actions.js");
    const expressionsUri  = g("pet/expressions.js");
    const dragUri         = g("pet/drag.js");
    const chatUri         = g("ai/chat.js");
    const petUri          = g("pet/pet.js");
    const pixiUri         = g("runtime/pixi.min.js");
    const live2dUri       = g("runtime/live2d.min.js");
    const live2dDisplayUri= g("runtime/live2d-display.min.js");
    const cubismUri       = g("runtime/live2dcubismcore.min.js");

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             img-src ${csp} ${Live2DViewProvider.modelBaseUrl} https: data: blob:;
             script-src ${csp} 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cubism.live2d.com https://raw.githubusercontent.com;
             style-src ${csp} 'unsafe-inline';
             connect-src ${Live2DViewProvider.modelBaseUrl} https: wss: data: blob:;
             font-src ${csp} https: data:;
             media-src https: blob:;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live2D Pet</title>
  <link rel="stylesheet" href="${styleUri}">
  <script src="${cubismUri}"></script>
  <script src="${pixiUri}"></script>
  <script src="${live2dUri}"></script>
  <script src="${live2dDisplayUri}"></script>
</head>
<body>
  <!-- 桌宠容器：position:fixed 固定在 webview 视口右下角 -->
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
    <!-- AI 对话面板：嵌套在 pet-wrapper 内，随宠物位置自适应 -->
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
