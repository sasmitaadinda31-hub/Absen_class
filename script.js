const STORAGE_STUDENTS = "ABSENSI_XII_RPL_STUDENTS";
const STORAGE_RECORDS = "ABSENSI_XII_RPL_RECORDS";

const defaultSiswa = [
  "AISYAH HARI AFIKA LIAWATI",
  "Andika Wahyu Utama",
  "Anita",
  "AUREL EFFILIAN NADIJUWA PUTRI",
  "CHAIDARUR ROHMAN",
  "CHARISSA MARTHA DEWI",
  "DINDA NUR LANIA DEWI",
  "DWI ASTUTI",
  "ERDIVA BERLIANA PUTRI",
  "Keany Agatha Nadzif",
  "KHOIRUN NIYSA",
  "Khoyrul Rahmandhani",
  "KIRANA DWI RAHMAYANI",
  "Kusnul Khotimah",
  "Lila Nur Latifah",
  "LUKMAN ARDIANSYAH ROMADHONI",
  "MACHFUDZ KHASAN",
  "MAR'ATUS SHOLIHAH",
  "MARSYA NISWA AZZAHRA",
  "Moh. Rafael Rizky Abadi",
  "NOVITA ANGGRAENI",
  "NUR KHASAN",
  "NUR KHOLIFAH",
  "RENATHA PUTRI",
  "Rifa Arinal Haq",
  "Ririn Ida Aulia",
  "RISMA VINUSTIKA",
  "SASMITA ADINDA PUTRI",
  "SHAFA ATIKA ZAHRA",
  "Sholekha",
  "SILVIA NUR ROHMAH",
  "SUPRIADI",
  "Tiara Celcilya Putri",
  "WAHIDATUL MUHAROM"
];

// 1. Pastikan data 34 siswa selalu tersedia di localStorage
function initStudents() {
    const existing = localStorage.getItem(STORAGE_STUDENTS);
    if (!existing || JSON.parse(existing).length === 0) {
        const formatted = defaultSiswa.map((nama, index) => ({
            id: index + 1,
            name: nama
        }));
        localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(formatted));
    }
}

function getTodayDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// 2. Halaman Attendance (Absensi)
function renderAttendanceTable(filter = "") {
    const tbody = document.getElementById("studentTable");
    if (!tbody) return;

    const students = JSON.parse(localStorage.getItem(STORAGE_STUDENTS)) || [];
    const records = JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || [];
    const dateInput = document.getElementById("attendanceDate");
    const selectedDate = dateInput ? dateInput.value : "";

    tbody.innerHTML = "";
    const filtered = students.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">Nama siswa tidak ditemukan.</td></tr>`;
        return;
    }

    filtered.forEach((student, idx) => {
        let status = "Belum diisi";
        if (selectedDate) {
            const found = records.find(r => r.date === selectedDate && r.studentId === student.id);
            if (found) status = found.status;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td><strong>${student.name}</strong></td>
            <td>
                <select class="status-select" data-student-id="${student.id}">
                    <option value="Belum diisi" ${status === "Belum diisi" ? "selected" : ""}>Belum diisi</option>
                    <option value="Hadir" ${status === "Hadir" ? "selected" : ""}>Hadir</option>
                    <option value="Sakit" ${status === "Sakit" ? "selected" : ""}>Sakit</option>
                    <option value="Izin" ${status === "Izin" ? "selected" : ""}>Izin</option>
                    <option value="Alpa" ${status === "Alpa" ? "selected" : ""}>Alpa</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function saveAttendance() {
    const dateInput = document.getElementById("attendanceDate");
    const msg = document.getElementById("saveMessage");
    if (!dateInput || !dateInput.value) {
        alert("Silakan pilih tanggal absensi terlebih dahulu!");
        return;
    }

    const dateVal = dateInput.value;
    const selects = document.querySelectorAll(".status-select");
    let records = JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || [];

    // Hapus catatan lama pada tanggal yang sama sebelum menyimpan yang baru
    records = records.filter(r => r.date !== dateVal);

    selects.forEach(sel => {
        if (sel.value !== "Belum diisi") {
            records.push({
                date: dateVal,
                studentId: Number(sel.dataset.studentId),
                status: sel.value
            });
        }
    });

    localStorage.setItem(STORAGE_RECORDS, JSON.stringify(records));
    if (msg) {
        msg.textContent = `Tersimpan untuk tanggal ${dateVal} di browser ini.`;
        msg.style.color = "#16a34a";
    }
}

// 3. Halaman Dashboard (index.html)
function renderDashboard() {
    const totalEl = document.getElementById("totalStudentsCount");
    if (!totalEl) return;

    const students = JSON.parse(localStorage.getItem(STORAGE_STUDENTS)) || [];
    const records = JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || [];
    const today = getTodayDate();

    const todayRecords = records.filter(r => r.date === today);
    const hadir = todayRecords.filter(r => r.status === "Hadir").length;
    const sakitIzin = todayRecords.filter(r => r.status === "Sakit" || r.status === "Izin").length;
    const alpa = todayRecords.filter(r => r.status === "Alpa").length;

    totalEl.textContent = students.length;
    document.getElementById("todayPresentCount").textContent = hadir;
    document.getElementById("todayExcusedCount").textContent = sakitIzin;
    document.getElementById("todayAbsentCount").textContent = alpa;
}

// 4. Halaman Data & Riwayat (history.html)
function renderHistory() {
    const historyBody = document.getElementById("historyTable");
    if (!historyBody) return;

    const students = JSON.parse(localStorage.getItem(STORAGE_STUDENTS)) || [];
    const records = JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || [];

    historyBody.innerHTML = "";
    if (records.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#64748b;">Belum ada riwayat absensi tersimpan.</td></tr>`;
        return;
    }

    // Urutkan dari tanggal terbaru
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    sorted.forEach(rec => {
        const student = students.find(s => s.id === rec.studentId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${rec.date}</td>
            <td>${student ? student.name : "Siswa Terhapus"}</td>
            <td><strong>${rec.status}</strong></td>
        `;
        historyBody.appendChild(tr);
    });
}

// Inisialisasi saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
    initStudents();

    // Setup Halaman Attendance
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput) {
        dateInput.value = getTodayDate();
        dateInput.addEventListener("change", () => renderAttendanceTable());
        renderAttendanceTable();
    }

    const searchInput = document.getElementById("searchStudent");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => renderAttendanceTable(e.target.value));
    }

    const allPresentBtn = document.getElementById("allPresentBtn");
    if (allPresentBtn) {
        allPresentBtn.addEventListener("click", () => {
            document.querySelectorAll(".status-select").forEach(sel => sel.value = "Hadir");
        });
    }

    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", saveAttendance);
    }

    // Setup Halaman Dashboard
    renderDashboard();

    // Setup Halaman History
    renderHistory();

    const addStudentBtn = document.getElementById("addStudentBtn");
    if (addStudentBtn) {
        addStudentBtn.addEventListener("click", () => {
            const nameInput = document.getElementById("newStudentName");
            const name = nameInput.value.trim();
            if (!name) return;

            const students = JSON.parse(localStorage.getItem(STORAGE_STUDENTS)) || [];
            const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
            students.push({ id: newId, name: name });
            localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(students));
            nameInput.value = "";
            alert(`Siswa "${name}" berhasil ditambahkan!`);
        });
    }

    const resetDataBtn = document.getElementById("resetDataBtn");
    if (resetDataBtn) {
        resetDataBtn.addEventListener("click", () => {
            if (confirm("Kembalikan daftar siswa ke 34 nama awal?")) {
                localStorage.removeItem(STORAGE_STUDENTS);
                initStudents();
                alert("Daftar siswa berhasil di-reset ke 34 siswa awal.");
            }
        });
    }
});

setupNavigation();
setupHome();
setupAttendance();
