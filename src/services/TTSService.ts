/**
 * TTSService - Provides TTS configuration for the webview.
 * Actual speech synthesis runs in the webview via Web Speech API.
 */
export class TTSService {
  /** Default TTS settings to pass to webview */
  static getDefaultSettings() {
    return {
      lang: "zh-CN",
      rate: 1.0,
      pitch: 1.2,
      volume: 0.9,
    };
  }
}
