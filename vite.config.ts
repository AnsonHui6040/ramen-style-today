import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import {
  assertFinderRegionData,
  type FinderRegionData,
} from './src/domain/ramenMap'

function readJson<T>(relativePath: string) {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))

  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function validateRamenMapData() {
  const data = readJson<FinderRegionData>(
    './public/ramen-map/data/taichung.json',
  )
  const profiles = readJson<Array<{ code: string }>>(
    './public/ramen-map/data/type-profiles.json',
  )

  assertFinderRegionData(data, profiles.map((profile) => profile.code))
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ramen-style-today/' : '/',
  plugins: [
    {
      name: 'validate-ramen-map-data',
      buildStart: validateRamenMapData,
    },
    react(),
  ],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text'],
    },
  },
})
