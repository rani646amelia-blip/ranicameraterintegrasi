# 🔐 Sistem Absensi & Akses berbasis Face Recognition

Sistem manajemen karyawan/event yang menggunakan **verifikasi wajah otomatis** sebagai pengganti absen manual atau QR Code. Website menggunakan teknologi AI untuk mendeteksi, mengenali, dan mencocokkan wajah dalam hitungan detik.

## 🎯 Fitur Utama

### 1. **Face Recognition (Deteksi Wajah)**
- Real-time face detection menggunakan kamera
- Automatic face matching dengan database yang terdaftar
- Display confidence level untuk setiap pencocokan
- Mencegah kecurangan absensi (titip absen)

### 2. **Enrollment (Pendaftaran Wajah)**
- Pendaftaran pengguna baru dengan data lengkap:
  - Nama Lengkap
  - NID/NIK
  - Departemen
- Capture 5 foto wajah dari berbagai sudut untuk akurasi maksimal
- Preview real-time saat pendaftaran

### 3. **History & Reporting**
- Riwayat lengkap semua check-in dengan timestamp
- Filter berdasarkan tanggal dan departemen
- Display accuracy level untuk setiap check-in
- Export data untuk keperluan laporan

## 🛠️ Teknologi yang Digunakan

| Teknologi | Fungsi |
|-----------|--------|
| **face-api.js** | Deteksi dan recognition wajah berbasis AI |
| **HTML5 Canvas** | Rendering visual face detection |
| **WebRTC/getUserMedia** | Akses kamera browser |
| **LocalStorage** | Penyimpanan data lokal (pengguna & history) |
| **JavaScript ES6+** | Core logic dan business logic |

### Library & Dependencies
```html
<!-- Face Recognition API (v0.22.2) -->
<script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
```

## 📋 Struktur File

```
ranicameraterintegrasi/
├── index.html          # Main HTML structure dengan 3 tab
├── style.css           # Styling modern & responsive design
├── script.js           # Logic lengkap face recognition
└── README.md           # Dokumentasi ini
```

## 🚀 Cara Menjalankan

### 1. **Setup Lokal**
```bash
# Buka file index.html di browser modern
# (Chrome, Edge, Firefox - yang support WebRTC)
open index.html
```

### 2. **Akses di Server Web**
```bash
# Jika menggunakan Python
python -m http.server 8000

# Atau gunakan Live Server di VS Code
# Buka index.html dengan Live Server extension
```

### 3. **Requirements**
- ✅ Browser modern dengan support WebRTC
- ✅ Akses ke webcam (meminta permission)
- ✅ Koneksi internet untuk load model AI
- ✅ JavaScript enabled

## 📖 Cara Penggunaan

### **TAB 1: Face Recognition (Check-In)**

1. Klik tombol **"Mulai Deteksi"**
2. Izinkan akses kamera saat browser meminta
3. Arahkan wajah ke depan kamera
4. Tunggu hingga sistem mendeteksi dan mencocokkan wajah
5. Jika cocok, klik **"✓ Check-In"** untuk mencatat kehadiran
6. Riwayat akan tersimpan otomatis

**Status Deteksi:**
- 🟢 **Wajah Cocok** = Identitas sudah terdaftar → Bisa check-in
- 🔴 **Wajah Tidak Cocok** = Tidak ada di database → Perlu daftar dulu
- ⚪ **Tidak Terdeteksi** = Posisikan wajah di depan kamera

### **TAB 2: Daftarkan Wajah (Enrollment)**

1. **Isi data pengguna:**
   - Nama Lengkap
   - NID/NIK
   - Pilih Departemen

2. **Klik "Mulai Pendaftaran"**
   - Izinkan akses kamera
   - Posisikan wajah di area yang ditandai

3. **Ambil 5 Foto** dengan mengklik **"📸 Ambil Foto"**
   - Ambil foto dari sudut berbeda
   - Pastikan pencahayaan cukup
   - Progress bar menunjukkan jumlah foto

4. **Klik "✓ Daftarkan Pengguna"**
   - Data pengguna + wajah akan tersimpan
   - Pengguna siap untuk check-in

### **TAB 3: Riwayat Absensi**

1. **Lihat semua data check-in:**
   - Nama, NID, Departemen
   - Waktu check-in lengkap
   - Accuracy level dari recognition

2. **Filter data:**
   - Filter berdasarkan tanggal
   - Filter berdasarkan departemen

3. **Hapus riwayat:** Klik **"🗑️ Hapus Riwayat"** (confirm terlebih dahulu)

## ⚙️ Konfigurasi

Edit file `script.js`, section **CONFIG**:

```javascript
const CONFIG = {
  FACE_DISTANCE_THRESHOLD: 0.6,      // Semakin kecil = semakin strict
  MIN_CONFIDENCE: 0.7,                // Minimum confidence level
  CAPTURE_COUNT_ENROLLMENT: 5,        // Jumlah foto saat enrollment
  VIDEO_WIDTH: 480,                   // Lebar video stream
  VIDEO_HEIGHT: 640,                  // Tinggi video stream
};
```

