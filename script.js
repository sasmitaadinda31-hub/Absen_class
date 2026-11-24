const STORAGE_STUDENTS = "absensiKelas_students_v1";
const STORAGE_RECORDS = "absensiKelas_records_v1";
const $ = (id) => document.getElementById(id);
const readData = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
const saveData = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const today = () => new Date().toLocaleDateString("en-CA");

function setupNavigation() {
  const toggle = $("menuToggle"), nav = $("navMenu");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

function setupHome() {
  if (!$("totalSiswa")) return;
  $("totalSiswa").textContent = readData(STORAGE_STUDENTS).length;
  $("totalCatatan").textContent = readData(STORAGE_RECORDS).length;
  $("tanggalHariIni").textContent = new Date().toLocaleDateString("id-ID", {day:"2-digit", month:"short", year:"numeric"});
}

function setupAttendance() {
  if (!$("studentForm")) return;
  const dateInput = $("attendanceDate");
  dateInput.value = today();

  $("studentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("studentName").value.trim();
    if (!name) return;
    const students = readData(STORAGE_STUDENTS);
    if (students.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      $("studentMessage").textContent = "Nama siswa sudah ada di daftar.";
      return;
    }
    students.push({id: Date.now(), name});
    saveData(STORAGE_STUDENTS, students);
    $("studentName").value = "";
    $("studentMessage").textContent = "Siswa berhasil ditambahkan.";
    renderStudents();
  });

  $("searchStudent").addEventListener("input", renderStudents);
  dateInput.addEventListener("change", renderStudents);
  $("saveAttendance").addEventListener("click", saveAttendance);
  $("exportCsv").addEventListener("click", exportCsv);
  renderStudents();
  renderHistory();
}

function renderStudents() {
  const body = $("studentTable");
  if (!body) return;
  const students = readData(STORAGE_STUDENTS);
  const records = readData(STORAGE_RECORDS);
  const date = $("attendanceDate").value;
  const query = $("searchStudent").value.trim().toLowerCase();
  const current = records.filter(r => r.date === date);
  const visible = students.filter(s => s.name.toLowerCase().includes(query));
  body.innerHTML = "";
  if (!visible.length) {
    body.innerHTML = `<tr><td colspan="4" class="empty">${students.length ? "Nama siswa tidak ditemukan." : "Belum ada siswa. Tambahkan nama siswa terlebih dahulu."}</td></tr>`;
    updateSummary(current);
    return;
  }
  visible.forEach((student, index) => {
    const saved = current.find(r => r.studentId === student.id);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${index + 1}</td><td class="student-name"></td><td><select aria-label="Status kehadiran"><option value="Hadir">Hadir</option><option value="Izin">Izin</option><option value="Sakit">Sakit</option><option value="Alpa">Alpa</option></select></td><td><button class="delete-btn" type="button">Hapus</button></td>`;
    tr.querySelector(".student-name").textContent = student.name;
    const select = tr.querySelector("select");
    select.value = saved ? saved.status : "Hadir";
    select.dataset.studentId = student.id;
    tr.querySelector(".delete-btn").addEventListener("click", () => {
      if (!confirm(`Hapus ${student.name} dari daftar siswa?`)) return;
      saveData(STORAGE_STUDENTS, readData(STORAGE_STUDENTS).filter(s => s.id !== student.id));
      saveData(STORAGE_RECORDS, readData(STORAGE_RECORDS).filter(r => r.studentId !== student.id));
      renderStudents(); renderHistory();
    });
    body.appendChild(tr);
  });
  updateSummary(current);
}

function updateSummary(records) {
  const count = {Hadir:0, Izin:0, Sakit:0, Alpa:0};
  records.forEach(r => { if (count[r.status] !== undefined) count[r.status]++; });
  $("attendanceSummary").textContent = `Hadir: ${count.Hadir} · Izin: ${count.Izin} · Sakit: ${count.Sakit} · Alpa: ${count.Alpa}`;
}

function saveAttendance() {
  const date = $("attendanceDate").value;
  if (!date) { $("saveMessage").textContent = "Pilih tanggal terlebih dahulu."; return; }
  const selects = [...document.querySelectorAll("#studentTable select")];
  if (!selects.length) { $("saveMessage").textContent = "Tambahkan siswa terlebih dahulu."; return; }
  const records = readData(STORAGE_RECORDS).filter(r => !(r.date === date && selects.some(s => Number(s.dataset.studentId) === r.studentId)));
  selects.forEach(select => records.push({date, studentId:Number(select.dataset.studentId), status:select.value}));
  saveData(STORAGE_RECORDS, records);
  $("saveMessage").textContent = "Absensi berhasil disimpan di browser ini.";
  renderStudents(); renderHistory();
}

function renderHistory() {
  const body = $("historyTable");
  if (!body) return;
  const students = readData(STORAGE_STUDENTS);
  const records = readData(STORAGE_RECORDS).slice().sort((a,b) => b.date.localeCompare(a.date));
  body.innerHTML = "";
  if (!records.length) { body.innerHTML = '<tr><td colspan="3" class="empty">Belum ada riwayat absensi.</td></tr>'; return; }
  records.forEach(record => {
    const student = students.find(s => s.id === record.studentId);
    if (!student) return;
    const tr = document.createElement("tr");
    const dateCell = document.createElement("td");
    dateCell.textContent = new Date(record.date + "T00:00:00").toLocaleDateString("id-ID", {day:"2-digit",month:"short",year:"numeric"});
    const nameCell = document.createElement("td"); nameCell.textContent = student.name;
    const statusCell = document.createElement("td"); statusCell.textContent = record.status;
    tr.append(dateCell, nameCell, statusCell); body.appendChild(tr);
  });
  if (!body.children.length) body.innerHTML = '<tr><td colspan="3" class="empty">Belum ada riwayat absensi.</td></tr>';
}

function exportCsv() {
  const students = readData(STORAGE_STUDENTS);
  const records = readData(STORAGE_RECORDS);
  if (!records.length) { alert("Belum ada data absensi untuk diunduh."); return; }
  const rows = [["Tanggal","Nama Siswa","Status"]];
  records.forEach(r => {
    const student = students.find(s => s.id === r.studentId);
    if (student) rows.push([r.date, student.name, r.status]);
  });
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "riwayat-absensi-kelas.csv"; link.click();
  URL.revokeObjectURL(url);
}

setupNavigation();
setupHome();
setupAttendance();
