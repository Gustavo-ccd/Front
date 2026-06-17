import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        user: resolve(__dirname, 'font/pages/html.pages/user.html'),
        administrative: resolve(__dirname, 'font/pages/html.pages/administrative.html'),
        course: resolve(__dirname, 'font/pages/html.pages/course.html'),
        courseview: resolve(__dirname, 'font/pages/html.pages/courseView.html'),
      }
    }
  }
})
