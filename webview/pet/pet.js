/**
 * pet.js - Main Live2D Pet Controller
 * Initializes PIXI, loads model, handles extension messages & toolbar.
 */
(function () {
  /* ---- VS Code API ---- */
  var vscode = acquireVsCodeApi();

  /* ---- State ---- */
  var app, model;
  var currentModelName = 'shizuku-48';
  var ttsEnabled = true;
  var config = {
    model: 'shizuku-48',
    modelUrl: '',
    modelWidth: 300,
    modelHeight: 380,
    position: 'right',
    moveX: 0,
    moveY: 0,
    opacity: 1,
    talk: true,
    tts: true,
    randomModel: false,
  };

  var MODEL_BASE = 'https://raw.githubusercontent.com/iCharlesZ/vscode-live2d-models/master/model-library/';
  var MODELS = [
    'shizuku-48','Haru02','Hiyori','Mark','Natori','Rice','Wanko','Chitose','Miku'
  ];
  for (var i = 1; i <= 200; i++) MODELS.push('Model' + i);

  /* ---- Loading overlay ---- */
  var wrapper = document.getElementById('pet-wrapper');

  function showLoading() {
    var existing = document.getElementById('loading-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div><div>加载模型中...</div>';
    wrapper.appendChild(overlay);
  }

  function hideLoading() {
    var el = document.getElementById('loading-overlay');
    if (el) el.remove();
  }

  /* ---- Build model URL ---- */
  function getModelUrl(cfg) {
    if (cfg.modelUrl) return cfg.modelUrl;
    if (cfg.randomModel) {
      var name = MODELS[Math.floor(Math.random() * MODELS.length)];
      currentModelName = name;
      return MODEL_BASE + name + '/' + name + '.model3.json';
    }
    var name = cfg.model || 'Haru';
    currentModelName = name;
    return MODEL_BASE + name + '/' + name + '.model3.json';
  }

  /* ---- Apply config to wrapper ---- */
  function applyConfig(cfg) {
    Object.assign(config, cfg);
    wrapper.style.opacity = cfg.opacity || 1;
    if (cfg.position === 'left') {
      wrapper.classList.add('position-left');
    } else {
      wrapper.classList.remove('position-left');
    }
    if (cfg.pointerOverHidden) {
      wrapper.classList.add('pointer-over-hidden');
    } else {
      wrapper.classList.remove('pointer-over-hidden');
    }
    if (cfg.moveX || cfg.moveY) {
      wrapper.style.transform = 'translate(' + (cfg.moveX||0) + 'px,' + (cfg.moveY||0) + 'px)';
    }
    if (window.PetSpeech) window.PetSpeech.setTTS(cfg.tts !== false);
  }

  /* ---- Load (or reload) model ---- */
  async function loadModel(url, w, h) {
    showLoading();
    try {
      console.log('[PetJS] Loading model from', url);
      if (model) {
        app.stage.removeChild(model);
        model.destroy();
        model = null;
      }

      // Determine scale: pixi-live2d-display auto-scales, so we set via a bounding box
      var targetW = w || config.modelWidth || 300;
      var targetH = h || config.modelHeight || 380;

      app.renderer.resize(targetW, targetH);
      app.view.width  = targetW;
      app.view.height = targetH;
      app.view.style.width  = targetW + 'px';
      app.view.style.height = targetH + 'px';

      model = await PIXI.live2d.Live2DModel.from(url, { autoInteract: false });

      // Scale to fit
      var scaleX = targetW / model.width;
      var scaleY = targetH / model.height;
      var scale  = Math.min(scaleX, scaleY) * 0.95;
      model.scale.set(scale);
      model.x = (targetW - model.width) / 2;
      model.y = (targetH - model.height) / 2;

      // Mouse interaction
      model.interactive = true;
      model.buttonMode  = true;

      model.on('pointerover', function () {
        if (window.PetActions) window.PetActions.playForContext('wave');
      });
      model.on('pointerdown', function (e) {
        if (window.PetActions) window.PetActions.playForContext('tap');
        if (window.PetExpressions) window.PetExpressions.playRandom();
        var msgs = [
          '主人在逗我吗？(o^▽^o)',
          '嘿嘿，主人点我干什么～',
          '呀！主人好坏！(>ω<)',
          '嘤嘤嘤，轻点啦！',
          '主人喜欢我吗？✨',
        ];
        if (window.PetSpeech) {
          window.PetSpeech.say(msgs[Math.floor(Math.random() * msgs.length)]);
        }
      });
      model.on('pointerout', function () {
        if (window.PetActions) window.PetActions.playForContext('idle');
      });

      // Mouse tracking
      app.ticker.add(function () {
        if (model && window._mouseX !== undefined) {
          model.focus(window._mouseX, window._mouseY);
        }
      });

      app.stage.addChild(model);
      window.petApp = { app: app, model: model };

      if (window.PetActions) window.PetActions.startIdleLoop();
      if (window.PetExpressions) {
        setInterval(function () { window.PetExpressions.playRandom(); }, 30000);
      }

      hideLoading();
      if (window.PetSpeech && config.talk) {
        var greets = [
          '你好呀主人！(✿◠‿◠)',
          '主人来了！今天也要加油哦～',
          '我是 ' + currentModelName + '！请多关照！',
        ];
        window.PetSpeech.say(greets[Math.floor(Math.random() * greets.length)]);
      }
    } catch (err) {
      hideLoading();
      console.error('[PetJS] Model load error:', err);
      showError('模型加载失败，请检查网络连接。');
    }
  }

  function showError(msg) {
    var el = document.getElementById('loading-overlay') || document.createElement('div');
    el.id = 'loading-overlay';
    el.innerHTML = '<div style="text-align:center;color:#f87171;font-size:13px;">❌ ' + msg + '</div>';
    wrapper.appendChild(el);
  }

  /* ---- Mouse tracking ---- */
  document.addEventListener('mousemove', function (e) {
    window._mouseX = e.clientX;
    window._mouseY = e.clientY;
  });

  /* ---- Model list picker ---- */
  function initModelPicker() {
    var picker = document.getElementById('model-picker');
    var listEl = document.getElementById('model-list');
    var countEl = document.getElementById('model-count');
    var searchEl = document.getElementById('model-search');
    var closeBtn = document.getElementById('model-picker-close');
    var nextBtn = document.getElementById('btn-next-model');

    if (countEl) countEl.textContent = MODELS.length;

    function renderList(filter) {
      listEl.innerHTML = '';
      MODELS.filter(function (m) {
        return !filter || m.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
      }).forEach(function (name) {
        var item = document.createElement('div');
        item.className = 'model-item' + (name === currentModelName ? ' active' : '');
        item.textContent = name;
        item.addEventListener('click', function () {
          currentModelName = name;
          var url = MODEL_BASE + name + '/' + name + '.model3.json';
          loadModel(url, config.modelWidth, config.modelHeight);
          picker.classList.add('hidden');
          if (window.PetSpeech) window.PetSpeech.say('正在加载模型 ' + name + '...');
        });
        listEl.appendChild(item);
      });
    }

    renderList('');

    if (searchEl) {
      searchEl.addEventListener('input', function () { renderList(searchEl.value); });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function () { picker.classList.add('hidden'); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        picker.classList.toggle('hidden');
        if (!picker.classList.contains('hidden')) renderList('');
      });
    }
  }

  /* ---- Toolbar buttons ---- */
  function initToolbar() {
    var btnAction = document.getElementById('btn-random-action');
    var btnChat   = document.getElementById('btn-chat');
    var btnTTS    = document.getElementById('btn-toggle-tts');

    if (btnAction) {
      btnAction.addEventListener('click', function () {
        if (window.PetActions) window.PetActions.playRandom();
        if (window.PetExpressions) window.PetExpressions.playRandom();
      });
    }
    if (btnChat) {
      btnChat.addEventListener('click', function () {
        if (window.PetChat) window.PetChat.toggle();
      });
    }
    if (btnTTS) {
      btnTTS.addEventListener('click', function () {
        ttsEnabled = !ttsEnabled;
        if (window.PetSpeech) window.PetSpeech.setTTS(ttsEnabled);
        btnTTS.textContent = ttsEnabled ? '���' : '���';
        if (window.PetSpeech) {
          window.PetSpeech.say(ttsEnabled ? '语音已开启！' : '语音已静音。');
        }
      });
    }
  }

  /* ---- Extension messages ---- */
  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'init':
        if (msg.config) {
          applyConfig(msg.config);
          loadModel(getModelUrl(msg.config), msg.config.modelWidth, msg.config.modelHeight);
        }
        break;

      case 'configUpdate':
        if (msg.config) {
          applyConfig(msg.config);
          loadModel(getModelUrl(msg.config), msg.config.modelWidth, msg.config.modelHeight);
        }
        break;

      case 'nextModel': {
        var idx = MODELS.indexOf(currentModelName);
        var nextName = MODELS[(idx + 1) % MODELS.length];
        currentModelName = nextName;
        var url = MODEL_BASE + nextName + '/' + nextName + '.model3.json';
        loadModel(url, config.modelWidth, config.modelHeight);
        if (window.PetSpeech) window.PetSpeech.say('切换到 ' + nextName + ' 啦！');
        break;
      }

      case 'buildFail':
        if (window.PetActions) window.PetActions.playForContext('fail');
        if (window.PetExpressions) window.PetExpressions.play('sad');
        if (window.PetSpeech && config.talk) window.PetSpeech.say(msg.text);
        break;

      case 'buildSuccess':
        if (window.PetActions) window.PetActions.playForContext('happy');
        if (window.PetExpressions) window.PetExpressions.play('smile');
        if (window.PetSpeech && config.talk) window.PetSpeech.say(msg.text);
        break;

      case 'gitSave':
      case 'gitCommit':
        if (window.PetActions) window.PetActions.playForContext('commit');
        if (window.PetSpeech && config.talk) window.PetSpeech.say(msg.text);
        break;

      case 'codeStats':
      case 'sessionTime':
        if (window.PetActions) window.PetActions.playForContext('happy');
        if (window.PetSpeech && config.talk) window.PetSpeech.say(msg.text);
        break;

      case 'chat':
        if (window.PetChat) {
          window.PetChat.hideTyping();
          window.PetChat.addMessage('bot', msg.reply || '...');
        }
        if (window.PetActions) window.PetActions.playForContext('chat');
        break;

      default:
        break;
    }
  });

  /* ---- Initialize PIXI app ---- */
  function initApp() {
    app = new PIXI.Application({
      view: document.getElementById('pet-canvas'),
      transparent: true,
      backgroundAlpha: 0,
      width:  config.modelWidth  || 300,
      height: config.modelHeight || 380,
      antialias: true,
    });

    // Register live2d plugin
    if (PIXI.live2d && PIXI.live2d.Live2DModel && PIXI.live2d.Live2DModel.registerTicker) {
      PIXI.live2d.Live2DModel.registerTicker(PIXI.Ticker);
    }

    window.petApp = { app: app, model: null };

    initToolbar();
    initModelPicker();

    // Load default model immediately (will be overwritten by 'init' message)
    showLoading();
    loadModel(MODEL_BASE + 'Haru/Haru.model3.json', 300, 380);
  }

  /* ---- Boot ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
