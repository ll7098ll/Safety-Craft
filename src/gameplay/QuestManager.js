import * as THREE from 'three';
import { sounds } from '../audio/SoundManager.js';

export class QuestManager {
  constructor(campingObjects, voxelWorld, safetyGauge, wildBoar, dayNightCycle, rpgSystem = null) {
    this.campingObjects = campingObjects;
    this.voxelWorld = voxelWorld;
    this.safetyGauge = safetyGauge;
    this.wildBoar = wildBoar;
    this.dayNightCycle = dayNightCycle;
    this.rpgSystem = rpgSystem;

    this.currentQuestIndex = 0;
    this.inspectedSigns = new Set();
    this.stringsFixed = 0;

    this.quests = [
      {
        id: 'site_selection',
        title: '에피소드 1: 안전 명당 사이트 탐색',
        desc: '계곡 급류, 바위 낙석, 고목 낙뢰 위험 표지판 3개를 조사하고 [안전 구역]으로 이동하세요!',
        steps: ['위험 표지판 조사 (0/3)', '초록색 안전 구역 도착 및 확정'],
        advancement: '안전한 보금자리',
        advIcon: '⛺',
        completed: false
      },
      {
        id: 'string_guard',
        title: '에피소드 2: 텐트 줄 야간 발걸림 방지',
        desc: '핫바 2번의 [야광 가드]를 손에 들고 텐트 줄 4곳에 우클릭하여 장착하세요!',
        steps: ['[야광 가드] 들고 텐트 줄 4곳 장착 (0/4)'],
        advancement: '야광의 수호자',
        advIcon: '✨',
        completed: false
      },
      {
        id: 'co_hazard',
        title: '에피소드 3: 위기 발생! 텐트 속 일산화탄소 악몽',
        desc: '텐트 안 숯불 난로를 밖으로 꺼내고, 환기창을 열고, 핫바 3번 [CO 경보기]를 천장에 설치하세요!',
        steps: [
          '숯불 난로를 텐트 밖으로 꺼내기',
          '텐트 환기창(벤틸레이션) 열기',
          '[CO 경보기] 들고 텐트 천장에 설치'
        ],
        advancement: '맑은 공기를 찾아서',
        advIcon: '🚨',
        completed: false
      },
      {
        id: 'bbq_safety',
        title: '에피소드 4: 과대 불판 폭발 방지 & 잔불 진압',
        desc: '위험한 과대 불판을 치우고, 핫바의 [소화기]나 [물 양동이]를 들고 화로대 잔불을 완전히 끄세요!',
        steps: [
          '과대 불판 치우고 안전 규격 불판 교체',
          '소화기 점검 및 안전핀 확인',
          '[소화기/물 양동이] 들고 모닥불 완벽 소화'
        ],
        advancement: '화재 진압관',
        advIcon: '🧯',
        completed: false
      },
      {
        id: 'wildlife_food',
        title: '에피소드 5: 어두운 밤 나타난 야생 멧돼지 퇴치!',
        desc: '음식 냄새를 맡고 멧돼지가 다가옵니다! [아이스박스]로 음식을 밀봉하고 [횃불]을 밝혀 쫓아내세요!',
        steps: [
          '[아이스박스] 들고 테이블 음식 밀봉 보관',
          '[횃불] 밝혀 야생 멧돼지 쫓아내기'
        ],
        advancement: '청결한 숲의 수호자',
        advIcon: '🐗',
        completed: false
      },
      {
        id: 'quiz_master',
        title: '에필로그: 캠핑 안전 골든벨 & 공식 수료증',
        desc: '배운 안전 수칙으로 퀴즈를 풀고 [대한민국 캠핑 안전 보안관 수료증]을 발급받으세요!',
        steps: ['캠핑 안전 골든벨 퀴즈 통과'],
        advancement: '캠핑 안전 마스터 보안관',
        advIcon: '🏅',
        completed: false
      }
    ];

    this.heaterMoved = false;
    this.ventOpened = false;
    this.detectorInstalled = false;

    this.panReplaced = false;
    this.extinguisherChecked = false;
    this.firePutOut = false;

    this.foodStored = false;
    this.boarScared = false;

    this.visitedSafeZone = false;
  }

