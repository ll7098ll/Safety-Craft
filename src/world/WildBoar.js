import * as THREE from 'three';
import { sounds } from '../audio/SoundManager.js';

export class WildBoar {
  constructor(scene) {
    this.scene = scene;
    this.state = 'hidden'; // 'hidden', 'approaching', 'patrol', 'scared', 'fled'
    this.position = new THREE.Vector3(12, 0, 8); // 숲 가장자리 시작
    this.target = new THREE.Vector3(4.5, 0, 0); // 테이블 음식 냄새를 맡고 접근
    this.speed = 2.0;
    this.animTime = 0;
    this.gruntTimer = 0;

    this.createBoarModel();
  }

  createBoarModel() {
    this.mesh = new THREE.Group();

    const brownMat = new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.9 });
    const darkBrownMat = new THREE.MeshStandardMaterial({ color: 0x2e180d, roughness: 0.9 });
    const snoutMat = new THREE.MeshStandardMaterial({ color: 0x8a5238 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 몸통 (0.8 x 0.6 x 1.1 m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.1), brownMat);
    body.position.set(0, 0.55, 0);
    body.castShadow = true;
    this.mesh.add(body);

    // 등 갈기
    const mane = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.9), darkBrownMat);
    mane.position.set(0, 0.9, 0);
    this.mesh.add(mane);

    // 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 0.65, 0.65);

    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), brownMat);
    headBox.castShadow = true;
    this.head.add(headBox);

    // 주둥이
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.3), snoutMat);
    snout.position.set(0, -0.1, 0.3);
    this.head.add(snout);

    // 송곳니 2개
    const leftTusk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), tuskMat);
    leftTusk.position.set(-0.16, 0.0, 0.32);
    leftTusk.rotation.x = -0.3;
    const rightTusk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), tuskMat);
    rightTusk.position.set(0.16, 0.0, 0.32);
    rightTusk.rotation.x = -0.3;
    this.head.add(leftTusk);
    this.head.add(rightTusk);

    // 눈 2개
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    leftEye.position.set(-0.18, 0.12, 0.26);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    rightEye.position.set(0.18, 0.12, 0.26);
    this.head.add(leftEye);
    this.head.add(rightEye);

    this.mesh.add(this.head);

    // 네 다리 (앞왼, 앞오른, 뒤왼, 뒤오른)
    const legGeo = new THREE.BoxGeometry(0.2, 0.35, 0.2);
    this.legs = [];

    const legPositions = [
      [-0.28, 0.175, 0.35],
      [0.28, 0.175, 0.35],
      [-0.28, 0.175, -0.35],
      [0.28, 0.175, -0.35]
    ];

    legPositions.forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, darkBrownMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      this.mesh.add(leg);
      this.legs.push(leg);
    });

    this.mesh.position.copy(this.position);
    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  spawn() {
    this.state = 'approaching';
    this.position.set(11, 0, 7);
    this.mesh.position.copy(this.position);
    this.mesh.visible = true;
  }

  scareAway() {
    if (this.state === 'approaching' || this.state === 'patrol') {
      this.state = 'scared';
      this.target = new THREE.Vector3(15, 0, 15); // 숲 밖으로 도주
      this.speed = 5.5; // 전력 질주
    }
  }

  update(delta) {
    if (this.state === 'hidden' || this.state === 'fled') return;

    this.animTime += delta * (this.state === 'scared' ? 18 : 8);

    // 다리 교차 보행 애니메이션
    const swing = Math.sin(this.animTime) * 0.5;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.legs[2].rotation.x = -swing;
    this.legs[3].rotation.x = swing;

    // 머리 까딱이기
    this.head.rotation.x = Math.sin(this.animTime * 0.5) * 0.1;

    // 이동 처리
    const dir = this.target.clone().sub(this.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist > 0.4) {
      dir.normalize();
      this.position.addScaledVector(dir, this.speed * delta);
      this.mesh.position.copy(this.position);

      // 이동 방향으로 멧돼지 몸체 회전
      const angle = Math.atan2(dir.x, dir.z);
      this.mesh.rotation.y = angle;
    } else {
      if (this.state === 'approaching') {
        this.state = 'patrol';
        this.target.set(5.5, 0, 1.5); // 테이블 주변 어슬렁거리기
      } else if (this.state === 'scared') {
        this.state = 'fled';
        this.mesh.visible = false;
      }
    }
  }
}
