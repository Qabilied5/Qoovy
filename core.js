let musicFiles = [];
const audioPlayer = new Audio();

document.addEventListener('DOMContentLoaded', () => {
    const folderPicker = document.getElementById('folderPicker');
    const loadFolderBtn = document.getElementById('loadFolderBtn');
    const searchInput = document.querySelector('.search-wrap input');
    const scrollArea = document.querySelector('.scroll-area');

    const npTitle = document.querySelector('.np-title');
    const npArtist = document.querySelector('.np-artist');
    const playBtn = document.querySelector('.play-main');

    loadFolderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        folderPicker.click();
    });

    folderPicker.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        musicFiles = files.filter(file => 
            file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name)
        ).map(file => ({
            name: file.name,
            data: file
        }));

        displayResults(musicFiles, ""); 
        alert(`${musicFiles.length} lagu berhasil dimuat!`);
    });

    searchInput.addEventListener('input', (e) => {
        const rawInput = e.target.value;
        const keyword = rawInput.toLowerCase().replace(/\s+/g, '');
        
        if (keyword.trim() === "") {
            displayResults(musicFiles, ""); 
            return;
        }

        const filtered = musicFiles.filter(item => {
            const originalLower = item.name.toLowerCase();
            const cleanFileName = originalLower.replace(/\s+/g, '');
            return originalLower.includes(rawInput.toLowerCase()) || cleanFileName.includes(keyword);
        });

        displayResults(filtered, rawInput);
    });

    window.playSong = (index, isFiltered = false, currentList = []) => {
        const targetList = currentList.length > 0 ? currentList : musicFiles;
        const selected = targetList[index];

        if (selected) {
            const songUrl = URL.createObjectURL(selected.data);
            audioPlayer.src = songUrl;
            audioPlayer.play();

            npTitle.innerText = selected.name.replace(/\.[^/.]+$/, "");
            npArtist.innerText = "Local File";
            
            playBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        }
    };

    let currentActiveList = [];

    window.playSong = (index) => {
    const selected = currentActiveList[index];

    if (selected && selected.data) {

        audioPlayer.pause();
        
        const songUrl = URL.createObjectURL(selected.data);
        audioPlayer.src = songUrl;
        
        audioPlayer.play().catch(err => console.error("Error playing audio:", err));

        const npTitle = document.querySelector('.np-title');
        const npArtist = document.querySelector('.np-artist');
        const playBtn = document.querySelector('.play-main');
        
        if(npTitle) npTitle.innerText = selected.name.replace(/\.[^/.]+$/, "");
        if(npArtist) npArtist.innerText = "Local File";
        
        if(playBtn) playBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    } else {
        console.error("File tidak ditemukan atau data korup");
    }
};

    function displayResults(results, query) {
    const scrollArea = document.querySelector('.scroll-area');
    currentActiveList = results; 

    scrollArea.innerHTML = `
        <div class="section">
            <div class="section-header">
                <div class="section-title">Found ${results.length} files</div>
            </div>
            <div class="track-list">
                ${results.map((item, i) => {

                    const cleanName = item.name.replace(/\.[^/.]+$/, "");
                    const highlightedName = highlightMatch(cleanName, query);
                    
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
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

    function highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.split('').join('.*?')})`, 'gi');
        return text.replace(regex, `<span style="color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.5); font-weight: bold;">$1</span>`);
    }
});

// --- LOGIKA TOMBOL PLAY UTAMA (PAUSE/RESUME) ---
const playBtn = document.querySelector('.play-main');

const updatePlayIcon = (isPlaying) => {
    if (isPlaying) {
        playBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    } else {
        playBtn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }
};

playBtn.addEventListener('click', () => {
    if (!audioPlayer.src) return;

    if (audioPlayer.paused) {
        audioPlayer.play();
        updatePlayIcon(true);
    } else {
        audioPlayer.pause();
        updatePlayIcon(false);
    }
});

// --- UPDATE FUNCTION PLAYSONG ---
let currentActiveIndex = -1;

window.playSong = (index) => {
    const selected = currentActiveList[index];

    if (selected && selected.data) {
        if (currentActiveIndex === index && audioPlayer.paused && audioPlayer.src !== "") {
            audioPlayer.play();
            updatePlayIcon(true);
            return;
        }

        audioPlayer.pause();
        
        const songUrl = URL.createObjectURL(selected.data);
        audioPlayer.src = songUrl;
        currentActiveIndex = index; // -- >> index played song
        
        audioPlayer.play()
            .then(() => updatePlayIcon(true))
            .catch(err => console.error("Error:", err));

        const npTitle = document.querySelector('.np-title');
        if(npTitle) npTitle.innerText = selected.name.replace(/\.[^/.]+$/, "");
    }
};

audioPlayer.addEventListener('ended', () => {
    updatePlayIcon(false);
    // function playNext() update upcoming
});


const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');

audioPlayer.addEventListener('timeupdate', () => {
    if (!isNaN(audioPlayer.duration)) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = percent + "%";
        
        currentTimeEl.innerText = formatTime(audioPlayer.currentTime);
        durationTimeEl.innerText = formatTime(audioPlayer.duration);
    }
});

progressContainer.addEventListener('click', (e) => {
    if (!audioPlayer.src) return;

    const rect = progressContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    
    const percent = Math.min(Math.max(offsetX / width, 0), 1);
    
    audioPlayer.currentTime = percent * audioPlayer.duration;
});

let isDragging = false;
progressContainer.addEventListener('mousedown', () => isDragging = true);
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', (e) => {
    if (isDragging && audioPlayer.src) {
        const rect = progressContainer.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const width = rect.width;
        const percent = Math.min(Math.max(offsetX / width, 0), 1);
        audioPlayer.currentTime = percent * audioPlayer.duration;
    }
});


// VOLUME
const volBar = document.querySelector('.vol-bar');
const muteBtn = document.querySelector('.player-right .ctrl-btn'); // Tombol speaker

const updateVolume = (e) => {
    const rect = volBar.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = rect.width;
    
    let vol = offsetX / width;
    vol = Math.max(0, Math.min(1, vol));
    
    audioPlayer.volume = vol;
    
    volBar.style.setProperty('--vol-width', (vol * 100) + '%');
};

volBar.addEventListener('click', updateVolume);

let isVolDragging = false;
volBar.addEventListener('mousedown', () => isVolDragging = true);
window.addEventListener('mouseup', () => isVolDragging = false);
window.addEventListener('mousemove', (e) => {
    if (isVolDragging) updateVolume(e);
});

// Mute Function (Later)
muteBtn.addEventListener('click', () => {
    if (audioPlayer.volume > 0) {
        audioPlayer.dataset.prevVol = audioPlayer.volume;
        audioPlayer.volume = 0;
        volBar.style.setProperty('--vol-width', '0%');
    } else {
        const prev = audioPlayer.dataset.prevVol || 1;
        audioPlayer.volume = prev;
        volBar.style.setProperty('--vol-width', (prev * 100) + '%');
    }
});