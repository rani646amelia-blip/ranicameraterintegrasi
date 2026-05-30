// Face Recognition System - Absensi & Akses
// Menggunakan face-api.js untuk deteksi dan pencocokan wajah

// ============= CONSTANTS & CONFIG =============
const CONFIG = {
  FACE_DISTANCE_THRESHOLD: 0.6, // Semakin kecil = semakin strict
  MIN_CONFIDENCE: 0.7,
  CAPTURE_COUNT_ENROLLMENT: 5,
  VIDEO_WIDTH: 480,
  VIDEO_HEIGHT: 640,
};

// ============= DOM ELEMENTS =============
const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('canvas');
const enrollVideoEl = document.getElementById('enrollVideo');
const enrollCanvasEl = document.getElementById('enrollCanvas');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const checkInBtn = document.getElementById('checkInBtn');
const statusEl = document.getElementById('status');
const faceCountEl = document.getElementById('faceCount');
const matchInfoEl = document.getElementById('matchInfo');
const resultEl = document.getElementById('result');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultTime = document.getElementById('resultTime');

// Enrollment elements
const startEnrollBtn = document.getElementById('startEnrollBtn');
const captureBtn = document.getElementById('captureBtn');
const stopEnrollBtn = document.getElementById('stopEnrollBtn');
const registerBtn = document.getElementById('registerBtn');
const nameInput = document.getElementById('nameInput');
const nidInput = document.getElementById('nidInput');
const departmentInput = document.getElementById('departmentInput');
const captureCountEl = document.getElementById('captureCount');
const progressBoxEl = document.getElementById('enrollmentProgress');
const progressFillEl = document.getElementById('progressFill');
const captureGalleryEl = document.getElementById('captureGallery');
const enrollResultEl = document.getElementById('enrollResult');

// History elements
const historyBodyEl = document.getElementById('historyBody');
const filterDateEl = document.getElementById('filterDate');
const filterDepartmentEl = document.getElementById('filterDepartment');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const currentTimeEl = document.getElementById('currentTime');

// ============= STATE =============
let modelsLoaded = false;
let recognitionActive = false;
let enrollmentActive = false;
let enrollmentCaptures = [];
let enrollmentImages = [];
let currentMatchedPerson = null;
let currentMatchDistance = null;

// ============= STORAGE =============
const STORAGE_KEY_PEOPLE = 'faceRecognition_people';
const STORAGE_KEY_HISTORY = 'faceRecognition_history';

// ============= UTILITY FUNCTIONS =============
function showNotification(message, type = 'success') {
  const notifEl = document.getElementById('notification');
  notifEl.textContent = message;
  notifEl.className = `notification ${type}`;
  
  setTimeout(() => {
    notifEl.classList.add('hidden');
  }, 4000);
}

function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  currentTimeEl.textContent = timeStr;
}

function formatDate(date) {
  return new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getRegisteredPeople() {
  const data = localStorage.getItem(STORAGE_KEY_PEOPLE);
  return data ? JSON.parse(data) : [];
}

function savePeople(people) {
  localStorage.setItem(STORAGE_KEY_PEOPLE, JSON.stringify(people));
}

function getHistory() {
  const data = localStorage.getItem(STORAGE_KEY_HISTORY);
  return data ? JSON.parse(data) : [];
}

function addToHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  updateHistoryTable();
}

// ============= FACE-API INITIALIZATION =============
async function loadModels() {
  if (modelsLoaded) return true;
  
  try {
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';
    
    statusEl.textContent = 'Memuat model AI (ini mungkin membutuhkan waktu)...';
    
    console.log('Loading models from:', MODEL_URL);
    
    // Load all models in parallel with timeout
    const loadPromises = [
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceDetectionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ];

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Model loading timeout')), 30000)
    );

    await Promise.race([Promise.all(loadPromises), timeoutPromise]);
    
    modelsLoaded = true;
    statusEl.textContent = 'Siap untuk deteksi';
    console.log('All models loaded successfully');
    showNotification('Model AI berhasil dimuat!', 'success');
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    statusEl.textContent = 'Error: Gagal memuat model - ' + error.message;
    showNotification('Gagal memuat model AI: ' + error.message, 'error');
    modelsLoaded = false;
    return false;
  }
}

