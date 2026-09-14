import { sounds } from '../audio/SoundManager.js';

export class ShopModal {
  constructor(container, rpgSystem, player, hud) {
    this.container = container;
    this.rpgSystem = rpgSystem;
    this.player = player;
    this.hud = hud;

    this.isOpen = false;
    this.currentShopType = null;

    this.catalog = {
      ranger_store: {
        title: '🛡️ 박 반장의 캠핑 안전 장비점',
        desc: '철저한 준비가 안전한 캠핑의 시작입니다! 검증된 정품 안전 장비를 구비하세요.',
        items: [
          {
            id: 'fire_shield',
            name: '내화 방염 작업 장갑',
            icon: '🧤',
            desc: '화재 및 불티로부터 몸을 보호합니다. (화재 위험 감쇄 버프 60초)',
            cost: 40,
            onBuy: () => {
              this.rpgSystem.applyBuff(
                'fire_shield',
                '내화 방염 보호',
                '🧤',
                60,
                () => {},
                () => {}
              );
            }
          },
          {
            id: 'super_lantern',
            name: '초강력 LED 캠핑 랜턴',
            icon: '🏮',
            desc: '칠흑 같은 야간에도 주변을 대낮처럼 밝혀 줍니다. (야간 조명 버프 90초)',
            cost: 50,
            onBuy: () => {
              this.rpgSystem.applyBuff(
                'lantern',
                '환한 캠핑 랜턴',
                '🏮',
                90,
                () => {},
                () => {}
              );
            }
          },
          {
            id: 'wood_bundle',
            name: '건축용 참나무 목재 (8개)',
            icon: '🪵',
            desc: '텐트 보강이나 캠핑 베이스 건축에 필요한 튼튼한 목재 블록 세트입니다.',
            cost: 30,
            onBuy: () => {
              const held = this.hud.hotbarSlots.find(s => s && s.id === 'oak_planks');
              if (held) {
                held.count += 8;
              } else {
                const emptyIdx = this.hud.hotbarSlots.findIndex(s => !s || s.count === 0);
                if (emptyIdx !== -1) {
                  this.hud.hotbarSlots[emptyIdx] = {
                    id: 'oak_planks',
                    name: '참나무 판자',
                    icon: '🪵',
                    count: 8
                  };
                }
              }
              this.hud.refreshHotbar();
            }
          },
          {
            id: 'first_aid_kit',
            name: '긴급 안전 구급함',
            icon: '🩹',
            desc: '체력과 허기를 즉시 최대로 회복시킵니다.',
            cost: 45,
            onBuy: () => {
              this.hud.setHealth(20);
              this.hud.setFood(20);
              this.hud.showAdvancement('구급함 사용 완료: 체력/허기 최대 회복!', '💖');
            }
          }
        ]
      },
      food_store: {
        title: '🍳 셰프 쿠킹 밥의 캠핑 레스토랑',
        desc: '모닥불에서 직화로 구워낸 전설의 캠핑 요리! 든든하게 먹고 힘을 내보세요.',
        items: [
          {
            id: 'speed_marshmallow',
            name: '황금 마시멜로 꼬치',
            icon: '🍡',
            desc: '달콤한 당 충전! 45초 동안 이동 속도가 35% 빨라집니다. [신속 버프]',
            cost: 35,
            onBuy: () => {
              const origWalk = this.player.walkSpeed;
              const origRun = this.player.runSpeed;
              this.rpgSystem.applyBuff(
                'speed',
                '신속의 질주',
                '🍡',
                45,
                () => {
                  this.player.walkSpeed = origWalk * 1.35;
                  this.player.runSpeed = origRun * 1.35;
                },
                () => {
                  this.player.walkSpeed = origWalk;
                  this.player.runSpeed = origRun;
                }
              );
            }
          },
          {
            id: 'fresh_stew',
            name: '모닥불 산채 스튜',
            icon: '🍲',
            desc: '신선한 야생 약초로 끓여 폐를 정화합니다. 60초간 일산화탄소 위험도 50% 차단!',
            cost: 45,
            onBuy: () => {
              this.rpgSystem.applyBuff(
                'co_shield',
                '청정 호흡 보호',
                '🍲',
                60,
                () => {},
                () => {}
              );
            }
          },
          {
            id: 'roasted_potato',
            name: '숯불 통감자 구이',
            icon: '🥔',
            desc: '포슬포슬 잘 구워진 영양 만점 캠핑 간식. 허기를 100% 채워줍니다.',
            cost: 20,
            onBuy: () => {
              this.hud.setFood(20);
              this.hud.showAdvancement('숯불 통감자 섭취 완료: 허기 충전!', '🥔');
            }
          }
        ]
      }
    };

    this.element = document.createElement('div');
    this.element.className = 'rpg-shop-wrap hidden';
    this.element.innerHTML = `
      <div class="rpg-shop-card">
        <div class="rpg-shop-header">
          <div class="rpg-shop-title" id="shopTitle">상점</div>
          <div class="rpg-wallet-badge">내 도토리: <span id="shopWalletAcorns">0</span> 🌰</div>
          <button class="modal-close" id="shopCloseBtn">✕</button>
        </div>
        <div class="rpg-shop-desc" id="shopDesc">설명</div>
        <div class="rpg-shop-grid" id="shopGrid">
          <!-- 아이템 목록 동적 렌더링 -->
        </div>
      </div>
    `;

    this.container.appendChild(this.element);

    this.titleEl = this.element.querySelector('#shopTitle');
    this.walletEl = this.element.querySelector('#shopWalletAcorns');
    this.descEl = this.element.querySelector('#shopDesc');
    this.gridEl = this.element.querySelector('#shopGrid');
    this.closeBtn = this.element.querySelector('#shopCloseBtn');

    this.closeBtn.addEventListener('click', () => this.close());
    this.rpgSystem.on('onAcornChange', (val) => {
      this.walletEl.innerText = val;
    });

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.code === 'Escape') {
        this.close();
        e.preventDefault();
      }
    });
  }

  open(shopType = 'ranger_store') {
    this.currentShopType = shopType;
    this.isOpen = true;
    this.element.classList.remove('hidden');

    const shop = this.catalog[shopType] || this.catalog.ranger_store;
    this.titleEl.innerText = shop.title;
    this.descEl.innerText = shop.desc;
    this.walletEl.innerText = this.rpgSystem.acorns;

    this.renderItems(shop.items);
  }

  renderItems(items) {
    this.gridEl.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'rpg-item-card';
      card.innerHTML = `
        <div class="item-icon-box">${item.icon}</div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
        </div>
        <div class="item-action">
          <div class="item-price">${item.cost} 🌰</div>
          <button class="rpg-buy-btn" data-id="${item.id}">구매하기</button>
        </div>
      `;

      const buyBtn = card.querySelector('.rpg-buy-btn');
      buyBtn.addEventListener('click', () => {
        if (this.rpgSystem.spendAcorns(item.cost)) {
          item.onBuy();
          this.hud.showAdvancement(`[${item.name}] 구매 완료!`, item.icon);
          this.walletEl.innerText = this.rpgSystem.acorns;
        } else {
          alert('도토리 코인이 부족합니다! 퀘스트를 완료하거나 블록을 채굴하여 도토리를 모아보세요.');
        }
      });

      this.gridEl.appendChild(card);
    });
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('hidden');
    sounds.playClick();
  }
}
