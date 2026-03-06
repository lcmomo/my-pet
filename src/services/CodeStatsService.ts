import * as vscode from "vscode";

interface Stats {
  linesSaved: number;
  filesSaved: number;
  sessionStart: number;
}

export class CodeStatsService {
  private static stats: Stats = {
    linesSaved: 0,
    filesSaved: 0,
    sessionStart: Date.now(),
  };

  static watch(
    context: vscode.ExtensionContext,
    onEvent: (msg: object) => void
  ) {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        const lang = doc.languageId;
        // Only count code files
        if (["plaintext", "markdown", "json", "xml"].includes(lang)) return;

        CodeStatsService.stats.filesSaved++;
        CodeStatsService.stats.linesSaved += doc.lineCount;

        const { linesSaved, filesSaved } = CodeStatsService.stats;

        // Milestone messages
        let text: string | null = null;

        if (linesSaved >= 10000 && linesSaved % 1000 < doc.lineCount) {
          text = `哇！主人已经写了超过 ${linesSaved} 行代码了！太厉害了！🎉`;
        } else if (linesSaved >= 5000 && linesSaved % 500 < doc.lineCount) {
          text = `主人写了 ${linesSaved} 行代码，继续加油，冲破1万行！⚡`;
        } else if (linesSaved >= 1000 && linesSaved % 200 < doc.lineCount) {
          text = `已经写了 ${linesSaved} 行代码！主人真厉害！(*≧∀≦*)`;
        } else if (linesSaved >= 500 && linesSaved % 100 < doc.lineCount) {
          text = `${linesSaved} 行了！保持住，继续冲！(ง •̀_•́)ง`;
        } else if (filesSaved % 10 === 0) {
          text = `已经保存了 ${filesSaved} 个文件！主人辛苦了！记得喝水哦 💧`;
        }

        if (text) {
          onEvent({ type: "codeStats", text, stats: { linesSaved, filesSaved } });
        }
      })
    );

    // Periodic encouragement (every 30 min)
    const timer = setInterval(() => {
      const minutes = Math.floor((Date.now() - CodeStatsService.stats.sessionStart) / 60000);
      if (minutes > 0 && minutes % 30 === 0) {
        const msgs = [
          `主人已经编码 ${minutes} 分钟了！适当休息，保护眼睛哦！👀`,
          `连续工作 ${minutes} 分钟！主人是最勤快的！要不要起来活动一下？`,
          `${minutes} 分钟啦！超努力的主人，记得喝水！💧`,
        ];
        onEvent({
          type: "sessionTime",
          text: msgs[Math.floor(Math.random() * msgs.length)],
          minutes,
        });
      }
    }, 60000);

    context.subscriptions.push({ dispose: () => clearInterval(timer) });
  }

  static getStats() {
    return { ...CodeStatsService.stats };
  }
}
