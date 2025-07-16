const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスで使用できるAPIを公開
contextBridge.exposeInMainWorld('electronAPI', {
    // 効果音再生のイベントリスナー
    onPlaySound: (callback) => ipcRenderer.on('play-sound', callback),
    onStopAllSounds: (callback) => ipcRenderer.on('stop-all-sounds', callback),
    onToggleMute: (callback) => ipcRenderer.on('toggle-mute', callback),
    
    // イベントリスナーの削除
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    setWindowHeight: (height) => ipcRenderer.send('set-window-height', height),
}); 