// ============= FACE DETECTION & RECOGNITION =============
async function detectFaces(videoElement, canvasElement) {
  if (!modelsLoaded) return null;
  if (!videoElement || videoElement.videoWidth === 0) return null;

  try {
    // Set canvas size to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw video frame on canvas first
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    // Detect faces
    const detections = await faceapi
      .detectAllFaces(videoElement)
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Draw detections on canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    detections.forEach(detection => {
      const { box } = detection.detection;
      
      // Draw bounding box
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      // Draw circles at detection corners
      ctx.fillStyle = '#4f46e5';
      const corners = [
        [box.x, box.y],
        [box.x + box.width, box.y],
        [box.x, box.y + box.height],
        [box.x + box.width, box.y + box.height]
      ];
      corners.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    return null;
  }
}

function matchFace(faceDescriptor, registeredPeople) {
  if (registeredPeople.length === 0) return null;

  let bestMatch = null;
  let bestDistance = Infinity;

  registeredPeople.forEach(person => {
    const personDescriptors = person.descriptors.map(d => new Float32Array(d));
    const labeledDescriptors = new faceapi.LabeledFaceDescriptors(person.name, personDescriptors);
    
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, CONFIG.FACE_DISTANCE_THRESHOLD);
    const result = faceMatcher.findBestMatch(faceDescriptor);

    if (result.distance < bestDistance) {
      bestDistance = result.distance;
      bestMatch = { person, distance: result.distance };
    }
  });

  if (bestMatch && bestMatch.distance < CONFIG.FACE_DISTANCE_THRESHOLD) {
    return bestMatch;
  }

  return null;
}

// ============= RECOGNITION MODE =============
async function startRecognition() {
  try {
    statusEl.textContent = 'Meminta akses kamera...';
    showNotification('Meminta izin akses kamera...', 'success');
    
    if (!videoEl.srcObject) {
      const constraints = {
        video: {
          width: { ideal: CONFIG.VIDEO_WIDTH },
          height: { ideal: CONFIG.VIDEO_HEIGHT },
          facingMode: 'user'
        },
        audio: false
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoEl.srcObject = stream;
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('autoplay', '');
        videoEl.setAttribute('muted', '');

        // Wait for video to load metadata
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout menunggu video metadata'));
          }, 5000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };

          videoEl.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          videoEl.play().catch(e => {
            console.error('Play error:', e);
            reject(e);
          });
        });

        console.log('Video stream started:', videoEl.videoWidth, 'x', videoEl.videoHeight);
      } catch (err) {
        console.error('Camera access error:', err);
        throw new Error('Tidak dapat mengakses kamera: ' + err.message);
      }
    } else if (videoEl.paused) {
      videoEl.play();
    }

    await loadModels();
    recognitionActive = true;
    
    statusEl.textContent = 'Deteksi wajah aktif...';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    
    showNotification('Kamera siap! Posisikan wajah Anda di depan kamera.', 'success');
    recognitionLoop();
  } catch (error) {
    console.error('Error starting recognition:', error);
    statusEl.textContent = 'Error: ' + error.message;
    showNotification('Error: ' + error.message, 'error');
    recognitionActive = false;
  }
}

