import * as vscode from "vscode";
import * as https from "https";

const SYSTEM_PROMPT = `你是一个可爱的二次元 Live2D 桌宠助手，名字叫小宠。
你的性格：活泼、可爱、关心主人、偶尔卖萌。
你喜欢用颜文字和emoji。
如果主人问编程问题，你会认真解答，但也会加上一点可爱的语气。
回复要简短，不超过100字。`;

export class ChatService {
  static async chat(
    userMessage: string,
    context: vscode.ExtensionContext
  ): Promise<string> {
    // Try VS Code built-in LM API first
    try {
      const reply = await ChatService.chatWithVSCodeLM(userMessage);
      if (reply) return reply;
    } catch {
      // fall through to OpenAI
    }

    // Try OpenAI if API key configured
    const cfg = vscode.workspace.getConfiguration("live2d-pet");
    const apiKey = cfg.get<string>("openaiApiKey", "");
    if (apiKey) {
      try {
        return await ChatService.chatWithOpenAI(userMessage, apiKey);
      } catch (e: any) {
        return `哎呀，AI出了点小问题：${e.message}`;
      }
    }

    // Fallback: rule-based responses
    return ChatService.fallbackResponse(userMessage);
  }

  private static async chatWithVSCodeLM(userMessage: string): Promise<string> {
    // VS Code 1.90+ has built-in LM API
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    if (!models || models.length === 0) throw new Error("No VS Code LM model");

    const model = models[0];
    const messages = [
      vscode.LanguageModelChatMessage.User(SYSTEM_PROMPT + "\n\n用户：" + userMessage),
    ];

    const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
    let text = "";
    for await (const chunk of response.text) {
      text += chunk;
    }
    return text || ChatService.fallbackResponse(userMessage);
  }

  private static chatWithOpenAI(userMessage: string, apiKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      const options = {
        hostname: "api.openai.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.choices[0].message.content.trim());
          } catch (e) {
            reject(new Error("解析 AI 响应失败"));
          }
        });
      });

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }

  private static fallbackResponse(userMessage: string): string {
    const msg = userMessage.toLowerCase();

    if (/你好|hello|hi|嗨/.test(msg)) {
      return "主人你好呀！ヾ(≧▽≦*)o 今天也要开心哦！";
    }
    if (/累|tired|疲惫/.test(msg)) {
      return "主人辛苦了！要不要休息一下呢？(。•ᴗ•。)";
    }
    if (/加油|fighting|努力/.test(msg)) {
      return "主人加油！！ヽ(✿ﾟ▽ﾟ)ノ 你是最棒的！";
    }
    if (/bug|错误|error/.test(msg)) {
      return "不怕不怕！bug都是纸老虎！主人一定可以解决的！(ง •̀_•́)ง";
    }
    if (/谢谢|thanks|thank you/.test(msg)) {
      return "不客气哦～主人最好了！(◕ᴗ◕✿)";
    }
    if (/吃|饿|hungry|food/.test(msg)) {
      return "主人饿了吗？要不要去吃点东西，充个电再来！🍱";
    }
    if (/名字|叫什么|who are you/.test(msg)) {
      return "我是小宠啦！主人的专属 Live2D 桌宠！(*^▽^*)";
    }
    if (/帮|help|怎么/.test(msg)) {
      return "主人需要帮忙吗？我来啦～虽然我能力有限，但会陪着你的！(｡♥‿♥｡)";
    }

    const defaults = [
      "哇～主人说了什么有趣的事情呢？(≧∇≦)/",
      "嗯嗯！主人说得对！(◡ ω ◡)",
      "小宠听到了！主人加油哦！(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
      "主人今天也很努力呢～ (¬‿¬)",
      "噗 ∑d(°∀°d) 小宠高兴！",
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
}
