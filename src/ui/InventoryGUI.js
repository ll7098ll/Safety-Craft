import { sounds } from '../audio/SoundManager.js';

export class InventoryGUI {
  constructor(container, player, hotbarSlots = []) {
    this.container = container;
    this.player = player;
    this.hotbarSlots = hotbarSlots;
    this.isOpen = false;

    // 2x2 조합대 4개 슬롯
    this.craftSlots = [null, null, null, null];
    this.craftResult = null;

    // 27칸 메인 보관함 샘플 조합 재료들
    this.storageSlots = [
      { id: 'oak_log', name: '오크 원목', icon: '🪵', count: 8 },
      { id: 'iron_ingot', name: '철 주괴', icon: '🔩', count: 4 },
      { id: 'redstone', name: '레드스톤', icon: '🔴', count: 4 },
      { id: 'glow_dust', name: '발광석 가루', icon: '✨', count: 6 },
      { id: 'string', name: '실/끈', icon: '🧶', count: 6 },
      { id: 'coal', name: '목탄/석탄', icon: '⚫', count: 4 },
      { id: 'stick', name: '나무 막대기', icon: '🦯', count: 8 },
      ...Array.from({ length: 20 }).map(() => null)
    ];

    this.initHTML();
    this.drawSteveAvatar2D();
  }