async function recognitionLoop() {
  if (!recognitionActive) return;

  try {
    const detections = await detectFaces(videoEl, canvasEl);

    if (detections && detections.length > 0) {
      faceCountEl.textContent = `Wajah Terdeteksi: ${detections.length}`;
      
      const faceDescriptor = detections[0].descriptor;
      const registeredPeople = getRegisteredPeople();
      const match = matchFace(faceDescriptor, registeredPeople);

      if (match) {
        matchInfoEl.innerHTML = `Hasil Pencocokan: <strong style="color: #10b981;">${match.person.name} (${(100 - match.distance * 100).toFixed(1)}%)</strong>`;
        currentMatchedPerson = match.person;
        currentMatchDistance = match.distance;
        statusEl.textContent = 'Wajah cocok! Siap untuk check-in';
        checkInBtn.style.display = 'inline-block';
      } else {
        matchInfoEl.innerHTML = 'Hasil Pencocokan: <strong style="color: #ef4444;">Wajah tidak terdaftar</strong>';
        currentMatchedPerson = null;
        currentMatchDistance = null;
        statusEl.textContent = 'Wajah tidak cocok dengan database';
        checkInBtn.style.display = 'none';
      }
    } else {
      faceCountEl.textContent = 'Wajah Terdeteksi: 0';
      matchInfoEl.innerHTML = 'Hasil Pencocokan: <strong>-</strong>';
      currentMatchedPerson = null;
      statusEl.textContent = 'Wajah tidak terdeteksi, coba posisikan wajah di depan kamera';
      checkInBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Recognition loop error:', error);
  }

  if (recognitionActive) {
    requestAnimationFrame(recognitionLoop);
  }
}

function stopRecognition() {
  recognitionActive = false;
  statusEl.textContent = 'Deteksi dihentikan';
  startBtn.style.display = 'inline-block';
  stopBtn.style.display = 'none';
  checkInBtn.style.display = 'none';
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
}

function performCheckIn() {
  if (!currentMatchedPerson) return;

  const accuracyValue = currentMatchDistance !== null
    ? (100 - currentMatchDistance * 100).toFixed(1)
    : '-';

  const entry = {
    name: currentMatchedPerson.name,
    nid: currentMatchedPerson.nid,
    department: currentMatchedPerson.department,
    timestamp: new Date().toISOString(),
    accuracy: accuracyValue
  };

  addToHistory(entry);
  
  resultEl.classList.remove('hidden');
  resultTitle.textContent = '✓ Check-In Berhasil';
  resultMessage.textContent = `Selamat datang, ${currentMatchedPerson.name}!`;
  resultTime.textContent = `Waktu: ${formatDate(entry.timestamp)}`;
  
  showNotification(`${currentMatchedPerson.name} berhasil check-in!`, 'success');
  
  // Reset after 3 seconds
  setTimeout(() => {
    resultEl.classList.add('hidden');
    stopRecognition();
  }, 3000);
}

// ============= ENROLLMENT MODE =============
async function startEnrollment() {
  const name = nameInput.value.trim();
  const nid = nidInput.value.trim();
  const department = departmentInput.value;

  if (!name || !nid || !department) {
    showNotification('Lengkapi semua data terlebih dahulu!', 'warning');
    return;
  }

  try {
    statusEl.textContent = 'Meminta akses kamera untuk pendaftaran...';
    showNotification('Meminta izin akses kamera...', 'success');
    
    if (!enrollVideoEl.srcObject) {
      const constraints = {
        video: {
          width: { ideal: CONFIG.VIDEO_WIDTH },
          height: { ideal: CONFIG.VIDEO_HEIGHT },
          facingMode: 'user'
        },
        audio: false
      };

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        enrollVideoEl.srcObject = stream;
        enrollVideoEl.setAttribute('playsinline', '');
        enrollVideoEl.setAttribute('autoplay', '');
        enrollVideoEl.setAttribute('muted', '');

        // Wait for video to load metadata
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout menunggu video metadata'));
          }, 5000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            enrollVideoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };

          enrollVideoEl.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          enrollVideoEl.play().catch(e => {
            console.error('Play error:', e);
            reject(e);
          });
        });

        console.log('Enrollment video stream started:', enrollVideoEl.videoWidth, 'x', enrollVideoEl.videoHeight);
      } catch (err) {
        console.error('Camera access error:', err);
        throw new Error('Tidak dapat mengakses kamera: ' + err.message);
      }
    } else if (enrollVideoEl.paused) {
      enrollVideoEl.play();
    }

    await loadModels();
    enrollmentActive = true;
    enrollmentCaptures = [];
    
    startEnrollBtn.style.display = 'none';
    captureBtn.style.display = 'inline-block';
    stopEnrollBtn.style.display = 'inline-block';
    progressBoxEl.classList.remove('hidden');
    
    statusEl.textContent = 'Kamera siap untuk pendaftaran';
    showNotification('Kamera siap! Posisikan wajah Anda dan ambil 5 foto.', 'success');
    enrollmentLoop();
  } catch (error) {
    console.error('Error starting enrollment:', error);
    statusEl.textContent = 'Error: ' + error.message;
    showNotification('Error: ' + error.message, 'error');
    enrollmentActive = false;
  }
}

