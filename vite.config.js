import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, 'index.html'),
        user: resolve(__dirname, 'pages/user.html'),
        administrative: resolve(__dirname, 'pages/administrative.html'),
        course: resolve(__dirname, 'pages/course.html'),
        courseview: resolve(__dirname, 'pages/courseView.html'),
      }
    }
  }
})
