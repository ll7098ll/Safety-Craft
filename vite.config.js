import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 로컬 파일(file://) 프로토콜로 직접 열어도 실행 가능하도록 설정
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 10000000
  }
});
