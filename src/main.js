import * as THREE from 'three';
import { VoxelWorld } from './world/VoxelWorld.js';
import { CampingObjects } from './world/Objects.js';
import { DayNightCycle } from './world/DayNightCycle.js';
import { WildBoar } from './world/WildBoar.js';
import { Player } from './player/Player.js';
import { Controls } from './player/Controls.js';
import { SafetyGauge } from './gameplay/SafetyGauge.js';
import { QuestManager } from './gameplay/QuestManager.js';
import { QuizSystem } from './gameplay/QuizSystem.js';
import { HUD } from './ui/HUD.js';
import { Dialogue } from './ui/Dialogue.js';
import { CertificateModal } from './ui/CertificateModal.js';
import { InventoryGUI } from './ui/InventoryGUI.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { sounds } from './audio/SoundManager.js';

class MinecraftSafetyGame {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.uiContainer = document.getElementById('ui-overlay');

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 5.0;

    this.targetBlock = null;
    this.targetNormal = null;
    this.isMining = false;
    this.miningTime = 0;
    this.miningDuration = 0.7;
    this.hitSoundCooldown = 0;

    this.initThree();
    this.initWorld();
    this.initPlayer();
    this.initGameplay();
    this.initUI();
    this.initEvents();

    window.__game = this;

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x78a7ff, 0.007);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);
  }

  initWorld() {
    this.voxelWorld = new VoxelWorld(this.scene);
    this.campingObjects = new CampingObjects(this.scene);
    this.dayNightCycle = new DayNightCycle(this.scene);
    this.wildBoar = new WildBoar(this.scene);
  }

  initPlayer() {
    this.player = new Player(this.scene, this.camera);
    this.controls = new Controls(this.player, this.renderer.domElement);
  }

  initGameplay() {
    this.safetyGauge = new SafetyGauge();
    this.questManager = new QuestManager(
      this.campingObjects,
      this.voxelWorld,
      this.safetyGauge,
      this.wildBoar,
      this.dayNightCycle
    );
    this.quizSystem = new QuizSystem();
  }

  initUI() {
    this.dialogue = new Dialogue(this.uiContainer);
    this.hud = new HUD(
      this.uiContainer,
      this.questManager,
      this.safetyGauge,
      this.dayNightCycle,
      this.player
    );

    // 핫바 아이템 배열을 인벤토리에 연동
    this.inventoryGUI = new InventoryGUI(this.uiContainer, this.player, this.hud.hotbarSlots);
    this.inventoryGUI.onCraftItem = (crafted) => {
      this.hud.showAdvancement(`아이템 조합 완성: [${crafted.name}]`, crafted.icon);
      this.hud.refreshHotbar();
    };
    this.inventoryGUI.onHotbarUpdated = () => {
      this.hud.refreshHotbar();
    };

    // ESC 일시정지 메뉴
    this.pauseMenu = new PauseMenu(this.uiContainer, {
      onToggleView: () => this.player.toggleCameraView(),
      onOpenGuide: () => alert("캠핑 안전 6계명: 1) 평지 안전구역 텐트 2) 야광 스트링 3) 텐트 내 난로 금지 4) 과대불판 금지 5) 음식 밀폐 6) 잔불 확인"),
      onQuitTitle: () => location.reload()
    });

    // 퀴즈 & 수료증 모달
    this.certModal = new CertificateModal(
      this.uiContainer,
      this.quizSystem,
      () => {
        this.questManager.completeQuizMission();
        this.dialogue.show("축하합니다! 캠핑 안전 골든벨을 통과하여 [캠핑 안전 보안관]이 되었습니다!");
      }
    );

    this.questManager.onOpenQuiz = () => this.certModal.openQuiz();
    this.questManager.onGuideMessage = (msg) => this.dialogue.show(msg);

    // 바로 게임 시작! 친절한 가이드 멘트 출력
    setTimeout(() => {
      this.dialogue.show("안녕! [세이프티 크래프트]에 온 걸 환영해! 나는 안전 멘토 [도토리 대장]이야. 위험 표지판을 조사하고 안전 구역을 찾아보자! (W,A,S,D로 이동 / 마우스 드래그로 시점 둘러보기)");
    }, 600);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 좌클릭: 채굴
    this.controls.onLeftMouseDown = () => {
      sounds.init();
      if (this.targetBlock) {
        this.isMining = true;
        this.miningTime = 0;
      }
    };

    this.controls.onLeftMouseUp = () => {
      this.isMining = false;
      this.miningTime = 0;
      this.voxelWorld.updateBreakingProgress(null, -1);
    };

    // 우클릭: 상호작용 또는 블록 설치
    this.controls.onRightClick = () => {
      sounds.init();

      const held = this.hud.getSelectedItem();

      // 1) 안전 미션 상호작용 먼저 검사
      const interaction = this.questManager.checkNearbyInteraction(this.player.position, held);
      if (interaction && interaction.action) {
        interaction.action();
        this.hud.refreshHotbar();
        return;
      }

      // 2) 블록 설치 (손에 든 아이템이 블록인 경우)
      if (this.targetBlock && this.targetNormal && held) {
        const placeX = this.targetBlock.x + this.targetNormal.x;
        const placeY = this.targetBlock.y + this.targetNormal.y;
        const placeZ = this.targetBlock.z + this.targetNormal.z;

        const pBlockX = Math.floor(this.player.position.x);
        const pBlockY = Math.floor(this.player.position.y);
        const pBlockZ = Math.floor(this.player.position.z);
        if (placeX === pBlockX && (placeY === pBlockY || placeY === pBlockY + 1) && placeZ === pBlockZ) {
          return;
        }

        if (held.id === 'oak_planks' && held.count > 0) {
          sounds.playPlace();
          this.voxelWorld.setBlock(placeX, placeY, placeZ, 'oak_planks');
          held.count--;
          this.hud.refreshHotbar();
        } else if (held.id === 'torch' && held.count > 0) {
          sounds.playPlace();
          this.voxelWorld.setBlock(placeX, placeY, placeZ, 'oak_log');
          held.count--;
          this.hud.refreshHotbar();
        }
      }
    };

    this.controls.onToggleInventory = () => {
      this.inventoryGUI.toggle();
    };

    this.controls.onTogglePause = () => {
      if (this.inventoryGUI.isOpen) {
        this.inventoryGUI.toggle();
      } else {
        this.pauseMenu.toggle();
      }
    };

    this.controls.onHotbarChange = (idx) => {
      this.hud.selectHotbar(idx);
    };
  }

  updateRaycasting() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects(this.voxelWorld.raycastMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const bx = Math.floor(hit.point.x - hit.face.normal.x * 0.1);
      const by = Math.floor(hit.point.y - hit.face.normal.y * 0.1);
      const bz = Math.floor(hit.point.z - hit.face.normal.z * 0.1);

      const block = this.voxelWorld.getBlock(bx, by, bz);
      if (block) {
        this.targetBlock = { x: bx, y: by, z: bz };
        this.targetNormal = hit.face.normal;
        this.voxelWorld.updateSelection(this.targetBlock);
        return;
      }
    }

    this.targetBlock = null;
    this.targetNormal = null;
    this.voxelWorld.updateSelection(null);
    this.isMining = false;
    this.miningTime = 0;
    this.voxelWorld.updateBreakingProgress(null, -1);
  }

  updateMining(delta) {
    if (!this.isMining || !this.targetBlock) return;

    this.miningTime += delta;
    this.hitSoundCooldown -= delta;

    if (this.hitSoundCooldown <= 0) {
      sounds.playFootstep();
      this.player.swingArm();
      this.hitSoundCooldown = 0.16;
    }

    const progressRatio = Math.min(1.0, this.miningTime / this.miningDuration);
    const stage = Math.floor(progressRatio * 9);
    this.voxelWorld.updateBreakingProgress(this.targetBlock, stage);

    if (this.miningTime >= this.miningDuration) {
      sounds.playPlace();
      this.voxelWorld.removeBlock(this.targetBlock.x, this.targetBlock.y, this.targetBlock.z);
      this.isMining = false;
      this.miningTime = 0;
      this.voxelWorld.updateBreakingProgress(null, -1);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.updateRaycasting();
    this.updateMining(delta);
    this.controls.update(delta, this.voxelWorld.collisionBoxes);

    this.voxelWorld.updateDroppedItems(delta, this.player.position, (itemType) => {
      this.hud.showAdvancement(`아이템 획득: [${itemType}]`, '📦');
      const held = this.hud.hotbarSlots.find(s => s && s.id === itemType);
      if (held) held.count++;
      this.hud.refreshHotbar();
    });

    this.campingObjects.update(delta);
    this.wildBoar.update(delta);
    this.dayNightCycle.update(delta);

    if (this.dayNightCycle.isNight()) {
      this.scene.fog.color.setHex(0x0c1322);
    } else {
      this.scene.fog.color.setHex(0x78a7ff);
    }

    this.safetyGauge.update(delta, this.player.position, this.campingObjects);
    this.hud.update(this.player.position);

    this.renderer.render(this.scene, this.camera);
  }
}

function initGame() {
  new MinecraftSafetyGame();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
