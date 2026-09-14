import * as THREE from 'three';
import { BaseNPC } from './NPC.js';

// ========================================================
// 1. 도토리 대장 (캠핑 안전 메인 멘토 다람쥐 수인)
// ========================================================
export class SquirrelLeaderNPC extends BaseNPC {
  constructor(scene, options = {}) {
    super(scene, {
      id: 'squirrel_leader',
      name: '도토리 대장',
      role: '캠핑 안전 수석 멘토',
      position: options.position || new THREE.Vector3(0, 0, 7.5),
      rotationY: Math.PI,
      questState: 'available',
      ...options
    });
  }

  initModel() {
    const squirrelBrown = new THREE.MeshStandardMaterial({ color: 0x965327, roughness: 0.85 });
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xf5dfb8, roughness: 0.85 });
    const darkBrown = new THREE.MeshStandardMaterial({ color: 0x542b10, roughness: 0.9 });
    const leafGreen = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 1. 몸통 (0.36 x 0.5 x 0.25)
    this.bodyInitialY = 0.8;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.25), squirrelBrown);
    this.body.position.set(0, this.bodyInitialY, 0);
    this.body.castShadow = true;

    // 배 앞면 크림색 털
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.05), creamMat);
    belly.position.set(0, -0.02, 0.12);
    this.body.add(belly);
    this.group.add(this.body);

    // 2. 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 1.25, 0);

    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, 0.38), squirrelBrown);
    headBox.castShadow = true;
    this.head.add(headBox);

    // 볼 살 (좌우 크림색)
    const leftCheek = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.16), creamMat);
    leftCheek.position.set(-0.16, -0.08, 0.12);
    const rightCheek = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.16), creamMat);
    rightCheek.position.set(0.16, -0.08, 0.12);
    this.head.add(leftCheek);
    this.head.add(rightCheek);

    // 눈 2개
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    leftEye.position.set(-0.1, 0.04, 0.2);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    rightEye.position.set(0.1, 0.04, 0.2);
    this.head.add(leftEye);
    this.head.add(rightEye);

    // 다람쥐 뾰족 귀 2개
    const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.08), darkBrown);
    leftEar.position.set(-0.14, 0.24, 0.02);
    const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.08), darkBrown);
    rightEar.position.set(0.14, 0.24, 0.02);
    this.head.add(leftEar);
    this.head.add(rightEar);

    // 도토리 캡 모자 & 나뭇잎
    const acornCap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), darkBrown);
    acornCap.position.set(0, 0.22, -0.02);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.16), leafGreen);
    leaf.position.set(0.08, 0.28, 0);
    leaf.rotation.y = 0.4;
    this.head.add(acornCap);
    this.head.add(leaf);

    this.group.add(this.head);

    // 3. 풍성한 복슬복슬 꼬리 (3단 구조)
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.65, -0.15);

    const tailBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.2), darkBrown);
    tailBase.position.set(0, 0.1, -0.1);
    tailBase.rotation.x = -0.4;

    const tailMid = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.28), squirrelBrown);
    tailMid.position.set(0, 0.35, -0.22);
    tailMid.rotation.x = -0.1;

    const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.26, 0.22), creamMat);
    tailTip.position.set(0, 0.6, -0.18);
    tailTip.rotation.x = 0.3;

    this.tail.add(tailBase);
    this.tail.add(tailMid);
    this.tail.add(tailTip);
    this.group.add(this.tail);

    // 4. 팔 (도토리 지팡이 소지)
    const armGeo = new THREE.BoxGeometry(0.12, 0.4, 0.12);
    this.leftArm = new THREE.Mesh(armGeo, squirrelBrown);
    this.leftArm.position.set(-0.26, 0.78, 0);
    this.rightArm = new THREE.Mesh(armGeo, squirrelBrown);
    this.rightArm.position.set(0.26, 0.78, 0);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    // 지팡이
    const staff = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.9, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
    );
    staff.position.set(0.3, 0.6, 0.15);
    const staffHead = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), leafGreen);
    staffHead.position.set(0.3, 1.05, 0.15);
    this.group.add(staff);
    this.group.add(staffHead);

    // 5. 다리
    const legGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
    this.leftLeg = new THREE.Mesh(legGeo, darkBrown);
    this.leftLeg.position.set(-0.1, 0.25, 0);
    this.rightLeg = new THREE.Mesh(legGeo, darkBrown);
    this.rightLeg.position.set(0.1, 0.25, 0);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
  }
}

// ========================================================
// 2. 관리소장 박 반장 (캠핑장 관리 및 안전도구 상점)
// ========================================================
export class RangerParkNPC extends BaseNPC {
  constructor(scene, options = {}) {
    super(scene, {
      id: 'ranger_park',
      name: '박 반장',
      role: '캠핑장 안전 관리소장',
      position: options.position || new THREE.Vector3(-6.5, 0, 7.0),
      rotationY: 0.6,
      hasShop: true,
      shopType: 'ranger_store',
      questState: 'available',
      ...options
    });
  }

  initModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd29972 });
    const uniformGreen = new THREE.MeshStandardMaterial({ color: 0x2e5c38 });
    const vestBrown = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const hatBrown = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x243329 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 몸통
    this.bodyInitialY = 0.95;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.62, 0.22), uniformGreen);
    this.body.position.set(0, this.bodyInitialY, 0);
    this.body.castShadow = true;

    // 안전 조끼 (앞면에 덧댐)
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.45, 0.24), vestBrown);
    vest.position.set(0, 0.05, 0);
    this.body.add(vest);

    // 무전기
    const radio = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.16, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    radio.position.set(-0.18, 0.15, 0.14);
    this.body.add(radio);

    this.group.add(this.body);

    // 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 1.48, 0);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // 콧수염
    const mustache = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    mustache.position.set(0, -0.06, 0.2);
    this.head.add(mustache);

    // 눈
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), eyeMat);
    leftEye.position.set(-0.1, 0.04, 0.2);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.02), eyeMat);
    rightEye.position.set(0.1, 0.04, 0.2);
    this.head.add(leftEye);
    this.head.add(rightEye);

    // 레인저 챙모자
    const hatBrim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.56), hatBrown);
    hatBrim.position.set(0, 0.18, 0);
    const hatTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.36), hatBrown);
    hatTop.position.set(0, 0.26, 0);
    this.head.add(hatBrim);
    this.head.add(hatTop);

    this.group.add(this.head);

    // 팔
    const armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, uniformGreen);
    this.leftArm.position.set(-0.31, 0.95, 0);
    this.rightArm = new THREE.Mesh(armGeo, uniformGreen);
    this.rightArm.position.set(0.31, 0.95, 0);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    // 다리
    const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.11, 0.3, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.11, 0.3, 0);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
  }
}

// ========================================================
// 3. 초보 캠퍼 민수 (텐트 구역 서브 퀘스트)
// ========================================================
export class CamperMinsuNPC extends BaseNPC {
  constructor(scene, options = {}) {
    super(scene, {
      id: 'camper_minsu',
      name: '초보 캠퍼 민수',
      role: '배고픈 생존자',
      position: options.position || new THREE.Vector3(3.5, 0, 4.5),
      rotationY: -1.2,
      questState: 'available',
      ...options
    });
  }

  initModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xefb890 });
    const redJacket = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
    const blueBeanie = new THREE.MeshStandardMaterial({ color: 0x2255aa });
    const jeanMat = new THREE.MeshStandardMaterial({ color: 0x334466 });
    const packMat = new THREE.MeshStandardMaterial({ color: 0x886633 });

    // 몸통
    this.bodyInitialY = 0.9;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.58, 0.22), redJacket);
    this.body.position.set(0, this.bodyInitialY, 0);

    // 등 뒤 큰 배낭
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.2), packMat);
    backpack.position.set(0, 0.04, -0.2);
    this.body.add(backpack);

    this.group.add(this.body);

    // 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 1.4, 0);
    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skinMat);
    this.head.add(headBox);

    // 비니 모자
    const beanie = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.38), blueBeanie);
    beanie.position.set(0, 0.14, 0);
    this.head.add(beanie);

    this.group.add(this.head);

    // 팔다리
    const armGeo = new THREE.BoxGeometry(0.14, 0.56, 0.14);
    this.leftArm = new THREE.Mesh(armGeo, redJacket);
    this.leftArm.position.set(-0.28, 0.9, 0);
    this.rightArm = new THREE.Mesh(armGeo, redJacket);
    this.rightArm.position.set(0.28, 0.9, 0);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    const legGeo = new THREE.BoxGeometry(0.16, 0.58, 0.16);
    this.leftLeg = new THREE.Mesh(legGeo, jeanMat);
    this.leftLeg.position.set(-0.1, 0.29, 0);
    this.rightLeg = new THREE.Mesh(legGeo, jeanMat);
    this.rightLeg.position.set(0.1, 0.29, 0);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
  }
}

// ========================================================
// 4. 방랑 요리사 쿠킹 밥 (캠핑 푸드 & 스태미나 버프 상점)
// ========================================================
export class ChefBobNPC extends BaseNPC {
  constructor(scene, options = {}) {
    super(scene, {
      id: 'chef_bob',
      name: '쿠킹 밥',
      role: '캠핑 마스터 셰프',
      position: options.position || new THREE.Vector3(5.8, 0, -1.8),
      rotationY: -2.3,
      hasShop: true,
      shopType: 'food_store',
      questState: 'none',
      ...options
    });
  }

  initModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd8956f });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdd2222 });
    const apronBlue = new THREE.MeshStandardMaterial({ color: 0x1e3a5f });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    // 몸통
    this.bodyInitialY = 0.92;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.6, 0.24), whiteMat);
    this.body.position.set(0, this.bodyInitialY, 0);

    // 빨간 스카프
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.26), redMat);
    scarf.position.set(0, 0.28, 0);
    this.body.add(scarf);

    // 파란 앞치마
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.04), apronBlue);
    apron.position.set(0, -0.08, 0.13);
    this.body.add(apron);

    this.group.add(this.body);

    // 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 1.45, 0);
    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), skinMat);
    this.head.add(headBox);

    // 턱수염
    const beard = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.12, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x442211 })
    );
    beard.position.set(0, -0.14, 0.18);
    this.head.add(beard);

    // 높은 요리사 모자
    const chefHatBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.36), whiteMat);
    chefHatBase.position.set(0, 0.2, 0);
    const chefHatPuff = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.46), whiteMat);
    chefHatPuff.position.set(0, 0.36, 0);
    this.head.add(chefHatBase);
    this.head.add(chefHatPuff);

    this.group.add(this.head);

    // 오른손에 황금 프라이팬
    const armGeo = new THREE.BoxGeometry(0.14, 0.58, 0.14);
    this.leftArm = new THREE.Mesh(armGeo, whiteMat);
    this.leftArm.position.set(-0.3, 0.92, 0);
    this.rightArm = new THREE.Mesh(armGeo, whiteMat);
    this.rightArm.position.set(0.3, 0.92, 0);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    const panHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.25, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    panHandle.position.set(0.32, 0.65, 0.15);
    const panBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.6, roughness: 0.3 })
    );
    panBody.position.set(0.32, 0.58, 0.3);
    panBody.rotation.x = Math.PI / 2;
    this.group.add(panHandle);
    this.group.add(panBody);

    // 다리
    const legGeo = new THREE.BoxGeometry(0.17, 0.6, 0.17);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.11, 0.3, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.11, 0.3, 0);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
  }
}

// ========================================================
// 5. 숲의 생태 보호원 아린 (클린 캠핑 서브 퀘스트)
// ========================================================
export class RangerArinNPC extends BaseNPC {
  constructor(scene, options = {}) {
    super(scene, {
      id: 'ranger_arin',
      name: '아린',
      role: '에코 레인저 & 자연 지킴이',
      position: options.position || new THREE.Vector3(-4.0, 0, -4.5),
      rotationY: 0.8,
      questState: 'available',
      ...options
    });
  }

  initModel() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf3c7a2 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x9bc53d });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x6a381f });
    const hatStraw = new THREE.MeshStandardMaterial({ color: 0xdfba73, roughness: 0.9 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a4e4d });

    // 몸통
    this.bodyInitialY = 0.88;
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.56, 0.2), shirtMat);
    this.body.position.set(0, this.bodyInitialY, 0);
    this.group.add(this.body);

    // 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 1.38, 0);
    const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), skinMat);
    this.head.add(headBox);

    // 갈색 양갈래 머리
    const hairL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), hairMat);
    hairL.position.set(-0.2, -0.05, -0.05);
    const hairR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), hairMat);
    hairR.position.set(0.2, -0.05, -0.05);
    this.head.add(hairL);
    this.head.add(hairR);

    // 밀짚 챙모자
    const strawHat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.56), hatStraw);
    strawHat.position.set(0, 0.18, 0);
    this.head.add(strawHat);

    this.group.add(this.head);

    // 팔다리
    const armGeo = new THREE.BoxGeometry(0.13, 0.54, 0.13);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.26, 0.88, 0);
    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.26, 0.88, 0);
    this.group.add(this.leftArm);
    this.group.add(this.rightArm);

    const legGeo = new THREE.BoxGeometry(0.15, 0.56, 0.15);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.09, 0.28, 0);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.09, 0.28, 0);
    this.group.add(this.leftLeg);
    this.group.add(this.rightLeg);
  }
}

