# Angklung Ensemble

**Satu angklung hanya bisa membunyikan satu nada. Maka sebuah lagu adalah persoalan koordinasi — dan itulah yang disimulasikan di sini.**

Simulator angklung yang dibangun di sekitar persoalan koordinasi: satu angklung satu nada, jadi sebuah lagu butuh banyak pemain. Bunyinya disintesis dari model fisik tabung bambu — tanpa satu pun rekaman. Situs statis, tanpa backend, tanpa jaringan saat dijalankan.

*An angklung simulator built around the coordination problem. The instrument is synthesised from a physical model of a bamboo tube; no sampled audio anywhere. Static site, no backend, no runtime network.*

---

## Yang membuatnya berbeda

- **Tiga teknik, satu model.** Kurulung, centok, dan tengkep bukan tiga berkas suara, melainkan tiga pola pukulan di atas satu bank resonator.
- **Tengkep menghapus resonator dari penjumlahan** — bukan menyaring, bukan mengecilkan. Pada angklung akompanimen mayor, empat tabung berbunyi sebagai septim dominan; satu tabung ditahan kelingking dan tersisa trinada mayor. Kelingking pemain adalah sakelar kualitas akor.
- **Penjadwalan memakai jam audio**, tidak pernah `setTimeout`. Nada yang dijadwalkan lewat timer melenceng dalam hitungan detik, dan melencengnya jadwal adalah satu-satunya bug yang menghancurkan simulator ansambel.
- **Ansambelnya adalah produknya.** Satu angklung yang bisa dibunyikan hanyalah papan suara.

## Menjalankan

```bash
pnpm install
pnpm dev
```

| Perintah | Kegunaan |
|---|---|
| `pnpm test:run` | Seluruh uji, sekali jalan |
| `pnpm test:synth` | Render luring: nada, parsial, jumlah pukulan, determinisme |
| `pnpm test:distribution` | Sifat pembagian + kecocokan dengan brute force |
| `pnpm bench:voices` | Beban polifoni pada ukuran ansambel penuh |
| `pnpm data:validate` | Kutipan laras, definisi set angklung, asal-usul melodi |
| `pnpm build` | Ekspor statis ke `./out` |
| `pnpm preview` | Melayani `./out` di bawah basePath produksi |

## Susunan

```
lib/synth/       INTI. Murni, bisa dirender di Node. Tanpa Web Audio, tanpa DOM.
  resonator.ts     bank modal per tabung
  excitation.ts    pola kurulung | centok | tengkep
  angklung.ts      susunan tabung → angklung melodi / akompanimen
  render.ts        params → Float32Array
lib/audio/       batas Web Audio: konteks, suara, penjadwal lookahead
lib/tuning/      laras, sen, pemetaan nada
lib/set/          definisi set angklung, penomoran padaeng
lib/distribute/  melodi + pemain → pembagian; pelaporan ketidakmungkinan
data/            laras, set, dan melodi — semuanya berkutipan dan bisa disunting
```

## Yang diuji, bukan didengarkan

`lib/synth` murni dan bisa dirender di Node, sehingga bunyinya diukur, bukan dinilai dengan telinga:

- **Nada** — fundamental hasil render diukur dengan FFT, dalam batas ±10 sen di seluruh set padaeng.
- **Tengkep** — dua arah: parsial tabung yang ditahan hilang saat ditengkep dan hadir saat tidak. Bentuk paling tegasnya: render tengkep identik sampel-per-sampel dengan render angklung yang memang tidak punya tabung itu.
- **Akor akompanimen** — empat nada membentuk septim dominan, tiga membentuk trinada mayor. Terkunci sebagai fixture.
- **Centok** tepat satu pukulan; laju pukulan **kurulung** berada dalam rentang 2–3 Hz yang dikutip.
- **Determinisme** — parameter dan seed yang sama menghasilkan render yang identik byte-per-byte.
- **Pembagian** — tidak ada nada yang dibuang diam-diam; jumlah pemain minimum dicocokkan dengan brute force.
- **Penjadwalan** — 4800 kejadian tanpa pergeseran yang terukur.

## Laras dan kejujuran datanya

Angklung padaeng bersifat diatonis-kromatis dan itu memang definisi, bukan pengukuran. **Salendro dan pelog degung tidak punya standar baku dan berbeda antar perangkat**, jadi keduanya dikirim sebagai satu set interval terdokumentasi — dengan sumbernya, ditandai sebagai satu set yang tercatat dan bukan "laras yang benar", dan nilai sennya bisa Anda ubah langsung di halaman Laras.

Melodi hanya dimuat jika domain publik atau ciptaan sendiri, dan keduanya disertai keterangan. Tidak ada lagu rakyat Sunda yang dimuat dari ingatan: memuat melodi yang keliru dengan nama aslinya lebih merugikan daripada tidak memuatnya sama sekali.

## Penghargaan

**Daeng Soetigna** menciptakan angklung padaeng yang diatonis-kromatis pada 1938, khusus agar angklung bisa bermain bersama alat musik Barat. **Udjo Ngalagena** mengembangkan teknik permainan di atas laras salendro dan pelog degung. [Saung Angklung Udjo](https://angklung-udjo.co.id/) dan sanggar-sanggar setempat adalah tempat mempelajari yang sebenarnya; simulator di peramban hanyalah pintu masuk.

Ini proyek pribadi untuk belajar, bukan otoritas. Laras dan teknik berbeda antar tradisi dan antar guru. Angklung buhun hidup dalam ritual pertanian padi dan penghormatan kepada Nyai Sri Pohaci — konteks itu disebut dengan hormat dan tidak disimulasikan.

## Penerbitan

`main` dibangun dan diterbitkan lewat GitHub Actions ke GitHub Pages. `basePath` harus sama dengan nama repositori, dan `.nojekyll` ditulis ke `out/` oleh `scripts/postbuild.mjs`, yang juga menolak build kalau ada berkas audio ikut terekspor.

Sebelum rilis apa pun yang menyentuh jalur audio, **uji penyalaan suara di perangkat iOS sungguhan**.
