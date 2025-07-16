const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// AudioOutputDeviceSelectionフラグを有効化
app.commandLine.appendSwitch('enable-features', 'AudioOutputDeviceSelection');

let mainWindow;

function createWindow() {
    // メインウィンドウを作成
    mainWindow = new BrowserWindow({
        width: 600, // 初期幅を600pxに
        height: 700,
        minWidth: 600,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'), // アイコンファイルがある場合
        titleBarStyle: 'default',
        show: false, // 初期状態では非表示
        backgroundColor: '#667eea'
    });

    // HTMLファイルを読み込み
    mainWindow.loadFile('index.html');

    // ウィンドウが準備できたら表示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // 開発モードの場合はDevToolsを開く
        if (process.argv.includes('--dev')) {
            mainWindow.webContents.openDevTools();
        }
    });

    // ウィンドウが閉じられたときの処理
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // メニューバーを設定
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'ファイル',
            submenu: [
                {
                    label: '終了',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: '編集',
            submenu: [
                { role: 'undo', label: '元に戻す' },
                { role: 'redo', label: 'やり直し' },
                { type: 'separator' },
                { role: 'cut', label: '切り取り' },
                { role: 'copy', label: 'コピー' },
                { role: 'paste', label: '貼り付け' },
                { role: 'selectall', label: '全て選択' }
            ]
        },
        {
            label: '表示',
            submenu: [
                { role: 'reload', label: '再読み込み' },
                { type: 'separator' },
                { role: 'resetZoom', label: '実際のサイズ' },
                { role: 'zoomIn', label: '拡大' },
                { role: 'zoomOut', label: '縮小' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'フルスクリーン' }
            ]
        },
        {
            label: '効果音',
            submenu: [
                {
                    label: '通知音',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'notification');
                    }
                },
                {
                    label: '成功音',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'success');
                    }
                },
                {
                    label: 'エラー音',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'error');
                    }
                },
                { type: 'separator' },
                {
                    label: 'カスタム1',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'custom1');
                    }
                },
                {
                    label: 'カスタム2',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'custom2');
                    }
                },
                {
                    label: 'カスタム3',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'custom3');
                    }
                },
                { type: 'separator' },
                {
                    label: '全て停止',
                    click: () => {
                        mainWindow.webContents.send('stop-all-sounds');
                    }
                },
                {
                    label: 'ミュート切り替え',
                    click: () => {
                        mainWindow.webContents.send('toggle-mute');
                    }
                }
            ]
        },
        {
            label: 'ヘルプ',
            submenu: [
                {
                    label: 'SE Playerについて',
                    click: () => {
                        require('electron').dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'SE Playerについて',
                            message: 'SE Player v1.0.1',
                            detail: '効果音プレイヤーアプリケーション'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// アプリケーションの準備が完了したとき
app.whenReady().then(() => {
    createWindow();

    // グローバルショートカット登録を削除
    // macOS用の処理
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 全てのウィンドウが閉じられたとき
app.on('window-all-closed', () => {
    // macOS以外ではアプリケーションを終了
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// アプリケーションが終了する前にグローバルショートカットを解除
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// セキュリティ警告を無効化（開発用）
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'; 

ipcMain.on('set-window-height', (event, height) => {
    if (mainWindow && typeof height === 'number') {
        const [width] = mainWindow.getContentSize();
        mainWindow.setContentSize(width, Math.ceil(height));
    }
}); 