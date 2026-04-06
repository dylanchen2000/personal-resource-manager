import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.DEPLOY_TARGET === 'github' ? '/personal-resource-manager/'
      : process.env.DEPLOY_TARGET === 'ecs' ? '/prm/'
      : '/',
  server: {
    allowedHosts: true,
  },
})
