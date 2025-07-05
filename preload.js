// preload.js

// All Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// window.addEventListener('DOMContentLoaded', () => {
//   const replaceText = (selector, text) => {
//     const element = document.getElementById(selector)
//     if (element) element.innerText = text
//   }

//   for (const dependency of ['chrome', 'node', 'electron']) {
//     replaceText(`${dependency}-version`, process.versions[dependency])
//   }
// })

console.log('Preload script loaded. Context Isolation is enabled.');

// You can expose specific APIs to the renderer process here if needed,
// using contextBridge.
// Example:
// const { contextBridge, ipcRenderer } = require('electron')
// contextBridge.exposeInMainWorld('myAPI', {
//   doAThing: () => ipcRenderer.send('do-a-thing')
// })
