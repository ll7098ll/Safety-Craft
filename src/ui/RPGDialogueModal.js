import { sounds } from '../audio/SoundManager.js';

export class RPGDialogueModal {
  constructor(container, rpgSystem) {
    this.container = container;
    this.rpgSystem = rpgSystem;

    this.isOpen = false;
    this.currentNPC = null;
    this.typingTimer = null;
    this.fullText = '';
    this.displayedText = '';
    this.isTyping = false;
    this.options = [];

    this.element = document.createElement('div');
    this.element.className = 'rpg-dialogue-wrap hidden';
    this.element.innerHTML = `
      <div class="rpg-dialogue-box">
        <div class="rpg-portrait-frame">
          <div class="rpg-portrait-icon" id="rpgPortrait">🐿️</div>
        </div>
        <div class="rpg-dialogue-main">
          <div class="rpg-speaker-row">
            <span class="rpg-speaker-role" id="rpgSpeakerRole">[수석 멘토]</span>
            <span class="rpg-speaker-name" id="rpgSpeakerName">도토리 대장</span>
          </div>
          <div class="rpg-text-area" id="rpgTextArea">
            대화 내용이 여기에 표시됩니다.
          </div>
          <div class="rpg-options-list" id="rpgOptionsList">
            <!-- 선택지 버튼이 동적으로 들어감 -->
          </div>
        </div>
        <button class="rpg-dialogue-close" id="rpgCloseBtn" title="대화 닫기 (ESC)">✕</button>
      </div>
    `;

    this.container.appendChild(this.element);

    this.portraitEl = this.element.querySelector('#rpgPortrait');
    this.speakerRoleEl = this.element.querySelector('#rpgSpeakerRole');
    this.speakerNameEl = this.element.querySelector('#rpgSpeakerName');
    this.textAreaEl = this.element.querySelector('#rpgTextArea');
    this.optionsListEl = this.element.querySelector('#rpgOptionsList');
    this.closeBtn = this.element.querySelector('#rpgCloseBtn');

    this.closeBtn.addEventListener('click', () => this.close());

    // 텍스트 영역 클릭 시 타이핑 즉시 완료
    this.textAreaEl.addEventListener('click', () => {
      if (this.isTyping) {
        this.finishTyping();
      }
    });

    this.initKeyboard();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.code === 'Escape') {
        this.close();
        e.preventDefault();
      } else if (e.code === 'Space') {
        if (this.isTyping) {
          this.finishTyping();
          e.preventDefault();
        }
      } else if (['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(e.code)) {
        const idx = parseInt(e.code.replace('Digit', '')) - 1;
        if (this.options[idx]) {
          sounds.playClick();
          this.options[idx].action();
          e.preventDefault();
        }
      }
    });
  }

  open(npc, dialogData) {
    this.currentNPC = npc;
    this.isOpen = true;
    this.element.classList.remove('hidden');

    // NPC별 아바타 이모지 매핑
    const avatars = {
      squirrel_leader: '🐿️',
      ranger_park: '👮',
      camper_minsu: '🎒',
      chef_bob: '👨‍🍳',
      ranger_arin: '🌿'
    };

    this.portraitEl.innerText = avatars[npc.id] || '👤';
    this.speakerRoleEl.innerText = `[${npc.role}]`;
    this.speakerNameEl.innerText = npc.name;

    this.setDialogue(dialogData.text, dialogData.options);
  }

  setDialogue(text, options = []) {
    this.fullText = text;
    this.displayedText = '';
    this.options = options;
    this.optionsListEl.innerHTML = '';
    this.optionsListEl.classList.add('hidden');

    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }

    this.isTyping = true;
    let charIndex = 0;

    this.typingTimer = setInterval(() => {
      if (charIndex < this.fullText.length) {
        this.displayedText += this.fullText.charAt(charIndex);
        this.textAreaEl.innerText = this.displayedText;

        // 2글자마다 비프음
        if (charIndex % 2 === 0 && this.fullText.charAt(charIndex) !== ' ') {
          sounds.playNpcVoice(this.currentNPC?.id === 'squirrel_leader' ? 1.3 : 0.95);
        }
        charIndex++;
      } else {
        this.finishTyping();
      }
    }, 28);
  }

  finishTyping() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    this.isTyping = false;
    this.textAreaEl.innerText = this.fullText;
    this.renderOptions();
  }

  renderOptions() {
    this.optionsListEl.innerHTML = '';
    if (!this.options || this.options.length === 0) {
      // 기본 "대화 종료" 버튼
      const defBtn = document.createElement('button');
      defBtn.className = 'rpg-opt-btn';
      defBtn.innerHTML = `<span class="opt-num">[1]</span> 알겠습니다. (대화 종료)`;
      defBtn.onclick = () => this.close();
      this.optionsListEl.appendChild(defBtn);
    } else {
      this.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'rpg-opt-btn';
        btn.innerHTML = `<span class="opt-num">[${idx + 1}]</span> ${opt.text}`;
        btn.onclick = () => {
          sounds.playClick();
          opt.action();
        };
        this.optionsListEl.appendChild(btn);
      });
    }
    this.optionsListEl.classList.remove('hidden');
  }

  close() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }
    this.isOpen = false;
    this.element.classList.add('hidden');
    sounds.playClick();
  }
}
