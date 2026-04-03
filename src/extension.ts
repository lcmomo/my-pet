import * as vscode from "vscode";
import { Live2DViewProvider } from "./panel/live2dView";
import { GitService } from "./services/GitService";
import { CodeStatsService } from "./services/CodeStatsService";
import { ChatService } from "./services/ChatService";
import { ModelService } from "./services/ModelService";

let panel: Live2DViewProvider;

export function activate(context: vscode.ExtensionContext) {
  // ---- Register WebviewView provider (sidebar panel, persists across sessions) ----
  const provider = new Live2DViewProvider(context);
  panel = provider;

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      Live2DViewProvider.viewType,
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // ---- Status bar toggle button ----
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "live2d.toggle";
  statusBarItem.tooltip = "点击切换 Live2D 桌宠显示/隐藏";
  const initialEnabled = vscode.workspace.getConfiguration("live2d-pet").get<boolean>("enabled", true);
  updateStatusBar(statusBarItem, initialEnabled);
  context.subscriptions.push(statusBarItem);

  // ---- Commands ----
  context.subscriptions.push(
    vscode.commands.registerCommand("live2d.start", async () => {
      await vscode.workspace.getConfiguration("live2d-pet").update("enabled", true, true);
      provider.postMessage({ type: "petVisibility", visible: true });
      // Reveal the sidebar panel so the pet becomes visible
      await vscode.commands.executeCommand(`${Live2DViewProvider.viewType}.focus`);
      updateStatusBar(statusBarItem, true);
    }),

    vscode.commands.registerCommand("live2d.hide", async () => {
      await vscode.workspace.getConfiguration("live2d-pet").update("enabled", false, true);
      provider.postMessage({ type: "petVisibility", visible: false });
      updateStatusBar(statusBarItem, false);
    }),

    vscode.commands.registerCommand("live2d.toggle", () => {
      const c = vscode.workspace.getConfiguration("live2d-pet");
      c.update("enabled", !c.get<boolean>("enabled", true), true);
      // Config change listener handles the actual show/hide
    }),

    vscode.commands.registerCommand("live2d.nextModel", () => {
      provider.postMessage({ type: "nextModel" });
    }),

    vscode.commands.registerCommand("live2d.chat", async () => {
      const input = await vscode.window.showInputBox({
        prompt: "和桌宠说点什么吧～",
        placeHolder: "输入消息...",
      });
      if (input) {
        const response = await ChatService.chat(input, context);
        provider.postMessage({ type: "chat", text: input, reply: response });
      }
    })
  );

  // ---- Git interactions ----
  GitService.watch(context, (event) => {
    provider.postMessage(event);
  });

  // ---- Code statistics ----
  CodeStatsService.watch(context, (event) => {
    provider.postMessage(event);
  });

  // ---- Build / task events ----
  context.subscriptions.push(
    vscode.tasks.onDidEndTaskProcess((e) => {
      if (e.exitCode !== 0) {
        provider.postMessage({ type: "buildFail", text: getBuildFailMessage() });
      } else if (e.exitCode === 0) {
        provider.postMessage({ type: "buildSuccess", text: getBuildSuccessMessage() });
      }
    })
  );

  // ---- Config changes → hot-reload / show-hide ----
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("live2d-pet")) return;

      const cfg = vscode.workspace.getConfiguration("live2d-pet");

      if (e.affectsConfiguration("live2d-pet.enabled")) {
        const enabled = cfg.get<boolean>("enabled", true);
        if (enabled) {
          provider.postMessage({ type: "petVisibility", visible: true });
          vscode.commands.executeCommand(`${Live2DViewProvider.viewType}.focus`);
        } else {
          provider.postMessage({ type: "petVisibility", visible: false });
        }
        updateStatusBar(statusBarItem, enabled);
        return;
      }

      // All other config changes → forward to webview for hot-reload
      provider.postMessage({
        type: "configUpdate",
        config: getConfig(cfg),
        models: ModelService.getModelNames(),
        modelUrlMap: ModelService.getAllModels(),
        modelBase: ModelService.base,
      });
    })
  );

  // ---- Handle messages from webview (AI chat) ----
  Live2DViewProvider.onDidReceiveMessage(async (msg: any, ctx: vscode.ExtensionContext) => {
    if (msg.type === "chat") {
      const reply = await ChatService.chat(msg.text, ctx);
      provider.postMessage({ type: "chat", text: msg.text, reply });
    }
  });
}

export function deactivate() {}

function updateStatusBar(item: vscode.StatusBarItem, visible: boolean) {
  item.text = visible ? "$(eye) 桌宠" : "$(eye-off) 桌宠";
  item.backgroundColor = visible
    ? undefined
    : new vscode.ThemeColor("statusBarItem.warningBackground");
  item.show();
}

function getConfig(cfg: vscode.WorkspaceConfiguration) {
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

const buildFailMessages = [
  "哎呀，编译失败了！代码里有小虫虫在捣乱～",
  "编译出错了！不要灰心，bug都是调出来的！",
  "又报错了？一起来找茬吧！",
  "哎，出错了...主人加油哦！",
  "编译失败！主人是不是漏了个分号？",
  "报错了！放轻松，没有解决不了的bug！",
  "哇，好多红色！要帮主人捉虫吗？",
  "编译炸了...深呼吸，再来一次！",
];

const buildSuccessMessages = [
  "编译成功！主人真厉害～",
  "完美编译！主人棒棒哒！",
  "代码通过了！给主人比心心❤",
  "耶！编译成功！主人最棒了！",
];

function getBuildFailMessage() {
  return buildFailMessages[Math.floor(Math.random() * buildFailMessages.length)];
}

function getBuildSuccessMessage() {
  return buildSuccessMessages[Math.floor(Math.random() * buildSuccessMessages.length)];
}
