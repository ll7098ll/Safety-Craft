import * as THREE from 'three';
import { textures } from './Textures.js';

export class CampingObjects {
  constructor(scene) {
    this.scene = scene;
    this.items = {};
    this.particles = [];
    this.interactiveObjects = [];

    this.materials = {
      wood: textures.createMaterial('wood_plank'),
      log: textures.createMaterial('wood_log'),
      metal: textures.createMaterial('stone'),
      tent_red: textures.createMaterial('tent_red', { doubleSide: true }),
      tent_blue: textures.createMaterial('tent_blue', { doubleSide: true }),
      tarp: textures.createMaterial('tarp_khaki', { doubleSide: true }),
      tent_dark: textures.createMaterial('tent_dark', { doubleSide: true }),
      deck: textures.createMaterial('deck_wood'),
      bridge_wood: textures.createMaterial('bridge_wood'),
      glow: new THREE.MeshBasicMaterial({ color: 0x55ff00 }),
      dark_string: new THREE.MeshBasicMaterial({ color: 0x333333 }),
      co_detector: textures.createMaterial('co_detector'),
      fire_extinguisher: textures.createMaterial('fire_extinguisher'),
      meat: new THREE.MeshStandardMaterial({ color: 0xcc3333 }),
      box_cooler: new THREE.MeshStandardMaterial({ color: 0x2288dd, roughness: 0.4 }),
      trash_bag: new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.8 }),
      fire: new THREE.MeshBasicMaterial({ color: 0xff6600 }),
      charcoal: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }),
      garland_bulb: new THREE.MeshBasicMaterial({ color: 0xffe277 }),
      pole_metal: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 }),
      chair_canvas: textures.createMaterial('tarp_khaki'),
      mug_steel: new THREE.MeshStandardMaterial({ color: 0xddeeff, metalness: 0.9, roughness: 0.2 }),
      cobble: textures.createMaterial('cobblestone')
    };

    this.initCampObjects();
  }

  initCampObjects() {
    // 1. 메인 럭셔리 대형 거실형 텐트 + 데크 + 타프 + 감성 조명
    this.createTent(2, 0, -2);

    // 2. 피크닉 테이블 & 의자 (x: 4.8, z: 0.5)
    this.createPicnicTable(4.8, 0, 0.5);

    // 3. 아이스박스 & 쓰레기 분리수거대 (x: 3.5, z: 1.5)
    this.createCoolerAndTrash(3.5, 0, 1.5);

    // 4. 텐트 내부의 위험한 숯불 화로 (미션 3 대상)
    this.createDangerousTentHeater(2, 0.2, -2);

    // 5. 바깥 야외 바비큐존 및 과대불판 가스버너 & 화로대 (미션 4 대상)
    this.createBBQArea(5, 0, -2.5);

    // 6. 소화기 비치대
    this.createFireExtinguisher(3.8, 0, -1.8);

    // 7. 계곡 건너편 부시크래프트 솔로 캠프 (x: -24, z: 1)
    this.createSoloCamp(-24, 0, 1);
  }

  // 대형 거실형 투룸 텐트 + 캠핑 데크 + 대형 타프 차양막 + 가랜드 조명
  createTent(x, y, z) {
    const tentGroup = new THREE.Group();
    tentGroup.position.set(x, y, z);

    // ==========================================
    // A. 원목 캠핑 데크 바닥 (5.4m x 6.4m, 높이 0.16m)
    // ==========================================
    const deckWidth = 5.4;
    const deckLength = 6.4;
    const deckHeight = 0.16;
    const deckMesh = new THREE.Mesh(
      new THREE.BoxGeometry(deckWidth, deckHeight, deckLength),
      this.materials.deck
    );
    deckMesh.position.set(0, deckHeight / 2, 0.8);
    deckMesh.receiveShadow = true;
    tentGroup.add(deckMesh);

    // 데크 테두리 원목 마감 몰딩 (외곽 4변)
    const borderMat = this.materials.log;
    const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, deckLength), borderMat);
    leftBorder.position.set(-deckWidth / 2, deckHeight / 2 + 0.02, 0.8);
    tentGroup.add(leftBorder);

    const rightBorder = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, deckLength), borderMat);
    rightBorder.position.set(deckWidth / 2, deckHeight / 2 + 0.02, 0.8);
    tentGroup.add(rightBorder);

    const frontBorder = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, 0.2, 0.18), borderMat);
    frontBorder.position.set(0, deckHeight / 2 + 0.02, 0.8 + deckLength / 2);
    tentGroup.add(frontBorder);

    const backBorder = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, 0.2, 0.18), borderMat);
    backBorder.position.set(0, deckHeight / 2 + 0.02, 0.8 - deckLength / 2);
    tentGroup.add(backBorder);

    // ==========================================
    // B. 대형 투룸 캐빈 텐트 (침실룸 + 전실 리빙룸)
    // ==========================================
    const tentWidth = 3.2;
    const tentDepth = 3.2;
    const tentH = 2.1;
    const tentCenterZ = -0.8;

    // 텐트 바닥 방수포 (데크 위)
    const tentFloor = new THREE.Mesh(
      new THREE.BoxGeometry(tentWidth, 0.04, tentDepth),
      this.materials.tent_blue
    );
    tentFloor.position.set(0, deckHeight + 0.02, tentCenterZ);
    tentGroup.add(tentFloor);

    // 텐트 지붕 (박공 지붕 / A-프레임 캐빈형)
    const roofThick = 0.06;
    const roofLen = tentDepth;
    const roofHalfW = 1.95;

    // 좌측 지붕 슬로프
    const leftRoof = new THREE.Mesh(
      new THREE.BoxGeometry(roofHalfW, roofThick, roofLen),
      this.materials.tarp
    );
    leftRoof.position.set(-0.85, deckHeight + 1.25, tentCenterZ);
    leftRoof.rotation.z = 0.65;
    leftRoof.castShadow = true;
    tentGroup.add(leftRoof);

    // 우측 지붕 슬로프
    const rightRoof = new THREE.Mesh(
      new THREE.BoxGeometry(roofHalfW, roofThick, roofLen),
      this.materials.tarp
    );
    rightRoof.position.set(0.85, deckHeight + 1.25, tentCenterZ);
    rightRoof.rotation.z = -0.65;
    rightRoof.castShadow = true;
    tentGroup.add(rightRoof);

    // 중앙 용마루 빔 (Ridge Pole)
    const ridgeBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, roofLen, 8),
      this.materials.pole_metal
    );
    ridgeBeam.position.set(0, deckHeight + tentH, tentCenterZ);
    ridgeBeam.rotation.x = Math.PI / 2;
    tentGroup.add(ridgeBeam);

    // 텐트 수직 하부 측벽 (Dark Olive 캔버스)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.85, tentDepth),
      this.materials.tent_dark
    );
    leftWall.position.set(-tentWidth / 2, deckHeight + 0.425, tentCenterZ);
    tentGroup.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.85, tentDepth),
      this.materials.tent_dark
    );
    rightWall.position.set(tentWidth / 2, deckHeight + 0.425, tentCenterZ);
    tentGroup.add(rightWall);

    // 텐트 뒷벽 (z = -1.5 relative to tentGroup, world z = -3.5)
    // 퀘스트매니저에서 ventPos = (2, 1.6, -3.5) 로 체크함!
    const backWallGeom = new THREE.BufferGeometry();
    const bW = tentWidth / 2;
    const bH = tentH;
    const backVertices = new Float32Array([
      -bW, deckHeight, -1.5,
       bW, deckHeight, -1.5,
       0.0, deckHeight + bH, -1.5,

      -bW, deckHeight, -1.5,
      -bW, deckHeight + 0.85, -1.5,
       0.0, deckHeight + bH, -1.5,

       bW, deckHeight, -1.5,
       0.0, deckHeight + bH, -1.5,
       bW, deckHeight + 0.85, -1.5
    ]);
    backWallGeom.setAttribute('position', new THREE.BufferAttribute(backVertices, 3));
    backWallGeom.computeVertexNormals();
    const backWall = new THREE.Mesh(backWallGeom, this.materials.tent_dark);
    tentGroup.add(backWall);

    // 후면 환기창 벤틸레이션 (미션 3 환기창 열기 대상: z = -1.52)
    const ventWindow = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 })
    );
    ventWindow.position.set(0, 1.6, -1.52);
    tentGroup.add(ventWindow);
    this.ventWindow = ventWindow;
    this.isVentOpen = false;

    // 텐트 내부 천장 중앙 CO 경보기 (미션 3 설치 대상)
    const coDetector = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.25, 0.08),
      this.materials.co_detector
    );
    coDetector.position.set(0, 1.5, -0.4);
    coDetector.visible = false;
    tentGroup.add(coDetector);
    this.coDetector = coDetector;

    // 텐트 내부 침실 매트 & 침낭 & 베개
    const bedMat1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.08, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x2b5b84, roughness: 0.6 })
    );
    bedMat1.position.set(-0.6, deckHeight + 0.06, -0.9);
    tentGroup.add(bedMat1);

    const bedMat2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.08, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x3d6b4f, roughness: 0.6 })
    );
    bedMat2.position.set(0.6, deckHeight + 0.06, -0.9);
    tentGroup.add(bedMat2);

    // 베개 2개
    [-0.6, 0.6].forEach(px => {
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.08, 0.35),
        new THREE.MeshStandardMaterial({ color: 0xeee8d5, roughness: 0.5 })
      );
      pillow.position.set(px, deckHeight + 0.12, -1.4);
      tentGroup.add(pillow);
    });

    // 텐트 앞쪽 개방형 출입구 (양옆 묶여있는 커튼 플랩)
    const flapMat = this.materials.tarp;
    const leftFlap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.1), flapMat);
    leftFlap.position.set(-1.1, deckHeight + 0.6, 0.1);
    tentGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.1), flapMat);
    rightFlap.position.set(1.1, deckHeight + 0.6, 0.1);
    tentGroup.add(rightFlap);

    // ==========================================
    // C. 전면 대형 헥사 타프 차양막 (Tarp Canopy)
    // ==========================================
    const tarpLength = 3.2;
    const tarpWingW = 2.2;

    // 좌측 타프 윙
    const leftTarpWing = new THREE.Mesh(
      new THREE.BoxGeometry(tarpWingW, 0.03, tarpLength),
      this.materials.tarp
    );
    leftTarpWing.position.set(-1.0, deckHeight + 1.8, 1.7);
    leftTarpWing.rotation.z = 0.35;
    leftTarpWing.castShadow = true;
    tentGroup.add(leftTarpWing);

    // 우측 타프 윙
    const rightTarpWing = new THREE.Mesh(
      new THREE.BoxGeometry(tarpWingW, 0.03, tarpLength),
      this.materials.tarp
    );
    rightTarpWing.position.set(1.0, deckHeight + 1.8, 1.7);
    rightTarpWing.rotation.z = -0.35;
    rightTarpWing.castShadow = true;
    tentGroup.add(rightTarpWing);

    // 타프 앞쪽 지지 메인 알루미늄 폴대 2개
    const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.3, 10);
    const leftPole = new THREE.Mesh(poleGeom, this.materials.pole_metal);
    leftPole.position.set(-1.1, deckHeight + 1.15, 3.2);
    tentGroup.add(leftPole);

    const rightPole = new THREE.Mesh(poleGeom, this.materials.pole_metal);
    rightPole.position.set(1.1, deckHeight + 1.15, 3.2);
    tentGroup.add(rightPole);

    // 타프 폴대에서 땅으로 뻗은 스트링 & 팩
    [[-1.1, 3.2, -1.9, 4.0], [1.1, 3.2, 1.9, 4.0]].forEach(([px, pz, sx, sz]) => {
      const poleGuyGeom = new THREE.CylinderGeometry(0.012, 0.012, 1.8);
      const poleGuy = new THREE.Mesh(poleGuyGeom, this.materials.dark_string);
      poleGuy.position.set((px + sx) / 2, deckHeight + 0.9, (pz + sz) / 2);
      poleGuy.rotation.z = (px < 0 ? 1 : -1) * 0.55;
      poleGuy.rotation.x = -0.4;
      tentGroup.add(poleGuy);

      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), this.materials.metal);
      peg.position.set(sx, 0.1, sz);
      tentGroup.add(peg);
    });

    // ==========================================
    // D. 감성 가랜드 전구 조명 (Fairy String Lights)
    // ==========================================
    const garlandGroup = new THREE.Group();
    const bulbGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const bulbCount = 7;
    for (let i = 0; i < bulbCount; i++) {
      const t = i / (bulbCount - 1);
      const bx = THREE.MathUtils.lerp(-1.1, 1.1, t);
      const sag = Math.sin(t * Math.PI) * 0.22;
      const by = deckHeight + 2.15 - sag;
      const bz = 3.2;

      const bulb = new THREE.Mesh(bulbGeom, this.materials.garland_bulb);
      bulb.position.set(bx, by, bz);
      garlandGroup.add(bulb);
    }

    // 따스한 감성 캠핑 전구 빛 (PointLight)
    const garlandLight = new THREE.PointLight(0xffb555, 1.6, 9);
    garlandLight.position.set(0, deckHeight + 2.0, 2.5);
    tentGroup.add(garlandLight);
    tentGroup.add(garlandGroup);

    // ==========================================
    // E. 타프 아래 감성 리빙 가구 (로우 체어 2개 & 롤 테이블)
    // ==========================================
    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.04, 0.9),
      this.materials.deck
    );
    tableTop.position.set(0, deckHeight + 0.42, 1.8);
    tentGroup.add(tableTop);

    [[-0.3, 1.4], [0.3, 1.4], [-0.3, 2.2], [0.3, 2.2]].forEach(([tx, tz]) => {
      const tleg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8),
        this.materials.pole_metal
      );
      tleg.position.set(tx, deckHeight + 0.21, tz);
      tentGroup.add(tleg);
    });

    const cup1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.04, 0.07, 8),
      this.materials.mug_steel
    );
    cup1.position.set(-0.15, deckHeight + 0.47, 1.65);
    tentGroup.add(cup1);

    const cup2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.04, 0.07, 8),
      this.materials.mug_steel
    );
    cup2.position.set(0.15, deckHeight + 0.47, 1.65);
    tentGroup.add(cup2);

    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.15, 10),
      this.materials.mug_steel
    );
    kettle.position.set(0, deckHeight + 0.51, 2.0);
    tentGroup.add(kettle);

    // 감성 캔버스 로우 체어 2개
    [-0.85, 0.85].forEach(cx => {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(cx, deckHeight, 1.8);

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.04, 0.45),
        this.materials.chair_canvas
      );
      seat.position.set(0, 0.28, 0);
      chairGroup.add(seat);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.42, 0.04),
        this.materials.chair_canvas
      );
      back.position.set(cx < 0 ? -0.2 : 0.2, 0.48, 0);
      back.rotation.z = (cx < 0 ? 1 : -1) * 0.25;
      chairGroup.add(back);

      const legMat = this.materials.log;
      [[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.35, 0.03), legMat);
        leg.position.set(lx, 0.15, lz);
        chairGroup.add(leg);
      });

      tentGroup.add(chairGroup);
    });

    // ==========================================
    // F. 텐트 메인 가이라인 (스트링 4개)과 팩 (에피소드 2 미션 대상!)
    // ==========================================
    this.strings = [];
    const pegOffsets = [
      { x: -2.2, z: -1.8 },
      { x: 2.2, z: -1.8 },
      { x: -2.2, z: 1.8 },
      { x: 2.2, z: 1.8 }
    ];

    pegOffsets.forEach((offset) => {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.3),
        this.materials.metal
      );
      peg.position.set(offset.x, 0.1, offset.z);
      peg.rotation.z = (offset.x < 0 ? -1 : 1) * 0.4;
      tentGroup.add(peg);

      const stringGeom = new THREE.CylinderGeometry(0.015, 0.015, 2.3);
      const stringMesh = new THREE.Mesh(stringGeom, this.materials.dark_string);
      stringMesh.position.set(offset.x * 0.55, 0.95, offset.z * 0.55);
      stringMesh.rotation.z = (offset.x < 0 ? -1 : 1) * 0.65;
      tentGroup.add(stringMesh);

      const glowGuard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.45),
        this.materials.glow
      );
      glowGuard.position.set(offset.x * 0.8, 0.35, offset.z * 0.8);
      glowGuard.visible = false;
      tentGroup.add(glowGuard);

      this.strings.push({
        stringMesh,
        glowGuard,
        position: new THREE.Vector3(x + offset.x, y + 0.3, z + offset.z)
      });
    });

    this.scene.add(tentGroup);
    this.tent = tentGroup;
  }

  // 텐트 안 위험한 숯불 난로 (에피소드 3 대상)
  createDangerousTentHeater(x, y, z) {
    const heaterGroup = new THREE.Group();
    heaterGroup.position.set(x, y, z);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.2, 0.35, 8),
      this.materials.charcoal
    );
    pot.position.set(0, 0.18, 0);
    heaterGroup.add(pot);

    const embers = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff3300 })
    );
    embers.position.set(0, 0.32, 0);
    heaterGroup.add(embers);

    this.tentHeater = heaterGroup;
    this.scene.add(heaterGroup);
    this.isHeaterInsideTent = true;
  }

  // 야외 바비큐존 및 과대불판 가스버너 & 화로대 (에피소드 4 대상)
  createBBQArea(x, y, z) {
    const bbqGroup = new THREE.Group();
    bbqGroup.position.set(x, y, z);

    // 1) 지상 가스버너 본체
    const stoveBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.8, roughness: 0.3 })
    );
    stoveBase.position.set(0, 0.1, 0);
    bbqGroup.add(stoveBase);

    // 부탄가스 수납부
    const gasCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.18, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x2255aa })
    );
    gasCover.position.set(0.18, 0.11, 0);
    bbqGroup.add(gasCover);

    // [위험 요소] 부탄가스통 위까지 다 덮어버린 거대한 과대불판!
    const dangerBigPan = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.05, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
    );
    dangerBigPan.position.set(0.05, 0.25, 0);
    dangerBigPan.castShadow = true;
    bbqGroup.add(dangerBigPan);
    this.dangerBigPan = dangerBigPan;

    // [안전 교체용] 알맞은 크기의 안전 규격 불판 (처음에는 숨김)
    const safePan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 })
    );
    safePan.position.set(-0.1, 0.25, 0);
    safePan.visible = false;
    safePan.castShadow = true;
    bbqGroup.add(safePan);
    this.safePan = safePan;
    this.isOverheatingPanFixed = false;

    // 2) 야외 규격 화로대 (숯불 잔불 모닥불)
    const firePit = new THREE.Group();
    firePit.position.set(0, 0, 1.6);

    // 화로대 주변 조약돌 원형 서클 (Cobblestone Ring)
    const stoneRingCount = 8;
    for (let i = 0; i < stoneRingCount; i++) {
      const angle = (i / stoneRingCount) * Math.PI * 2;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.15),
        this.materials.cobble
      );
      stone.position.set(Math.cos(angle) * 0.65, 0.08, Math.sin(angle) * 0.65);
      firePit.add(stone);
    }

    // 통나무 스툴 의자 3개 (화로 주변 둘러앉는 원목 의자)
    const stumpAngles = [Math.PI * 0.3, Math.PI * 0.9, Math.PI * 1.6];
    stumpAngles.forEach(ang => {
      const stump = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.24, 0.35, 8),
        this.materials.log
      );
      stump.position.set(Math.cos(ang) * 1.25, 0.175, Math.sin(ang) * 1.25);
      firePit.add(stump);
    });

    // 화로대 옆 장작더미 거치대 (Firewood Rack)
    const rackGroup = new THREE.Group();
    rackGroup.position.set(1.2, 0, 0.6);
    const rBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.8), this.materials.metal);
    rBase.position.set(0, 0.025, 0);
    rackGroup.add(rBase);
    for (let l = 0; l < 4; l++) {
      const woodLog = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6),
        this.materials.log
      );
      woodLog.rotation.x = Math.PI / 2;
      woodLog.position.set((l % 2 - 0.5) * 0.16, 0.1 + Math.floor(l / 2) * 0.14, 0);
      rackGroup.add(woodLog);
    }
    firePit.add(rackGroup);

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.08),
      this.materials.metal
    );
    stand.position.set(0, 0.1, 0);
    firePit.add(stand);

    const charcoal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.25, 0.2, 8),
      this.materials.charcoal
    );
    charcoal.position.set(0, 0.22, 0);
    firePit.add(charcoal);

    const fireMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.5, 6),
      this.materials.fire
    );
    fireMesh.position.set(0, 0.45, 0);
    firePit.add(fireMesh);
    this.fireMesh = fireMesh;
    this.isCampfireExtinguished = false;

    bbqGroup.add(firePit);
    this.firePit = firePit;

    this.scene.add(bbqGroup);
    this.bbqGroup = bbqGroup;
  }

  // 피크닉 테이블 & 음식물 방치 (야생동물 유인 위험 - 에피소드 5 대상)
  createPicnicTable(x, y, z) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.1, 0.9),
      this.materials.wood
    );
    top.position.set(0, 0.75, 0);
    top.castShadow = true;
    tableGroup.add(top);

    const legGeom = new THREE.BoxGeometry(0.1, 0.75, 0.1);
    [[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeom, this.materials.wood);
      leg.position.set(lx, 0.375, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });

    [-0.6, 0.6].forEach(bz => {
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 0.35),
        this.materials.wood
      );
      bench.position.set(0, 0.45, bz);
      tableGroup.add(bench);
    });

    const foodGroup = new THREE.Group();
    foodGroup.position.set(0, 0.85, 0);

    const steak = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.2), this.materials.meat);
    foodGroup.add(steak);

    const sausage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xbb4422 })
    );
    sausage.rotation.z = Math.PI / 2;
    sausage.position.set(-0.25, 0.03, 0.1);
    foodGroup.add(sausage);

    const snackBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.15, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffcc00 })
    );
    snackBag.position.set(0.3, 0.07, -0.1);
    foodGroup.add(snackBag);

    tableGroup.add(foodGroup);
    this.exposedFood = foodGroup;
    this.isFoodPackedInCooler = false;

    this.scene.add(tableGroup);
    this.picnicTable = tableGroup;
  }

  // 아이스박스 & 쓰레기 분리수거 봉투
  createCoolerAndTrash(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const cooler = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.45, 0.45),
      this.materials.box_cooler
    );
    cooler.position.set(0, 0.225, 0);
    cooler.castShadow = true;
    group.add(cooler);

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.08, 0.47),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    lid.position.set(0, 0.45, 0);
    group.add(lid);
    this.cooler = cooler;

    const trashBag = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.25),
      this.materials.trash_bag
    );
    trashBag.scale.set(1, 1.3, 0.9);
    trashBag.position.set(0.6, 0.25, 0);
    trashBag.castShadow = true;
    group.add(trashBag);
    this.trashBag = trashBag;

    this.scene.add(group);
    this.storageGroup = group;
  }

  // 소화기
  createFireExtinguisher(x, y, z) {
    const extGroup = new THREE.Group();
    extGroup.position.set(x, y, z);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12),
      this.materials.fire_extinguisher
    );
    body.position.set(0, 0.25, 0);
    body.castShadow = true;
    extGroup.add(body);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 })
    );
    handle.position.set(0, 0.52, 0);
    extGroup.add(handle);

    const hose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x111111 })
    );
    hose.position.set(0.1, 0.38, 0);
    extGroup.add(hose);

    this.scene.add(extGroup);
    this.fireExtinguisher = extGroup;
  }

  // 계곡 건너편 숲속 부시크래프트 솔로 돔텐트 & 캠프
  createSoloCamp(x, y, z) {
    const soloGroup = new THREE.Group();
    soloGroup.position.set(x, y, z);

    const domeMat = this.materials.tent_red;
    const domeGeom = new THREE.SphereGeometry(1.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.set(0, 0, 0);
    dome.castShadow = true;
    soloGroup.add(dome);

    const fly = new THREE.Mesh(
      new THREE.ConeGeometry(1.3, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: 0xdd6611, roughness: 0.5 })
    );
    fly.position.set(0, 0.8, 0);
    soloGroup.add(fly);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1), this.materials.cobble);
      s.position.set(Math.cos(angle) * 0.4 + 1.6, 0.05, Math.sin(angle) * 0.4);
      soloGroup.add(s);
    }

    const soloStump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.3, 8),
      this.materials.log
    );
    soloStump.position.set(1.4, 0.15, 1.2);
    soloGroup.add(soloStump);

    const backpack = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7 })
    );
    backpack.position.set(1.4, 0.22, 1.6);
    backpack.rotation.y = 0.3;
    soloGroup.add(backpack);

    this.scene.add(soloGroup);
  }

  // 파티클 업데이트 (모닥불 연기, 화염 흔들림, CO 독성 연기)
  update(delta) {
    if (this.fireMesh && !this.isCampfireExtinguished) {
      const scale = 0.9 + Math.sin(Date.now() * 0.01) * 0.15;
      this.fireMesh.scale.set(scale, scale, scale);
    }

    if (this.isHeaterInsideTent && Math.random() < 0.2) {
      this.spawnSmokeParticle(
        this.tentHeater.position.x + (Math.random() - 0.5) * 0.2,
        this.tentHeater.position.y + 0.4,
        this.tentHeater.position.z + (Math.random() - 0.5) * 0.2,
        0x555555
      );
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.multiplyScalar(0.98);
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  spawnSmokeParticle(x, y, z, color = 0x888888) {
    const geom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        0.5 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.2
      ),
      life: 1.2
    });
  }

  // 소화기 분사 파티클
  spawnExtinguisherSpray(origin, target) {
    for (let i = 0; i < 25; i++) {
      const geom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(origin);
      this.scene.add(mesh);

      const dir = target.clone().sub(origin).normalize();
      dir.x += (Math.random() - 0.5) * 0.4;
      dir.y += (Math.random() - 0.5) * 0.4;
      dir.z += (Math.random() - 0.5) * 0.4;

      this.particles.push({
        mesh,
        velocity: dir.multiplyScalar(4 + Math.random() * 2),
        life: 0.6
      });
    }
  }
}
