class SoundPlayer {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.currentlyPlaying = null;
        this.selectedDeviceId = '';
        this.audioDevices = [];
        this.playingNodes = [];
        this.presetAudioFiles = {
            notification: 'sounds/決定ボタンを押す27.mp3',
            success: 'sounds/クイズ正解2.mp3',
            error: 'sounds/クイズ不正解2.mp3'
        };
        this.init();
    }

    async init() {
        await this.loadAudioDevices();
        this.createSounds();
        this.setupEventListeners();
        this.updateStatus('効果音プレイヤーが準備完了しました');
    }

    async loadAudioDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
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
        this.sounds.notification = () => this._playPresetAudio('notification');
        this.sounds.success = () => this._playPresetAudio('success');
        this.sounds.error = () => this._playPresetAudio('error');
        this.customSounds = {
            custom1: null,
            custom2: null,
            custom3: null
        };
    }

    async _playPresetAudio(type) {
        const audio = new Audio(this.presetAudioFiles[type]);
        audio.volume = this.volume;
        audio.datasetSound = type;
        if (this.selectedDeviceId && typeof audio.setSinkId === 'function') {
            try {
                await audio.setSinkId(this.selectedDeviceId);
            } catch (e) {
                this.updateStatus('デバイス切り替えに失敗しました: ' + e.message);
            }
        }
        audio.play();
        this.playingNodes.push(audio);
        audio.onended = () => {
            this._removeNode(audio);
        };
    }

    setupEventListeners() {
        document.querySelectorAll('.sound-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const soundType = e.target.dataset.sound;
                // カスタム音が未登録の場合はファイル選択ダイアログを表示
                if (["custom1","custom2","custom3"].includes(soundType) && !this.customSounds[soundType]) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.style.display = 'none';
                    document.body.appendChild(input);
                    input.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (file && file.type.startsWith('audio/')) {
                            const url = URL.createObjectURL(file);
                            this.customSounds[soundType] = { url, file };
                            this.updateStatus('音声ファイルを登録しました: ' + file.name);
                            // ボタンラベル変更
                            const baseName = file.name.replace(/\.[^/.]+$/, "");
                            button.textContent = baseName;
                            this.promptLabelEdit(button);
                        } else {
                            this.updateStatus('音声ファイルのみ登録できます');
                        }
                        document.body.removeChild(input);
                    });
                    input.click();
                    return;
                }
                if (this._isSoundPlaying(soundType)) {
                    this._stopSound(soundType);
                    e.target.blur();
                    return;
                }
                this.playSound(soundType, e.target);
                e.target.blur();
            });

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
                        const baseName = file.name.replace(/\.[^/.]+$/, "");
                        button.textContent = baseName;
                        this.promptLabelEdit(button);
                    } else {
                        this.updateStatus('音声ファイルのみ登録できます');
                    }
                });
            }
        });

        document.getElementById('stopAll').addEventListener('click', () => {
            this.stopAllSounds();
        });

        document.getElementById('muteToggle').addEventListener('click', () => {
            this.toggleMute();
        });

        const volumeSlider = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');
        volumeSlider.addEventListener('input', (e) => {
            this.volume = e.target.value / 100;
            volumeValue.textContent = `${e.target.value}%`;
            this.playingNodes.forEach(node => {
                if (node instanceof Audio) {
                    node.volume = this.volume;
                }
            });
        });

        const deviceSelect = document.getElementById('audioDevice');
        const refreshButton = document.getElementById('refreshDevices');
        deviceSelect.addEventListener('change', async (e) => {
            this.selectedDeviceId = e.target.value;
            if (typeof this.selectedDeviceId === 'string' && this.selectedDeviceId !== '') {
                for (const node of this.playingNodes) {
                    if (node instanceof Audio && typeof node.setSinkId === 'function') {
                        try {
                            await node.setSinkId(this.selectedDeviceId);
                        } catch (err) {
                            this.updateStatus('デバイス切り替えに失敗しました: ' + err.message);
                        }
                    }
                }
            }
            const selectedOption = deviceSelect.options[deviceSelect.selectedIndex];
            const label = selectedOption ? selectedOption.textContent : '';
            this.updateStatus(`音声出力デバイスを切り替えました: ${label}`);
        });
        refreshButton.addEventListener('click', async () => {
            await this.loadAudioDevices();
            this.updateStatus('デバイスリストを更新しました');
        });

        if (window.electronAPI) {
            window.electronAPI.onPlaySound((event, soundType) => {
                const button = document.querySelector(`[data-sound="${soundType}"]`);
                if (button) {
                    this.playSound(soundType, button);
                }
            });
            window.electronAPI.onStopAllSounds(() => {
                this.stopAllSounds();
            });
            window.electronAPI.onToggleMute(() => {
                this.toggleMute();
            });
        }
    }

    async playSound(soundType, button) {
        if (this.isMuted) return;
        const progressBar = document.querySelector(`.progress-bar[data-sound="${soundType}"]`);
        if (progressBar) progressBar.style.width = '0%';
        if (this.sounds[soundType]) {
            let duration = 0.3;
            if (soundType === 'success') duration = 0.4;
            if (soundType === 'error') duration = 0.4;
            this.sounds[soundType]();
            if (progressBar) {
                this._animateProgressBar(progressBar, duration);
            }
        } else if (this.customSounds[soundType]) {
            const audio = new Audio(this.customSounds[soundType].url);
            audio.volume = this.volume;
            audio.datasetSound = soundType;
            if (this.selectedDeviceId && typeof audio.setSinkId === 'function') {
                try {
                    await audio.setSinkId(this.selectedDeviceId);
                } catch (e) {
                    this.updateStatus('デバイス切り替えに失敗しました: ' + e.message);
                }
            }
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
        this.playingNodes.forEach(node => {
            if (node instanceof Audio) {
                try { node.pause(); node.currentTime = 0; } catch (e) {}
            }
        });
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
        if (["notification","success","error"].includes(soundType)) {
            return this.playingNodes.some(node => node instanceof Audio && !node.paused && node.datasetSound === soundType);
        }
        if (["custom1","custom2","custom3"].includes(soundType)) {
            return this.playingNodes.some(node => node instanceof Audio && !node.paused && node.datasetSound === soundType);
        }
        return false;
    }

    _stopSound(soundType) {
        if (["notification","success","error","custom1","custom2","custom3"].includes(soundType)) {
            this.playingNodes.forEach(node => {
                if (node instanceof Audio && node.datasetSound === soundType) {
                    try { node.pause(); node.currentTime = 0; } catch (e) {}
                }
            });
        }
        const progressBar = document.querySelector(`.progress-bar[data-sound="${soundType}"]`);
        if (progressBar) {
            if (progressBar._rafId) cancelAnimationFrame(progressBar._rafId);
            progressBar.style.width = '0%';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SoundPlayer();
}); 