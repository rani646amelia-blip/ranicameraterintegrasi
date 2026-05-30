const assessmentBtn = document.getElementById('assessmentBtn');
const tipBtn = document.getElementById('tipBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeModal = document.getElementById('closeModal');
const confirmBtn = document.getElementById('confirmBtn');
const summaryText = document.getElementById('summaryText');

const postureTips = [
  'Jaga bahu tetap rileks dan sedikit ditarik ke belakang saat duduk.',
  'Letakkan layar sejajar mata untuk mencegah leher menunduk.',
  'Gunakan kursi dengan sandaran yang mendukung punggung bawah.',
  'Bangun rutinitas peregangan pagi untuk membuka punggung dan bahu.',
];

const workouts = [
  'Mulai dengan 3 set squat tubuh, 12 repetisi setiap set.',
  'Coba plank 30 detik, ulangi 3 kali untuk kekuatan inti.',
  'Lakukan lunges berjalan 10 repetisi per kaki untuk stabilitas.',
  'Tambahkan bridge pinggul 15 repetisi untuk penguatan punggung bawah.',
];

function openModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModalWindow() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function getRandomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

assessmentBtn.addEventListener('click', () => {
  const workout = getRandomItem(workouts);
  summaryText.textContent = `Rekomendasi AI: ${workout} Fokuskan pada teknik yang benar dan kecepatan stabil.`;
  openModal('Hasil Penilaian', `AI merekomendasikan: ${workout} Ikuti gerakan ini dengan postur baik untuk hasil terbaik.`);
});

tipBtn.addEventListener('click', () => {
  const tip = getRandomItem(postureTips);
  summaryText.textContent = `Tips Postur: ${tip}`;
  openModal('Saran Postur', tip);
});

closeModal.addEventListener('click', closeModalWindow);
confirmBtn.addEventListener('click', closeModalWindow);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModalWindow();
  }
});
