import * as THREE from 'three';

class TextureGenerator {
  constructor() {
    this.cache = new Map();
  }

  createPixelCanvas(drawCallback, size = 16) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawCallback(ctx, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  fillNoise(ctx, baseColor, colorVariants, size = 16) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const rand = Math.floor(Math.random() * colorVariants.length);
        ctx.fillStyle = colorVariants[rand] || baseColor;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  get(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    let texture;
    switch (name) {
      case 'grass_top':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#4c7828', ['#436d22', '#4c7828', '#588b30', '#3b611e', '#52832c']);
        });
        break;

      case 'grass_side':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#866043', ['#77553b', '#866043', '#6c4d35', '#956b4a', '#5d412d']);
          ctx.fillStyle = '#4c7828';
          for (let x = 0; x < 16; x++) {
            const h = 2 + (x % 3 === 0 ? 2 : (x % 2 === 0 ? 1 : 0));
            ctx.fillRect(x, 0, 1, h);
          }
        });
        break;

      case 'dirt':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#866043', ['#77553b', '#866043', '#6c4d35', '#956b4a', '#5d412d']);
        });
        break;

      case 'stone':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#7b7b7b', ['#686868', '#737373', '#7b7b7b', '#858585', '#919191']);
        });
        break;

      case 'cobblestone':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#686868', ['#4f4f4f', '#5e5e5e', '#737373', '#808080', '#3e3e3e']);
          ctx.strokeStyle = '#383838';
          ctx.strokeRect(1, 1, 6, 6);
          ctx.strokeRect(8, 1, 7, 6);
          ctx.strokeRect(3, 8, 8, 7);
        });
        break;

      case 'oak_log':
      case 'wood_log':
        texture = this.createPixelCanvas(ctx => {
          for (let x = 0; x < 16; x++) {
            const col = (x % 4 === 0) ? '#43301a' : (x % 2 === 0 ? '#543d22' : '#634828');
            ctx.fillStyle = col;
            ctx.fillRect(x, 0, 1, 16);
          }
        });
        break;

      case 'oak_planks':
      case 'wood_plank':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#b88b56', ['#a57946', '#b88b56', '#c99a63', '#8f6738']);
          ctx.fillStyle = '#644726';
          ctx.fillRect(0, 3, 16, 1);
          ctx.fillRect(0, 7, 16, 1);
          ctx.fillRect(0, 11, 16, 1);
          ctx.fillRect(0, 15, 16, 1);
        });
        break;

      case 'oak_leaves':
      case 'leaves':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#336820', ['#265016', '#336820', '#427f2c', '#1e4011']);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(3, 3, 2, 2);
          ctx.fillRect(10, 8, 2, 2);
          ctx.fillRect(6, 12, 2, 2);
        });
        break;

      case 'tent_red':
        texture = this.createPixelCanvas(ctx => {
          for (let x = 0; x < 16; x++) {
            ctx.fillStyle = (x % 4 < 2) ? '#d93838' : '#f0f0f0';
            ctx.fillRect(x, 0, 1, 16);
          }
        });
        break;

      case 'tent_blue':
        texture = this.createPixelCanvas(ctx => {
          for (let x = 0; x < 16; x++) {
            ctx.fillStyle = (x % 4 < 2) ? '#2873d9' : '#e6f0fa';
            ctx.fillRect(x, 0, 1, 16);
          }
        });
        break;

      case 'glow_strip':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#40ff00', ['#38e600', '#54ff1a', '#73ff42', '#30cc00']);
        });
        break;

      case 'co_detector':
        texture = this.createPixelCanvas(ctx => {
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#112211';
          ctx.fillRect(3, 3, 10, 4);
          ctx.fillStyle = '#00ff66';
          ctx.fillRect(4, 4, 3, 2);
          ctx.fillStyle = '#ff2222';
          ctx.fillRect(4, 9, 2, 2);
          ctx.fillStyle = '#444';
          ctx.fillRect(8, 9, 1, 1);
          ctx.fillRect(10, 9, 1, 1);
        });
        break;

      case 'fire_extinguisher':
        texture = this.createPixelCanvas(ctx => {
          ctx.fillStyle = '#cc1111';
          ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, 4, 12, 8);
          ctx.fillStyle = '#111111';
          ctx.fillRect(4, 6, 8, 1);
          ctx.fillRect(4, 8, 6, 1);
        });
        break;

      case 'caution':
        texture = this.createPixelCanvas(ctx => {
          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              ctx.fillStyle = ((x + y) % 4 < 2) ? '#ffcc00' : '#222222';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        });
        break;

      case 'safe_zone':
        texture = this.createPixelCanvas(ctx => {
          ctx.fillStyle = '#33cc55';
          ctx.fillRect(0, 0, 16, 16);
          ctx.strokeStyle = '#88ffaa';
          ctx.strokeRect(1, 1, 14, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(4, 7, 2, 2);
          ctx.fillRect(6, 9, 2, 2);
          ctx.fillRect(8, 7, 2, 2);
          ctx.fillRect(10, 5, 2, 2);
        });
        break;

      case 'water':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#3366cc', ['#2a5cb8', '#3366cc', '#3d72db', '#487ee6']);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(2, 3, 4, 1);
          ctx.fillRect(9, 10, 5, 1);
        });
        break;

      case 'sun':
        texture = this.createPixelCanvas(ctx => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#ffffaa';
          ctx.fillRect(2, 2, 12, 12);
        });
        break;

      case 'moon':
        texture = this.createPixelCanvas(ctx => {
          ctx.fillStyle = '#cccccc';
          ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(3, 3, 10, 10);
        });
        break;

      case 'tarp_khaki':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#d2b48c', ['#c8aa80', '#d2b48c', '#dcbe96', '#be9e72']);
          ctx.strokeStyle = '#a6855b';
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, 16, 16);
        });
        break;

      case 'tent_dark':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#2d3732', ['#252e2a', '#2d3732', '#36423c', '#1d2420']);
          ctx.fillStyle = '#41524a';
          ctx.fillRect(0, 7, 16, 2);
        });
        break;

      case 'deck_wood':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#8a5d3b', ['#7e5434', '#8a5d3b', '#976641', '#6f482b']);
          ctx.fillStyle = '#4c2e17';
          ctx.fillRect(0, 0, 16, 1);
          ctx.fillRect(0, 8, 16, 1);
          ctx.fillStyle = '#222';
          ctx.fillRect(2, 4, 1, 1);
          ctx.fillRect(14, 4, 1, 1);
          ctx.fillRect(2, 12, 1, 1);
          ctx.fillRect(14, 12, 1, 1);
        });
        break;

      case 'pine_leaves':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#1e3f20', ['#163218', '#1e3f20', '#284f2b', '#122613']);
          ctx.fillStyle = '#0f2010';
          ctx.fillRect(3, 2, 2, 2);
          ctx.fillRect(9, 6, 2, 2);
          ctx.fillRect(4, 11, 2, 2);
          ctx.fillRect(11, 12, 2, 2);
        });
        break;

      case 'gravel_path':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#9e917d', ['#8c7f6b', '#9e917d', '#aca08d', '#7d715d']);
          ctx.fillStyle = '#655a49';
          ctx.fillRect(2, 3, 2, 1);
          ctx.fillRect(8, 8, 1, 2);
          ctx.fillRect(12, 4, 2, 2);
          ctx.fillRect(5, 12, 2, 1);
        });
        break;

      case 'bridge_wood':
        texture = this.createPixelCanvas(ctx => {
          this.fillNoise(ctx, '#6e4726', ['#5c3a1e', '#6e4726', '#7c522e', '#4f3017']);
          ctx.fillStyle = '#39210c';
          ctx.fillRect(0, 3, 16, 1);
          ctx.fillRect(0, 7, 16, 1);
          ctx.fillRect(0, 11, 16, 1);
          ctx.fillRect(0, 15, 16, 1);
          ctx.fillStyle = '#1c1005';
          ctx.fillRect(1, 1, 1, 1);
          ctx.fillRect(14, 1, 1, 1);
        });
        break;

      case 'dandelion':
        texture = this.createPixelCanvas(ctx => {
          ctx.clearRect(0, 0, 16, 16);
          ctx.fillStyle = '#3a6619';
          ctx.fillRect(7, 8, 2, 8);
          ctx.fillRect(5, 11, 2, 3);
          ctx.fillRect(9, 10, 2, 4);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(6, 4, 4, 4);
          ctx.fillRect(5, 5, 6, 2);
          ctx.fillStyle = '#fff488';
          ctx.fillRect(7, 5, 2, 2);
        });
        break;

      case 'poppy':
        texture = this.createPixelCanvas(ctx => {
          ctx.clearRect(0, 0, 16, 16);
          ctx.fillStyle = '#3a6619';
          ctx.fillRect(7, 7, 2, 9);
          ctx.fillRect(5, 10, 2, 4);
          ctx.fillStyle = '#dd2222';
          ctx.fillRect(6, 3, 4, 4);
          ctx.fillRect(5, 4, 6, 2);
          ctx.fillStyle = '#220000';
          ctx.fillRect(7, 4, 2, 2);
        });
        break;

      default:
        if (name.startsWith('destroy_stage_')) {
          const stage = parseInt(name.split('_')[2]);
          texture = this.createPixelCanvas(ctx => {
            ctx.clearRect(0, 0, 16, 16);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const density = (stage + 1) * 7;
            for (let i = 0; i < density; i++) {
              const x = (i * 7) % 16;
              const y = (i * 11) % 16;
              ctx.fillRect(x, y, 1 + (stage > 5 ? 1 : 0), 1 + (stage > 7 ? 1 : 0));
            }
          });
        } else {
          texture = this.createPixelCanvas(ctx => {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(0, 0, 16, 16);
          });
        }
    }

    this.cache.set(name, texture);
    return texture;
  }

  createMaterial(name, options = {}) {
    const texture = this.get(name);
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: options.roughness !== undefined ? options.roughness : 0.85,
      metalness: options.metalness !== undefined ? options.metalness : 0.05,
      transparent: options.transparent || false,
      opacity: options.opacity !== undefined ? options.opacity : 1.0,
      side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide
    });
  }
}

export const textures = new TextureGenerator();
