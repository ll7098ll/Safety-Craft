import { sounds } from '../audio/SoundManager.js';

export class TitleScreen {
  constructor(container, onStartGame, onOpenGuide) {
    this.container = container;
    this.onStartGame = onStartGame;
    this.onOpenGuide = onOpenGuide;

    this.splashMessages = [
      "초등 캠핑 안전 100점!",
      "텐트 안 숯불 난로는 절대 금지!",
      "야광 가드로 밤길 안전!",
      "과대 불판은 폭발 위험!",
      "마인크래프트로 배우는 안전 캠핑!",
      "음식은 밀폐 아이스박스에!",
      "모닥불 잔불은 물로 확인사살!"
    ];

    this.initHTML();
  }

  initHTML() {
    this.element = document.createElement('div');
    this.element.className = 'mc-title-screen';

    const randomSplash = this.splashMessages[Math.floor(Math.random() * this.splashMessages.length)];

    this.element.innerHTML = `
      <div class="mc-logo-wrap">
        <h1 class="mc-logo-title">SAFETY CRAFT</h1>
        <div class="mc-logo-sub">CAMP SAFETY HERO</div>
        <div class="mc-splash-text">${randomSplash}</div>
      </div>

      <div class="mc-menu-buttons">
        <button class="mc-btn" id="btnPlayGame">싱글 플레이 (캠핑장 입장)</button>
        <button class="mc-btn" id="btnTitleGuide">캠핑 안전 수칙 도감</button>
        <button class="mc-btn" id="btnInstructions">게임 조작법 & 팁</button>
      </div>

      <div class="mc-version-tag">Safety Craft v1.1.0 (Minecraft Safety Edition)</div>
    `;

    this.container.appendChild(this.element);

    // 이벤트
    this.element.querySelector('#btnPlayGame').addEventListener('click', () => {
      sounds.playClick();
      this.hide();
      if (this.onStartGame) this.onStartGame();
    });

    this.element.querySelector('#btnTitleGuide').addEventListener('click', () => {
      sounds.playClick();
      if (this.onOpenGuide) this.onOpenGuide();
    });

    this.element.querySelector('#btnInstructions').addEventListener('click', () => {
      sounds.playClick();
      alert(
        "【세이프티 크래프트 (Safety Craft) 조작법】\n" +
        "• 이동: W, A, S, D / 점프: Space / 달리기: Shift\n" +
        "• 시점 회전: 마우스 드래그 또는 더블클릭(포인터락)\n" +
        "• 블록 캐기: 마우스 좌클릭 길게 누름\n" +
        "• 블록/도구 설치 및 사용: 마우스 우클릭\n" +
        "• 인벤토리 & 조합대: E 키\n" +
        "• 핫바 선택: 숫자키 1~9 또는 마우스 휠\n" +
        "• 1인칭/3인칭 전환: V 키\n" +
        "• 일시정지 메뉴: ESC 키"
      );
    });
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }
}
