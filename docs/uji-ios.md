# Uji audio di perangkat iOS

Wajib dijalankan sebelum rilis apa pun yang menyentuh jalur audio (lihat `CLAUDE.md`, bagian Deployment). Yang perlu diuji bukan apakah ada bunyi, melainkan apakah bunyinya tetap ada setelah hal-hal yang cuma terjadi di iPhone.

Buka `https://andifathulms.github.io/angklung-simulator/` di **Safari iOS** — bukan simulator, bukan peramban desktop dengan mode ponsel.

## Yang sudah ditangani di kode, dan perlu dibuktikan

| # | Yang diuji | Cara | Lolos kalau |
|---|---|---|---|
| 1 | Mulai lewat sentuhan | Buka `/rak`, tekan **Nyalakan suara** | Status berubah jadi hijau "Suara menyala" |
| 2 | Nada pertama tidak tertelan | Segera tekan satu angklung | Terdengar penuh, bukan setengah atau senyap |
| 3 | Tanpa jeda pertama | Tekan beberapa angklung berbeda berturut-turut | Tidak ada yang terasa lebih lambat dari yang lain |
| 4 | Sakelar senyap | Nyalakan sakelar senyap iPhone, tekan angklung | Senyap **dan** ada keterangan sakelar senyap di layar |
| 5 | Panggilan masuk | Telepon perangkatnya, tolak, kembali ke halaman | Status sempat oranye, lalu pulih setelah layar disentuh |
| 6 | Siri | Panggil Siri, tutup, kembali | Sama seperti no. 5 |
| 7 | Pindah aplikasi | Geser ke aplikasi lain, tunggu 10 detik, kembali | Bunyi kembali normal tanpa perlu memuat ulang halaman |
| 8 | Layar terkunci | Kunci layar saat ansambel bermain, buka lagi | Tidak macet; boleh berhenti, asal bisa dimainkan lagi |
| 9 | Ansambel penuh | `/ansambel`, **Uji Koordinasi**, mode Dengarkan | Tidak ada bunyi pecah, tidak ada nada yang hilang |
| 10 | Bagian Anda | Mode Mainkan bagian Anda sambil menekan angklung sendiri | Nada Anda masuk seketika, iringan tetap rapi |

## Angka, bukan kesan

Buka `/diagnostik` di perangkat yang sama dan jalankan pengukurannya. Yang dicari:

- **`missedLookahead` harus 0.** Kalau lebih dari nol, ada bangun penjadwal yang datang lebih dari 200 ms terlambat, dan nada yang seharusnya diantrikan sudah lewat. Itulah nada hilang.
- **`worstLate` di bawah 80 ms** untuk semua ukuran suara.
- **Biaya render satu nada.** Kalau jauh di atas 60 ms, penyiapan rak akan terasa lama walau sudah dicicil.

Tekan **Salin hasil** dan simpan keluarannya bersama catatan rilis. Pengukuran ini tetap sahih walau sakelar senyap menyala.

## Kalau ada yang gagal

- **Nada pertama tertelan** → periksa pembangun `startAudioEngine` di `lib/audio/context.ts`; sampel senyap pembangun perangkat keras harus dibunyikan di dalam gerakan yang sama dengan yang memulai konteks.
- **Tidak pulih setelah panggilan** → `resumeAudioEngine` dipanggil dari `pointerdown`, `touchend`, `focus`, dan `visibilitychange` di `AudioProvider`. Safari butuh gerakan; kalau pulihnya cuma setelah menyentuh layar, itu memang perilaku iOS dan bukan bug.
- **`missedLookahead` > 0** → turunkan `DEFAULT_MAX_VOICES` di `lib/audio/voices.ts` sampai nol, lalu catat angkanya. Jangan naikkan lookahead sebagai gantinya: itu menyembunyikan gejalanya, bukan bebannya.
