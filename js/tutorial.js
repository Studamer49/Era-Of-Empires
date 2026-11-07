/* Era of Empires - interactive tutorial */
(function () {
  const STAGES = [
    {
      id: 1,
      title: 'Welcome to Era of Empires',
      target: null,
      body: 'Welcome to Era of Empires, a grand-strategy game where you command a nation and build it into a global power.<br><br>Your objective is to grow a powerful nation by managing resources, developing the economy, maintaining a military and dealing with other countries.<br><br>The world map shows every playable country. Your selected country is yours to lead.'
    },
    {
      id: 2,
      title: 'Your Country',
      target: 'your-country',
      body: 'You are playing as <b id="tut-country-name"></b>. This country is permanently assigned to you for this game.<br><br>Your country\u2019s flag and name appear at the top of the screen. On the map, your nation is highlighted.<br><br>You can inspect other countries on the map, but only your own country\u2019s resources and orders are under your control.'
    },
    {
      id: 3,
      title: 'National Resources',
      target: 'national-resources',
      body: 'The resource dashboard shows your nation\u2019s current stocks:<br><br>\u2022 Treasury \u2014 money used for most actions.<br>\u2022 Food \u2014 needed to sustain and grow your population.<br>\u2022 Oil \u2014 fuels industry and military operations.<br>\u2022 Steel \u2014 used for building and arms.<br>\u2022 Gold \u2014 a valuable reserve and trade good.<br><br>Managing these resources well is the foundation of a strong empire.'
    },
    {
      id: 4,
      title: 'Economy',
      target: 'economy',
      body: 'Your economic strength determines how much income your nation generates each turn.<br><br>A stronger economy means more treasury income to spend on development, military and diplomacy. Develop your economy to support your ambitions.'
    },
    {
      id: 5,
      title: 'Military',
      target: 'military',
      body: 'Military strength represents your nation\u2019s armed power.<br><br>Recruitment and training increase your military strength over time. A strong military deters rivals and enables the abstract territorial expansion system \u2014 claiming influence and territory without drawing every border by hand.'
    },
    {
      id: 6,
      title: 'Diplomacy',
      target: 'diplomacy',
      body: 'International relations shape the world.<br><br>You will be able to form alliances, negotiate trade agreements and establish peace with other nations.<br><br>The full diplomacy interface is coming in a future update. For now, focus on building your own nation.'
    },
    {
      id: 7,
      title: 'Turns',
      target: 'end-turn',
      body: 'The game advances in turns. Each turn, your nation\u2019s statistics update: income is added to your treasury, resources shift and world events can occur.<br><br>When you are ready, press <b>End Turn</b> to advance the game and see how your nation and the world have changed.'
    },
    {
      id: 8,
      title: 'Tutorial Complete',
      target: null,
      body: 'Congratulations! You have completed the interactive tutorial.<br><br>You now know how to inspect your country, manage resources, develop the economy, maintain a military and advance turns.<br><br>You can begin playing independently. The tutorial can be replayed at any time from Settings.'
    }
  ];

  function el(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  const tutorial = {
    gameId: null,
    progress: null,
    stageIndex: 0,

    wrap: el('tutorial-wrap'),
    dialog: el('tutorial-dialog'),
    highlight: el('tutorial-highlight'),
    pill: el('tutorial-pill'),
    title: el('tutorial-title'),
    body: el('tutorial-body'),
    prevBtn: el('tutorial-prev'),
    nextBtn: el('tutorial-next'),
    skipBtn: el('tutorial-skip'),

    init: async function (gameId) {
      this.gameId = gameId;
      this.prevBtn.addEventListener('click', () => this.prev());
      this.nextBtn.addEventListener('click', () => this.next());
      this.skipBtn.addEventListener('click', () => this.skip());
    },

    start: async function (gameId) {
      this.gameId = gameId;
      try {
        const data = await window.EOE.api.get('/api/tutorial?gameId=' + gameId);
        this.progress = data.progress || { stage: 1, completed: false, seenStages: [1] };
      } catch (e) {
        this.progress = { stage: 1, completed: false, seenStages: [1] };
      }
      if (this.progress.completed) return;
      this.stageIndex = Math.max(1, Math.min(8, this.progress.stage || 1)) - 1;
      this.render();
    },

    replay: async function (gameId) {
      try {
        await window.EOE.api.post('/api/tutorial/reset', { gameId });
      } catch (e) {}
      this.gameId = gameId;
      this.progress = { stage: 1, completed: false, seenStages: [1] };
      this.stageIndex = 0;
      this.render();
    },

    render: function () {
      const stage = STAGES[this.stageIndex];
      if (!stage) return;
      this.wrap.classList.add('open');
      this.pill.textContent = 'Stage ' + stage.id + ' of 8';
      this.title.textContent = stage.title;
      this.body.innerHTML = stage.body;
      const nameEl = this.body.querySelector('#tut-country-name');
      if (nameEl && this.countryName) nameEl.textContent = this.countryName;

      this.prevBtn.disabled = this.stageIndex === 0;
      this.nextBtn.textContent = this.stageIndex === STAGES.length - 1 ? 'Finish' : 'Next';

      this.positionHighlight(stage);
      this.saveProgress();
    },

    setCountryName: function (name) {
      this.countryName = name;
      const nameEl = this.body.querySelector('#tut-country-name');
      if (nameEl) nameEl.textContent = name;
    },

    positionHighlight: function (stage) {
      const wrapRect = this.wrap.getBoundingClientRect();
      this.highlight.style.display = 'none';
      if (!stage.target) {
        this.dialog.style.left = '50%';
        this.dialog.style.top = '18vh';
        this.dialog.style.transform = 'translateX(-50%)';
        return;
      }
      const target = document.querySelector('[data-tutorial-target="' + stage.target + '"]');
      if (!target) {
        this.dialog.style.left = '50%';
        this.dialog.style.top = '18vh';
        this.dialog.style.transform = 'translateX(-50%)';
        return;
      }
      const rect = target.getBoundingClientRect();
      this.highlight.style.left = rect.left + 'px';
      this.highlight.style.top = rect.top + 'px';
      this.highlight.style.width = rect.width + 'px';
      this.highlight.style.height = rect.height + 'px';
      this.highlight.style.display = 'block';

      // Place dialog below the target, or above if not enough room below.
      let top = rect.bottom + 16;
      let left = rect.left;
      if (top + 300 > window.innerHeight) top = rect.top - 316;
      if (top < 12) top = 12;
      if (left + 380 > window.innerWidth) left = window.innerWidth - 380 - 12;
      if (left < 12) left = 12;
      this.dialog.style.left = left + 'px';
      this.dialog.style.top = top + 'px';
      this.dialog.style.transform = 'none';
    },

    next: async function () {
      const stage = STAGES[this.stageIndex];
      this.markSeen(stage.id);
      if (this.stageIndex >= STAGES.length - 1) {
        await this.finish();
        return;
      }
      this.stageIndex++;
      this.render();
    },

    prev: function () {
      if (this.stageIndex <= 0) return;
      this.stageIndex--;
      this.render();
    },

    skip: async function () {
      await this.finish();
    },

    markSeen: async function (stageId) {
      if (!this.progress) return;
      if (!this.progress.seenStages) this.progress.seenStages = [];
      if (!this.progress.seenStages.includes(stageId)) {
        this.progress.seenStages.push(stageId);
      }
      this.progress.stage = Math.max(this.progress.stage || 1, stageId);
      try {
        await window.EOE.api.post('/api/tutorial', {
          gameId: this.gameId,
          stage: this.progress.stage,
          seenStages: this.progress.seenStages
        });
      } catch (e) {}
    },

    saveProgress: async function () {
      if (!this.progress) return;
      try {
        await window.EOE.api.post('/api/tutorial', {
          gameId: this.gameId,
          stage: STAGES[this.stageIndex].id,
          seenStages: this.progress.seenStages || [STAGES[this.stageIndex].id]
        });
      } catch (e) {}
    },

    finish: async function () {
      const last = STAGES[STAGES.length - 1];
      this.markSeen(last.id);
      this.progress.completed = true;
      this.progress.stage = 8;
      try {
        await window.EOE.api.post('/api/tutorial', {
          gameId: this.gameId,
          stage: 8,
          completed: true,
          seenStages: this.progress.seenStages || [1, 2, 3, 4, 5, 6, 7, 8]
        });
      } catch (e) {}
      this.wrap.classList.remove('open');
    }
  };

  window.EOE = window.EOE || {};
  window.EOE.tutorial = tutorial;
})();
