import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

// MV3 빌드 파이프라인 (tech-spec §0). `vite build` → dist/ 에 unpacked 확장 산출.
// 테스트는 vitest.config.ts를 따로 쓰므로 crx 플러그인은 빌드에서만 동작한다.
export default defineConfig({
  plugins: [crx({ manifest })],
})
