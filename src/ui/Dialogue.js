export class Dialogue {
  constructor(container) {
    this.container = container;
    this.element = document.createElement('div');
    this.element.className = 'dialogue-box hidden';
    this.element.innerHTML = `
      <div class="squirrel-avatar">🐿️</div>
      <div class="dialogue-content">
        <div class="mentor-name">안전 가이드 [도토리 대장]</div>
        <div class="dialogue-text">안녕! 오늘 나와 함께 캠핑장 안전 수칙을 마스터해보자!</div>
      </div>
      <button class="dialogue-close">확인</button>
    `;
    this.container.appendChild(this.element);

    this.textEl = this.element.querySelector('.dialogue-text');
    this.closeBtn = this.element.querySelector('.dialogue-close');
    this.closeBtn.addEventListener('click', () => this.hide());
  }

  show(text) {
    this.textEl.innerText = text;
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
