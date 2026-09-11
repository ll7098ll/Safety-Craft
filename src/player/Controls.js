import * as THREE from 'three';

export class Controls {
  constructor(player, domElement) {
    this.player = player;
    this.domElement = domElement;

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shift: false
    };

    this.isMouseDown = false;
    this.mouseButton = -1; // 0: 좌, 2: 우
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    this.selectedHotbarIndex = 0; // 0~8 (9칸)

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'Space':
          this.input.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.shift = true;
          break;
        case 'KeyV':
          this.player.toggleCameraView();
          break;
        case 'KeyE':
          if (this.onToggleInventory) this.onToggleInventory();
          break;
        case 'Escape':
          if (this.onTogglePause) this.onTogglePause();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          this.selectHotbar(parseInt(e.key) - 1);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
          this.input.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.shift = false;
          break;
      }
    });

    // 마우스 휠로 핫바 슬롯 전환 (마인크래프트 감성)
    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        this.selectHotbar((this.selectedHotbarIndex + 1) % 9);
      } else if (e.deltaY < 0) {
        this.selectHotbar((this.selectedHotbarIndex + 8) % 9);
      }
    });

    // 마우스 다운 (좌클릭: 채굴/타격, 우클릭: 블록 설치/상호작용)
    this.domElement.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.mouseButton = e.button;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      this.player.swingArm();

      if (e.button === 0 && this.onLeftMouseDown) {
        this.onLeftMouseDown();
      } else if (e.button === 2 && this.onRightClick) {
        this.onRightClick();
      }
    });

    // 마우스 우클릭 브라우저 메뉴 차단
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mouseup', (e) => {
      this.isMouseDown = false;
      if (e.button === 0 && this.onLeftMouseUp) {
        this.onLeftMouseUp();
      }
    });

    // 마우스 시점 회전 (포인터 락 또는 드래그)
    window.addEventListener('mousemove', (e) => {
      let movementX = 0;
      let movementY = 0;

      if (document.pointerLockElement === this.domElement) {
        movementX = e.movementX || 0;
        movementY = e.movementY || 0;
      } else if (this.isMouseDown) {
        movementX = e.clientX - this.prevMouseX;
        movementY = e.clientY - this.prevMouseY;
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      } else {
        return;
      }

      const sensitivity = 0.0026;
      this.player.yaw -= movementX * sensitivity;
      this.player.pitch -= movementY * sensitivity;

      const maxPitch = Math.PI / 2.15;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
    });

    // 더블 클릭 시 포인터락 전환
    this.domElement.addEventListener('dblclick', () => {
      if (document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock?.();
      }
    });
  }

  selectHotbar(idx) {
    if (idx >= 0 && idx < 9) {
      this.selectedHotbarIndex = idx;
      if (this.onHotbarChange) this.onHotbarChange(idx);
    }
  }

  update(delta, collisionBoxes) {
    this.player.update(delta, this.input, collisionBoxes);
  }
}
