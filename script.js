// --- DATA AWAL DENGAN FOTO BARANG REALISTIS ---
const INITIAL_DATA = [
    {
        id: "RPT-1001",
        type: "Temuan",
        reporterName: "Budi Santoso",
        reporterClass: "Kelas 10",
        itemName: "Botol Tupperware Biru",
        category: "Botol/Tempat Makan",
        location: "Kantin Sekolah",
        description: "Botol minum Tupperware warna biru tua kapasitas 750ml dengan stiker anime.",
        tags: ["tupperware", "biru", "750ml", "stiker", "kantin"],
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
        date: "2026-10-22 09:30",
        status: "Aktif",
        claimedBy: null
    },
    {
        id: "RPT-1002",
        type: "Hilang",
        reporterName: "Siti Rahma",
        reporterClass: "Kelas 11",
        itemName: "Botol Minum Biru Ada Stiker",
        category: "Botol/Tempat Makan",
        location: "Kantin Sekolah",
        description: "Hilang botol Tupperware warna biru dekat meja kantin.",
        tags: ["botol", "biru", "tupperware", "kantin", "stiker"],
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=80",
        date: "2026-10-22 10:15",
        status: "Aktif",
        claimedBy: null
    },
    {
        id: "RPT-1003",
        type: "Temuan",
        reporterName: "Ahmad Rizky",
        reporterClass: "Kelas 12",
        itemName: "Kunci Motor Honda + Gantungan Leather",
        category: "Kunci",
        location: "Lapangan Olahraga",
        description: "Kunci motor Honda ditemukan tergeletak di tribun lapangan olahraga.",
        tags: ["kunci", "motor", "honda", "dompet", "stnk", "kulit"],
        image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=80",
        date: "2026-10-21 14:00",
        status: "Aktif",
        claimedBy: null
    }
];

let reportsData = [];
let currentUser = null; 
let activeImageBase64 = null; // Menyimpan data gambar Base64 dari foto hasil pemindaian/kamera

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    const savedData = localStorage.getItem('findit_reports');
    if (savedData) {
        try { 
            reportsData = JSON.parse(savedData); 
        } catch (e) { 
            reportsData = [...INITIAL_DATA]; 
        }
    } else {
        reportsData = [...INITIAL_DATA];
        saveToLocalStorage();
    }

    const savedUser = localStorage.getItem('findit_session_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
        } catch (e) {
            currentUser = null;
        }
    }

    updateAuthUI();
    renderData();
    calculateAIMatches();
    updateStatistics();
});

function saveToLocalStorage() {
    localStorage.setItem('findit_reports', JSON.stringify(reportsData));
}

// --- FUNGSI MENGAMBIL FOTO/UNGGAH FOTO LANGSUNG ---
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        // Kompresi atau pembacaan gambar menjadi format DataURL (Base64)
        const reader = new FileReader();
        reader.onload = function(e) {
            activeImageBase64 = e.target.result; // Menyimpan foto asli yang di-upload/foto kamera
            const previewImg = document.getElementById('imagePreview');
            const previewContainer = document.getElementById('imagePreviewContainer');
            if (previewImg && previewContainer) {
                previewImg.src = e.target.result;
                previewContainer.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    }
}