  getCurrentQuest() {
    return this.quests[this.currentQuestIndex] || null;
  }

  // 플레이어 위치와 들고 있는 아이템(heldItem)에 따른 상호작용 검사
  checkNearbyInteraction(playerPos, heldItem) {
    const q = this.getCurrentQuest();
    if (!q) return null;

    const heldId = heldItem?.id || '';

    // 에피소드 1: 표지판 & 안전 구역
    if (q.id === 'site_selection') {
      for (const zone of this.voxelWorld.interactableZones) {
        if (playerPos.distanceTo(zone.position) < zone.radius) {
          return {
            text: '[우클릭] 표지판 조사하기',
            action: () => this.inspectSign(zone)
          };
        }
      }
      if (this.voxelWorld.safeZoneBounds.containsPoint(playerPos)) {
        if (this.inspectedSigns.size >= 3 && !this.visitedSafeZone) {
          return {
            text: '[우클릭] 안전 명당 사이트 확정하기!',
            action: () => this.confirmSafeZone()
          };
        }
      }
    }

    // 에피소드 2: 야광 가드 장착
    if (q.id === 'string_guard') {
      for (let i = 0; i < this.campingObjects.strings.length; i++) {
        const s = this.campingObjects.strings[i];
        if (!s.glowGuard.visible && playerPos.distanceTo(s.position) < 2.0) {
          if (heldId === 'glow_strip') {
            return {
              text: `[우클릭] 손에 든 [야광 가드]를 ${i + 1}번 줄에 장착!`,
              action: () => this.attachStringGuard(i, heldItem)
            };
          } else {
            return {
              text: `[!] 핫바에서 [야광 가드](2번)를 손에 들고 우클릭하세요!`,
              action: () => this.notifyItemRequired('야광 가드(2번)')
            };
          }
        }
      }
    }

    // 에피소드 3: 일산화탄소 위기
    if (q.id === 'co_hazard') {
      // 1) 숯불 난로 빼내기
      if (!this.heaterMoved) {
        const heaterPos = this.campingObjects.tentHeater.position;
        if (playerPos.distanceTo(heaterPos) < 1.8) {
          return {
            text: '[우클릭] 숯불 난로를 텐트 밖으로 꺼내기!',
            action: () => this.moveHeaterOut()
          };
        }
      }
      // 2) 환기창 열기
      if (!this.ventOpened) {
        const ventPos = new THREE.Vector3(2, 1.6, -3.5);
        if (playerPos.distanceTo(ventPos) < 2.0) {
          return {
            text: '[우클릭] 텐트 환기창(벤틸레이션) 활짝 열기',
            action: () => this.openVent()
          };
        }
      }
      // 3) CO 경보기 설치
      if (!this.detectorInstalled && this.heaterMoved && this.ventOpened) {
        const tentCenter = new THREE.Vector3(2, 1.4, -2);
        if (playerPos.distanceTo(tentCenter) < 2.2) {
          if (heldId === 'co_detector') {
            return {
              text: '[우클릭] 손에 든 [CO 경보기]를 텐트 천장에 설치!',
              action: () => this.installDetector(heldItem)
            };
          } else {
            return {
              text: '[!] 핫바에서 [CO 경보기](3번)를 손에 들고 우클릭하세요!',
              action: () => this.notifyItemRequired('CO 경보기(3번)')
            };
          }
        }
      }
    }

    // 에피소드 4: 과대 불판 & 모닥불 잔불
    if (q.id === 'bbq_safety') {
      if (!this.panReplaced) {
        const bbqPos = this.campingObjects.bbqGroup.position;
        if (playerPos.distanceTo(bbqPos) < 2.0) {
          return {
            text: '[우클릭] 폭발 위험 과대 불판 치우기!',
            action: () => this.replaceOverheatPan()
          };
        }
      }
      if (!this.extinguisherChecked) {
        const extPos = this.campingObjects.fireExtinguisher.position;
        if (playerPos.distanceTo(extPos) < 1.8) {
          return {
            text: '[우클릭] 소화기 압력 점검 및 안전핀 확인',
            action: () => this.checkExtinguisher()
          };
        }
      }
      if (!this.firePutOut && this.panReplaced && this.extinguisherChecked) {
        const firePos = new THREE.Vector3(5, 0.4, -0.9);
        if (playerPos.distanceTo(firePos) < 2.2) {
          if (heldId === 'extinguisher' || heldId === 'water_bucket') {
            return {
              text: `[우클릭] 손에 든 [${heldItem.name}] 분사하여 잔불 완벽 소화!`,
              action: () => this.extinguishCampfire()
            };
          } else {
            return {
              text: '[!] 핫바에서 [소화기](1번) 또는 [물 양동이](5번)를 들고 우클릭하세요!',
              action: () => this.notifyItemRequired('소화기 또는 물 양동이')
            };
          }
        }
      }
    }

    // 에피소드 5: 음식 밀봉 & 멧돼지 퇴치
    if (q.id === 'wildlife_food') {
      const tablePos = this.campingObjects.picnicTable.position;
      if (!this.foodStored && playerPos.distanceTo(tablePos) < 2.2) {
        if (heldId === 'cooler') {
          return {
            text: '[우클릭] 손에 든 [아이스박스]에 음식을 밀봉 보관!',
            action: () => this.packFoodToCooler()
          };
        } else {
          return {
            text: '[!] 핫바에서 [아이스박스](8번)를 들고 우클릭하세요!',
            action: () => this.notifyItemRequired('아이스박스(8번)')
          };
        }
      }

      if (this.foodStored && !this.boarScared) {
        if (heldId === 'torch') {
          return {
            text: '[우클릭] 손에 든 [횃불]을 밝혀 멧돼지를 쫓아내기!',
            action: () => this.scareBoar()
          };
        } else {
          return {
            text: '[!] 핫바에서 [횃불](7번)을 들고 우클릭하세요!',
            action: () => this.notifyItemRequired('횃불(7번)')
          };
        }
      }
    }

    // 에필로그: 퀴즈
    if (q.id === 'quiz_master' && !q.completed) {
      const tentPos = new THREE.Vector3(2, 0.5, -2);
      if (playerPos.distanceTo(tentPos) < 3.0) {
        return {
          text: '[우클릭] 캠핑 안전 골든벨 퀴즈 시작!',
          action: () => this.startQuiz()
        };
      }
    }

    return null;
  }

