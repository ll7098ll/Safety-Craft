import { sounds } from '../audio/SoundManager.js';

export class QuestJournalModal {
  constructor(container, questManager, rpgSystem) {
    this.container = container;
    this.questManager = questManager;
    this.rpgSystem = rpgSystem;

    this.isOpen = false;

    this.element = document.createElement('div');
    this.element.className = 'rpg-journal-wrap hidden';
    this.element.innerHTML = `
      <div class="rpg-journal-book">
        <div class="rpg-journal-header">
          <div class="journal-title">📜 캠퍼 모험 일지 & 퀘스트 북</div>
          <button class="modal-close" id="journalCloseBtn">✕</button>
        </div>
        <div class="rpg-journal-content">
          <!-- 좌측: 메인 안전 퀘스트 -->
          <div class="journal-col main-quest-col">
            <h3 class="col-title">🌟 메인 캠핑 안전 미션</h3>
            <div id="journalMainContent" class="journal-quest-box">
              <!-- 동적 렌더링 -->
            </div>
          </div>
          <!-- 우측: 서브 퀘스트 목록 -->
          <div class="journal-col side-quest-col">
            <h3 class="col-title">📋 NPC 서브 퀘스트</h3>
            <div id="journalSideContent" class="journal-quest-box">
              <!-- 동적 렌더링 -->
            </div>
          </div>
        </div>
        <div class="journal-footer">
          <span class="tip-text">단축키 [J] 또는 [ESC]로 일지를 닫을 수 있습니다.</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);

    this.mainEl = this.element.querySelector('#journalMainContent');
    this.sideEl = this.element.querySelector('#journalSideContent');
    this.closeBtn = this.element.querySelector('#journalCloseBtn');

    this.closeBtn.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyJ') {
        this.toggle();
        e.preventDefault();
      } else if (this.isOpen && e.code === 'Escape') {
        this.close();
        e.preventDefault();
      }
    });

    this.rpgSystem.on('onQuestUpdate', () => {
      if (this.isOpen) this.refresh();
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.element.classList.remove('hidden');
    sounds.playClick();
    this.refresh();
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('hidden');
    sounds.playClick();
  }

  refresh() {
    // 1. 메인 퀘스트 렌더링
    const currentMain = this.questManager.getCurrentQuest();
    if (currentMain) {
      this.mainEl.innerHTML = `
        <div class="quest-card active">
          <div class="q-badge">진행 중</div>
          <div class="q-title">${currentMain.title}</div>
          <div class="q-desc">${currentMain.desc}</div>
          <div class="q-steps">
            ${currentMain.steps
              .map(
                (step) => `
              <div class="q-step-item ${step.startsWith('✅') ? 'done' : ''}">
                ${step.startsWith('✅') ? '✔️' : '◽'} ${step}
              </div>
            `
              )
              .join('')}
          </div>
          <div class="q-reward">
            🏆 완료 발전과제: <strong>[${currentMain.advancement}]</strong> (${currentMain.advIcon})
          </div>
        </div>
      `;
    } else {
      this.mainEl.innerHTML = `<div class="empty-quest">모든 메인 안전 미션을 마스터했습니다! 🏆</div>`;
    }

    // 2. 서브 퀘스트 렌더링
    const sides = this.rpgSystem.sideQuests;
    this.sideEl.innerHTML = '';
    sides.forEach((sq) => {
      const card = document.createElement('div');
      card.className = `quest-card ${sq.completed ? 'completed' : sq.active ? 'active' : 'inactive'}`;

      const statusBadge = sq.completed
        ? '<span class="q-badge done">완료됨</span>'
        : sq.active
        ? '<span class="q-badge active">진행 중</span>'
        : '<span class="q-badge">미수락 (NPC와 대화 필요)</span>';

      card.innerHTML = `
        <div class="q-head-row">
          ${statusBadge}
          <span class="q-rewards-tag">+${sq.rewardXp} XP | +${sq.rewardAcorns} 🌰</span>
        </div>
        <div class="q-title">${sq.title}</div>
        <div class="q-desc">${sq.desc}</div>
        <div class="q-progress-wrap">
          <div class="q-progress-bar" style="width: ${Math.min(100, (sq.current / sq.target) * 100)}%"></div>
        </div>
        <div class="q-progress-num">달성도: ${sq.current} / ${sq.target}</div>
      `;

      this.sideEl.appendChild(card);
    });
  }
}