async function enrollmentLoop() {
  if (!enrollmentActive) return;

  try {
    const detections = await detectFaces(enrollVideoEl, enrollCanvasEl);

    if (detections && detections.length > 0) {
      statusEl.textContent = 'Wajah terdeteksi, siap untuk diambil';
    } else {
      statusEl.textContent = 'Wajah tidak terdeteksi';
    }
  } catch (error) {
    console.error('Enrollment loop error:', error);
  }

  if (enrollmentActive) {
    requestAnimationFrame(enrollmentLoop);
  }
}

async function captureEnrollmentFace() {
  if (!enrollmentActive) {
    showNotification('Mulai pendaftaran terlebih dahulu sebelum mengambil foto.', 'warning');
    return;
  }

  if (!enrollVideoEl || enrollVideoEl.videoWidth === 0) {
    showNotification('Video belum siap, coba lagi sebentar.', 'warning');
    return;
  }

  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = enrollVideoEl.videoWidth;
  photoCanvas.height = enrollVideoEl.videoHeight;
  const photoCtx = photoCanvas.getContext('2d');
  photoCtx.drawImage(enrollVideoEl, 0, 0, photoCanvas.width, photoCanvas.height);

  const photoUrl = photoCanvas.toDataURL('image/png');
  addCapturePreview(photoUrl);

  const detections = await faceapi
    .detectAllFaces(enrollVideoEl)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections || detections.length === 0) {
    showNotification('Wajah tidak terdeteksi, coba lagi!', 'warning');
    return;
  }

  const descriptor = Array.from(detections[0].descriptor);
  enrollmentCaptures.push(descriptor);
  enrollmentImages.push(photoUrl);

  const progress = (enrollmentCaptures.length / CONFIG.CAPTURE_COUNT_ENROLLMENT) * 100;
  captureCountEl.textContent = enrollmentCaptures.length;
  progressFillEl.style.width = `${progress}%`;

  const fileName = `capture-${Date.now()}.png`;
  const anchor = document.createElement('a');
  anchor.href = photoUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  showNotification(`Foto ${enrollmentCaptures.length}/${CONFIG.CAPTURE_COUNT_ENROLLMENT} berhasil diambil`, 'success');

  if (enrollmentCaptures.length >= CONFIG.CAPTURE_COUNT_ENROLLMENT) {
    completeEnrollment();
  }
}

function stopEnrollment() {
  enrollmentActive = false;
  enrollmentCaptures = [];
  
  startEnrollBtn.style.display = 'inline-block';
  captureBtn.style.display = 'none';
  stopEnrollBtn.style.display = 'none';
  progressBoxEl.classList.add('hidden');
  registerBtn.style.display = 'none';
  
  clearCaptureGallery();

  const ctx = enrollCanvasEl.getContext('2d');
  ctx.clearRect(0, 0, enrollCanvasEl.width, enrollCanvasEl.height);
  
  statusEl.textContent = 'Pendaftaran dibatalkan';
}

function completeEnrollment() {
  enrollmentActive = false;
  captureBtn.style.display = 'none';
  stopEnrollBtn.style.display = 'none';
  registerBtn.style.display = 'inline-block';
  
  statusEl.textContent = 'Siap untuk mendaftarkan pengguna';
}

function addCapturePreview(photoUrl) {
  const image = document.createElement('img');
  image.src = photoUrl;
  image.alt = 'Preview foto pendaftaran';
  captureGalleryEl.appendChild(image);
}