### Penjelasan Threshold:
- **FACE_DISTANCE_THRESHOLD**
  - Nilai 0.3-0.5 = sangat strict (hanya cocok untuk orang yang sama persis)
  - Nilai 0.6 = balanced (recommended)
  - Nilai 0.7-0.8 = lebih toleran (bisa match orang lain)

## 💾 Penyimpanan Data

### **LocalStorage Schema**

#### 1. Pengguna Terdaftar
```javascript
// Key: "faceRecognition_people"
// Value: Array of people objects
{
  id: "1234567890",
  name: "John Doe",
  nid: "123456789",
  department: "IT",
  descriptors: [Float32Array, ...],  // 5 face descriptors
  registeredAt: "2024-05-30T10:00:00Z"
}
```

#### 2. Riwayat Check-In
```javascript
// Key: "faceRecognition_history"
// Value: Array of attendance entries
{
  name: "John Doe",
  nid: "123456789",
  department: "IT",
  timestamp: "2024-05-30T10:15:30Z",
  accuracy: "95.2"
}
```

### **Clearing Data**
```javascript
// Di browser console, untuk reset semua data:
localStorage.removeItem('faceRecognition_people');
localStorage.removeItem('faceRecognition_history');
```

## 🔒 Keamanan & Privacy

### Best Practices:
1. ✅ Data wajah disimpan di device lokal saja (tidak ke server)
2. ✅ Tidak mengirim foto ke cloud (face descriptors saja)
3. ✅ Setiap device memiliki database sendiri
4. ✅ Recommended untuk enterprise: implementasi backend server

### Jika Implementasi Enterprise:
```javascript
// Kirim face descriptor ke backend server yang terenkripsi
const encryptedDescriptor = encrypt(faceDescriptor);
await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: newPerson, descriptor: encryptedDescriptor })
});
```

## 🎨 Customization

### Mengubah Warna Tema
Edit `:root` di `style.css`:

```css
:root {
  --primary: #4f46e5;        /* Warna utama */
  --secondary: #10b981;      /* Warna sekunder */
  --danger: #ef4444;         /* Warna danger/error */
  --success: #10b981;        /* Warna success */
  --bg: #0f172a;             /* Background */
  --surface: #1e293b;        /* Surface cards */
}
```

### Menambah Departemen Baru
Edit di `index.html` dan `script.js`:

```html
<!-- Di enrollment form -->
<select id="departmentInput">
  <option value="">-- Pilih Departemen --</option>
  <option value="IT">IT</option>
  <option value="HR">HR</option>
  <option value="Finance">Finance</option>
  <option value="Sales">Sales</option>
  <option value="YOUR_NEW_DEPARTMENT">YOUR_NEW_DEPARTMENT</option>
</select>
```

## 📊 Performa & Optimasi

| Metric | Value |
|--------|-------|
| Model Load Time | ~2-5 detik (first load) |
| Face Detection | ~100-200ms per frame |
| Face Matching | ~50-100ms |
| FPS Optimal | 15-20 FPS (real-time) |

**Tips Optimasi:**
- Gunakan hardware dengan GPU untuk performa lebih baik
- Reduce video resolution untuk mobile devices
- Load models sekali saja (di-cache di memory)

## 🐛 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Kamera tidak accessible | ✓ Check browser permissions, gunakan HTTPS untuk production |
| Model tidak load | ✓ Check internet connection, clear cache browser |
| Face tidak terdeteksi | ✓ Improve lighting, posisikan wajah lebih dekat |
| Match accuracy rendah | ✓ Capture foto enrollment dari sudut berbeda |
| Data hilang setelah refresh | ✓ Data stored di localStorage, cek jika cleared |

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

**Catatan:** Untuk mobile, gunakan mode portrait dan pastikan lighting cukup baik.

## 🚀 Development & Future Enhancements

### Planned Features:
- [ ] Backend API integration (Node.js/Python)
- [ ] Database persistence (MongoDB/PostgreSQL)
- [ ] Multi-face recognition (multiple detections sekaligus)
- [ ] Face anti-spoofing (detect foto/video palsu)
- [ ] Email notifications
- [ ] Mobile app version (React Native)
- [ ] Advanced analytics & reporting

### Untuk Development:
```bash
# Monitor model loading
console.log(faceapi.nets.faceRecognitionNet);

# Debug face descriptors
const detections = await faceapi.detectAllFaces(video)
  .withFaceLandmarks()
  .withFaceDescriptors();
console.log(detections[0].descriptor);

# Test face matching distance
const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
console.log('Distance:', distance); // Lebih kecil = lebih mirip
```

## 📄 Lisensi

Open source untuk keperluan non-commercial. Untuk commercial use, silakan hubungi author.

## 👨‍💻 Support & Feedback

Jika ada pertanyaan atau bugs, silakan buat issue atau hubungi tim development.

---

**Last Updated:** 30 Mei 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
