import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";

export class GitService {
  static watch(
    context: vscode.ExtensionContext,
    onEvent: (msg: object) => void
  ) {
    // Watch for file saves (commit hint)
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        // Only react to source files
        if (!doc.uri.fsPath.match(/\.(ts|js|py|java|c|cpp|cs|go|rs|vue|jsx|tsx)$/)) {
          return;
        }
        const msgs = [
          "主人保存了文件，继续加油哦！",
          "文件已保存，主人真勤快！",
          "好的进度！别忘了休息哦～",
          "保存成功！主人辛苦啦！",
        ];
        onEvent({
          type: "gitSave",
          text: msgs[Math.floor(Math.random() * msgs.length)],
        });
      })
    );

    // Watch for git commits using git watcher
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    for (const folder of workspaceFolders) {
      GitService.watchGitCommit(folder.uri.fsPath, onEvent);
    }
  }

  private static watchGitCommit(root: string, onEvent: (msg: object) => void) {
    const headPath = path.join(root, ".git", "COMMIT_EDITMSG");
    let lastContent = "";

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(root, ".git/COMMIT_EDITMSG")
    );

    const handle = () => {
      try {
        cp.exec(`git -C "${root}" log -1 --pretty=format:"%s"`, (err, stdout) => {
          if (err) return;
          const msg = stdout.trim();
          if (msg && msg !== lastContent) {
            lastContent = msg;
            const replies = [
              `主人提交了代码！"${msg}" 真棒！`,
              `Git commit 成功~ "${msg}"！继续努力！`,
              `代码提交啦！主人最努力了！`,
            ];
            onEvent({
              type: "gitCommit",
              commitMsg: msg,
              text: replies[Math.floor(Math.random() * replies.length)],
            });
          }
        });
      } catch {
        // ignore
      }
    };

    watcher.onDidChange(handle);
    watcher.onDidCreate(handle);
  }

  /** Get recent git log */
  static getLog(root: string, limit = 5): Promise<string[]> {
    return new Promise((resolve) => {
      cp.exec(
        `git -C "${root}" log --oneline -${limit}`,
        (err, stdout) => {
          if (err) resolve([]);
          else resolve(stdout.trim().split("\n").filter(Boolean));
        }
      );
    });
  }
}
