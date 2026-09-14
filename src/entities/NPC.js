import * as THREE from 'three';

export class BaseNPC {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.id = options.id || 'npc_' + Math.random().toString(36).substr(2, 6);
    this.name = options.name || '주민';
    this.role = options.role || '캠핑장 이웃';
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.rotationY = options.rotationY || 0;
    this.dialogueKey = options.dialogueKey || this.id;
    this.hasShop = !!options.hasShop;
    this.shopType = options.shopType || null;

    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotationY;

    this.animTime = Math.random() * 10;
    this.walkSpeed = options.walkSpeed || 0;
    this.patrolPoints = options.patrolPoints || null;
    this.patrolIndex = 0;

    this.questState = options.questState || 'none'; // 'available'(!), 'in_progress'(?), 'completed'(gold ?)

    this.initModel();
    this.initNameplate();
    this.initQuestMarker();

    this.scene.add(this.group);
  }

  initModel() {
    // 자식 클래스에서 오버라이드하여 독창적 복셀 조립
  }

  // 3D 캔버스 텍스처 네임태그 빌보드
  initNameplate() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // 반투명 다크 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.roundRect(8, 8, 240, 64, 8);
    ctx.fill();
    ctx.strokeStyle = '#c98847';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 역할 (소제목)
    ctx.font = 'bold 18px Consolas, monospace, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.fillText(`[${this.role}]`, 128, 34);

    // 이름 (본문)
    ctx.font = 'bold 24px Consolas, monospace, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 128, 62);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    this.nameplateSprite = new THREE.Sprite(spriteMat);
    this.nameplateSprite.scale.set(1.6, 0.5, 1.0);
    this.nameplateSprite.position.set(0, 2.1, 0);
    this.group.add(this.nameplateSprite);
  }

  // 머리 위 3D 회전 퀘스트 마커 (! / ?)
  initQuestMarker() {
    this.markerGroup = new THREE.Group();
    this.markerGroup.position.set(0, 2.55, 0);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffbb00,
      emissive: 0xaa7700,
      roughness: 0.3
    });

    // 느낌표 (!) 모델
    this.exclamationMesh = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), goldMat);
    bar.position.set(0, 0.1, 0);
    bar.castShadow = true;
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), goldMat);
    dot.position.set(0, -0.2, 0);
    dot.castShadow = true;
    this.exclamationMesh.add(bar);
    this.exclamationMesh.add(dot);
    this.markerGroup.add(this.exclamationMesh);

    this.group.add(this.markerGroup);
    this.updateQuestMarker();
  }

  setQuestState(state) {
    this.questState = state;
    this.updateQuestMarker();
  }

  updateQuestMarker() {
    if (!this.markerGroup) return;
    if (this.questState === 'available') {
      this.markerGroup.visible = true;
      this.exclamationMesh.visible = true;
    } else {
      this.markerGroup.visible = false;
    }
  }

  update(delta, playerPosition) {
    this.animTime += delta;

    // 1. 머리 위 마커 회전 및 위아래 바운스
    if (this.markerGroup && this.markerGroup.visible) {
      this.markerGroup.rotation.y += delta * 2.5;
      this.markerGroup.position.y = 2.55 + Math.sin(this.animTime * 3) * 0.08;
    }

    // 2. 플레이어와의 거리 계산 및 시선 추적
    const distToPlayer = this.group.position.distanceTo(playerPosition);
    if (distToPlayer < 7.0 && this.head) {
      // 플레이어를 부드럽게 바라봄
      const targetPos = new THREE.Vector3(playerPosition.x, this.head.position.y + this.group.position.y, playerPosition.z);
      const lookMat = new THREE.Matrix4();
      lookMat.lookAt(targetPos, this.group.position, new THREE.Vector3(0, 1, 0));
      const targetEuler = new THREE.Euler().setFromRotationMatrix(lookMat, 'YXZ');
      
      const localYaw = targetEuler.y - this.group.rotation.y;
      this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, Math.max(-1.0, Math.min(1.0, localYaw)), 0.1);
    } else if (this.head) {
      this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0, 0.05);
    }

    // 3. Idle 호흡 애니메이션
    if (this.body) {
      this.body.position.y = this.bodyInitialY + Math.sin(this.animTime * 2.5) * 0.02;
    }

    // 4. 순찰 경로가 있으면 이동
    if (this.patrolPoints && this.patrolPoints.length > 1 && distToPlayer >= 4.0) {
      this.updatePatrol(delta);
    }
  }

  updatePatrol(delta) {
    const target = this.patrolPoints[this.patrolIndex];
    const dir = new THREE.Vector3().subVectors(target, this.group.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 0.3) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPoints.length;
    } else {
      dir.normalize();
      this.group.position.addScaledVector(dir, this.walkSpeed * delta);
      const angle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, 0.1);

      // 걷기 애니메이션 (팔다리 스윙)
      if (this.leftLeg && this.rightLeg && this.leftArm && this.rightArm) {
        const legSwing = Math.sin(this.animTime * 8) * 0.4;
        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;
        this.leftArm.rotation.x = -legSwing;
        this.rightArm.rotation.x = legSwing;
      }
    }
  }
}
