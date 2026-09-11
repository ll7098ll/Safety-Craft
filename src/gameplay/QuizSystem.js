import { sounds } from '../audio/SoundManager.js';

export class QuizSystem {
  constructor() {
    this.questions = [
      {
        question: "1. 텐트 안이 춥다고 숯불이나 난로를 텐트 안에 들여놓고 자도 될까요?",
        options: [
          { text: "O (따뜻하니까 문을 닫고 켜둔다)", correct: false },
          { text: "X (일산화탄소 중독 위험! 텐트 안 난로 절대 금지)", correct: true }
        ],
        explanation: "일산화탄소는 냄새와 색이 없어 자는 도중 질식할 수 있어요. 텐트 안에서는 두꺼운 침낭과 핫팩을 이용하고, 환기창을 꼭 열어두어야 합니다!"
      },
      {
        question: "2. 가스버너로 고기를 구울 때, 버너보다 훨씬 커다란 '과대 불판'을 사용하면 어떻게 될까요?",
        options: [
          { text: "고기를 많이 구울 수 있어서 아주 좋다", correct: false },
          { text: "열기가 부탄가스통을 가열해 폭발할 수 있어 위험하다", correct: true }
        ],
        explanation: "불판이 부탄가스 덮개를 덮으면 내부 온도가 치솟아 캔이 펑 터질 수 있어요! 반드시 버너 크기에 알맞은 불판을 써야 합니다."
      },
      {
        question: "3. 바비큐를 마친 뒤 모닥불/화로대 불씨는 어떻게 정리해야 안전할까요?",
        options: [
          { text: "어차피 밤이니까 그냥 두고 잠자리에 든다", correct: false },
          { text: "물을 듬뿍 붓고 소화기를 확인하여 잔불까지 완전히 끈다", correct: true }
        ],
        explanation: "작은 불씨도 밤사이 부는 바람을 타고 산불로 번질 수 있어요. 물을 충분히 붓고 흙으로 덮어 열기가 완전히 사라질 때까지 확인해야 합니다."
      }
    ];

    this.currentIndex = 0;
    this.score = 0;
  }

  getCurrentQuestion() {
    return this.questions[this.currentIndex] || null;
  }

  answer(optionIndex) {
    const q = this.getCurrentQuestion();
    if (!q) return null;

    const opt = q.options[optionIndex];
    if (opt.correct) {
      sounds.playDing();
      this.score++;
      return {
        correct: true,
        explanation: q.explanation,
        isLast: this.currentIndex === this.questions.length - 1
      };
    } else {
      sounds.playBuzzer();
      return {
        correct: false,
        explanation: q.explanation,
        isLast: false
      };
    }
  }

  nextQuestion() {
    this.currentIndex++;
    return this.getCurrentQuestion();
  }

  reset() {
    this.currentIndex = 0;
    this.score = 0;
  }
}