  notifyItemRequired(itemName) {
    sounds.playBuzzer();
    if (this.onNotice) {
      this.onNotice(`⚠️ 올바른 도구가 필요합니다: 손에 [${itemName}]을 쥐고 우클릭하세요!`, 'warning');
    }
  }

  inspectSign(zone) {
    sounds.playPlace();
    this.inspectedSigns.add(zone.message);
    const q = this.quests[0];
    q.steps[0] = `위험 표지판 조사 (${this.inspectedSigns.size}/3)`;

    if (this.onNotice) this.onNotice(zone.message, 'warning');

    if (this.inspectedSigns.size >= 3 && this.onGuideMessage) {
      this.onGuideMessage("훌륭해! 위험한 3곳을 모두 조사했어. 이제 중앙 초록색 [안전 구역]으로 가서 사이트를 확정하자!");
    }
  }

  confirmSafeZone() {
    this.visitedSafeZone = true;
    this.safetyGauge.addScore(15);
    this.triggerAdvancement(0);
    this.completeQuest(0);

    if (this.onGuideMessage) {
      this.onGuideMessage("명당 자리 선정 완료! 다음으로 밤에 줄에 걸려 넘어지지 않게 핫바 2번 [야광 가드]를 들고 텐트 줄 4곳에 달아줘!");
    }
  }

