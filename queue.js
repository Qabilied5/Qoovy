// Fungsi untuk buka/tutup popup
window.toggleQueue = (show) => {
    const popup = document.getElementById('queue-popup');
    if (!popup) return;

    if (show) {
        renderQueueItems(); // Selalu refresh data sebelum tampil
        popup.style.display = 'flex';
        // Memberikan class aktif untuk trigger animasi CSS jika ada
        popup.classList.add('active'); 
    } else {
        popup.style.display = 'none';
        popup.classList.remove('active');
    }
};

// Fungsi memproses list antrean ke dalam HTML
function renderQueueItems() {
    const container = document.getElementById('queue-items-container');
    if (!container) return;
    
    // Mengambil data dari window.musicQueue yang diisi oleh core.js
    const queue = window.musicQueue || [];
    
    // Tampilan jika antrean kosong
    if (queue.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px; color: #888;">
                <p style="margin-bottom: 5px; font-weight: 500;">Antrean Kosong</p>
                <small>Klik ikon "+" pada lagu untuk menambah</small>
            </div>`;
        return;
    }

    // Render list lagu menggunakan map
    container.innerHTML = queue.map((song, index) => {
        // Membersihkan ekstensi file untuk tampilan nama
        const cleanName = song.name.replace(/\.[^/.]+$/, "");
        
        return `
            <div class="queue-item" style="display: flex; align-items: center; padding: 12px; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;">
                <div class="q-art" style="width:40px; height:40px; background: linear-gradient(45deg, #6366f1, #a855f7); border-radius: 8px; flex-shrink: 0;"></div>
                <div class="q-info" style="flex: 1; min-width: 0;">
                    <div class="q-name" style="font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">
                        ${cleanName}
                    </div>
                    <div class="q-artist" style="font-size: 0.75rem; color: #888;">Local Audio</div>
                </div>
                <div class="q-index" style="color: #6366f1; font-size: 0.8rem; font-weight: 600; opacity: 0.6;">
                    #${index + 1}
                </div>
            </div>
        `;
    }).join('');
}

// Menutup popup jika user mengklik bagian background yang blur
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('queue-popup');
    const queueBtn = document.getElementById('queue-btn');

    // Menutup popup jika user mengklik area background (overlay)
    popup?.addEventListener('click', (e) => {
        if (e.target === popup) {
            window.toggleQueue(false);
        }
    });

    // Memastikan tombol queue-btn memicu toggleQueue
    queueBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        window.toggleQueue(true);
    });
});