  initHTML() {
    this.element = document.createElement('div');
    this.element.className = 'mc-inventory-gui hidden';
    this.element.innerHTML = `
      <div class="mc-inv-top-row">
        <!-- 스티브 아바타 -->
        <div class="mc-avatar-preview-box">
          <canvas class="mc-avatar-preview-canvas" id="invAvatarCanvas" width="140" height="180"></canvas>
        </div>

        <!-- 2x2 마인크래프트 조합대 -->
        <div class="mc-crafting-area">
          <div>
            <div class="mc-inv-title">조합 (Crafting) - 재료 클릭</div>
            <div class="mc-crafting-grid">
              <div class="mc-craft-slot" data-craft="0"></div>
              <div class="mc-craft-slot" data-craft="1"></div>
              <div class="mc-craft-slot" data-craft="2"></div>
              <div class="mc-craft-slot" data-craft="3"></div>
            </div>
          </div>
          <div class="mc-craft-arrow">➔</div>
          <div class="mc-craft-result-slot" id="craftResultSlot" title="결과물 클릭하여 획득"></div>
        </div>
      </div>

      <!-- 27칸 보관함 -->
      <div class="mc-inv-title">보관함 (재료 클릭 시 조합대에 올리기)</div>
      <div class="mc-main-inv-grid" id="mainInvGrid">
        ${this.storageSlots.map((item, idx) => `
          <div class="mc-inv-slot" data-storage="${idx}">
            ${item ? `<span class="mc-slot-item-icon">${item.icon}</span><span class="mc-slot-item-count">${item.count}</span>` : ''}
          </div>
        `).join('')}
      </div>

      <!-- 9칸 핫바 연동 슬롯 -->
      <div class="mc-inv-title" style="margin-top: 10px;">핫바 (1~9번 단축바)</div>
      <div class="mc-inv-hotbar-grid" id="invHotbarGrid">
        ${this.hotbarSlots.map((item, idx) => `
          <div class="mc-inv-slot" data-hotbar="${idx}">
            ${item ? `<span class="mc-slot-item-icon">${item.icon}</span><span class="mc-slot-item-count">${item.count}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    this.container.appendChild(this.element);

    // 조합대 슬롯 클릭 시 재료 회수
    const craftSlotEls = this.element.querySelectorAll('.mc-craft-slot');
    craftSlotEls.forEach((slot, idx) => {
      slot.addEventListener('click', () => {
        if (this.craftSlots[idx]) {
          sounds.playClick();
          // 보관함으로 회수
          this.addToStorage(this.craftSlots[idx]);
          this.craftSlots[idx] = null;
          this.checkRecipes();
          this.updateCraftingUI();
          this.updateStorageUI();
        }
      });
    });

    // 보관함 슬롯 클릭 시 조합대로 재료 이동
    const storageEls = this.element.querySelectorAll('[data-storage]');
    storageEls.forEach(el => {
      el.addEventListener('click', () => {
        const sIdx = parseInt(el.getAttribute('data-storage'));
        const item = this.storageSlots[sIdx];
        if (!item || item.count <= 0) return;

        // 비어있는 조합 슬롯 찾기
        const emptyCraftIdx = this.craftSlots.findIndex(c => c === null);
        if (emptyCraftIdx !== -1) {
          sounds.playPlace();
          this.craftSlots[emptyCraftIdx] = { ...item, count: 1 };
          item.count--;
          if (item.count <= 0) {
            this.storageSlots[sIdx] = null;
          }
          this.checkRecipes();
          this.updateCraftingUI();
          this.updateStorageUI();
        }
      });
    });

    // 조합 결과 슬롯 클릭 시 핫바/보관함으로 획득!
    const resultSlot = this.element.querySelector('#craftResultSlot');
    resultSlot.addEventListener('click', () => {
      if (this.craftResult) {
        sounds.playFanfare();
        const crafted = { ...this.craftResult };

        // 핫바로 넣기
        this.addToHotbar(crafted);

        if (this.onCraftItem) {
          this.onCraftItem(crafted);
        }

        // 조합 재료 소모
        this.craftSlots = [null, null, null, null];
        this.craftResult = null;

        this.updateCraftingUI();
        this.updateHotbarUI();
      }
    });
  }

  addToStorage(item) {
    const existing = this.storageSlots.find(s => s && s.id === item.id);
    if (existing) {
      existing.count += item.count;
    } else {
      const emptyIdx = this.storageSlots.findIndex(s => s === null);
      if (emptyIdx !== -1) {
        this.storageSlots[emptyIdx] = { ...item };
      }
    }
  }

  addToHotbar(item) {
    const existing = this.hotbarSlots.find(s => s && s.id === item.id);
    if (existing) {
      existing.count += item.count;
    } else {
      const emptyIdx = this.hotbarSlots.findIndex(s => s === null || s.count <= 0);
      if (emptyIdx !== -1) {
        this.hotbarSlots[emptyIdx] = { ...item };
      }
    }
  }

  // 실시간 마인크래프트 2x2 조합 레시피 검증
  checkRecipes() {
    const items = this.craftSlots.filter(s => s !== null);

    if (items.length === 1) {
      // 1) 원목 1개 ➔ 판자 4개
      if (items[0].id === 'oak_log') {
        this.craftResult = { id: 'oak_planks', name: '오크 판자', icon: '🪵', count: 4 };
        this.updateCraftingUI();
        return;
      }
      // 2) 판자 1개 ➔ 버튼
      if (items[0].id === 'oak_planks') {
        this.craftResult = { id: 'stick', name: '나무 막대기', icon: '🦯', count: 2 };
        this.updateCraftingUI();
        return;
      }
    }

    if (items.length === 2) {
      const has = (id) => items.some(i => i.id === id);
      // 막대기 + 석탄 ➔ 횃불 4개
      if (has('stick') && has('coal')) {
        this.craftResult = { id: 'torch', name: '야간 횃불', icon: '🔥', count: 4 };
        this.updateCraftingUI();
        return;
      }
      // 끈 + 발광석 가루 ➔ 야광 가드 2개
      if (has('string') && has('glow_dust')) {
        this.craftResult = { id: 'glow_strip', name: '야광 스트링 가드', icon: '✨', count: 2 };
        this.updateCraftingUI();
        return;
      }
      // 철 주괴 + 레드스톤 ➔ 일산화탄소 경보기 1개
      if (has('iron_ingot') && has('redstone')) {
        this.craftResult = { id: 'co_detector', name: 'CO 일산화탄소 경보기', icon: '🚨', count: 1 };
        this.updateCraftingUI();
        return;
      }
    }

    if (items.length >= 3) {
      const has = (id) => items.some(i => i.id === id);
      // 철 주괴 + 끈 + 막대기 ➔ 소화기 1개
      if (has('iron_ingot') && has('stick')) {
        this.craftResult = { id: 'extinguisher', name: '안전 소화기', icon: '🧯', count: 1 };
        this.updateCraftingUI();
        return;
      }
    }

    this.craftResult = null;
    this.updateCraftingUI();
  }

  updateCraftingUI() {
    const slots = this.element.querySelectorAll('.mc-craft-slot');
    slots.forEach((s, idx) => {
      const item = this.craftSlots[idx];
      s.innerHTML = item ? `<span class="mc-slot-item-icon">${item.icon}</span>` : '';
    });

    const resultSlot = this.element.querySelector('#craftResultSlot');
    if (this.craftResult) {
      resultSlot.innerHTML = `
        <span class="mc-slot-item-icon">${this.craftResult.icon}</span>
        <span class="mc-slot-item-count">${this.craftResult.count}</span>
      `;
      resultSlot.title = `${this.craftResult.name} (${this.craftResult.count}개)`;
    } else {
      resultSlot.innerHTML = '';
      resultSlot.title = '';
    }
  }

  updateStorageUI() {
    const storageEls = this.element.querySelectorAll('[data-storage]');
    storageEls.forEach((el, idx) => {
      const item = this.storageSlots[idx];
      el.innerHTML = item && item.count > 0 ? `
        <span class="mc-slot-item-icon">${item.icon}</span>
        <span class="mc-slot-item-count">${item.count}</span>
      ` : '';
    });
  }

  updateHotbarUI() {
    const hotbarEls = this.element.querySelectorAll('[data-hotbar]');
    hotbarEls.forEach((el, idx) => {
      const item = this.hotbarSlots[idx];
      el.innerHTML = item && item.count > 0 ? `
        <span class="mc-slot-item-icon">${item.icon}</span>
        <span class="mc-slot-item-count">${item.count}</span>
      ` : '';
    });

    // 인게임 HUD 핫바 슬롯도 동기화
    if (this.onHotbarUpdated) this.onHotbarUpdated();
  }

  drawSteveAvatar2D() {
    const canvas = this.element.querySelector('#invAvatarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(0, 0, 140, 180);

    const cx = 70;
    const cy = 25;

    ctx.fillStyle = '#c89664';
    ctx.fillRect(cx - 20, cy, 40, 40);
    ctx.fillStyle = '#4a2e12';
    ctx.fillRect(cx - 20, cy, 40, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 14, cy + 18, 8, 6);
    ctx.fillRect(cx + 6, cy + 18, 8, 6);
    ctx.fillStyle = '#224499';
    ctx.fillRect(cx - 10, cy + 18, 4, 6);
    ctx.fillRect(cx + 6, cy + 18, 4, 6);

    ctx.fillStyle = '#009999';
    ctx.fillRect(cx - 20, cy + 42, 40, 55);

    ctx.fillStyle = '#009999';
    ctx.fillRect(cx - 36, cy + 42, 16, 20);
    ctx.fillRect(cx + 20, cy + 42, 16, 20);
    ctx.fillStyle = '#c89664';
    ctx.fillRect(cx - 36, cy + 62, 16, 35);
    ctx.fillRect(cx + 20, cy + 62, 16, 35);

    ctx.fillStyle = '#2b3866';
    ctx.fillRect(cx - 19, cy + 97, 18, 50);
    ctx.fillRect(cx + 1, cy + 97, 18, 50);

    ctx.fillStyle = '#555555';
    ctx.fillRect(cx - 19, cy + 147, 18, 8);
    ctx.fillRect(cx + 1, cy + 147, 18, 8);
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.element.classList.remove('hidden');
      sounds.playClick();
      this.updateStorageUI();
      this.updateHotbarUI();
      this.checkRecipes();
      this.drawSteveAvatar2D();
    } else {
      this.element.classList.add('hidden');
      sounds.playClick();
    }
    return this.isOpen;
  }
}
