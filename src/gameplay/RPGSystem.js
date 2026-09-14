import { sounds } from '../audio/SoundManager.js';

export class RPGSystem {
  constructor() {
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 100;
    this.acorns = 120; // 시작 지원금 120 도토리

    this.titles = [
      { level: 1, name: '🌱 캠핑 입문자' },
      { level: 2, name: '🔥 불꽃 감시원' },
      { level: 3, name: '🌲 숲의 수호자' },
      { level: 4, name: '🛡️ 안전 마스터' },
      { level: 5, name: '👑 전설의 캠핑 히어로' }
    ];

    // 버프 시스템: { key: { name, icon, duration, maxDuration, apply: fn, remove: fn } }
    this.buffs = new Map();

    // 서브 퀘스트 목록
    this.sideQuests = [
      {
        id: 'gather_firewood',
        npcId: 'ranger_park',
        title: '🌲 박 반장의 안전 장작 비축',
        desc: '젖은 나무 대신 잘 마른 원목 블록을 3개 채굴하여 가져다주세요.',
        current: 0,
        target: 3,
        itemRequired: 'oak_log',
        rewardXp: 80,
        rewardAcorns: 60,
        completed: false,
        active: false
      },
      {
        id: 'deliver_snack',
        npcId: 'camper_minsu',
        title: '🌽 배고픈 초보 캠퍼 민수의 구원',
        desc: '모닥불 주변 테이블에서 맛있는 [구운 옥수수]를 챙겨 민수에게 전달하세요.',
        current: 0,
        target: 1,
        rewardXp: 70,
        rewardAcorns: 50,
        completed: false,
        active: false
      },
      {
        id: 'clean_campsite',
        npcId: 'ranger_arin',
        title: '🧹 아린의 에코 클린 캠핑 작전',
        desc: '캠핑장 숲길 주변에 흩어진 쓰레기(캔/페트병) 3개를 찾아 깨끗이 수거하세요.',
        current: 0,
        target: 3,
        rewardXp: 120,
        rewardAcorns: 80,
        completed: false,
        active: false
      }
    ];

    // 쓰레기 오브젝트 위치들 (월드에 배치)
    this.litterItems = [
      { id: 'litter_1', name: '버려진 알루미늄 캔', x: 2.5, y: 0.1, z: 8.5, collected: false },
      { id: 'litter_2', name: '버려진 플라스틱 페트병', x: -7.0, y: 0.1, z: -3.0, collected: false },
      { id: 'litter_3', name: '구겨진 과자 비닐봉지', x: 9.0, y: 0.1, z: -6.0, collected: false }
    ];

    this.listeners = {
      onLevelUp: [],
      onXPChange: [],
      onAcornChange: [],
      onBuffChange: [],
      onQuestUpdate: []
    };
  }

  getTitle() {
    for (let i = this.titles.length - 1; i >= 0; i--) {
      if (this.level >= this.titles[i].level) {
        return this.titles[i].name;
      }
    }
    return this.titles[0].name;
  }

  addXP(amount) {
    this.xp += amount;
    this.trigger('onXPChange', { xp: this.xp, xpToNext: this.xpToNext });

    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.5);
      sounds.playLevelUp();
      this.trigger('onLevelUp', { level: this.level, title: this.getTitle() });
      this.trigger('onXPChange', { xp: this.xp, xpToNext: this.xpToNext });
    }
  }

  addAcorns(amount) {
    this.acorns += amount;
    sounds.playCoin();
    this.trigger('onAcornChange', this.acorns);
  }

  spendAcorns(amount) {
    if (this.acorns >= amount) {
      this.acorns -= amount;
      sounds.playCoin();
      this.trigger('onAcornChange', this.acorns);
      return true;
    }
    sounds.playBuzzer();
    return false;
  }

  applyBuff(buffId, name, icon, durationSeconds, onStart, onEnd) {
    if (this.buffs.has(buffId)) {
      const existing = this.buffs.get(buffId);
      existing.duration = Math.max(existing.duration, durationSeconds);
      existing.maxDuration = Math.max(existing.maxDuration, durationSeconds);
    } else {
      const buff = {
        id: buffId,
        name,
        icon,
        duration: durationSeconds,
        maxDuration: durationSeconds,
        onEnd
      };
      this.buffs.set(buffId, buff);
      if (onStart) onStart();
    }
    this.trigger('onBuffChange', Array.from(this.buffs.values()));
  }

  hasBuff(buffId) {
    return this.buffs.has(buffId);
  }

  update(delta) {
    let changed = false;
    for (const [key, buff] of this.buffs.entries()) {
      buff.duration -= delta;
      if (buff.duration <= 0) {
        if (buff.onEnd) buff.onEnd();
        this.buffs.delete(key);
        changed = true;
      }
    }
    if (changed) {
      this.trigger('onBuffChange', Array.from(this.buffs.values()));
    }
  }

  getSideQuest(id) {
    return this.sideQuests.find(q => q.id === id);
  }

  startSideQuest(id) {
    const q = this.getSideQuest(id);
    if (q && !q.active && !q.completed) {
      q.active = true;
      sounds.playQuestAccept();
      this.trigger('onQuestUpdate', q);
      return true;
    }
    return false;
  }

  progressSideQuest(id, amount = 1) {
    const q = this.getSideQuest(id);
    if (q && q.active && !q.completed) {
      q.current = Math.min(q.target, q.current + amount);
      this.trigger('onQuestUpdate', q);
      return q.current >= q.target;
    }
    return false;
  }

  completeSideQuest(id) {
    const q = this.getSideQuest(id);
    if (q && q.active && !q.completed) {
      q.completed = true;
      q.active = false;
      sounds.playQuestComplete();
      this.addXP(q.rewardXp);
      this.addAcorns(q.rewardAcorns);
      this.trigger('onQuestUpdate', q);
      return true;
    }
    return false;
  }

  on(event, fn) {
    if (this.listeners[event]) {
      this.listeners[event].push(fn);
    }
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data));
    }
  }
}
