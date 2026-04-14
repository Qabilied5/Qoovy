// --- 1. GLOBAL VARIABLES ---
let musicFiles = [];
window.musicQueue = [];
let currentActiveList = [];
let currentActiveIndex = -1;
let isDragging = false;
let isVolDragging = false;

const audioPlayer = new Audio();

// --- 2. HELPERS ---
const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
};

const updatePlayIcon = (isPlaying) => {
    const playBtn = document.querySelector('.play-main');
    if (!playBtn) return;
    playBtn.innerHTML = isPlaying 
        ? `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
};

// --- 3. CORE FUNCTIONS ---
function playDirectly(songObj) {
    if (!songObj || !songObj.data) return;
    
    audioPlayer.pause();
    // Membersihkan memory dari URL lama
    if (audioPlayer.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioPlayer.src);
    }

    const songUrl = URL.createObjectURL(songObj.data);
    audioPlayer.src = songUrl;
    
    audioPlayer.play()
        .then(() => updatePlayIcon(true))
        .catch(err => console.error("Playback Error:", err));

    const npTitle = document.querySelector('.np-title');
    if(npTitle) npTitle.innerText = songObj.name.replace(/\.[^/.]+$/, "");
}

window.playNextInQueue = () => {
    if (musicQueue.length > 0) {
        playDirectly(musicQueue.shift());
    } else if (currentActiveIndex + 1 < currentActiveList.length) {
        window.playSong(currentActiveIndex + 1);
    } else {
        updatePlayIcon(false);
        alert("Playlist berakhir.");
    }
};

window.playSong = (index) => {
    const selected = currentActiveList[index];
    if (selected) {
        if (currentActiveIndex === index && audioPlayer.paused && audioPlayer.src !== "") {
            audioPlayer.play();
            updatePlayIcon(true);
            return;
        }
        currentActiveIndex = index;
        playDirectly(selected);
    }
};

window.addToQueue = (index, event) => {
    event.stopPropagation();
    const song = currentActiveList[index];
    if (song) {
        musicQueue.push(song);
        alert(`Ditambah ke antrian: ${song.name}`);
    }
};

// --- 4. DOM EVENTS (SEMUA LOGIKA TOMBOL DI SINI) ---
document.addEventListener('DOMContentLoaded', () => {
    const folderPicker = document.getElementById('folderPicker');
    const loadFolderBtn = document.getElementById('loadFolderBtn');
    
    const searchInput = document.querySelector('.search-wrap input');
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Filter dari daftar file utama (musicFiles)
        const filteredSongs = musicFiles.filter(song => 
            song.name.toLowerCase().includes(query)
        );

        // Render ulang UI dengan hasil filter dan highlight
        window.displayResults(filteredSongs, query);
    });

    const playBtn = document.querySelector('.play-main');
    const nextBtn = document.querySelector('.controls .ctrl-btn:nth-child(4)');
    const progressContainer = document.getElementById('progress-container');
    const volBar = document.querySelector('.vol-bar') || document.getElementById('vol-container');
    const muteBtn = document.getElementById('mute-btn');

    // FIX: Folder Loading Logic
    loadFolderBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        folderPicker.click();
    });

    folderPicker?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        musicFiles = files.filter(file => 
            file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name)
        ).map(file => ({ name: file.name, data: file }));

        window.displayResults(musicFiles, ""); 
        alert(`${musicFiles.length} lagu berhasil dimuat!`);
    });

    // Main Control
    playBtn?.addEventListener('click', () => {
        if (!audioPlayer.src) return;
        audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
        updatePlayIcon(!audioPlayer.paused);
    });

    nextBtn?.addEventListener('click', () => window.playNextInQueue());
    audioPlayer.addEventListener('ended', () => window.playNextInQueue());

    // Progress Update
    audioPlayer.addEventListener('timeupdate', () => {
        const fill = document.getElementById('progress-fill');
        const curEl = document.getElementById('current-time');
        const durEl = document.getElementById('duration-time');
        
        if (!isNaN(audioPlayer.duration)) {
            const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            if (fill) fill.style.width = percent + "%";
            if (curEl) curEl.innerText = formatTime(audioPlayer.currentTime);
            if (durEl) durEl.innerText = formatTime(audioPlayer.duration);
        }
    });

    // Scrubbing Logic
    const handleScrub = (e) => {
        if (!audioPlayer.src) return;
        const rect = progressContainer.getBoundingClientRect();
        const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        audioPlayer.currentTime = percent * audioPlayer.duration;
    };

    progressContainer?.addEventListener('mousedown', (e) => { isDragging = true; handleScrub(e); });

    // Volume Logic
    const handleVol = (e) => {
        const rect = volBar.getBoundingClientRect();
        const vol = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        audioPlayer.volume = vol;
        volBar.style.setProperty('--vol-width', (vol * 100) + '%');
    };

    volBar?.addEventListener('mousedown', (e) => { isVolDragging = true; handleVol(e); });

    // Global Mouse Handlers
    window.addEventListener('mouseup', () => { isDragging = false; isVolDragging = false; });
    window.addEventListener('mousemove', (e) => {
        if (isDragging) handleScrub(e);
        if (isVolDragging) handleVol(e);
    });
});

// --- 5. UI RENDER ---
window.displayResults = (results, query) => {
    const scrollArea = document.querySelector('.scroll-area');
    if (!scrollArea) return;
    currentActiveList = results; 

    scrollArea.innerHTML = `
        <div class="section">
            <div class="section-header">
                <div class="section-title">Found ${results.length} files</div>
            </div>
            <div class="track-list">
                ${results.map((item, i) => {
                    const cleanName = item.name.replace(/\.[^/.]+$/, "");
                    const highlightedName = window.highlightMatch(cleanName, query);
                    
                    return `
                        <div class="track-item" onclick="playSong(${i})" style="cursor:pointer;">
                            <div class="track-num">${i + 1}</div>
                            
                            <div class="track-play-icon">
                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            </div>

                            <div class="track-art" style="background: linear-gradient(45deg, #6366f1, #a855f7); opacity: 0.6;"></div>

                            <div class="track-info">
                                <div class="track-name">${highlightedName}</div>
                                <div class="track-artist-name">QoovyMusic</div>
                            </div>

                            <div class="track-add-queue" onclick="addToQueue(${i}, event)" title="Add to Queue" style="margin-left: auto; padding: 5px; cursor: pointer;">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};

window.highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(regex, `<span class="highlight">$1</span>`);
};
