import { sounds } from '../audio/SoundManager.js';

export class SafetyGauge {
  constructor() {
    this.score = 25; // 시작 점수 (캠핑장에 위험요소 가득)
    this.maxScore = 100;

    // 위험 인자 (0 ~ 100%)
    this.coDanger = 85;      // 텐트 내 일산화탄소 위험
    this.fireDanger = 70;    // 과대불판 및 잔불 위험
    this.tripDanger = 60;    // 야간 스트링 발걸림 위험
    this.wildlifeDanger = 65;// 음식물 방치 야생동물 위험

    this.alarmCooldown = 0;
  }

  addScore(amount) {
    this.score = Math.min(this.maxScore, this.score + amount);
  }

  update(delta, playerPos, campingObjects) {
    // 텐트 중심 위치: (2, -2)
    const distToTent = Math.hypot(playerPos.x - 2, playerPos.z - (-2));
    const isInsideTent = distToTent < 1.4 && playerPos.y < 1.6;

    // 텐트 안 난로가 아직 있고, 플레이어가 텐트 안에 있으면 CO 위험 경고!
    if (campingObjects.isHeaterInsideTent) {
      if (isInsideTent) {
        this.coDanger = Math.min(100, this.coDanger + delta * 15);
        this.alarmCooldown -= delta;
        if (this.alarmCooldown <= 0) {
          sounds.playAlarm();
          this.alarmCooldown = 1.8;
        }
      }
    } else {
      // 난로를 밖으로 꺼냈으면 환기창과 경보기에 따라 급속 감소
      let reductionRate = 20;
      if (campingObjects.isVentOpen) reductionRate += 30;
      if (campingObjects.coDetector.visible) reductionRate += 30;
      this.coDanger = Math.max(0, this.coDanger - delta * reductionRate);
    }

    // 화재 위험
    if (campingObjects.isCampfireExtinguished && campingObjects.isOverheatingPanFixed) {
      this.fireDanger = 0;
    }

    // 발걸림 위험
    const glowCount = campingObjects.strings.filter(s => s.glowGuard.visible).length;
    this.tripDanger = Math.max(0, 60 - glowCount * 15);

    // 야생동물 위험
    if (campingObjects.isFoodPackedInCooler) {
      this.wildlifeDanger = 0;
    }
  }

  getTotalSafetyPercent() {
    return Math.round(this.score);
  }
}