  attachStringGuard(idx, heldItem) {
    sounds.playPlace();
    const strObj = this.campingObjects.strings[idx];
    strObj.glowGuard.visible = true;
    strObj.stringMesh.material = this.campingObjects.materials.glow;
    this.stringsFixed++;

    if (heldItem && heldItem.count > 0) heldItem.count--;

    const q = this.quests[1];
    q.steps[0] = `[야광 가드] 텐트 줄 장착 (${this.stringsFixed}/4)`;

    if (this.stringsFixed >= 4) {
      this.safetyGauge.addScore(15);
      this.triggerAdvancement(1);
      this.completeQuest(1);

      if (this.onGuideMessage) {
        this.onGuideMessage("큰일 났어!! 텐트 안이 춥다고 안에 숯불 난로를 켜두었대! 일산화탄소 중독으로 쓰러질 수 있어! 당장 텐트로 들어가 난로를 꺼내줘!");
      }
    }
  }

  moveHeaterOut() {
    sounds.playPlace();
    this.heaterMoved = true;
    this.campingObjects.isHeaterInsideTent = false;
    this.campingObjects.tentHeater.position.set(2, 0, -4.5);
    const q = this.quests[2];
    q.steps[0] = '✅ 숯불 난로 텐트 밖 이동 완료';

    if (this.onNotice) {
      this.onNotice("숯불 난로를 밖으로 꺼냈습니다! 텐트 안 난로는 절대 금지!", "success");
    }
  }

  openVent() {
    sounds.playPlace();
    this.ventOpened = true;
    this.campingObjects.isVentOpen = true;
    this.campingObjects.ventWindow.rotation.x = -Math.PI / 4;
    const q = this.quests[2];
    q.steps[1] = '✅ 텐트 환기창(벤틸레이션) 개방 완료';

    if (this.onNotice) {
      this.onNotice("환기창을 열었습니다! 공기가 환기됩니다. 이제 3번 [CO 경보기]를 천장에 달아주세요!", "success");
    }
  }

  installDetector(heldItem) {
    sounds.playPlace();
    this.detectorInstalled = true;
    this.campingObjects.coDetector.visible = true;
    if (heldItem && heldItem.count > 0) heldItem.count--;

    const q = this.quests[2];
    q.steps[2] = '✅ 천장 [CO 경보기] 설치 완료';

    this.safetyGauge.addScore(20);
    this.triggerAdvancement(2);
    this.completeQuest(2);

    if (this.onGuideMessage) {
      this.onGuideMessage("휴, 살았다! 이제 바깥 바비큐 테이블로 가봐! 버너에 부탄가스를 덮은 위험한 '과대 불판'이 올려져 있어!");
    }
  }

  replaceOverheatPan() {
    sounds.playPlace();
    this.panReplaced = true;
    this.campingObjects.dangerBigPan.visible = false;
    this.campingObjects.safePan.visible = true;
    this.campingObjects.isOverheatingPanFixed = true;
    const q = this.quests[3];
    q.steps[0] = '✅ 과대 불판 치우고 안전 규격 불판 교체 완료';

    if (this.onNotice) {
      this.onNotice("과대 불판을 치웠습니다! 부탄가스 과열 폭발 위험을 예방했습니다.", "success");
    }
  }

  checkExtinguisher() {
    sounds.playPlace();
    this.extinguisherChecked = true;
    const q = this.quests[3];
    q.steps[1] = '✅ 소화기 압력 및 안전핀 점검 완료';

    if (this.onNotice) {
      this.onNotice("소화기 확인 완료! 이제 1번 소화기나 5번 물 양동이를 들고 모닥불 잔불을 꺼주세요!", "info");
    }
  }

