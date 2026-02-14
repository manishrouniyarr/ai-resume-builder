import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})





// // vite.config.js

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
  
//   // 🛠️ FIX: ADD THE SERVER BLOCK WITH PROXY
//   server: {
//     // This tells Vite to handle all requests starting with /api
//     proxy: {
//       '/api': {
//         // Target is the backend server running your Express application
//         target: 'http://localhost:5000', 
//         // This is critical: it changes the 'Host' header of the request
//         // so the backend thinks it's a request from its own port.
//         changeOrigin: true, 
//         // Set to true if your backend were running HTTPS
//         secure: false, 
//       },
//     },
//     // Ensure the frontend still runs on the correct port (optional, but good)
//     port: 5173, 
//   },
// })