import { sounds } from '../audio/SoundManager.js';

export class HUD {
  constructor(container, questManager, safetyGauge, dayNightCycle, player, rpgSystem = null) {
    this.container = container;
    this.questManager = questManager;
    this.safetyGauge = safetyGauge;
    this.dayNightCycle = dayNightCycle;
    this.player = player;
    this.rpgSystem = rpgSystem;

    this.hotbarSlots = [
      { id: 'extinguisher', name: '안전 소화기', icon: '🧯', count: 1 },
      { id: 'glow_strip', name: '야광 스트링 가드', icon: '✨', count: 4 },
      { id: 'co_detector', name: 'CO 일산화탄소 경보기', icon: '🚨', count: 1 },
      { id: 'oak_planks', name: '오크 판자 블록', icon: '🪵', count: 16 },
      { id: 'water_bucket', name: '소화수 양동이', icon: '🪣', count: 1 },
      { id: 'wool', name: '방수 텐트 천', icon: '🧶', count: 8 },
      { id: 'torch', name: '야간 횃불', icon: '🔥', count: 4 },
      { id: 'cooler', name: '밀폐 아이스박스', icon: '🧊', count: 1 },
      { id: 'cooked_beef', name: '캠핑 바비큐 소고기', icon: '🥩', count: 3 }
    ];

    this.selectedHotbarIndex = 0;
    this.heldItemTimer = null;
    this.onOpenJournal = null;

    this.initHTML();
    this.bindEvents();

    // 1번 슬롯 소화기 초기 장착
    this.selectHotbar(0);
  }

