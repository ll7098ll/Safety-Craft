import { sounds } from '../audio/SoundManager.js';

export class PauseMenu {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isOpen = false;

    this.initHTML();
  }

  initHTML() {
    this.element = document.createElement('div');
    this.element.className = 'mc-pause-menu hidden';
    this.element.innerHTML = `
      <h2 class="mc-pause-title">게임 일시 정지 (Game Paused)</h2>
      <div class="mc-pause-buttons">
        <button class="mc-btn" id="btnResume">게임으로 돌아가기</button>
        <button class="mc-btn" id="btnPauseGuide">캠핑 안전 수칙 도감</button>
        <button class="mc-btn" id="btnPauseView">시점 변경 (1인칭 / 3인칭)</button>
        <button class="mc-btn" id="btnPauseTitle">메인 메뉴로 나가기</button>
      </div>
    `;

    this.container.appendChild(this.element);

    // 이벤트 바인딩
    this.element.querySelector('#btnResume').addEventListener('click', () => {
      sounds.playClick();
      this.toggle();
    });

    this.element.querySelector('#btnPauseGuide').addEventListener('click', () => {
      sounds.playClick();
      if (this.callbacks.onOpenGuide) this.callbacks.onOpenGuide();
    });

    this.element.querySelector('#btnPauseView').addEventListener('click', () => {
      sounds.playClick();
      if (this.callbacks.onToggleView) this.callbacks.onToggleView();
    });

    this.element.querySelector('#btnPauseTitle').addEventListener('click', () => {
      sounds.playClick();
      this.toggle();
      if (this.callbacks.onQuitTitle) this.callbacks.onQuitTitle();
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
    }
    return this.isOpen;
  }
}
