import * as vscode from "vscode";
import { Live2DPanel } from "./panel/live2dPanel";
import { GitService } from "./services/GitService";
import { CodeStatsService } from "./services/CodeStatsService";
import { ChatService } from "./services/ChatService";

let panel: Live2DPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  const cfg = vscode.workspace.getConfiguration("live2d-pet");

  // Auto-start if enabled
  if (cfg.get<boolean>("enabled", true)) {
    panel = Live2DPanel.getOrCreate(context);
  }

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("live2d.start", () => {
      panel = Live2DPanel.getOrCreate(context);
    }),

    vscode.commands.registerCommand("live2d.hide", () => {
      if (panel) {
        panel.dispose();
        panel = undefined;
      }
    }),

    vscode.commands.registerCommand("live2d.nextModel", () => {
      panel?.postMessage({ type: "nextModel" });
    }),

    vscode.commands.registerCommand("live2d.chat", async () => {
      const input = await vscode.window.showInputBox({
        prompt: "和桌宠说点什么吧～",
        placeHolder: "输入消息...",
      });
      if (input) {
        const response = await ChatService.chat(input, context);
        panel?.postMessage({ type: "chat", text: input, reply: response });
      }
    })
  );

  // Git interactions
  GitService.watch(context, (event) => {
    panel?.postMessage(event);
  });

  // Code statistics
  CodeStatsService.watch(context, (event) => {
    panel?.postMessage(event);
  });

  // Build / task fail → tsukkomi
  context.subscriptions.push(
    vscode.tasks.onDidEndTaskProcess((e) => {
      if (e.exitCode !== 0) {
        panel?.postMessage({
          type: "buildFail",
          text: getBuildFailMessage(),
        });
      } else if (e.exitCode === 0) {
        panel?.postMessage({
          type: "buildSuccess",
          text: getBuildSuccessMessage(),
        });
      }
    })
  );

  // Config change → hot-reload
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("live2d-pet")) {
        const newCfg = vscode.workspace.getConfiguration("live2d-pet");
        panel?.postMessage({ type: "configUpdate", config: getConfig(newCfg) });
      }
    })
  );

  // Handle AI chat messages from webview
  Live2DPanel.onDidReceiveMessage(async (msg: any, ctx: vscode.ExtensionContext) => {
    if (msg.type === "chat") {
      const reply = await ChatService.chat(msg.text, ctx);
      panel?.postMessage({ type: "chat", text: msg.text, reply });
    }
  }, context);
}

export function deactivate() {
  panel?.dispose();
}

function getConfig(cfg: vscode.WorkspaceConfiguration) {
  return {
    model: cfg.get<string>("model", "shizuku-48"),
    modelUrl: cfg.get<string>("modelUrl", "https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/shizuku-48/index.json"),
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