  initHTML() {
    this.root = document.createElement('div');
    this.root.className = 'mc-hud-root';
    this.root.innerHTML = `
      <!-- 중앙 인버트 십자 크로스헤어 -->
      <div class="mc-crosshair"></div>

      <!-- CO 일산화탄소 중독 화면 일렁임/디버프 오버레이 -->
      <div class="mc-nausea-overlay" id="mcNauseaOverlay"></div>

      <!-- 발전과제 (Advancements) 팝업 컨테이너 -->
      <div id="advancementContainer"></div>

      <!-- 상단 HUD 영역: 퀘스트 카드 & RPG 레벨/도토리 & 상단 버튼들 -->
      <div class="hud-top">
        <div class="safety-score-card">
          <div class="score-header">
            <span class="score-icon">🛡️</span>
            <span class="score-title" id="questTopTitle">에피소드 1: 안전 명당 탐색</span>
          </div>
          <div class="score-bar-bg">
            <div class="score-bar-fill" id="safetyBarFill" style="width: 25%"></div>
          </div>
          <div class="grade-badge" id="questStepText">위험 표지판 3곳 조사하기</div>
        </div>

        <!-- RPG 스탯 뱃지 (레벨/칭호/도토리 지갑) -->
        <div class="rpg-hud-stats">
          <div class="rpg-level-badge">
            <span class="rpg-lvl-num" id="rpgLevelText">Lv.1</span>
            <span class="rpg-title-name" id="rpgTitleText">🌱 캠핑 입문자</span>
          </div>
          <div class="rpg-wallet-chip">
            <span class="rpg-acorn-icon">🌰</span>
            <span class="rpg-acorn-count" id="rpgAcornsText">120</span>
          </div>
        </div>

        <div class="hud-controls">
          <button class="hud-btn hud-btn-gold" id="btnHudJournal">📜 퀘스트 북 (J)</button>
          <button class="hud-btn" id="btnHudView">🎥 시점 전환 (V)</button>
          <button class="hud-btn" id="btnHudDayNight">☀️ 낮/밤 전환</button>
          <button class="hud-btn" id="btnHudGuide">📖 안전 수칙</button>
        </div>
      </div>

      <!-- 상호작용 팁 (조준 블록/객체 액션) -->
      <div class="mc-action-tip hidden" id="mcActionTip"></div>

      <!-- 하단 상태 바 (하트 10개, 허기 10개, 경험치 바, 9칸 핫바) -->
      <div class="mc-hud-bottom">
        <div class="mc-held-item-name" id="mcHeldItemName"></div>

        <div class="mc-status-row">
          <div class="mc-hearts" id="mcHeartsRow">
            ${Array.from({ length: 10 }).map(() => `<span class="mc-heart">❤️</span>`).join('')}
          </div>
          <div class="mc-food" id="mcFoodRow">
            ${Array.from({ length: 10 }).map(() => `<span class="mc-drumstick">🍗</span>`).join('')}
          </div>
        </div>

        <div class="mc-xp-bar-wrap">
          <div class="mc-xp-bar-fill" id="mcXpBarFill" style="width: 25%"></div>
          <span class="mc-xp-level-num" id="mcXpLevelNum">25</span>
        </div>

        <div class="mc-hotbar" id="mcHotbarGrid">
          ${this.hotbarSlots.map((slot, idx) => `
            <div class="mc-hotbar-slot ${idx === 0 ? 'active' : ''}" data-index="${idx}">
              <span class="mc-slot-num">${idx + 1}</span>
              <span class="mc-slot-item-icon">${slot ? slot.icon : ''}</span>
              ${slot && slot.count > 1 ? `<span class="mc-slot-item-count">${slot.count}</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 안전 수칙 도감 모달 -->
      <div class="modal-overlay hidden" id="hudGuideModal">
        <div class="modal-card guide-card">
          <div class="modal-header">
            <h2>⛺ 초등 캠핑 안전 핵심 6계명</h2>
            <button class="modal-close" id="closeHudGuideBtn">✕</button>
          </div>
          <div class="guide-list">
            <div class="guide-item">
              <span class="g-num">1</span>
              <div>
                <strong>안전한 명당 자리 찾기</strong>
                <p>계곡 급류 침수 위험, 큰 마른 나무 아래(벼락/가지 낙하), 바위 절벽 밑(낙석 위험)을 피하고 평평한 안전 구역에 텐트를 쳐요.</p>
              </div>
            </div>
            <div class="guide-item">
              <span class="g-num">2</span>
              <div>
                <strong>텐트 줄(스트링) 발걸림 방지</strong>
                <p>밤에 줄에 걸려 넘어지면 크게 다칠 수 있어요! 줄마다 야광 가드나 반사 스티커, 조명을 꼭 달아주세요.</p>
              </div>
            </div>
            <div class="guide-item">
              <span class="g-num">3</span>
              <div>
                <strong>텐트 안 난로/숯불 절대 금지! (일산화탄소 중독)</strong>
                <p>밀폐된 텐트 안에서 숯불이나 난로를 켜면 일산화탄소가 차올라 매우 위험해요! 환기창을 열고 일산화탄소 경보기를 꼭 챙겨요.</p>
              </div>
            </div>
            <div class="guide-item">
              <span class="g-num">4</span>
              <div>
                <strong>과대 불판 금지 & 잔불 소화</strong>
                <p>가스버너보다 큰 불판은 부탄가스통을 가열해 폭발해요! 고기를 구운 뒤에는 화로대에 물을 듬뿍 부어 잔불을 완전히 꺼요.</p>
              </div>
            </div>
            <div class="guide-item">
              <span class="g-num">5</span>
              <div>
                <strong>음식은 아이스박스에 밀봉 & 횃불 밝히기</strong>
                <p>남은 음식을 밖에 두면 냄새를 맡고 야생 멧돼지나 벌레가 찾아와요! 음식은 밀폐 용기에 넣고 쓰레기를 바로 정리해요.</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="confirmHudGuideBtn">알겠습니다!</button>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.root);
  }

  bindEvents() {
    this.cachedEls = {
      fillEl: this.root.querySelector('#mcXpBarFill'),
      lvlEl: this.root.querySelector('#mcXpLevelNum'),
      nausea: this.root.querySelector('#mcNauseaOverlay'),
      hearts: this.root.querySelectorAll('.mc-heart'),
      topTitle: this.root.querySelector('#questTopTitle'),
      stepText: this.root.querySelector('#questStepText'),
      tipEl: this.root.querySelector('#mcActionTip'),
      heldNameEl: this.root.querySelector('#mcHeldItemName'),
      rpgLevelText: this.root.querySelector('#rpgLevelText'),
      rpgTitleText: this.root.querySelector('#rpgTitleText'),
      rpgAcornsText: this.root.querySelector('#rpgAcornsText')
    };

    this.lastState = {
      score: -1,
      isNausea: null,
      questTitle: '',
      stepText: '',
      interactionText: '',
      rpgLevel: -1,
      rpgAcorns: -1
    };

    const slots = this.root.querySelectorAll('.mc-hotbar-slot');
    slots.forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = parseInt(slot.getAttribute('data-index'));
        this.selectHotbar(idx);
      });
    });

    // 팁 요소 클릭 시 액션 실행
    this.cachedEls.tipEl.addEventListener('click', () => {
      if (this.currentAction) {
        this.currentAction();
      }
    });

    // 퀘스트 북 버튼
    const btnJournal = this.root.querySelector('#btnHudJournal');
    btnJournal.addEventListener('click', () => {
      if (this.onOpenJournal) {
        this.onOpenJournal();
      }
    });

    // 상단 버튼 이벤트
    const btnView = this.root.querySelector('#btnHudView');
    btnView.addEventListener('click', () => {
      const is3rd = this.player.toggleCameraView();
      btnView.innerText = is3rd ? '🎥 3인칭 뷰' : '🎥 1인칭 뷰';
      sounds.playClick();
    });

    const btnDayNight = this.root.querySelector('#btnHudDayNight');
    btnDayNight.addEventListener('click', () => {
      const isNight = this.dayNightCycle.toggleDayNight();
      btnDayNight.innerText = isNight ? '🌙 밤 모드' : '☀️ 낮 모드';
      sounds.playClick();
    });

    const btnGuide = this.root.querySelector('#btnHudGuide');
    const guideModal = this.root.querySelector('#hudGuideModal');
    const closeGuide = this.root.querySelector('#closeHudGuideBtn');
    const confirmGuide = this.root.querySelector('#confirmHudGuideBtn');

    btnGuide.addEventListener('click', () => {
      guideModal.classList.remove('hidden');
      sounds.playClick();
    });
    closeGuide.addEventListener('click', () => guideModal.classList.add('hidden'));
    confirmGuide.addEventListener('click', () => guideModal.classList.add('hidden'));

    this.questManager.onQuestAdvancement = (title, icon) => {
      this.showAdvancement(title, icon);
    };
  }

  selectHotbar(idx) {
    if (idx < 0 || idx >= this.hotbarSlots.length) return;
    this.selectedHotbarIndex = idx;

    const slots = this.root.querySelectorAll('.mc-hotbar-slot');
    slots.forEach((s, i) => {
      if (i === idx) s.classList.add('active');
      else s.classList.remove('active');
    });

    const item = this.hotbarSlots[idx];

    if (this.player && this.player.setHeldItem) {
      this.player.setHeldItem(item ? item.id : null);
    }

    if (item && item.count > 0) {
      const nameEl = this.cachedEls?.heldNameEl || this.root.querySelector('#mcHeldItemName');
      nameEl.innerText = `${item.name} (${item.count}개)`;
      nameEl.classList.add('show');
      clearTimeout(this.heldItemTimer);
      this.heldItemTimer = setTimeout(() => {
        nameEl.classList.remove('show');
      }, 1800);
    }
  }

  refreshHotbar() {
    const slots = this.root.querySelectorAll('.mc-hotbar-slot');
    slots.forEach((s, idx) => {
      const item = this.hotbarSlots[idx];
      s.innerHTML = `
        <span class="mc-slot-num">${idx + 1}</span>
        <span class="mc-slot-item-icon">${item ? item.icon : ''}</span>
        ${item && item.count > 1 ? `<span class="mc-slot-item-count">${item.count}</span>` : ''}
      `;
    });
    this.selectHotbar(this.selectedHotbarIndex);
  }

  getSelectedItem() {
    return this.hotbarSlots[this.selectedHotbarIndex] || null;
  }

  showAdvancement(title, icon = '🏆') {
    sounds.playFanfare();
    const advContainer = this.root.querySelector('#advancementContainer');
    const toast = document.createElement('div');
    toast.className = 'mc-advancement-toast';
    toast.innerHTML = `
      <div class="mc-adv-icon">${icon}</div>
      <div class="mc-adv-text">
        <div class="mc-adv-header">발전 과제 달성!</div>
        <div class="mc-adv-title">${title}</div>
      </div>
    `;
    advContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4200);
  }

  update(playerPos, nearbyNPC = null, nearbyLitter = null, onNpcTalk = null, onLitterCollect = null) {
    if (!this.cachedEls) return;

    // 0) RPG 스탯 갱신 (레벨, 칭호, 도토리)
    if (this.rpgSystem) {
      if (this.lastState.rpgLevel !== this.rpgSystem.level) {
        this.lastState.rpgLevel = this.rpgSystem.level;
        this.cachedEls.rpgLevelText.innerText = `Lv.${this.rpgSystem.level}`;
        this.cachedEls.rpgTitleText.innerText = this.rpgSystem.getTitle();
      }
      if (this.lastState.rpgAcorns !== this.rpgSystem.acorns) {
        this.lastState.rpgAcorns = this.rpgSystem.acorns;
        this.cachedEls.rpgAcornsText.innerText = this.rpgSystem.acorns;
      }
    }

    // 1) 안전 점수 / XP 바 (Dirty Checking)
    const score = this.safetyGauge.getTotalSafetyPercent();
    if (this.lastState.score !== score) {
      this.lastState.score = score;
      this.cachedEls.fillEl.style.width = `${score}%`;
      this.cachedEls.lvlEl.innerText = `${score}`;
    }

    // 2) CO 일산화탄소 중독 효과 (Dirty Checking)
    const isNausea = this.safetyGauge.coDanger > 40;
    if (this.lastState.isNausea !== isNausea) {
      this.lastState.isNausea = isNausea;
      if (isNausea) {
        this.cachedEls.nausea.classList.add('active');
        this.cachedEls.hearts.forEach(h => h.classList.add('shaking'));
      } else {
        this.cachedEls.nausea.classList.remove('active');
        this.cachedEls.hearts.forEach(h => h.classList.remove('shaking'));
      }
    }

    // 3) 상단 퀘스트 텍스트 (Dirty Checking)
    const q = this.questManager.getCurrentQuest();
    if (q) {
      const curTitle = q.title;
      const curStep = q.steps.find(s => !s.startsWith('✅')) || '모든 목표 완료!';
      if (this.lastState.questTitle !== curTitle) {
        this.lastState.questTitle = curTitle;
        this.cachedEls.topTitle.innerText = curTitle;
      }
      if (this.lastState.stepText !== curStep) {
        this.lastState.stepText = curStep;
        this.cachedEls.stepText.innerText = curStep;
      }
    }

    // 4) 상호작용 팁 (우선순위: 안전 미션 > NPC 대화 > 쓰레기 수거)
    const held = this.getSelectedItem();
    const interaction = this.questManager.checkNearbyInteraction(playerPos, held);

    let newText = '';
    let newAction = null;

    if (interaction) {
      newText = interaction.text;
      newAction = interaction.action;
    } else if (nearbyNPC) {
      newText = `[F 또는 클릭] [${nearbyNPC.name}]과 대화하기`;
      newAction = () => {
        if (onNpcTalk) onNpcTalk(nearbyNPC);
      };
    } else if (nearbyLitter) {
      newText = `[클릭] [${nearbyLitter.data.name}] 수거하기 (클린 캠핑)`;
      newAction = () => {
        if (onLitterCollect) onLitterCollect(nearbyLitter);
      };
    }

    if (this.lastState.interactionText !== newText) {
      this.lastState.interactionText = newText;
      if (newText) {
        this.cachedEls.tipEl.innerText = newText;
        this.cachedEls.tipEl.classList.remove('hidden');
      } else {
        this.cachedEls.tipEl.classList.add('hidden');
      }
    }
    this.currentAction = newAction;
  }
}
