# Aset merek

Berkas sumbernya ada di `exports/`, dan **folder itu tidak ikut masuk ke git**. Kit merek dibuat di luar repositori lalu diekspor utuh; kalau seluruh dump ikut dikomit, satu ikon yang diperbarui akan menyeret 600 KB berkas lain ikut berubah. Yang disimpan di repositori hanya aset yang benar-benar dilayani aplikasi.

## Yang dipakai aplikasi, dan dari mana asalnya

| Di repositori | Sumber di `exports/` | Kegunaan |
|---|---|---|
| `app/icon.svg` | `svg/favicon.svg` | Ikon tab peramban modern |
| `app/icon.png` | `icon/…-icon-32.png` | Cadangan untuk peramban tanpa favicon SVG |
| `app/apple-icon.png` | `icon/…-icon-180.png` | Ikon layar utama iOS |
| `public/brand/icon-192.png` | `icon/…-icon-192.png` | Manifest PWA |
| `public/brand/icon-512.png` | `icon/…-icon-512.png` | Manifest PWA |
| `public/brand/icon-maskable-512.png` | `icon/…-icon-maskable-512.png` | Ikon adaptif Android |
| `public/brand/og.png` | `social/…-og-1200x630.png` | Pratinjau tautan di media sosial |
| `public/brand/lockup-horizontal-dark.png` | `lockup/…-horizontal-dark-1280.png` | Kepala README |
| `public/brand/icon-light.svg` | `svg/…-icon-light.svg` | Cadangan varian terang |

Tanda di kepala halaman **tidak** memuat berkas gambar: geometrinya digambar ulang sebagai SVG sebaris di `components/SiteNav.tsx`, dari koordinat yang sama dengan `svg/favicon.svg`. Alasannya agar tanda itu ikut mewarisi warna tema dan tidak menambah satu permintaan jaringan pun di halaman yang seharusnya nol permintaan setelah muat pertama.

## Aturan yang tidak boleh dilanggar

Diambil dari `exports/README.txt`:

- **Tabung panjang selalu tan, tabung pendek selalu amber.** Tidak pernah ditukar — pada angklung, tabung yang lebih panjang memang bernada lebih rendah, jadi menukarnya membuat gambarnya berbohong.
- **Garis buku tabung hanya muncul pada varian ink dan light, mulai ukuran 64 px.** Di bawah itu garisnya dihilangkan; ubin warna rack dan amber selalu polos.
- **Tanpa gradien, tanpa bayangan.** Isian datar saja.

## Memperbarui aset

1. Ekspor ulang kit ke `exports/`.
2. Salin ulang hanya baris-baris pada tabel di atas.
3. `pnpm build` — `scripts/postbuild.mjs` akan menolak build kalau ada berkas audio ikut terbawa, dan gambar tidak pernah dioptimasi ulang karena situs ini diekspor statis (`images.unoptimized`).