function clearCaptureGallery() {
  captureGalleryEl.innerHTML = '';
  enrollmentImages = [];
}

function registerNewPerson() {
  const name = nameInput.value.trim();
  const nid = nidInput.value.trim();
  const department = departmentInput.value;

  if (enrollmentCaptures.length < CONFIG.CAPTURE_COUNT_ENROLLMENT) {
    showNotification('Ambil minimal 5 foto wajah terlebih dahulu!', 'warning');
    return;
  }

  const people = getRegisteredPeople();
  
  // Check if person already exists
  if (people.some(p => p.nid === nid)) {
    showNotification('NID sudah terdaftar!', 'warning');
    return;
  }

  const newPerson = {
    id: Date.now().toString(),
    name,
    nid,
    department,
    descriptors: enrollmentCaptures,
    registeredAt: new Date().toISOString()
  };

  people.push(newPerson);
  savePeople(people);

  enrollResultEl.classList.remove('hidden');
  enrollResultEl.innerHTML = `
    <p style="color: #10b981; font-weight: 600;">✓ Pendaftaran Berhasil!</p>
    <p>${name} (${nid}) telah terdaftar di sistem.</p>
  `;

  showNotification(`${name} berhasil terdaftar!`, 'success');

  // Reset form
  setTimeout(() => {
    nameInput.value = '';
    nidInput.value = '';
    departmentInput.value = '';
    enrollmentCaptures = [];
    clearCaptureGallery();
    registerBtn.style.display = 'none';
    startEnrollBtn.style.display = 'inline-block';
    progressBoxEl.classList.add('hidden');
    enrollResultEl.classList.add('hidden');
    statusEl.textContent = 'Siap';
  }, 2000);
}

// ============= HISTORY =============
function updateHistoryTable() {
  let history = getHistory();
  const filterDate = filterDateEl.value;
  const filterDept = filterDepartmentEl.value;

  if (filterDate) {
    const selectedDate = new Date(filterDate).toDateString();
    history = history.filter(entry => {
      const entryDate = new Date(entry.timestamp).toDateString();
      return entryDate === selectedDate;
    });
  }

  if (filterDept) {
    history = history.filter(entry => entry.department === filterDept);
  }

  const tbody = historyBodyEl;
  tbody.innerHTML = '';

  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada data absensi</td></tr>';
    return;
  }

  history.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.name}</td>
      <td>${entry.nid}</td>
      <td>${entry.department}</td>
      <td>${formatDate(entry.timestamp)}</td>
      <td>${entry.accuracy || '-'}%</td>
      <td><span style="color: #10b981; font-weight: 600;">✓ Check-In</span></td>
    `;
    tbody.appendChild(row);
  });
}

// ============= TAB NAVIGATION =============
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Update button state
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    // Stop any active processes
    if (recognitionActive) stopRecognition();
    if (enrollmentActive) stopEnrollment();

    // Update history when switching to history tab
    if (tabName === 'history') {
      updateHistoryTable();
    }
  });
});

// ============= EVENT LISTENERS =============
startBtn.addEventListener('click', startRecognition);
stopBtn.addEventListener('click', stopRecognition);
checkInBtn.addEventListener('click', performCheckIn);

startEnrollBtn.addEventListener('click', startEnrollment);
captureBtn.addEventListener('click', captureEnrollmentFace);
stopEnrollBtn.addEventListener('click', stopEnrollment);
registerBtn.addEventListener('click', registerNewPerson);

filterDateEl.addEventListener('change', updateHistoryTable);
filterDepartmentEl.addEventListener('change', updateHistoryTable);
clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Apakah Anda yakin ingin menghapus semua riwayat absensi?')) {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    updateHistoryTable();
    showNotification('Riwayat absensi telah dihapus', 'success');
  }
});

// ============= INITIALIZATION =============
setInterval(updateTime, 1000);
updateTime();

// Pre-load models on page load
window.addEventListener('load', () => {
  console.log('Page loaded, initializing face-api models...');
  loadModels();
});
