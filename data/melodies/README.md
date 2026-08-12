# Melodi

Sebuah melodi hanya dimuat kalau **domain publik** atau **ciptaan sendiri**, dan keduanya wajib disertai keterangan asal (invarian 15). `pnpm data:validate` menolak build kalau syarat itu tidak dipenuhi.

## Kenapa belum ada lagu rakyat Sunda di sini

Ini kekosongan yang disengaja, bukan kelalaian — dan sebaiknya diisi.

Repertoar Sunda seperti *Cing Cangkeling* dan *Tokecang* memang lagu rakyat tanpa pencipta yang tercatat, jadi melodinya wajar dianggap domain publik. Masalahnya bukan hak cipta, melainkan **ketepatan**: memuat melodi yang salah dengan nama aslinya adalah bentuk penggambaran yang keliru terhadap tradisi yang masih hidup, dan itu lebih merugikan daripada tidak memuat apa pun. Menyalin not angka dari satu blog tanpa pembanding tidak cukup untuk membuktikan ketepatan itu.

*Manuk Dadali* tidak akan dimuat: lagu itu punya pencipta yang tercatat, Sambas Mangundikarta, jadi statusnya berbeda dari lagu rakyat.

## Menambahkan lagu rakyat Sunda dengan benar

Yang dibutuhkan sebelum sebuah melodi masuk:

1. **Sumber tertulis yang bisa ditunjuk.** Buku lagu daerah terbitan resmi, buku ajar seni budaya, atau notasi dari sanggar — bukan blog tanpa penyunting. Catat judul, penerbit, dan tahunnya di `source.title`.
2. **Satu pembanding.** Cocokkan not angkanya dengan sumber kedua yang berdiri sendiri. Kalau keduanya berbeda, tulis perbedaannya di `source.caveat` alih-alih memilih diam-diam.
3. **Keterangan kepengarangan.** Nyatakan bahwa lagu itu tanpa pencipta tercatat, dan sebutkan di mana pernyataan itu Anda temukan. Kalau ada nama pencipta, lagu itu belum boleh dimuat.
4. **Hanya melodinya.** Lirik punya sejarah kepengarangan sendiri dan tidak ikut dimuat.
5. **Laras yang jujur.** Kalau lagunya hidup dalam salendro atau degung, muat dalam laras itu — jangan dipaksa masuk padaeng hanya supaya cocok dengan set kromatis.

## Bentuk berkasnya

```json
{
  "id": "kebab-case",
  "title": "Judul",
  "subtitle": "keterangan singkat",
  "setId": "melodi-diatonis",
  "laras": "padaeng",
  "provenance": "domain-publik",
  "source": {
    "title": "sumber tertulis: judul, penerbit, tahun",
    "note": "bagaimana notasinya dibaca dan disesuaikan",
    "caveat": "apa yang belum pasti, dan apa yang belum diperiksa"
  },
  "bpm": 96,
  "beatsPerBar": 4,
  "notes": [{ "pitchId": "C4", "startBeat": 0, "durationBeats": 1 }]
}
```

Daftarkan berkasnya di `lib/melody/index.ts`, lalu jalankan `pnpm data:validate` dan `pnpm test:distribution`.