  extinguishCampfire() {
    sounds.playExtinguish();
    this.firePutOut = true;
    this.campingObjects.fireMesh.visible = false;
    this.campingObjects.isCampfireExtinguished = true;
    this.campingObjects.spawnExtinguisherSpray(
      this.campingObjects.fireExtinguisher.position,
      this.campingObjects.firePit.position
    );

    const q = this.quests[3];
    q.steps[2] = '✅ 모닥불 잔불 완전 소화 완료';

    this.safetyGauge.addScore(15);
    this.triggerAdvancement(3);
    this.completeQuest(3);

    // 에피소드 5 진입: 밤 모드로 전환되고 숲에서 멧돼지 출현!
    this.dayNightCycle.toggleDayNight();
    this.wildBoar.spawn();

    if (this.onGuideMessage) {
      this.onGuideMessage("밤이 되자 음식 냄새를 맡고 멧돼지가 나타났어! 서둘러 8번 [아이스박스]를 들고 음식을 밀봉하고, 7번 [횃불]을 들어 쫓아내!");
    }
  }

  packFoodToCooler() {
    sounds.playPlace();
    this.foodStored = true;
    this.campingObjects.isFoodPackedInCooler = true;
    this.campingObjects.exposedFood.visible = false;
    const q = this.quests[4];
    q.steps[0] = '✅ 음식을 밀폐 아이스박스에 보관 완료';

    if (this.onNotice) {
      this.onNotice("음식을 아이스박스에 밀봉했습니다! 이제 [횃불](7번)을 들고 멧돼지를 쫓아내세요!", "success");
    }
  }

  scareBoar() {
    sounds.playExtinguish();
    this.boarScared = true;
    this.wildBoar.scareAway();
    const q = this.quests[4];
    q.steps[1] = '✅ 횃불을 밝혀 야생 멧돼지 퇴치 완료!';

    this.safetyGauge.addScore(15);
    this.triggerAdvancement(4);
    this.completeQuest(4);

    if (this.onGuideMessage) {
      this.onGuideMessage("멋지게 멧돼지를 물리쳤어! 이제 모든 실전 안전 훈련을 마쳤어. 텐트 앞 도토리 대장에게 가서 [골든벨 퀴즈]를 풀고 수료증을 받자!");
    }
  }

  startQuiz() {
    if (this.onOpenQuiz) this.onOpenQuiz();
  }

  completeQuizMission() {
    this.safetyGauge.addScore(20);
    this.triggerAdvancement(5);
    this.completeQuest(5);
  }

  triggerAdvancement(index) {
    const q = this.quests[index];
    if (q && this.onQuestAdvancement) {
      this.onQuestAdvancement(q.advancement, q.advIcon);
    }
  }

  completeQuest(index) {
    if (this.quests[index]) {
      this.quests[index].completed = true;
      if (this.currentQuestIndex === index) {
        this.currentQuestIndex = Math.min(this.quests.length - 1, index + 1);
      }
      if (this.rpgSystem) {
        this.rpgSystem.addXP(100);
        this.rpgSystem.addAcorns(60);
      }
    }
  }

