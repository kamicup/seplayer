class SoundPlayer {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.currentlyPlaying = null;
        this.audioContext = null;
        this.selectedDeviceId = '';
        this.audioDevices = [];
        
        this.init();
    }

    async init() {
        await this.initializeAudioContext();
        await this.loadAudioDevices();
        this.createSounds();
        this.setupEventListeners();
        this.updateStatus('効果音プレイヤーが準備完了しました');
    }

    async initializeAudioContext() {
        // AudioContextの初期化
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // ユーザーインタラクションが必要な場合の処理
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async loadAudioDevices() {
        try {
            // マイク権限を要求（デバイス一覧を取得するため）
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 利用可能な音声デバイスを取得
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.audioDevices = devices.filter(device => device.kind === 'audiooutput');
            
            this.populateDeviceSelect();
        } catch (error) {
            console.warn('音声デバイスの取得に失敗しました:', error);
            this.updateStatus('音声デバイスの取得に失敗しました');
        }
    }

    populateDeviceSelect() {
        const deviceSelect = document.getElementById('audioDevice');
        deviceSelect.innerHTML = '<option value="">デフォルトデバイス</option>';
        
        this.audioDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `音声デバイス ${device.deviceId.slice(0, 8)}`;
            deviceSelect.appendChild(option);
        });
    }

    createSounds() {
        // Web Audio APIを使用して効果音を生成
        
        // 通知音（高音のビープ音）
        this.sounds.notification = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };

        // クリック音（短いポップ音）
        this.sounds.click = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.001);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };

        // 成功音（上昇する音階）
        this.sounds.success = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C
            oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E
            oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G
            oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime + 0.3); // C (高音)
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.25, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
        };

        // エラー音（下降する音階）
        this.sounds.error = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime); // G
            oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E
            oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime + 0.2); // C
            oscillator.frequency.setValueAtTime(392, this.audioContext.currentTime + 0.3); // G (低音)
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
        };

        // 警告音（断続的なビープ音）
        this.sounds.alert = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.2);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };

        // チャイム音（美しい和音）
        this.sounds.ding = () => {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C
            oscillator2.frequency.setValueAtTime(659, this.audioContext.currentTime); // E
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            
            oscillator1.start(this.audioContext.currentTime);
            oscillator2.start(this.audioContext.currentTime);
            oscillator1.stop(this.audioContext.currentTime + 0.5);
            oscillator2.stop(this.audioContext.currentTime + 0.5);
        };

        // ポップ音（軽やかな音）
        this.sounds.pop = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(1500, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.15, this.audioContext.currentTime + 0.001);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        };

        // チャイム音（上昇する音階）
        this.sounds.chime = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(262, this.audioContext.currentTime); // C
            oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime + 0.1); // E
            oscillator.frequency.setValueAtTime(392, this.audioContext.currentTime + 0.2); // G
            oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime + 0.3); // C (高音)
            oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.4); // E (高音)
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
    }

    setupEventListeners() {
        // 効果音ボタンのイベントリスナー
        document.querySelectorAll('.sound-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const soundType = e.target.dataset.sound;
                this.playSound(soundType, e.target);
            });
        });

        // 全て停止ボタン
        document.getElementById('stopAll').addEventListener('click', () => {
            this.stopAllSounds();
        });

        // ミュートボタン
        document.getElementById('muteToggle').addEventListener('click', () => {
            this.toggleMute();
        });

        // 音量スライダー
        const volumeSlider = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');
        
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            volumeValue.textContent = `${e.target.value}%`;
        });

        // 音声出力デバイス選択
        const deviceSelect = document.getElementById('audioDevice');
        const refreshButton = document.getElementById('refreshDevices');
        deviceSelect.addEventListener('change', async (e) => {
            this.selectedDeviceId = e.target.value;
            if (typeof this.audioContext.destination.setSinkId === 'function') {
                try {
                    await this.audioContext.destination.setSinkId(this.selectedDeviceId || 'default');
                    this.updateStatus('音声出力デバイスを切り替えました');
                } catch (err) {
                    this.updateStatus('デバイス切り替えに失敗しました: ' + err.message);
                }
            } else {
                this.updateStatus('このブラウザは音声出力デバイスの切り替えに対応していません');
            }
        });
        refreshButton.addEventListener('click', async () => {
            await this.loadAudioDevices();
            this.updateStatus('デバイスリストを更新しました');
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            const keyMap = {
                '1': 'notification',
                '2': 'click',
                '3': 'success',
                '4': 'error',
                '5': 'alert',
                '6': 'ding',
                '7': 'pop',
                '8': 'chime'
            };

            if (keyMap[e.key]) {
                const button = document.querySelector(`[data-sound="${keyMap[e.key]}"]`);
                if (button) {
                    this.playSound(keyMap[e.key], button);
                }
            }

            // スペースキーでミュート切り替え
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleMute();
            }

            // Escapeキーで全て停止
            if (e.code === 'Escape') {
                this.stopAllSounds();
            }
        });

        // Electronのイベントリスナー（Electronアプリケーションの場合のみ）
        if (window.electronAPI) {
            // メインプロセスからの効果音再生要求
            window.electronAPI.onPlaySound((event, soundType) => {
                const button = document.querySelector(`[data-sound="${soundType}"]`);
                if (button) {
                    this.playSound(soundType, button);
                }
            });

            // メインプロセスからの全停止要求
            window.electronAPI.onStopAllSounds(() => {
                this.stopAllSounds();
            });

            // メインプロセスからのミュート切り替え要求
            window.electronAPI.onToggleMute(() => {
                this.toggleMute();
            });
        }
    }

    playSound(soundType, button) {
        if (this.isMuted) return;

        // ボタンのアニメーション
        button.classList.add('playing');
        setTimeout(() => {
            button.classList.remove('playing');
        }, 500);

        // 効果音を再生
        if (this.sounds[soundType]) {
            this.sounds[soundType]();
            this.updateStatus(`${button.textContent}を再生しました`);
        }
    }

    stopAllSounds() {
        // Web Audio APIでは直接的な停止機能がないため、
        // 新しいAudioContextを作成して既存の音を停止
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.updateStatus('全ての効果音を停止しました');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteButton = document.getElementById('muteToggle');
        
        if (this.isMuted) {
            muteButton.textContent = '🔊 ミュート解除';
            this.updateStatus('ミュートにしました');
        } else {
            muteButton.textContent = '🔇 ミュート';
            this.updateStatus('ミュートを解除しました');
        }
    }

    updateStatus(message) {
        const statusElement = document.getElementById('status');
        statusElement.textContent = message;
        
        // 3秒後に元のメッセージに戻す
        setTimeout(() => {
            statusElement.textContent = '準備完了 - ボタンをクリックして効果音を再生してください';
        }, 3000);
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new SoundPlayer();
}); 