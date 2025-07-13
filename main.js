const { app, BrowserWindow, Menu, globalShortcut, ipcMain } = require('electron');
const path = require('path');

// AudioOutputDeviceSelectionフラグを有効化
app.commandLine.appendSwitch('enable-features', 'AudioOutputDeviceSelection');

let mainWindow;

function createWindow() {
    // メインウィンドウを作成
    mainWindow = new BrowserWindow({
        width: 800,
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
                { role: 'forceReload', label: '強制再読み込み' },
                { role: 'toggleDevTools', label: '開発者ツール' },
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
                    accelerator: '1',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'notification');
                    }
                },
                {
                    label: 'クリック音',
                    accelerator: '2',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'click');
                    }
                },
                {
                    label: '成功音',
                    accelerator: '3',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'success');
                    }
                },
                {
                    label: 'エラー音',
                    accelerator: '4',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'error');
                    }
                },
                {
                    label: '警告音',
                    accelerator: '5',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'alert');
                    }
                },
                {
                    label: 'チャイム音',
                    accelerator: '6',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'ding');
                    }
                },
                {
                    label: 'ポップ音',
                    accelerator: '7',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'pop');
                    }
                },
                {
                    label: 'チャイム音2',
                    accelerator: '8',
                    click: () => {
                        mainWindow.webContents.send('play-sound', 'chime');
                    }
                },
                { type: 'separator' },
                {
                    label: '全て停止',
                    accelerator: 'Escape',
                    click: () => {
                        mainWindow.webContents.send('stop-all-sounds');
                    }
                },
                {
                    label: 'ミュート切り替え',
                    accelerator: 'Space',
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
                            message: 'SE Player v1.0.0',
                            detail: '効果音プレイヤーアプリケーション\n\nキーボードショートカット:\n1-8: 効果音再生\nSpace: ミュート切り替え\nEscape: 全て停止'
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

    // グローバルショートカットを登録
    globalShortcut.register('1', () => {
        mainWindow.webContents.send('play-sound', 'notification');
    });
    globalShortcut.register('2', () => {
        mainWindow.webContents.send('play-sound', 'click');
    });
    globalShortcut.register('3', () => {
        mainWindow.webContents.send('play-sound', 'success');
    });
    globalShortcut.register('4', () => {
        mainWindow.webContents.send('play-sound', 'error');
    });
    globalShortcut.register('5', () => {
        mainWindow.webContents.send('play-sound', 'alert');
    });
    globalShortcut.register('6', () => {
        mainWindow.webContents.send('play-sound', 'ding');
    });
    globalShortcut.register('7', () => {
        mainWindow.webContents.send('play-sound', 'pop');
    });
    globalShortcut.register('8', () => {
        mainWindow.webContents.send('play-sound', 'chime');
    });
    globalShortcut.register('Space', () => {
        mainWindow.webContents.send('toggle-mute');
    });
    globalShortcut.register('Escape', () => {
        mainWindow.webContents.send('stop-all-sounds');
    });

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