  // NPC별 대화 트리 및 상호작용 생성
  getNPCDialogue(npc, callbacks = {}, hotbarSlots = []) {
    const curQuest = this.getCurrentQuest();

    // 1. 도토리 대장
    if (npc.id === 'squirrel_leader') {
      if (curQuest) {
        return {
          text: `안녕! 나는 이 캠핑장의 안전 멘토 [도토리 대장]이야!\n지금은 "${curQuest.title}" 미션을 해결할 차례란다. 도움이 필요하면 언제든 물어보렴!`,
          options: [
            {
              text: '현재 미션에 대한 힌트를 알려주세요!',
              action: () => {
                callbacks.showNotice?.(`💡 [힌트]: ${curQuest.desc}`);
                callbacks.closeDialog?.();
              }
            },
            {
              text: '캠핑 안전 골든벨 퀴즈에 도전하고 싶어요!',
              action: () => {
                callbacks.closeDialog?.();
                callbacks.openQuiz?.();
              }
            },
            {
              text: '감사합니다, 이따 뵐게요!',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      } else {
        return {
          text: '모든 캠핑 안전 미션을 훌륭하게 완수했구나! 진정한 캠핑 안전 보안관이야!',
          options: [
            {
              text: '수료증 다시 확인하기',
              action: () => {
                callbacks.closeDialog?.();
                callbacks.openQuiz?.();
              }
            },
            {
              text: '감사합니다!',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      }
    }

    // 2. 관리소장 박 반장
    if (npc.id === 'ranger_park') {
      const qWood = this.rpgSystem?.getSideQuest('gather_firewood');
      let woodInInventory = 0;
      if (hotbarSlots) {
        const slot = hotbarSlots.find(s => s && s.id === 'oak_log');
        if (slot) woodInInventory = slot.count;
      }

      if (qWood && qWood.completed) {
        return {
          text: '자네 덕에 밤에도 마른 장작으로 따뜻하고 안전하게 캠프를 지킬 수 있겠네. 필요한 장비가 있다면 내 상점을 둘러보게나!',
          options: [
            {
              text: '박 반장의 안전 장비점 열기',
              action: () => {
                callbacks.closeDialog?.();
                callbacks.openShop?.('ranger_store');
              }
            },
            {
              text: '수고하세요!',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      } else if (qWood && qWood.active) {
        if (woodInInventory >= 3) {
          return {
            text: '오! 잘 마른 참나무 원목을 3개나 구해왔군! 정말 고맙네. 여기 약속한 보답일세!',
            options: [
              {
                text: '원목 3개 전달하기 (퀘스트 완료)',
                action: () => {
                  const slot = hotbarSlots.find(s => s && s.id === 'oak_log');
                  if (slot) slot.count -= 3;
                  this.rpgSystem.completeSideQuest('gather_firewood');
                  npc.setQuestState('none');
                  callbacks.refreshHotbar?.();
                  callbacks.closeDialog?.();
                }
              }
            ]
          };
        } else {
          return {
            text: `음, 아직 원목이 부족하군. 주변 마른 나무를 캐서 [참나무 원목] 3개를 가져다주게. (현재 소지: ${woodInInventory}/3)`,
            options: [
              {
                text: '안전 장비점 구경하기',
                action: () => {
                  callbacks.closeDialog?.();
                  callbacks.openShop?.('ranger_store');
                }
              },
              {
                text: '곧 모아오겠습니다!',
                action: () => callbacks.closeDialog?.()
              }
            ]
          };
        }
      } else {
        return {
          text: '어서 오게! 밤이 되면 산속 기온이 급격히 떨어지거든. 텐트 주변 바짝 마른 원목 3개만 캐다 줄 수 있겠나?',
          options: [
            {
              text: '네, 제가 모아올게요! (서브 퀘스트 수락)',
              action: () => {
                this.rpgSystem.startSideQuest('gather_firewood');
                npc.setQuestState('none');
                callbacks.closeDialog?.();
              }
            },
            {
              text: '박 반장의 안전 장비점 보기',
              action: () => {
                callbacks.closeDialog?.();
                callbacks.openShop?.('ranger_store');
              }
            },
            {
              text: '지금은 바빠서요.',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      }
    }

    // 3. 초보 캠퍼 민수
    if (npc.id === 'camper_minsu') {
      const qCorn = this.rpgSystem?.getSideQuest('deliver_snack');
      if (qCorn && qCorn.completed) {
        return {
          text: '구운 옥수수 정말 꿀맛이었어요! 덕분에 기운 차리고 텐트 팩도 튼튼하게 다시 박았답니다. 고마워요!',
          options: [{ text: '다행이네요! 즐거운 캠핑 되세요!', action: () => callbacks.closeDialog?.() }]
        };
      } else if (qCorn && qCorn.active) {
        return {
          text: '피크닉 테이블에 가면 모닥불에 구운 노릇노릇한 옥수수가 있을 거예요! 배가 고파서 쓰러지기 일보 직전이에요 ㅠㅠ',
          options: [
            {
              text: '테이블에서 옥수수 챙겨서 전달하기',
              action: () => {
                this.rpgSystem.completeSideQuest('deliver_snack');
                npc.setQuestState('none');
                callbacks.closeDialog?.();
              }
            },
            {
              text: '조금만 더 기다려줘요!',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      } else {
        return {
          text: '으으... 텐트 치느라 온 힘을 다 썼더니 배가 너무 고파요... 저기 테이블에 구운 옥수수 하나만 챙겨다 주실 수 있나요?',
          options: [
            {
              text: '배고픈 건 못 참죠! 제가 가져다줄게요. (수락)',
              action: () => {
                this.rpgSystem.startSideQuest('deliver_snack');
                npc.setQuestState('none');
                callbacks.closeDialog?.();
              }
            },
            {
              text: '혼자서 참아보세요.',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      }
    }

    // 4. 셰프 쿠킹 밥
    if (npc.id === 'chef_bob') {
      return {
        text: '본 조르노! 캠핑의 낭만은 모닥불 직화 요리 아니겠나? 스피드가 빨라지는 마시멜로부터 든든한 산채 스튜까지 준비되어 있네!',
        options: [
          {
            text: '캠핑 레스토랑 메뉴 보기 (상점 열기)',
            action: () => {
              callbacks.closeDialog?.();
              callbacks.openShop?.('food_store');
            }
          },
          {
            text: '캠핑 요리 안전 팁을 알려주세요!',
            action: () => {
              callbacks.showNotice?.('👨‍🍳 [셰프 팁]: 휴대용 버너보다 큰 냄비나 과대 불판을 쓰면 부탄가스통이 과열되어 폭발합니다!');
              callbacks.closeDialog?.();
            }
          },
          {
            text: '다음에 들를게요!',
            action: () => callbacks.closeDialog?.()
          }
        ]
      };
    }

    // 5. 에코 레인저 아린
    if (npc.id === 'ranger_arin') {
      const qClean = this.rpgSystem?.getSideQuest('clean_campsite');
      if (qClean && qClean.completed) {
        return {
          text: '와! 캠핑장 주변이 정말 몰라보게 깨끗해졌어! 아름다운 숲을 지켜줘서 정말 고마워. 너는 최고의 자연 수호자야!',
          options: [{ text: '함께 지키는 클린 캠핑!', action: () => callbacks.closeDialog?.() }]
        };
      } else if (qClean && qClean.active) {
        if (qClean.current >= qClean.target) {
          return {
            text: '우와! 숲속에 버려져 있던 캔과 쓰레기 3개를 다 주워왔구나! 여기 감사의 도토리 보상이야!',
            options: [
              {
                text: '분리수거 완료 보고 (보상 받기)',
                action: () => {
                  this.rpgSystem.completeSideQuest('clean_campsite');
                  npc.setQuestState('none');
                  callbacks.closeDialog?.();
                }
              }
            ]
          };
        } else {
          return {
            text: `주변 풀숲과 계곡 근처를 잘 둘러봐! 반짝이는 캔이나 페트병이 버려져 있을 거야. (현재 수거: ${qClean.current}/${qClean.target})`,
            options: [{ text: '다 찾아서 주워올게요!', action: () => callbacks.closeDialog?.() }]
          };
        }
      } else {
        return {
          text: '안녕! 자연을 사랑하는 멋진 캠퍼구나! 캠핑장 주변에 양심 없는 사람들이 버리고 간 쓰레기 3개만 주워 분리수거해 줄래?',
          options: [
            {
              text: '클린 캠핑 작전 시작! (서브 퀘스트 수락)',
              action: () => {
                this.rpgSystem.startSideQuest('clean_campsite');
                npc.setQuestState('none');
                callbacks.closeDialog?.();
              }
            },
            {
              text: '나중에 할게요.',
              action: () => callbacks.closeDialog?.()
            }
          ]
        };
      }
    }

    // 기본 fallback
    return {
      text: `안녕하세요! 반갑습니다.`,
      options: [{ text: '안녕히 계세요.', action: () => callbacks.closeDialog?.() }]
    };
  }
}
