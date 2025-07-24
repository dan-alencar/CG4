// vite.config.js
import { defineConfig } from 'vite';
// import basicSsl from '@vitejs/plugin-basic-ssl'; // Uncomment if you need HTTPS for development

import wasm from 'vite-plugin-wasm';
// import basicSsl from '@vitejs/plugin-basic-ssl'; // Uncomment if you need HTTPS for development

export default defineConfig({
  plugins: [
  wasm(), // Add the wasm plugin here
  // basicSsl(), // Uncomment if you need HTTPS for development
  ],
  // plugins: [basicSsl()], // Uncomment if you need HTTPS for development
  root: './', // Specify the root of your project (current directory)
  publicDir: 'public', // Directory for static assets, relative to root
  build: {
    outDir: 'dist', // Output directory for production build
  },
  resolve: {
    // Optional: If you need to set up aliases for easier imports
    alias: {
      // 'three': 'node_modules/three/build/three.module.js' // Generally not needed for 'three' bare import
    }
  },
  server: {
    host: '0.0.0.0', // Make the server accessible externally (e.g., on your local network)
    port: 3000, // Or any other port you prefer
    open: true, // Automatically open the browser
  }
});