function clearImagePreview() {
    activeImageBase64 = null;
    const fileInput = document.getElementById('itemImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.classList.add('hidden');
}

// --- SUBMIT LAPORAN DENGAN FOTO LANGSUNG ---
function submitReport(event) {
    event.preventDefault();
    if (!currentUser) {
        alert("Silakan login terlebih dahulu untuk memfoto dan melaporkan barang.");
        return;
    }

    const reportTypeEl = document.querySelector('input[name="reportType"]:checked');
    const itemNameEl = document.getElementById('itemName');
    const categoryEl = document.getElementById('itemCategory');
    const locationEl = document.getElementById('itemLocation');
    const descriptionEl = document.getElementById('itemDesc');

    if (!reportTypeEl || !itemNameEl || !descriptionEl) return;

    const reportType = reportTypeEl.value;
    const itemName = itemNameEl.value.trim();
    const category = categoryEl ? categoryEl.value : 'Lainnya';
    const location = locationEl ? locationEl.value : 'Lainnya';
    const description = descriptionEl.value.trim();

    // Ekstraksi Tag Otomatis oleh AI
    const stopWords = ["yang", "di", "ke", "dari", "pada", "dalam", "dengan", "dan", "atau", "ini", "itu", "ada"];
    const words = (itemName + " " + description).toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
    const tags = [...new Set(words.filter(w => w.length > 2 && !stopWords.includes(w)))];

    // Placeholder jika penemu/pelapor tidak mengunggah foto
    const fallbackImg = reportType === 'Hilang' 
        ? "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&auto=format&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=80";

    // FOTO YANG DITAMPILKAN ADALAH FOTO HASIL KAMERA / UPLOAD (activeImageBase64)
    const finalImage = activeImageBase64 ? activeImageBase64 : fallbackImg;

    const newReport = {
        id: "RPT-" + Math.floor(1000 + Math.random() * 9000),
        type: reportType,
        reporterName: currentUser.name,
        reporterClass: currentUser.class,
        itemName,
        category,
        location,
        description,
        tags,
        image: finalImage, // Gambar foto barang langsung disimpan
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: "Aktif",
        claimedBy: null
    };

    reportsData.unshift(newReport);
    saveToLocalStorage();

    // Reset Form
    const form = document.getElementById('reportForm');
    if (form) form.reset();
    clearImagePreview();

    generateAutoTags();
    renderData();
    calculateAIMatches();
    updateStatistics();

    alert("Berhasil! Laporan barang beserta foto langsung telah ditambahkan ke layar utama.");
}

// --- RENDER DAFAR BARANG DI LAYAR UTAMA (KATALOG) ---
function renderData() {
    const container = document.getElementById('itemsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterTypeEl = document.getElementById('filterType');

    if (!container) return;

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const filterType = filterTypeEl ? filterTypeEl.value : 'Semua';

    const filtered = reportsData.filter(item => {
        const itemTags = item.tags || [];
        const matchesSearch = item.itemName.toLowerCase().includes(search) || 
                              item.description.toLowerCase().includes(search) || 
                              item.location.toLowerCase().includes(search) ||
                              itemTags.some(t => t.toLowerCase().includes(search));
        
        let matchesType = true;
        if (filterType === 'Selesai') {
            matchesType = (item.status === 'Selesai');
        } else if (filterType !== 'Semua') {
            matchesType = (item.type === filterType && item.status === 'Aktif');
        }

        return matchesSearch && matchesType;
    });

    const badge = document.getElementById('totalItemsBadge');
    if (badge) badge.innerText = `${filtered.length} Barang`;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <i class="fa-solid fa-box-open text-3xl text-slate-300 mb-2"></i>
                <p class="text-xs text-slate-500 font-semibold">Tidak ditemukan laporan yang cocok.</p>
            </div>
        `;
        return;
    }

    // Tampilkan Foto Barang secara langsung di Feed Layar Utama
    container.innerHTML = filtered.map(item => `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
                <!-- MENAMPILKAN FOTO BARANG LANGSUNG -->
                <div class="relative h-44 bg-slate-100">
                    <img src="${item.image}" alt="${item.itemName}" class="w-full h-full object-cover">
                    <span class="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${item.type === 'Hilang' ? 'bg-rose-500' : 'bg-emerald-500'} shadow">
                        ${item.type}
                    </span>
                    ${item.status === 'Selesai' ? '<span class="absolute top-2 right-2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">VERIFIKASI TERKLAIM</span>' : ''}
                </div>
                <div class="p-3.5 space-y-1">
                    <h4 class="font-bold text-xs text-slate-800 line-clamp-1">${item.itemName}</h4>
                    <p class="text-[11px] text-slate-500 line-clamp-2">${item.description}</p>
                    <p class="text-[10px] text-indigo-600 font-semibold"><i class="fa-solid fa-location-dot"></i> ${item.location}</p>
                </div>
            </div>
            <div class="p-3 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[10px] text-slate-400">Oleh: ${item.reporterName}</span>
                <button onclick="openDetailModal('${item.id}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-lg transition">
                    Lihat Foto & Detail <i class="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// --- SWITCH TAB MENU ---
function switchTab(tab) {
    const btnLapor = document.getElementById('tabLapor');
    const btnMatch = document.getElementById('tabMatch');
    const btnStat = document.getElementById('tabStat');

    const contentLapor = document.getElementById('tabContentLapor');
    const contentMatch = document.getElementById('tabContentPencocokan');
    const contentStat = document.getElementById('tabContentStatistik');

    [btnLapor, btnMatch, btnStat].forEach(btn => {
        if (btn) {
            btn.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-100 relative";
        }
    });

    if (contentLapor) contentLapor.classList.add('hidden');
    if (contentMatch) contentMatch.classList.add('hidden');
    if (contentStat) contentStat.classList.add('hidden');

    if (tab === 'lapor') {
        if (btnLapor) btnLapor.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-sm";
        if (contentLapor) contentLapor.classList.remove('hidden');
        renderData();
    } else if (tab === 'pencocokan') {
        if (btnMatch) btnMatch.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-sm relative";
        if (contentMatch) contentMatch.classList.remove('hidden');
        calculateAIMatches();
    } else if (tab === 'statistik') {
        if (btnStat) btnStat.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-sm";
        if (contentStat) contentStat.classList.remove('hidden');
        updateStatistics();
    }
}

// --- SYSTEM LOGIN & AUTH ---
function openLoginModal(roleType) {
    const modal = document.getElementById('loginModal');
    const roleInput = document.getElementById('loginRoleType');
    const modalTitle = document.getElementById('loginModalTitle');
    const classGroup = document.getElementById('classInputGroup');
    const passGroup = document.getElementById('passInputGroup');

    if (!modal || !roleInput || !modalTitle) return;

    roleInput.value = roleType;

    if (roleType === 'admin') {
        modalTitle.innerText = "Login Guru BK / Admin Verifikator";
        if (classGroup) classGroup.classList.add('hidden');
        if (passGroup) passGroup.classList.remove('hidden');
    } else {
        modalTitle.innerText = "Login / Reg Penemu Barang";
        if (classGroup) classGroup.classList.remove('hidden');
        if (passGroup) passGroup.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.classList.add('hidden');
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const roleType = document.getElementById('loginRoleType')?.value;
    const name = document.getElementById('loginName')?.value.trim();
    const userClass = document.getElementById('loginClass')?.value;
    const pass = document.getElementById('loginPass')?.value;

    if (!name) return;

    if (roleType === 'admin') {
        if (pass !== 'admin123') {
            alert('Password Admin salah! (Password default: admin123)');
            return;
        }
        currentUser = { name, role: 'admin', class: 'Guru BK / Tim Kesiswaan' };
    } else {
        currentUser = { name, role: 'penemu', class: userClass || 'Siswa' };
    }

    localStorage.setItem('findit_session_user', JSON.stringify(currentUser));
    closeLoginModal();
    updateAuthUI();
    renderData();
    calculateAIMatches();
    updateStatistics();
    alert(`Selamat datang, ${currentUser.name}! Anda dapat mengambil foto dan mengunggah barang temuan.`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem('findit_session_user');
    updateAuthUI();
    renderData();
    calculateAIMatches();
    updateStatistics();
    alert('Anda telah keluar.');
}

function updateAuthUI() {
    const container = document.getElementById('authStatusContainer');
    const loggedOutForm = document.getElementById('formLoggedOutState');
    const loggedInForm = document.getElementById('formLoggedInState');
    const bkBanner = document.getElementById('bkBanner');
    const reporterBadge = document.getElementById('reporterBadge');

    if (!container) return;

    if (currentUser) {
        container.innerHTML = `
            <div class="flex items-center gap-2 bg-indigo-800/80 px-3 py-1.5 rounded-xl border border-indigo-500/40 text-xs">
                <i class="fa-solid ${currentUser.role === 'admin' ? 'fa-user-shield text-amber-300' : 'fa-user-check text-emerald-300'}"></i>
                <div>
                    <p class="font-bold text-white leading-tight">${currentUser.name}</p>
                    <p class="text-[10px] text-indigo-200">${currentUser.class}</p>
                </div>
                <button onclick="logout()" class="ml-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                    Keluar
                </button>
            </div>
        `;

        if (loggedOutForm) loggedOutForm.classList.add('hidden');
        if (loggedInForm) loggedInForm.classList.remove('hidden');
        if (reporterBadge) reporterBadge.innerText = `${currentUser.name} (${currentUser.class})`;

        if (currentUser.role === 'admin') {
            if (bkBanner) bkBanner.classList.remove('hidden');
        } else {
            if (bkBanner) bkBanner.classList.add('hidden');
        }
    } else {
        container.innerHTML = `
            <button onclick="openLoginModal('penemu')" class="bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm">
                <i class="fa-solid fa-right-to-bracket mr-1"></i> Login Penemu
            </button>
            <button onclick="openLoginModal('admin')" class="bg-indigo-800 hover:bg-indigo-900 text-indigo-100 text-xs font-bold px-3 py-2 rounded-xl transition border border-indigo-600">
                <i class="fa-solid fa-shield-halved"></i> BK
            </button>
        `;

        if (loggedOutForm) loggedOutForm.classList.remove('hidden');
        if (loggedInForm) loggedInForm.classList.add('hidden');
        if (bkBanner) bkBanner.classList.add('hidden');
    }
}

// --- AI MATCHING ENGINE ---
function calculateAIMatches() {
    const container = document.getElementById('aiMatchContainer');
    const matchBadge = document.getElementById('matchBadge');

    const activeLost = reportsData.filter(i => i.type === 'Hilang' && i.status === 'Aktif');
    const activeFound = reportsData.filter(i => i.type === 'Temuan' && i.status === 'Aktif');

    const matches = [];

    activeLost.forEach(lost => {
        activeFound.forEach(found => {
            let score = 0;
            const lostTags = lost.tags || [];
            const foundTags = found.tags || [];

            if (lost.category === found.category) score += 35;
            if (lost.location === found.location) score += 25;

            const sharedTags = lostTags.filter(t => foundTags.includes(t));
            const minLen = Math.min(lostTags.length, foundTags.length);
            if (minLen > 0) {
                const ratio = sharedTags.length / minLen;
                score += Math.round(ratio * 40);
            }

            score = Math.min(score, 98);

            if (score >= 40) {
                matches.push({ lost, found, score, sharedTags });
            }
        });
    });

    matches.sort((a, b) => b.score - a.score);

    if (matchBadge) {
        matchBadge.innerText = matches.length;
        if (matches.length > 0) matchBadge.classList.remove('hidden');
        else matchBadge.classList.add('hidden');
    }

    if (!container) return;

    if (matches.length === 0) {
        container.innerHTML = `
            <div class="py-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <i class="fa-solid fa-wand-magic-sparkles text-3xl text-indigo-300 mb-2"></i>
                <p class="text-xs font-semibold text-slate-600">Belum ada potensi kecocokan yang terdeteksi oleh AI.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = matches.map(m => `
        <div class="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="text-xs font-bold px-2.5 py-1 rounded-lg ${m.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} flex items-center gap-1">
                    <i class="fa-solid fa-bolt"></i> Match Score: ${m.score}%
                </span>
                <span class="text-[11px] text-slate-500 font-semibold">Kategori: ${m.lost.category}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="bg-rose-50/60 p-3 rounded-xl border border-rose-100 flex gap-2">
                    <img src="${m.lost.image}" class="w-14 h-14 object-cover rounded-lg">
                    <div>
                        <span class="text-[10px] font-bold text-rose-600 uppercase">Barang Hilang</span>
                        <h5 class="font-bold text-xs text-slate-800">${m.lost.itemName}</h5>
                        <p class="text-[10px] text-slate-500 line-clamp-1">${m.lost.description}</p>
                    </div>
                </div>

                <div class="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex gap-2">
                    <img src="${m.found.image}" class="w-14 h-14 object-cover rounded-lg">
                    <div>
                        <span class="text-[10px] font-bold text-emerald-600 uppercase">Barang Temuan</span>
                        <h5 class="font-bold text-xs text-slate-800">${m.found.itemName}</h5>
                        <p class="text-[10px] text-slate-500 line-clamp-1">${m.found.description}</p>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between pt-1">
                <div class="flex items-center gap-1 flex-wrap">
                    <span class="text-[10px] font-bold text-slate-400">Kata Kunci Cocok:</span>
                    ${m.sharedTags.map(t => `<span class="bg-indigo-50 text-indigo-600 text-[10px] font-medium px-1.5 py-0.5 rounded">#${t}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// --- UPDATE STATISTIK ---
function updateStatistics() {
    const elTotal = document.getElementById('statTotal');
    const elTemuan = document.getElementById('statTemuan');
    const elHilang = document.getElementById('statHilang');
    const elSelesai = document.getElementById('statSelesai');

    const total = reportsData.length;
    const temuan = reportsData.filter(r => r.type === 'Temuan' && r.status === 'Aktif').length;
    const hilang = reportsData.filter(r => r.type === 'Hilang' && r.status === 'Aktif').length;
    const selesai = reportsData.filter(r => r.status === 'Selesai').length;

    if (elTotal) elTotal.innerText = total;
    if (elTemuan) elTemuan.innerText = temuan;
    if (elHilang) elHilang.innerText = hilang;
    if (elSelesai) elSelesai.innerText = selesai;
}

// --- MODAL DETAIL & TAMPILAN FOTO PENUH ---
function openDetailModal(id) {
    const item = reportsData.find(r => r.id === id);
    if (!item) return;

    const modal = document.getElementById('detailModal');
    const content = document.getElementById('modalContent');
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!modal || !content) return;

    content.innerHTML = `
        <div class="space-y-3">
            <!-- DISPLAY FOTO ASLI HASIL KAMERA/UPLOAD DI MODAL -->
            <div class="relative h-56 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <img src="${item.image}" alt="${item.itemName}" class="w-full h-full object-cover">
                <span class="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${item.type === 'Hilang' ? 'bg-rose-500' : 'bg-emerald-500'}">
                    ${item.type}
                </span>
            </div>

            <h3 class="font-bold text-base text-slate-800">${item.itemName}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">${item.description}</p>

            <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><strong>Lokasi Kejadian:</strong> ${item.location}</p>
                <p><strong>Pelapor:</strong> ${item.reporterName} (${item.reporterClass})</p>
                <p><strong>Waktu Lapor:</strong> ${item.date}</p>
                <p><strong>Status:</strong> ${item.status}</p>
                ${item.claimedBy ? `<p class="text-emerald-600 font-bold"><strong>Pengambil Terverifikasi:</strong> ${item.claimedBy}</p>` : ''}
            </div>

            <div class="pt-2">
                ${item.status === 'Aktif' ? `
                    ${isAdmin ? `
                        <div class="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2">
                            <p class="text-xs font-bold text-amber-800">Verifikasi Pengambil (Admin BK):</p>
                            <input type="text" id="claimerInputName" placeholder="Nama Siswa Pengambil" class="w-full px-2 py-1.5 text-xs border rounded-lg focus:outline-none">
                            <button onclick="verifyClaimByAdmin('${item.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition">
                                Selesaikan & Verifikasi Pengambilan
                            </button>
                        </div>
                    ` : `
                        <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center space-y-2">
                            <p class="text-xs text-indigo-800 font-medium">Ini barang Anda yang hilang?</p>
                            <button onclick="claimNotice('${item.id}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition">
                                <i class="fa-solid fa-hand-holding mr-1"></i> Klaim Pengambilan di Ruang BK
                            </button>
                        </div>
                    `}
                ` : `
                    <div class="text-center bg-slate-100 py-2 rounded-xl text-xs font-bold text-slate-500">
                        Barang ini telah diverifikasi & diserahkan oleh BK.
                    </div>
                `}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function verifyClaimByAdmin(id) {
    const claimerName = document.getElementById('claimerInputName')?.value.trim();
    if (!claimerName) {
        alert("Masukkan nama siswa pengambil barang.");
        return;
    }

    const item = reportsData.find(r => r.id === id);
    if (item) {
        item.status = 'Selesai';
        item.claimedBy = claimerName;
        saveToLocalStorage();
        closeModal();
        renderData();
        calculateAIMatches();
        updateStatistics();
        alert(`Verifikasi berhasil! Barang diserahkan kepada ${claimerName}`);
    }
}

function claimNotice(id) {
    alert(`[PETUNJUK PENGAMBILAN]\nTunjukkan Kartu Pelajar Anda ke Guru BK di Ruang BK untuk mencocokkan fisik barang ini (ID: ${id}).`);
}

function closeModal() {
    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.add('hidden');
}

function generateAutoTags() {
    const text = document.getElementById('itemDesc')?.value || '';
    const container = document.getElementById('tagContainer');
    if (!container) return;

    const stopWords = ["yang", "di", "ke", "dari", "pada", "dalam", "dengan", "dan", "atau", "ini"];
    const words = text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    const unique = [...new Set(words)].slice(0, 5);

    container.innerHTML = unique.map(t => `<span class="bg-indigo-100 text-indigo-700 text-[10px] font-medium px-1.5 py-0.5 rounded">#${t}</span>`).join('') || '<span class="text-[10px] text-slate-400 italic">Ketik deskripsi...</span>';
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportsData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Laporan_Barang_Hilang_${new Date().toISOString().substring(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function resetData() {
    if (confirm("Reset data ke setelan awal?")) {
        reportsData = [...INITIAL_DATA];
        saveToLocalStorage();
        renderData();
        calculateAIMatches();
        updateStatistics();
        alert("Data telah di-reset.");
    }
}

function toggleChatbot() {
    const window = document.getElementById('chatWindow');
    if (window) window.classList.toggle('hidden');
}

function sendChatMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    const chatLogs = document.getElementById('chatLogs');
    if (!chatLogs) return;

    chatLogs.innerHTML += `<div class="flex gap-2 justify-end"><div class="bg-indigo-600 text-white p-2 rounded-xl text-xs">${query}</div></div>`;
    input.value = '';
    chatLogs.scrollTop = chatLogs.scrollHeight;

    setTimeout(() => {
        chatLogs.innerHTML += `<div class="flex gap-2 items-start"><div class="bg-indigo-600 text-white p-1 rounded-full text-[10px]"><i class="fa-solid fa-robot"></i></div><div class="bg-white p-2 rounded-xl border text-xs text-slate-700">Silakan bawa Kartu Pelajar ke Ruang BK untuk proses verifikasi.</div></div>`;
        chatLogs.scrollTop = chatLogs.scrollHeight;
    }, 500);
}
