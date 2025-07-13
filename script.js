class SoundPlayer {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.currentlyPlaying = null;
        this.audioContext = null;
        this.selectedDeviceId = '';
        this.audioDevices = [];
        this.playingNodes = [];
        
        this.init();
    }

    async init() {
        // AudioContextの初期化を遅延実行に変更
        // await this.initializeAudioContext();
        // Electron環境ではデバイス選択UIを非表示
        if (window.electronAPI) {
            const deviceControl = document.querySelector('.device-control');
            if (deviceControl) deviceControl.style.display = 'none';
        } else {
            await this.loadAudioDevices();
        }
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
        // プリセット音のみ生成
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
            // ノード管理
            this.playingNodes.push(oscillator, gainNode);
            oscillator.onended = () => {
                this._removeNode(oscillator);
                this._removeNode(gainNode);
            };
        };
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
            this.playingNodes.push(oscillator, gainNode);
            oscillator.onended = () => {
                this._removeNode(oscillator);
                this._removeNode(gainNode);
            };
        };
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
            this.playingNodes.push(oscillator, gainNode);
            oscillator.onended = () => {
                this._removeNode(oscillator);
                this._removeNode(gainNode);
            };
        };
        // カスタム音用の空スロット
        this.customSounds = {
            custom1: null,
            custom2: null,
            custom3: null
        };
    }

    setupEventListeners() {
        // 効果音ボタンのイベントリスナー
        document.querySelectorAll('.sound-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const soundType = e.target.dataset.sound;
                // すでに再生中なら停止
                if (this._isSoundPlaying(soundType)) {
                    this._stopSound(soundType);
                    e.target.blur();
                    return;
                }
                this.playSound(soundType, e.target);
                // フォーカスを外す
                e.target.blur();
            });

            // カスタムボタン用ドラッグ＆ドロップ
            const soundType = button.dataset.sound;
            if (soundType.startsWith('custom')) {
                button.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    button.classList.add('dragover');
                });
                button.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    button.classList.remove('dragover');
                });
                button.addEventListener('drop', (e) => {
                    e.preventDefault();
                    button.classList.remove('dragover');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('audio/')) {
                        const url = URL.createObjectURL(file);
                        this.customSounds[soundType] = { url, file };
                        this.updateStatus('音声ファイルを登録しました: ' + file.name);
                        // ファイル名（拡張子除く）をデフォルトラベルに
                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        button.textContent = baseName;
                        // ラベル編集用テキスト入力
                        this.promptLabelEdit(button);
                    } else {
                        this.updateStatus('音声ファイルのみ登録できます');
                    }
                });
            }
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
            // 再生中のAudio要素やGainNodeの音量も即時反映
            this.playingNodes.forEach(node => {
                if (node instanceof Audio) {
                    node.volume = this.volume;
                }
                if (node instanceof GainNode) {
                    try { node.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime); } catch (e) {}
                }
            });
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
        // document.addEventListener('keydown', (e) => {
        //     const keyMap = {
        //         '1': 'notification',
        //         '2': 'click',
        //         '3': 'success',
        //         '4': 'error',
        //         '5': 'alert',
        //         '6': 'ding',
        //         '7': 'pop',
        //         '8': 'chime'
        //     };
        //
        //     if (keyMap[e.key]) {
        //         const button = document.querySelector(`[data-sound="${keyMap[e.key]}"]`);
        //         if (button) {
        //             this.playSound(keyMap[e.key], button);
        //         }
        //     }
        //
        //     // スペースキーでミュート切り替え
        //     if (e.code === 'Space') {
        //         e.preventDefault();
        //         this.toggleMute();
        //     }
        //
        //     // Escapeキーで全て停止
        //     if (e.code === 'Escape') {
        //         this.stopAllSounds();
        //     }
        // });

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

    async playSound(soundType, button) {
        if (this.isMuted) return;
        // AudioContextの初期化・resumeを最初のユーザー操作時に実行
        if (!this.audioContext) {
            await this.initializeAudioContext();
        } else if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        // 進捗バー取得
        const progressBar = document.querySelector(`.progress-bar[data-sound="${soundType}"]`);
        if (progressBar) progressBar.style.width = '0%';
        // プリセット音
        if (this.sounds[soundType]) {
            let duration = 0.3; // デフォルト: 通知音
            if (soundType === 'success') duration = 0.4;
            if (soundType === 'error') duration = 0.4;
            this.sounds[soundType]();
            if (progressBar) {
                this._animateProgressBar(progressBar, duration);
            }
        } else if (this.customSounds[soundType]) {
            // カスタム音声ファイル再生
            const audio = new Audio(this.customSounds[soundType].url);
            audio.volume = this.volume;
            audio.datasetSound = soundType;
            audio.play();
            this.playingNodes.push(audio);
            audio.onended = () => {
                this._removeNode(audio);
                if (progressBar) progressBar.style.width = '0%';
            };
            if (progressBar) {
                this._animateAudioProgressBar(progressBar, audio);
            }
        } else {
            this.updateStatus('音声が登録されていません');
        }
        // ボタンのアニメーション等は既存通り
        if (button) {
            button.classList.add('active');
            setTimeout(() => button.classList.remove('active'), 150);
        }
    }

    _animateProgressBar(bar, duration) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        bar.style.transition = 'width linear';
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = (timestamp - start) / 1000;
            const percent = Math.min((elapsed / duration) * 100, 100);
            bar.style.width = percent + '%';
            if (elapsed < duration) {
                bar._rafId = requestAnimationFrame(animate);
            } else {
                bar.style.width = '0%';
            }
        };
        if (bar._rafId) cancelAnimationFrame(bar._rafId);
        bar._rafId = requestAnimationFrame(animate);
    }

    _animateAudioProgressBar(bar, audio) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        bar.style.transition = 'width linear';
        const animate = () => {
            if (audio.paused || audio.ended) {
                bar.style.width = '0%';
                return;
            }
            if (audio.duration > 0) {
                const percent = Math.min((audio.currentTime / audio.duration) * 100, 100);
                bar.style.width = percent + '%';
            }
            bar._rafId = requestAnimationFrame(animate);
        };
        if (bar._rafId) cancelAnimationFrame(bar._rafId);
        bar._rafId = requestAnimationFrame(animate);
        audio.onended = () => {
            this._removeNode(audio);
            if (bar._rafId) cancelAnimationFrame(bar._rafId);
            bar.style.width = '0%';
        };
    }

    stopAllSounds() {
        // 再生中のノードをすべて停止
        this.playingNodes.forEach(node => {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                try { node.stop(); } catch (e) {}
            }
            if (node instanceof GainNode) {
                try { node.disconnect(); } catch (e) {}
            }
            if (node instanceof Audio) {
                try { node.pause(); node.currentTime = 0; } catch (e) {}
            }
        });
        // 進捗バーもリセット
        document.querySelectorAll('.progress-bar').forEach(bar => {
            if (bar._rafId) cancelAnimationFrame(bar._rafId);
            bar.style.width = '0%';
        });
        this.playingNodes = [];
        this.updateStatus('全ての効果音を停止しました');
    }
    _removeNode(node) {
        const idx = this.playingNodes.indexOf(node);
        if (idx !== -1) this.playingNodes.splice(idx, 1);
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

    promptLabelEdit(button) {
        const currentLabel = button.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentLabel.replace(/^＋ /, '');
        input.style.width = '80px';
        button.textContent = '';
        button.appendChild(input);
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                button.textContent = input.value;
            }
        });
        input.addEventListener('blur', () => {
            button.textContent = input.value;
        });
    }

    _isSoundPlaying(soundType) {
        // プリセット音: OscillatorNodeがplayingNodesに存在
        if (['notification','success','error'].includes(soundType)) {
            return this.playingNodes.some(node => node instanceof OscillatorNode);
        }
        // カスタム音: Audio要素がplayingNodesに存在し、data-sound一致
        if (['custom1','custom2','custom3'].includes(soundType)) {
            return this.playingNodes.some(node => node instanceof Audio && !node.paused && node.datasetSound === soundType);
        }
        return false;
    }

    _stopSound(soundType) {
        // プリセット音: OscillatorNodeをすべて停止
        if (['notification','success','error'].includes(soundType)) {
            this.playingNodes.forEach(node => {
                if (node instanceof OscillatorNode) {
                    try { node.stop(); } catch (e) {}
                }
            });
        }
        // カスタム音: Audio要素を停止
        if (['custom1','custom2','custom3'].includes(soundType)) {
            this.playingNodes.forEach(node => {
                if (node instanceof Audio && node.datasetSound === soundType) {
                    try { node.pause(); node.currentTime = 0; } catch (e) {}
                }
            });
        }
        // プログレスバーもリセット
        const progressBar = document.querySelector(`.progress-bar[data-sound="${soundType}"]`);
        if (progressBar) {
            if (progressBar._rafId) cancelAnimationFrame(progressBar._rafId);
            progressBar.style.width = '0%';
        }
    }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    new SoundPlayer();
}); 