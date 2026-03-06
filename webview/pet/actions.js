/**
 * actions.js — 50+ Live2D actions / motions
 * Exposes: window.PetActions = { play, playRandom, playForContext, startIdleLoop, all }
 */
(function () {
  'use strict';

  const ALL_ACTIONS = [
    // Standard Cubism motion groups
    'TapBody', 'Idle', 'TapHead', 'TapSpecial',
    // Named-model specific
    'Wave', 'FlickHead', 'Idle01', 'Idle02', 'Idle03',
    // Emotions & gestures (50+)
    'Happy', 'Sad', 'Angry', 'Surprised', 'Confused',
    'Blush', 'Yawn', 'Excited', 'Bored', 'Focused',
    'Sleepy', 'Determined', 'Scared', 'Proud', 'Shy',
    'Embarrassed', 'Cheerful', 'Melancholy', 'Mischief', 'Curious',
    'Dance', 'Clap', 'Cheer', 'Applaud', 'Celebrate',
    'Bow', 'Greet', 'Farewell', 'Wink', 'Pout',
    'Smile', 'Laugh', 'Chuckle', 'Cry', 'Sob',
    'Think', 'Point', 'Stretch', 'Nod', 'ShakeHead',
    'Run', 'Jump', 'Spin', 'Flip', 'Pose',
    'Meditate', 'Focus', 'Write', 'Read', 'Listen',
    'Scratch', 'Peek', 'Swim', 'Roll', 'Fly',
    'Tap', 'Touch', 'Flick', 'Special',
  ];

  function play(name) {
    try {
      var m = window.petApp && window.petApp.model;
      if (!m) return;
      m.motion(name);
    } catch (e) { /* model may not have this motion */ }
  }

  function playRandom() {
    var name = ALL_ACTIONS[Math.floor(Math.random() * ALL_ACTIONS.length)];
    play(name);
  }

  function playForContext(ctx) {
    var map = {
      idle:      ['Idle', 'Idle01', 'Idle02', 'Idle03'],
      tap:       ['TapBody', 'Tap', 'Touch'],
      happy:     ['Happy', 'Cheer', 'Celebrate', 'Excited'],
      sad:       ['Sad', 'Cry', 'Sob', 'Melancholy'],
      angry:     ['Angry', 'Pout'],
      surprised: ['Surprised'],
      wave:      ['Wave', 'Greet', 'Farewell'],
      focus:     ['Focus', 'Think', 'Meditate', 'Read', 'Write'],
      build:     ['Determined', 'Focus'],
      fail:      ['Sad', 'Sob', 'Confused'],
      commit:    ['Happy', 'Cheer', 'Applaud', 'Celebrate'],
      save:      ['Nod', 'Smile'],
      chat:      ['TapBody', 'Wave', 'Wink'],
      dance:     ['Dance', 'Spin', 'Flip'],
    };
    var candidates = map[ctx] || ALL_ACTIONS;
    play(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  var idleTimer;
  function startIdleLoop() {
    if (idleTimer) clearInterval(idleTimer);
    idleTimer = setInterval(function () {
      if (!document.hidden) playForContext('idle');
    }, 15000);
  }

  window.PetActions = { all: ALL_ACTIONS, play: play, playRandom: playRandom, playForContext: playForContext, startIdleLoop: startIdleLoop };
})();
