/**
 * speech.js — Speech bubble + TTS
 * Exposes: window.PetSpeech = { say, tts, enableTTS, disableTTS }
 */
(function () {
  'use strict';

  let ttsEnabled = true;
  let bubbleTimer = null;
  const bubble = document.getElementById('speech-bubble');
  const bubbleText = document.getElementById('speech-text');

  /** Show speech bubble with text, auto-hide after delay */
  function say(text, duration) {
    if (!bubble || !bubbleText) return;
    duration = duration || Math.max(3000, text.length * 80);

    bubbleText.textContent = text;
    bubble.classList.remove('hidden');
    bubble.style.animation = 'none';
    void bubble.offsetWidth; // reflow
    bubble.style.animation = 'bubbleIn 0.3s ease';

    if (bubbleTimer) clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => {
      bubble.style.animation = 'bubbleOut 0.3s ease forwards';
      setTimeout(() => bubble.classList.add('hidden'), 300);
    }, duration);

    if (ttsEnabled) tts(text);
  }

  /** Web Speech API TTS */
  function tts(text) {
    if (!('speechSynthesis' in window) || !ttsEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 1.0;
      utter.pitch = 1.2;
      utter.volume = 0.85;

      // Try to pick a Chinese voice
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang.startsWith('zh'));
      if (zhVoice) utter.voice = zhVoice;

      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('[TTS]', e);
    }
  }

  window.PetSpeech = {
    say,
    tts,
    enableTTS()  { ttsEnabled = true; },
    disableTTS() { ttsEnabled = false; },
    setTTS(v)    { ttsEnabled = !!v; },
  };
})();
