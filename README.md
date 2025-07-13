# SE Player (効果音プレイヤー)

美しいUIを持つ効果音プレイヤーアプリケーションです。Web Audio APIを使用して様々な効果音を生成し、Electronアプリケーションとして動作します。

## 機能

- 🎵 8種類の効果音（通知音、クリック音、成功音、エラー音、警告音、チャイム音、ポップ音、チャイム音2）
- 🎚️ 音量調整機能
- 🔇 ミュート機能
- ⌨️ キーボードショートカット対応
- 🖱️ 美しいアニメーション効果
- 📱 レスポンシブデザイン

## 効果音一覧

1. **通知音** (キー: 1) - 高音のビープ音
2. **クリック音** (キー: 2) - 短いポップ音
3. **成功音** (キー: 3) - 上昇する音階
4. **エラー音** (キー: 4) - 下降する音階
5. **警告音** (キー: 5) - 断続的なビープ音
6. **チャイム音** (キー: 6) - 美しい和音
7. **ポップ音** (キー: 7) - 軽やかな音
8. **チャイム音2** (キー: 8) - 上昇する音階

## キーボードショートカット

- `1-8`: 対応する効果音を再生
- `Space`: ミュート切り替え
- `Escape`: 全ての効果音を停止
- `Cmd/Ctrl + Q`: アプリケーション終了

## インストールと実行

### 必要な環境

- Node.js (v14以上)
- npm または yarn

### セットアップ

1. 依存関係をインストール:
```bash
npm install
```

2. アプリケーションを実行:
```bash
npm start
```

3. 開発モードで実行（DevTools付き）:
```bash
npm run dev
```

### ビルド

アプリケーションを配布用にビルドする場合:

```bash
npm run build
```

ビルドされたアプリケーションは `dist` フォルダに生成されます。

## ファイル構成

```
seplayer/
├── index.html          # メインHTMLファイル
├── script.js           # 効果音再生ロジック
├── main.js             # Electronメインプロセス
├── preload.js          # Electronプリロードスクリプト
├── package.json        # プロジェクト設定
└── README.md          # このファイル
```

## 技術仕様

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **音声処理**: Web Audio API
- **デスクトップアプリ**: Electron
- **ビルドツール**: electron-builder

## カスタマイズ

### 新しい効果音を追加

`script.js` の `createSounds()` メソッド内に新しい効果音を追加できます:

```javascript
this.sounds.newSound = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 音の設定
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
};
```

### UIのカスタマイズ

`index.html` のCSSセクションを編集して、色やレイアウトを変更できます。

## ライセンス

MIT License

## 作者

Your Name