// ========================================================
// 6. 숲속 야생동물: 복셀 토끼 (Rabbit)
// ========================================================
export class RabbitEntity {
  constructor(scene, x, z) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, 0, z);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.animTime = Math.random() * 5;
    this.hopCooldown = 1.0 + Math.random() * 2.0;
    this.isHopping = false;
    this.hopProgress = 0;
    this.hopDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

    this.createModel();
    this.scene.add(this.group);
  }

  createModel() {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.9 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffa0b0 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x992222 });

    // 몸통
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.32), whiteMat);
    this.body.position.set(0, 0.14, 0);
    this.group.add(this.body);

    // 머리
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), whiteMat);
    this.head.position.set(0, 0.25, 0.14);

    // 긴 귀 2개
    const earGeo = new THREE.BoxGeometry(0.05, 0.2, 0.03);
    const leftEar = new THREE.Mesh(earGeo, pinkMat);
    leftEar.position.set(-0.05, 0.16, -0.02);
    const rightEar = new THREE.Mesh(earGeo, pinkMat);
    rightEar.position.set(0.05, 0.16, -0.02);
    this.head.add(leftEar);
    this.head.add(rightEar);

    // 눈 2개
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), eyeMat);
    leftEye.position.set(-0.09, 0.02, 0.06);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), eyeMat);
    rightEye.position.set(0.09, 0.02, 0.06);
    this.head.add(leftEye);
    this.head.add(rightEye);

    this.group.add(this.head);

    // 꼬리
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), whiteMat);
    tail.position.set(0, 0.15, -0.18);
    this.group.add(tail);
  }

  update(delta) {
    this.animTime += delta;
    this.hopCooldown -= delta;

    if (this.hopCooldown <= 0 && !this.isHopping) {
      this.isHopping = true;
      this.hopProgress = 0;
      this.hopCooldown = 1.2 + Math.random() * 2.5;
      this.hopDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      this.group.rotation.y = Math.atan2(this.hopDir.x, this.hopDir.z);
    }

    if (this.isHopping) {
      this.hopProgress += delta * 3.5;
      if (this.hopProgress >= Math.PI) {
        this.isHopping = false;
        this.group.position.y = 0;
      } else {
        this.group.position.y = Math.sin(this.hopProgress) * 0.25;
        this.group.position.addScaledVector(this.hopDir, delta * 1.6);
      }
    }
  }
}

// ========================================================
// 7. 캠핑장 마스코트 순둥이 시바견 (Camp Dog)
// ========================================================
export class CampDogEntity {
  constructor(scene, x, z) {
    this.scene = scene;
    this.position = new THREE.Vector3(x, 0, z);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.animTime = 0;
    this.createModel();
    this.scene.add(this.group);
  }

  createModel() {
    const shibaBrown = new THREE.MeshStandardMaterial({ color: 0xc67d39 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const redCollar = new THREE.MeshStandardMaterial({ color: 0xee2222 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 몸통
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.55), shibaBrown);
    this.body.position.set(0, 0.32, 0);

    const chestWhite = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.1), whiteMat);
    chestWhite.position.set(0, -0.04, 0.25);
    this.body.add(chestWhite);

    // 빨간 목줄
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.28), redCollar);
    collar.position.set(0, 0.12, 0.25);
    this.body.add(collar);

    this.group.add(this.body);

    // 머리
    this.head = new THREE.Group();
    this.head.position.set(0, 0.54, 0.32);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), shibaBrown);
    this.head.add(headMesh);

    // 주둥이
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.16), whiteMat);
    snout.position.set(0, -0.05, 0.16);
    this.head.add(snout);

    // 삼각 귀 2개
    const earGeo = new THREE.BoxGeometry(0.08, 0.1, 0.04);
    const leftEar = new THREE.Mesh(earGeo, shibaBrown);
    leftEar.position.set(-0.1, 0.16, -0.04);
    const rightEar = new THREE.Mesh(earGeo, shibaBrown);
    rightEar.position.set(0.1, 0.16, -0.04);
    this.head.add(leftEar);
    this.head.add(rightEar);

    // 눈 2개
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), eyeMat);
    leftEye.position.set(-0.08, 0.04, 0.14);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), eyeMat);
    rightEye.position.set(0.08, 0.04, 0.14);
    this.head.add(leftEye);
    this.head.add(rightEye);

    this.group.add(this.head);

    // 살랑거리는 꼬리
    this.tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), shibaBrown);
    this.tail.position.set(0, 0.45, -0.3);
    this.tail.rotation.x = 0.5;
    this.group.add(this.tail);

    // 네 다리
    const legGeo = new THREE.BoxGeometry(0.1, 0.26, 0.1);
    this.legs = [];
    [
      [-0.1, 0.13, 0.18],
      [0.1, 0.13, 0.18],
      [-0.1, 0.13, -0.18],
      [0.1, 0.13, -0.18]
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, whiteMat);
      leg.position.set(lx, ly, lz);
      this.group.add(leg);
      this.legs.push(leg);
    });
  }

  update(delta, playerPosition) {
    this.animTime += delta;

    // 꼬리 살랑살랑
    if (this.tail) {
      this.tail.rotation.z = Math.sin(this.animTime * 12) * 0.35;
    }

    // 플레이어 바라보기
    if (playerPosition && this.head) {
      const dist = this.group.position.distanceTo(playerPosition);
      if (dist < 5.0) {
        const angle = Math.atan2(playerPosition.x - this.group.position.x, playerPosition.z - this.group.position.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, 0.05);
      }
    }
  }
}
