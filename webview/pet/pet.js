/**
 * pet.js - Main Live2D Pet Controller
 * Initializes PIXI, loads model, handles extension messages & toolbar.
 */
(function () {
  /* ---- VS Code API ---- */

  /* ---- State ---- */
  var app, model;
  var currentModelName = 'shizuku-48';
  var ttsEnabled = true;
  var defaultConfig = {
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
  var MODEL_URL_MAP = {};

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
      return MODEL_URL_MAP[name] || (MODEL_BASE + name + '/' + name + '.model3.json');
    }
    var name = cfg.model || 'shizuku-48';
    currentModelName = name;
    return MODEL_URL_MAP[name] || (MODEL_BASE + name + '/' + name + '.model3.json');
  }

  /* ---- Apply config to wrapper ---- */
  function applyConfig(config) {
    const { config: cfg, models = [], modelUrlMap = {} } = config;
    Object.assign(defaultConfig, cfg);
    MODELS = models;
    MODEL_URL_MAP = modelUrlMap;
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

  /* ---- Load (or reload) model using PIXI.live2d ---- */
  async function loadModel(url, w, h) {
    // Resolve target canvas dimensions up-front so the renderer is resized before loading
    const targetW = w || defaultConfig.modelWidth || 300;
    const targetH = h || defaultConfig.modelHeight || 380;

    showLoading();
    try {
      // Resize the PIXI renderer and canvas to match the new dimensions
      if (app) {
        app.renderer.resize(targetW, targetH);
      }

      console.log('[PetJS] Loading model from', url);
      if (model) {
        app.stage.removeChild(model);
        model.destroy();
        model = null;
      }

      // Load Live2D model using PIXI.live2d
      console.log('[PetJS] Initializing PIXI.Live2DModel...', PIXI);
      const live2DModel = await PIXI.live2d.Live2DModel.from(url);

      if (!live2DModel) {
        throw new Error('Failed to load Live2D model. Model is null.');
      }

      // Determine scale: fit the model to the canvas
      const scaleX = targetW / live2DModel.width;
      const scaleY = targetH / live2DModel.height;
      const scale = Math.min(scaleX, scaleY) * 0.95;

      live2DModel.scale.set(scale);
      live2DModel.x = (targetW - live2DModel.width) / 2;
      live2DModel.y = (targetH - live2DModel.height) / 2;

      // Add interaction
      live2DModel.interactive = true;
      live2DModel.buttonMode = true;

      // Click: play action + expression + speech
      live2DModel.on('pointerdown', function () {
        if (window.PetActions) window.PetActions.playForContext('tap');
        if (window.PetExpressions) window.PetExpressions.playRandom();
        if (window.PetSpeech && defaultConfig.talk) {
          var phrases = [
            '嗯？主人有什么事吗？(◕ᴗ◕)',
            '哎呀～不要随便戳我嘛！',
            '嘿嘿～主人喜欢我对不对～',
            '呀！吓我一跳！(*°∀°)',
            '主人！干嘛啦～',
            '(害羞) 主人不要这样嘛...',
          ];
          window.PetSpeech.say(phrases[Math.floor(Math.random() * phrases.length)]);
        }
      });

      // Hover: occasional shy comment
      live2DModel.on('pointerover', function () {
        if (Math.random() < 0.2 && window.PetSpeech && defaultConfig.talk) {
          var hovers = [
            '主人看我干嘛～',
            '(小声) 不要盯着我嘛...',
            '嗯？有什么事吗？',
            '主人～有话直说哦！',
          ];
          window.PetSpeech.say(hovers[Math.floor(Math.random() * hovers.length)]);
        }
      });

      app.stage.addChild(live2DModel);
      model = live2DModel;
      window.petApp.model = model;

      // Extract real motion groups & expression names for accurate playback
      try {
        var internalModel = model.internalModel;
        // pixi-live2d-display uses .settings (not .modelSettings)
        var settings = internalModel && (internalModel.settings || internalModel.modelSettings);
        var motionGroups = [];

        // Primary: read from motionManager.definitions (most reliable across versions)
        if (internalModel && internalModel.motionManager) {
          var defs = internalModel.motionManager.definitions;
          if (defs && typeof defs === 'object' && !Array.isArray(defs)) {
            motionGroups = Object.keys(defs);
          }
        }
        // Fallback: read from settings.Motions
        if (!motionGroups.length && settings) {
          var motionObj = settings.Motions || settings.motions || {};
          motionGroups = Object.keys(motionObj);
        }
        window.petApp.motionGroups = motionGroups;

        var exprArr = (settings && (settings.Expressions || settings.expressions)) || [];
        window.petApp.expressionNames = exprArr.map(function(e) { return e.Name || e.name || ''; }).filter(Boolean);
        console.log('[PetJS] Motion groups:', window.petApp.motionGroups);
        console.log('[PetJS] Expressions:', window.petApp.expressionNames);
      } catch(ex) {
        window.petApp.motionGroups = [];
        window.petApp.expressionNames = [];
      }

      hideLoading();
      console.log('[PetJS] Model loaded successfully');

      // Greeting after load
      setTimeout(function () {
        if (window.PetSpeech && defaultConfig.talk) {
          var greetings = [
            '你好呀主人！今天也一起加油哦～(*ﾟ▽ﾟ*)',
            '主人好！有我在，bug 都会消失的！',
            '嗨嗨！今天也要好好写代码呢！',
            '主人你来了！(´▽｀)',
            '欢迎回来！主人今天辛苦了～',
          ];
          window.PetSpeech.say(greetings[Math.floor(Math.random() * greetings.length)]);
        }
        if (window.PetActions) window.PetActions.playForContext('wave');
        if (window.PetActions) window.PetActions.startIdleLoop();
        startReminderLoop();
      }, 600);
    } catch (err) {
      hideLoading();
      console.error('[PetJS] Model load error:', err);
      showError('模型加载失败，请检查网络连接或模型文件。');
    }
  }

  function showError(msg) {
    var el = document.getElementById('loading-overlay') || document.createElement('div');
    el.id = 'loading-overlay';
    el.innerHTML = '<div style="text-align:center;color:#f87171;font-size:13px;">❌ ' + msg + '</div>';
    wrapper.appendChild(el);
  }

  /* ---- Periodic reminders (drink water / move body) ---- */
  var reminderTimers = [];

  var WATER_PHRASES = [
    '主人～该喝水啦！补充水分很重要哦 💧',
    '记得喝水！主人的健康第一！(｡•ᴗ•｡)',
    '你上次喝水是什么时候？快去喝一杯吧～',
    '主人！水是生命之源，快来一杯！💦',
    '喝水时间到！不喝水主人会变干巴巴的啦～',
    '嘿！去倒杯水喝嘛，我等你回来 (≧▽≦)',
  ];

  var MOVE_PHRASES = [
    '主人，久坐伤身！起来活动一下吧～🏃',
    '该起来走走啦！对眼睛也好哦 (＾▽＾)',
    '主人的身体很重要！做几个伸展运动吧！🤸',
    '已经坐了好久了～站起来动一动吧！',
    '休息一下！眼睛离屏幕远一点，活动活动手腕 ✨',
    '主人，去放松一下眼睛吧，看看远方～👀',
  ];

  function startReminderLoop() {
    reminderTimers.forEach(function(t) { clearInterval(t); });
    reminderTimers = [];

    // Drink water reminder: every 30 minutes
    var waterTimer = setInterval(function () {
      if (document.hidden) return;
      if (window.PetSpeech && defaultConfig.talk) {
        window.PetSpeech.say(WATER_PHRASES[Math.floor(Math.random() * WATER_PHRASES.length)]);
      }
      if (window.PetActions) window.PetActions.playForContext('wave');
    }, 30 * 60 * 1000);

    // Move body reminder: every 45 minutes
    var moveTimer = setInterval(function () {
      if (document.hidden) return;
      if (window.PetSpeech && defaultConfig.talk) {
        window.PetSpeech.say(MOVE_PHRASES[Math.floor(Math.random() * MOVE_PHRASES.length)]);
      }
      if (window.PetActions) window.PetActions.playForContext('dance');
      if (window.PetExpressions) window.PetExpressions.playRandom();
    }, 45 * 60 * 1000);

    reminderTimers.push(waterTimer, moveTimer);
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
          var url = MODEL_URL_MAP[name] || (MODEL_BASE + name + '/' + name + '.model3.json');
          loadModel(url, defaultConfig.modelWidth, defaultConfig.modelHeight);
          picker.classList.add('hidden');
          renderList('');
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

    // Expose so init handler can refresh after model list is loaded
    window.modelPickerRefresh = function () {
      if (countEl) countEl.textContent = MODELS.length;
      renderList(searchEl ? searchEl.value : '');
    };
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
          applyConfig(msg);
          if (window.modelPickerRefresh) window.modelPickerRefresh();
          // Respect initial visibility flag sent from extension
          if (msg.visible === false) {
            wrapper.style.display = 'none';
          } else {
            wrapper.style.display = '';
            loadModel(getModelUrl(msg.config), msg.config.modelWidth, msg.config.modelHeight);
          }
        }
        break;

      case 'petVisibility':
        if (msg.visible) {
          wrapper.style.display = '';
          // If the model was never loaded (because it was hidden on init), load it now
          if (!model) {
            loadModel(getModelUrl(defaultConfig), defaultConfig.modelWidth, defaultConfig.modelHeight);
          }
        } else {
          wrapper.style.display = 'none';
        }
        break;

      case 'configUpdate':
        if (msg.config) {
          applyConfig(msg);
          if (window.modelPickerRefresh) window.modelPickerRefresh();
          loadModel(getModelUrl(msg.config), msg.config.modelWidth, msg.config.modelHeight);
        }
        break;

      case 'nextModel': {
        var idx = MODELS.indexOf(currentModelName);
        var nextIdx = (idx + 1) % MODELS.length;
        var nextName = MODELS[nextIdx];
        currentModelName = nextName;
        var url = MODEL_URL_MAP[nextName] || (MODEL_BASE + nextName + '/' + nextName + '.model3.json');
        loadModel(url, defaultConfig.modelWidth, defaultConfig.modelHeight);
        if (window.PetSpeech) window.PetSpeech.say('切换到 ' + nextName + ' 啦！');
        break;
      }

      case 'buildFail':
        if (window.PetActions) window.PetActions.playForContext('fail');
        if (window.PetExpressions) window.PetExpressions.play('sad');
        if (window.PetSpeech && defaultConfig.talk) window.PetSpeech.say(msg.text);
        break;

      case 'buildSuccess':
        if (window.PetActions) window.PetActions.playForContext('happy');
        if (window.PetExpressions) window.PetExpressions.play('smile');
        if (window.PetSpeech && defaultConfig.talk) window.PetSpeech.say(msg.text);
        break;

      case 'gitSave':
      case 'gitCommit':
        if (window.PetActions) window.PetActions.playForContext('commit');
        if (window.PetSpeech && defaultConfig.talk) window.PetSpeech.say(msg.text);
        break;

      case 'codeStats':
      case 'sessionTime':
        if (window.PetActions) window.PetActions.playForContext('happy');
        if (window.PetSpeech && defaultConfig.talk) window.PetSpeech.say(msg.text);
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
      width:  defaultConfig.modelWidth  || 300,
      height: defaultConfig.modelHeight || 380,
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
    // loadModel(MODEL_BASE + 'shizuku-48/index.json', 300, 380);
    
  }

  /* ---- Boot ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
