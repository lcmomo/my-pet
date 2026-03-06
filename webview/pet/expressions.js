/**
 * expressions.js — 20+ Live2D expressions
 * Exposes: window.PetExpressions = { play, playRandom, all }
 */
(function () {
  'use strict';

  /* Expression IDs — these correspond to .exp3.json files in the model package.
     Models differ; we try by index as well as by name.                          */
  var ALL_EXPRESSIONS = [
    'f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08',
    // Generic names used by many cubism4 models
    'smile', 'angry', 'sad', 'happy', 'surprised', 'confused',
    'blush', 'wink', 'pout', 'laugh', 'cry',
    'yawn', 'shy', 'excited', 'bored', 'focused',
    'sleepy', 'determined', 'scared', 'proud', 'embarrassed',
    // Short alpha codes
    'exp_01', 'exp_02', 'exp_03', 'exp_04', 'exp_05',
    'exp_06', 'exp_07', 'exp_08', 'exp_09', 'exp_10',
  ];

  function play(nameOrIndex) {
    try {
      var m = window.petApp && window.petApp.model;
      if (!m) return;
      m.expression(nameOrIndex);
    } catch (e) { /* ignore */ }
  }

  function playRandom() {
    // Also try numeric index (0..7 are common across many models)
    if (Math.random() < 0.5) {
      play(Math.floor(Math.random() * 8));
    } else {
      var expr = ALL_EXPRESSIONS[Math.floor(Math.random() * ALL_EXPRESSIONS.length)];
      play(expr);
    }
  }

  window.PetExpressions = { all: ALL_EXPRESSIONS, play: play, playRandom: playRandom };
})();
