import { sounds } from '../audio/SoundManager.js';

export class CertificateModal {
  constructor(container, quizSystem, onComplete) {
    this.container = container;
    this.quizSystem = quizSystem;
    this.onComplete = onComplete;

    this.initElements();
  }

  initElements() {
    // 퀴즈 팝업
    this.quizModal = document.createElement('div');
    this.quizModal.className = 'modal-overlay hidden';
    this.quizModal.innerHTML = `
      <div class="modal-card quiz-card">
        <div class="modal-header">
          <span class="badge">🔥 미션 6</span>
          <h2>캠핑 안전 골든벨 퀴즈!</h2>
        </div>
        <div class="quiz-body">
          <div class="quiz-question" id="quizQuestionText">질문이 여기에 표시됩니다.</div>
          <div class="quiz-options" id="quizOptionsContainer"></div>
          <div class="quiz-feedback hidden" id="quizFeedback"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary hidden" id="quizNextBtn">다음 문제로</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.quizModal);

    // 수료증 팝업
    this.certModal = document.createElement('div');
    this.certModal.className = 'modal-overlay hidden';
    this.certModal.innerHTML = `
      <div class="modal-card cert-card printable" id="certPrintArea">
        <div class="cert-border">
          <div class="cert-badge">🏅 마인크래프트 안전 히어로</div>
          <h1 class="cert-title">캠핑 안전 보안관 수료증</h1>
          <p class="cert-subtitle">Certificate of Camping Safety Master</p>
          
          <div class="cert-recipient">
            <span class="cert-label">성 명 :</span>
            <input type="text" id="studentNameInput" value="용감한 어린이" maxlength="10" />
          </div>

          <div class="cert-body">
            위 어린이는 3D 블록 캠핑장에서 실시한<br/>
            <strong>텐트 안전 설치, 화재 예방, 일산화탄소 중독 방지, 야간 안전</strong> 등<br/>
            모든 캠핑 생존 안전 훈련과 골든벨 퀴즈를 우수한 성적으로 이수하였기에<br/>
            본 수료증과 함께 <strong>[대한민국 캠핑 안전 어린이 보안관]</strong>으로 임명합니다.
          </div>

          <div class="cert-date" id="certDateText">2026년 9월 10일</div>

          <div class="cert-seal-wrap">
            <div class="cert-seal">
              <span>참 잘했어요!</span>
              <div class="seal-star">★ ★ ★</div>
            </div>
            <div class="cert-issuer">세이프티 크래프트 캠핑 안전 협회</div>
          </div>
        </div>

        <div class="cert-actions no-print">
          <button class="btn btn-gold" id="printCertBtn">🖨️ 수료증 인쇄 / PDF 저장</button>
          <button class="btn btn-secondary" id="closeCertBtn">캠핑장으로 돌아가기</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.certModal);

    this.bindEvents();
  }

  bindEvents() {
    // 퀴즈 다음 버튼
    const nextBtn = this.quizModal.querySelector('#quizNextBtn');
    nextBtn.addEventListener('click', () => {
      const q = this.quizSystem.nextQuestion();
      if (q) {
        this.renderQuestion();
      } else {
        // 모든 퀴즈 완료 -> 수료증 열기
        this.quizModal.classList.add('hidden');
        this.showCertificate();
        if (this.onComplete) this.onComplete();
      }
    });

    // 수료증 인쇄 버튼
    const printBtn = this.certModal.querySelector('#printCertBtn');
    printBtn.addEventListener('click', () => {
      window.print();
    });

    // 닫기 버튼
    const closeBtn = this.certModal.querySelector('#closeCertBtn');
    closeBtn.addEventListener('click', () => {
      this.certModal.classList.add('hidden');
    });
  }

  openQuiz() {
    this.quizSystem.reset();
    this.quizModal.classList.remove('hidden');
    this.renderQuestion();
  }

  renderQuestion() {
    const q = this.quizSystem.getCurrentQuestion();
    if (!q) return;

    const qText = this.quizModal.querySelector('#quizQuestionText');
    const optContainer = this.quizModal.querySelector('#quizOptionsContainer');
    const feedback = this.quizModal.querySelector('#quizFeedback');
    const nextBtn = this.quizModal.querySelector('#quizNextBtn');

    qText.innerText = q.question;
    optContainer.innerHTML = '';
    feedback.className = 'quiz-feedback hidden';
    feedback.innerText = '';
    nextBtn.classList.add('hidden');

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerText = opt.text;
      btn.addEventListener('click', () => {
        // 이미 답변했으면 중복 클릭 방지
        if (!nextBtn.classList.contains('hidden')) return;

        const res = this.quizSystem.answer(idx);
        if (res.correct) {
          btn.classList.add('correct');
          feedback.className = 'quiz-feedback success';
          feedback.innerHTML = `🎉 <strong>정답입니다!</strong><br/>${res.explanation}`;
          nextBtn.classList.remove('hidden');
        } else {
          btn.classList.add('wrong');
          feedback.className = 'quiz-feedback error';
          feedback.innerHTML = `❌ <strong>아쉬워요! 다시 생각해볼까요?</strong><br/>${res.explanation}`;
        }
      });
      optContainer.appendChild(btn);
    });
  }

  showCertificate() {
    sounds.playFanfare();
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dateEl = this.certModal.querySelector('#certDateText');
    if (dateEl) dateEl.innerText = dateStr;

    this.certModal.classList.remove('hidden');
  }
}
