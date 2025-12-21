const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  sendText: (text) => ipcRenderer.invoke('send-text', text),
  hideInputWindow: () => ipcRenderer.invoke('hide-input-window'),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  getHistory: () => ipcRenderer.invoke('get-history'),
  addToHistory: (text) => ipcRenderer.invoke('add-to-history', text),
  onThemeUpdated: (callback) => ipcRenderer.on('theme-updated', (event, theme) => callback(theme)),
  onClearInput: (callback) => ipcRenderer.on('clear-input', (event) => callback()),
  onHistoryReload: (callback) => ipcRenderer.on('history-reload', (event) => callback())
});