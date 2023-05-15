import { resolve } from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

import svelteConfig from './svelte.config'

export default defineConfig({
  plugins: [svelte(svelteConfig)],
  resolve: {
    alias: { src: resolve(__dirname, 'src') }
  }
})
