/**
 * Indonesian first, English secondary. Sundanese terminology is never translated
 * away in either locale — kurulung, centok, tengkep, tabung dasar, laras stay as
 * they are and are glossed on first use (invariant 16).
 */
export { fill } from './fill'

export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export interface Dictionary {
  readonly localeName: string
  readonly nav: {
    readonly rak: string
    readonly ansambel: string
    readonly teknik: string
    readonly laras: string
    readonly aransemen: string
    readonly menu: string
    readonly language: string
  }
  readonly audio: {
    readonly start: string
    readonly starting: string
    readonly ready: string
    readonly hint: string
    readonly failed: string
    readonly voices: string
    readonly interrupted: string
    readonly resume: string
    readonly silentSwitch: string
  }
  readonly hero: {
    readonly try: string
    readonly starting: string
    readonly tapInvite: string
    readonly tapHint: string
    readonly step2Title: string
    readonly playMelody: string
    readonly stop: string
    readonly needs: string
    readonly people: string
    readonly distinctNotes: string
    readonly awaiting: string
    readonly punchline: string
    readonly explore: string
    readonly stepsTitle: string
    readonly step1: string
    readonly step1Body: string
    readonly step2: string
    readonly step2Body: string
    readonly step3: string
    readonly step3Body: string
    readonly whereTitle: string
  }
  readonly home: {
    readonly title: string
    readonly subtitle: string
    readonly premise: string
    readonly premiseBody: string
    readonly whyTitle: string
    readonly whyBody: string
    readonly techniquesTitle: string
    readonly tengkepTitle: string
    readonly tengkepBody: string
    readonly startHere: string
    readonly creditsTitle: string
    readonly creditsBody: string
    readonly repertoireTitle: string
    readonly repertoireBody: string
    readonly disclaimer: string
    readonly ritual: string
    readonly visit: string
  }
  readonly contoh: {
    readonly title: string
    readonly lede: string
    readonly phrase: string
    readonly step1: string
    readonly step2: string
    readonly step3: string
    readonly answer: string
    readonly clashLine: string
    readonly clearLine: string
    readonly listen: string
    readonly pitchesLabel: string
    readonly caveat: string
    readonly whatIf: string
    readonly whatIfBody: string
    readonly moveLabel: string
    readonly reset: string
  }
  readonly teknikNames: {
    readonly kurulung: string
    readonly centok: string
    readonly tengkep: string
  }
  readonly teknikDesc: {
    readonly kurulung: string
    readonly centok: string
    readonly tengkep: string
  }
  readonly rak: {
    readonly title: string
    readonly lede: string
    readonly howto: string
    readonly setLabel: string
    readonly techniqueLabel: string
    readonly keyboardHint: string
    readonly nomor: string
    readonly warming: string
    readonly stateYourPart: string
    readonly stateCued: string
  }
  readonly ansambel: {
    readonly title: string
    readonly lede: string
    readonly melodyLabel: string
    readonly playersLabel: string
    readonly minimum: string
    readonly needs: string
    readonly listen: string
    readonly yourPart: string
    readonly everyPart: string
    readonly listenHint: string
    readonly yourPartHint: string
    readonly everyPartHint: string
    readonly mode: string
    readonly groupPiece: string
    readonly groupRoom: string
    readonly groupTransport: string
    readonly tempo: string
    readonly countIn: string
    readonly cueLane: string
    readonly legend: string
    readonly legendYours: string
    readonly legendOthers: string
    readonly legendAbsent: string
    readonly legendPeak: string
    readonly rowSummary: string
    readonly timelineRegion: string
    readonly pairRuleTitle: string
    readonly pairRule: string
    readonly pairRuleSource: string
    readonly pairCompatible: string
    readonly pairClash: string
    readonly pairHolds: string
    readonly wholePieceCaveat: string
    readonly nextCue: string
    readonly cueAnnounce: string
    readonly cueNone: string
    readonly play: string
    readonly stop: string
    readonly player: string
    readonly holds: string
    readonly holdsNothing: string
    readonly rests: string
    readonly notesCount: string
    readonly cannotAlone: string
    readonly pickPlayer: string
    readonly waiting: string
    readonly infeasible: string
    readonly infeasibleOutsideSet: string
    readonly infeasibleSelfOverlap: string
    readonly infeasibleTooFewPlayers: string
    readonly whyThisNumber: string
    readonly hideWhy: string
    readonly driverOverlap: string
    readonly driverOverlapTied: string
    readonly driverNoteCount: string
    readonly driverPacking: string
    readonly perPlayerLabel: string
    readonly perPlayerOne: string
    readonly perPlayerTwo: string
    readonly perPlayerHint: string
    readonly markAbsent: string
    readonly bringBack: string
    readonly absenceTitle: string
    readonly absenceBody: string
    readonly absenceHint: string
    readonly restoreAll: string
    readonly andMore: string
    readonly withAkompanimen: string
    readonly akompanimenOff: string
    readonly akompanimenOn: string
    readonly akompanimenNone: string
    readonly akompanimenBody: string
    readonly roleAkompanimen: string
    readonly akompanimenAdds: string
  }
  readonly teknik: {
    readonly title: string
    readonly lede: string
    readonly shakeRate: string
    readonly shakeRateCited: string
    readonly hardness: string
    readonly hold: string
    readonly strikes: string
    readonly strikeTrain: string
    readonly chainTitle: string
    readonly chainStep1: string
    readonly chainStep2: string
    readonly chainStep3: string
    readonly chainCaveat: string
    readonly render: string
    readonly sounding: string
    readonly muted: string
    readonly modes: string
    readonly modesHint: string
    readonly amplitude: string
    readonly decay: string
    readonly octaveWarning: string
    readonly exportTitle: string
    readonly exportHint: string
  }
  readonly akor: {
    readonly title: string
    readonly septimDominan: string
    readonly trinadaMayor: string
    readonly septimMinor: string
    readonly trinadaMinor: string
    readonly hold: string
    readonly release: string
    readonly tubes: string
    readonly interval: string
    readonly which: string
    readonly degreeRoot: string
    readonly degreeTertsMayor: string
    readonly degreeTertsMinor: string
    readonly degreeKuint: string
    readonly degreeSeptim: string
    readonly whyChord: string
    readonly whyTriad: string
    readonly removedDegree: string
  }
  readonly laras: {
    readonly title: string
    readonly lede: string
    readonly oneAtATime: string
    readonly samePhrase: string
    readonly cents: string
    readonly centsExplained: string
    readonly edit: string
    readonly reset: string
    readonly notAuthority: string
    readonly togetherTitle: string
    readonly togetherBody: string
    readonly togetherPlay: string
    readonly togetherFirst: string
    readonly togetherSecond: string
    readonly togetherApart: string
    readonly togetherSame: string
    readonly togetherModel: string
    readonly beats: string
    readonly source: string
  }
  readonly footer: {
    readonly about: string
    readonly respect: string
    readonly source: string
  }
  readonly diagnostik: {
    readonly eyebrow: string
    readonly title: string
    readonly lede: string
    readonly device: string
    readonly renderCost: string
    readonly run: string
    readonly running: string
    readonly voices: string
    readonly medianLate: string
    readonly worstLate: string
    readonly missed: string
    readonly verdict: string
    readonly explain: string
    readonly copy: string
    readonly copied: string
    readonly silentOk: string
    readonly soundCheck: string
    readonly soundCheckBody: string
    readonly referenceTone: string
    readonly oneAngklung: string
    readonly bothSilent: string
  }
  readonly aransemen: {
    readonly title: string
    readonly lede: string
    readonly input: string
    readonly inputHint: string
    readonly solve: string
    readonly result: string
    readonly feasible: string
    readonly notFeasible: string
    readonly nothingDropped: string
  }
}

const id: Dictionary = {
  localeName: 'Bahasa Indonesia',
  nav: {
    rak: 'Rak',
    ansambel: 'Ansambel',
    teknik: 'Teknik',
    laras: 'Laras',
    aransemen: 'Aransemen',
    menu: 'Menu',
    language: 'Bahasa',
  },
  audio: {
    start: 'Nyalakan suara',
    starting: 'Menyalakan…',
    ready: 'Suara menyala',
    hint: 'Suara hanya bisa dinyalakan lewat sentuhan Anda — begitu aturan peramban, terutama di iOS.',
    failed: 'Suara tidak bisa dinyalakan di peramban ini.',
    voices: 'suara aktif',
    interrupted: 'Suara terhenti — panggilan masuk, Siri, atau tab ini sempat ditinggalkan. Sentuh layar untuk menyalakannya lagi.',
    resume: 'Lanjutkan suara',
    silentSwitch: 'Tidak terdengar apa-apa? Di iPhone, sakelar senyap ikut membungkam suara halaman web. Geser sakelarnya dan naikkan volume.',
  },
  hero: {
    try: 'Bunyikan angklungnya',
    starting: 'Menyalakan…',
    tapInvite: 'Ketuk angklung mana pun di atas — atau tekan tombolnya.',
    tapHint: 'Ketuk angklung mana pun. Tahan agar terus berbunyi.',
    step2Title: 'Sekarang mainkan satu lagu',
    playMelody: 'Mainkan “Bintang Kecil”',
    stop: 'Hentikan',
    needs: 'Lagu ini butuh',
    people: 'orang',
    distinctNotes: 'nada berbeda',
    awaiting: 'Mainkan lagunya, dan angka-angka ini terisi sendiri.',
    punchline: 'Anda punya dua tangan. Di situlah angklung berbeda dari alat musik lain — dan itulah yang disimulasikan di sini.',
    explore: 'Lihat pembagiannya',
    stepsTitle: 'Cara kerjanya',
    step1: 'Satu angklung, satu nada',
    step1Body: 'Goyang angklung, tabung bambunya memukul rangka. Cuma satu nada yang bisa keluar — tidak ada nada kedua di dalamnya.',
    step2: 'Satu lagu, banyak tangan',
    step2Body: 'Karena itu satu lagu harus dibagi. Tiap orang memegang satu atau dua angklung dan menunggu giliran nadanya tiba.',
    step3: 'Satu aba-aba',
    step3Body: 'Pemimpin ansambel memberi isyarat nomor dengan tangan. Nomor itulah identitas tiap angklung, bukan nama nadanya.',
    whereTitle: 'Ke mana selanjutnya',
  },
  home: {
    title: 'Satu angklung, satu nada',
    subtitle:
      'Simulator angklung yang bisa langsung Anda mainkan di peramban. Bunyinya disintesis dari model fisik tabung bambu — tanpa satu pun rekaman.',
    premise: 'Satu angklung hanya bisa membunyikan satu nada.',
    premiseBody:
      'Maka sebuah lagu bukan soal satu alat musik, melainkan soal satu ruangan berisi orang — masing-masing memegang satu atau dua angklung, masing-masing menunggu giliran nadanya. Angklung itu alat musik yang tersebar. Memainkannya adalah persoalan koordinasi, dan itulah yang disimulasikan di sini.',
    whyTitle: 'Kenapa bukan papan suara',
    whyBody:
      'Hampir semua aplikasi angklung adalah papan suara: ketuk gambar bambu, keluar nada. Itu menirukan bunyinya dan melewatkan alat musiknya. Di sini bunyinya disintesis dari model fisik tabung bambu — tanpa satu pun rekaman — dan sebaran nadanya ke banyak pemain justru menjadi isi utamanya.',
    techniquesTitle: 'Tiga teknik, satu model',
    tengkepTitle: 'Yang paling menarik: tengkep',
    tengkepBody:
      'Pada angklung melodi, tengkep membungkam tabung oktaf sehingga terdengar satu nada murni, bukan dua seperti biasanya. Pada angklung akompanimen mayor, tanpa tengkep empat tabung berbunyi sebagai akor septim dominan; satu tabung ditahan kelingking dan yang tersisa adalah trinada mayor. Jadi kelingking pemain adalah sakelar kualitas akor.',
    startHere: 'Mulai dari rak',
    creditsTitle: 'Orang-orangnya',
    creditsBody:
      'Daeng Soetigna menciptakan angklung padaeng yang diatonis-kromatis pada 1938, khusus agar angklung bisa bermain bersama alat musik Barat. Udjo Ngalagena mengembangkan teknik permainan di atas laras salendro dan pelog degung.',
    repertoireTitle: 'Kenapa belum ada lagu Sunda di sini',
    repertoireBody:
      'Lagu yang dimuat di sini hanya yang domain publik atau ciptaan sendiri — dan belum ada satu pun lagu rakyat Sunda. Bukan karena hak cipta: Cing Cangkeling dan Tokecang memang tanpa pencipta tercatat. Alasannya ketepatan. Memuat melodi yang keliru dengan nama aslinya adalah penggambaran yang salah terhadap tradisi yang masih hidup, dan menyalin not angka dari satu sumber tanpa pembanding belum cukup untuk memastikannya. Kekosongan ini disengaja dan sebaiknya diisi — syaratnya dicatat di data/melodies/README.md.',
    disclaimer:
      'Ini proyek pribadi untuk belajar, bukan otoritas. Laras dan teknik berbeda-beda antar tradisi dan antar guru; angka yang dipakai di sini disertai sumber dan bisa Anda ubah.',
    ritual:
      'Angklung buhun hidup dalam ritual pertanian padi dan penghormatan kepada Nyai Sri Pohaci. Konteks itu disebut di sini dengan hormat, dan tidak disimulasikan.',
    visit: 'Saung Angklung Udjo dan sanggar-sanggar setempat adalah tempat mempelajari yang sebenarnya.',
  },
  contoh: {
    title: 'Contoh yang bisa diikuti sampai selesai',
    lede: 'Empat nada, tiga nada berbeda. Angka-angka di bawah ini dihitung oleh pembagi yang sama yang dipakai di seluruh situs — bukan ditulis tangan.',
    phrase: 'Frasa contoh',
    step1: 'Pertama, catat kapan tiap nada berbunyi dan berapa lama.',
    step2: 'Lalu bandingkan tiap pasang nada: pernahkah keduanya berbunyi pada saat yang sama?',
    step3: 'Nada yang pernah bertabrakan harus dipegang orang yang berbeda. Yang tidak pernah bertabrakan boleh menumpang di satu pasang tangan.',
    answer: 'Jadi frasa ini butuh {players} orang.',
    clashLine: '{a} dan {b} bertabrakan pada detik {atSec} — dua orang',
    clearLine: '{a} dan {b} tidak pernah bersamaan — boleh satu orang',
    listen: 'Dengarkan frasanya',
    pitchesLabel: 'Nada berbeda',
    caveat:
      'Contoh ini sengaja dibuat sependek mungkin agar bisa dihitung dengan tangan. Lagu sungguhan punya puluhan nada, tetapi aturannya persis sama — tidak ada aturan tambahan yang muncul belakangan.',
    whatIf: 'Bagaimana kalau nadanya digeser?',
    whatIfBody:
      'Geser G4 ke kiri sampai ia ikut berbunyi bersama C4 dan E4. Tidak ada nada yang ditambah atau dibuang — yang berubah hanya kapan satu nada dimulai — dan jumlah orang yang dibutuhkan ikut berubah. Di situlah letak persoalannya: bukan pada berapa banyak nadanya, melainkan pada berapa banyak yang berbunyi bersamaan.',
    moveLabel: 'Mulai G4 pada detik',
    reset: 'Kembalikan',
  },
  teknikNames: { kurulung: 'Kurulung', centok: 'Centok', tengkep: 'Tengkep' },
  teknikDesc: {
    kurulung:
      'Getar. Rangka dipegang, tabung dasar digoyang kiri-kanan selama nada berlangsung. Anjuran 2–3 goyangan per detik.',
    centok:
      'Sentak. Tabung dasar ditarik cepat ke telapak tangan. Berbunyi sekali saja — pendek, seperti pizzicato.',
    tengkep:
      'Seperti kurulung, tetapi satu tabung ditahan kelingking sehingga tidak ikut bergetar. Lebih lembut, lebih sedikit nada atas.',
  },
  rak: {
    title: 'Rak',
    lede: 'Angklung tergantung berurutan, panjang tabungnya benar-benar bertingkat menurut nada. Nomornya adalah nomor yang diberi aba-aba dengan tangan.',
    howto:
      'Pilih teknik, lalu tekan angklungnya. Kurulung dan tengkep berbunyi selama ditahan; centok berbunyi sekali. Tahan Shift saat menekan untuk memaksa tengkep.',
    setLabel: 'Set angklung',
    techniqueLabel: 'Teknik saat diklik',
    keyboardHint: 'Dengan papan ketik: Tab untuk berpindah, spasi atau Enter untuk membunyikan, Shift untuk tengkep.',
    nomor: 'Nomor',
    warming: 'Menyiapkan bunyi angklung…',
    stateYourPart: 'bagian Anda',
    stateCued: 'sedang diaba-abakan',
  },
  ansambel: {
    title: 'Ansambel',
    lede: 'Satu melodi dibagikan ke beberapa pemain. Perhatikan diamnya: bagi pemain angklung, menunggu adalah sebagian besar pekerjaan.',
    melodyLabel: 'Melodi',
    playersLabel: 'Jumlah pemain',
    minimum: 'paling sedikit',
    needs: 'Lagu ini butuh',
    listen: 'Dengarkan',
    yourPart: 'Mainkan bagian Anda',
    everyPart: 'Mainkan semua bagian',
    listenHint: 'Seluruh ansambel dimainkan mesin. Perhatikan berapa banyak baris yang menganggur setiap saat.',
    yourPartHint:
      'Mesin memainkan semua pemain lain. Bagian Anda dikosongkan — Anda yang harus masuk tepat waktu.',
    everyPartHint:
      'Mesin tidak memainkan apa pun. Silakan coba mainkan seluruh lagu sendirian.',
    mode: 'Cara main',
    groupPiece: 'Lagunya',
    groupRoom: 'Ruangannya',
    groupTransport: 'Jalankan',
    tempo: 'Tempo',
    countIn: 'Aba-aba masuk',
    cueLane: 'Jalur aba-aba',
    legend: 'Bacaan garis waktu',
    legendYours: 'bagian Anda',
    legendOthers: 'pemain lain',
    legendAbsent: 'tidak ada yang memegang',
    legendPeak: 'saat tersibuk',
    rowSummary: '{notes} nada, masuk pertama pada detik {first}, diam {rest} persen',
    timelineRegion: 'Garis waktu, bisa digeser',
    pairRuleTitle: 'Kenapa nomor-nomor itu yang dipegang bersama',
    pairRule:
      'Aturannya satu, dan hanya satu: dua angklung boleh dipegang satu orang kalau nadanya tidak pernah berbunyi bersamaan. Kalau pernah bertabrakan sekali saja, keduanya harus dipegang dua orang berbeda.',
    pairRuleSource: 'Aturan ini yang dijalankan pembagi di lib/distribute — PRD §6.',
    pairCompatible: 'bisa dipegang bersama {pitchId}',
    pairClash: 'bentrok dengan {pitchId} pada detik {atSec}',
    pairHolds: 'Pemain {player} memegang {pitches}',
    wholePieceCaveat:
      'Penyederhanaan yang dipakai di sini: satu orang memegang angklung yang sama dari awal sampai akhir lagu. Ansambel sungguhan bisa bertukar di antara bagian, dan kalau bertukar, jumlah orang yang dibutuhkan bisa lebih sedikit dari angka di atas.',
    nextCue: 'Nomor berikutnya',
    cueAnnounce: 'Nomor {nomor}, {beats} ketukan lagi',
    cueNone: 'Belum ada aba-aba',
    play: 'Mainkan',
    stop: 'Berhenti',
    player: 'Pemain',
    holds: 'memegang',
    holdsNothing: 'tidak memegang angklung',
    rests: 'diam',
    notesCount: 'nada',
    cannotAlone:
      'Coba tekan semuanya sendiri. Anda akan gagal, dan kegagalannya itulah jawabannya.',
    pickPlayer: 'Pilih pemain',
    waiting: 'menunggu',
    infeasible: 'Tidak bisa dimainkan seperti ini',
    infeasibleOutsideSet:
      'Nada {pitchId} tidak ada dalam set ini — {count} nada tidak bisa dimainkan. Ganti set, atau ubah aransemennya.',
    infeasibleSelfOverlap:
      'Nada {pitchId} harus berbunyi dua kali sekaligus. Satu angklung hanya bisa berbunyi sekali — dibutuhkan angklung kedua dengan nada yang sama.',
    infeasibleTooFewPlayers:
      'Butuh {needed} pemain, tersedia {available}. Lagu ini tidak dipotong agar muat.',
    whyThisNumber: 'Kenapa segini?',
    hideWhy: 'Tutup',
    driverOverlap:
      'Pada detik {atSec}, {count} nada berbunyi bersamaan. Sebanyak itu tangan harus berada di udara pada saat yang sama — dan di situlah satu orang kehabisan tangan.',
    driverOverlapTied: 'Saat sesibuk itu terjadi lebih dari sekali; yang ditandai adalah yang pertama.',
    driverNoteCount:
      'Tidak ada nada yang bertumpuk di lagu ini. Yang menentukan justru jumlahnya: ada {distinct} nada berbeda, dan satu orang paling banyak memegang {perPlayer} angklung.',
    driverPacking:
      '{distinct} nada berbeda tidak bisa dibagi ke lebih sedikit orang tanpa ada dua nada yang bentrok di suatu tempat.',
    perPlayerLabel: 'Angklung per orang',
    perPlayerOne: 'satu',
    perPlayerTwo: 'dua',
    perPlayerHint:
      'Dua tangan, dua angklung — itu batas yang dipakai di sini. Di banyak kelas tiap anak memegang satu, dan jumlah orang yang dibutuhkan pun berubah.',
    markAbsent: 'Tandai tidak hadir',
    bringBack: 'Panggil kembali',
    absenceTitle: 'Ada yang tidak datang',
    absenceBody:
      '{players} tidak hadir. {silenced} dari {total} nada tidak ada yang memegang, jadi nada-nada itu tidak berbunyi.',
    absenceHint:
      'Nada-nadanya tidak dihapus dari lagu — lagunya tetap utuh, hanya ada lubang di tempat orangnya seharusnya berdiri. Itulah yang terjadi kalau satu orang tidak datang latihan.',
    restoreAll: 'Panggil semuanya kembali',
    andMore: '+{rest} lagi',
    withAkompanimen: 'Akompanimen',
    akompanimenOff: 'tanpa',
    akompanimenOn: 'dengan',
    akompanimenNone: 'Lagu ini belum punya bagian akompanimen yang bisa dipertanggungjawabkan.',
    akompanimenBody:
      'Angklung akompanimen bukan satu nada, melainkan satu akor — empat tabung sekaligus, dan kelingking pemainnya adalah sakelar kualitas akor. Perhatikan barisnya di garis waktu: pemain melodi lebih banyak menunggu, pemain akompanimen hampir tidak pernah berhenti. Dua pekerjaan yang berbeda di ruangan yang sama.',
    roleAkompanimen: 'akompanimen',
    akompanimenAdds: 'Iringannya menambah {added} orang lagi, jadi {total} orang di ruangan.',
  },
  teknik: {
    title: 'Laboratorium teknik',
    lede: 'Satu angklung, sendirian, dengan pola pukulannya terbuka. Yang Anda lihat adalah yang didengar mesin suaranya.',
    shakeRate: 'Laju goyangan',
    shakeRateCited: 'Rentang terdokumentasi: 2–3 Hz. Di luar itu bukan lagi kurulung yang diajarkan.',
    hardness: 'Kekerasan pukulan',
    hold: 'Tahan tabung (tengkep)',
    strikes: 'pukulan',
    strikeTrain: 'Deret pukulan',
    chainTitle: 'Satu rantai, bukan tiga gambar',
    chainStep1:
      '1 · Teknik menjadi deret pukulan. Kurulung menggoyang tabung dasar, dan tiap kali arah goyangan berbalik terjadi satu pukulan — jadi 2–3 goyangan per detik menghasilkan 4–6 pukulan. Centok cuma satu pukulan, lebih keras. Tengkep sama seperti kurulung, hanya satu tabung ditahan.',
    chainStep2:
      '2 · Tiap pukulan membunyikan bank modal tabung. Satu tabung bukan satu frekuensi, melainkan beberapa mode yang berbunyi bersama lalu meluruh sendiri-sendiri. Daftar di bawah inilah modelnya, dan bisa Anda ubah.',
    chainStep3:
      '3 · Semua tabung yang berbunyi dijumlahkan menjadi gelombang. Di situlah tengkep bekerja: tabung yang ditahan tidak ikut masuk ke penjumlahan, jadi modenya benar-benar tidak ada — bukan dikecilkan, bukan disaring.',
    chainCaveat:
      'Yang disederhanakan: satu goyangan sebenarnya tidak punya panjang tertentu, jadi kurulung dan tengkep di sini dirender enam detik lalu diredam saat dilepas. Kalau Anda menahan lebih lama dari itu, yang terdengar adalah perkiraan.',
    render: 'Hasil bunyi',
    sounding: 'berbunyi',
    muted: 'ditahan',
    modes: 'Bank modal tabung',
    modesHint:
      'Inilah modelnya, bukan tiruannya: tiap baris satu mode resonansi tabung — kelipatan frekuensi dasar, kekuatannya, dan waktu peluruhannya sampai turun 60 dB. Nada dan jumlah pukulan sudah diuji dengan angka; warna bunyi tidak bisa, jadi bagian itu memang harus disetel dengan telinga di sini.',
    amplitude: 'Kekuatan',
    decay: 'Peluruhan',
    octaveWarning:
      'Kelipatan mendekati 2 akan menabrak tabung oktaf, dan justru ketiadaan bunyi di 2f itulah yang membuat tengkep bisa diukur. Uji tengkep akan gagal.',
    exportTitle: 'Bawa pulang setelannya',
    exportHint:
      'Setelan di halaman ini tidak ikut tersimpan. Salin potongan kode ini ke lib/synth/resonator.ts, lalu jalankan pnpm test:synth — kalau nada atau partialnya meleset, modelnya yang salah, bukan toleransinya.',
  },
  akor: {
    title: 'Angklung akompanimen',
    septimDominan: 'Akor septim dominan',
    trinadaMayor: 'Trinada mayor',
    septimMinor: 'Akor septim minor',
    trinadaMinor: 'Trinada minor',
    hold: 'Tahan tabung dengan kelingking',
    release: 'Lepaskan',
    tubes: 'tabung berbunyi',
    interval: 'jarak dari nada dasar',
    which: 'Angklung',
    degreeRoot: 'nada dasar',
    degreeTertsMayor: 'terts mayor',
    degreeTertsMinor: 'terts minor',
    degreeKuint: 'kuint murni',
    degreeSeptim: 'septim minor',
    whyChord:
      'Empat tabung ini — nada dasar, terts, kuint, septim — itulah yang membuat susunannya disebut akor septim. Bukan namanya yang menentukan, melainkan keempat jaraknya.',
    whyTriad:
      'Kelingking menahan tabung septim. Tiga yang tersisa — nada dasar, terts, kuint — itulah trinada. Tidak ada yang diredam atau disaring: satu tabung memang tidak ikut bergetar, jadi jaraknya hilang dari jumlahnya.',
    removedDegree: 'Yang hilang: {degree} ({cents} sen)',
  },
  laras: {
    title: 'Laras',
    lede: 'Frasa yang sama, tiga laras. Cara tercepat mendengar kenapa temuan 1938 itu penting — dan kenapa perangkat berlaras satu tidak bisa begitu saja bergabung dengan yang lain.',
    oneAtATime: 'Satu per satu',
    samePhrase: 'Frasa yang dimainkan sama persis; yang berbeda hanya larasnya.',
    cents: 'sen',
    centsExplained:
      'Sen adalah satuan jarak nada, bukan frekuensi. Satu oktaf dibagi 1200 sen, jadi satu langkah setengah nada pada piano adalah 100 sen. Satuan ini dipakai di sini karena telinga menangkap perbandingan, bukan selisih: 100 sen terdengar sama besarnya di nada rendah maupun tinggi, sedangkan selisih dalam Hz tidak.',
    edit: 'Ubah nilai sen',
    reset: 'Kembalikan',
    notAuthority:
      'Salendro dan pelog degung tidak punya standar baku dan berbeda antar perangkat. Angka di sini satu set terdokumentasi, bukan satu-satunya yang benar.',
    togetherTitle: 'Dua laras sekaligus',
    togetherBody:
      'Sampai di sini keduanya diperdengarkan bergantian, dan bergantian membuat keduanya terdengar sama-sama enak. Bunyikan berbarengan, dan terdengar apa yang sebenarnya terjadi: derajat yang sepadan tidak jatuh di frekuensi yang sama, lalu keduanya beradu. Bukan karena salah satunya keliru — keduanya benar di tempatnya masing-masing — melainkan karena keduanya memang tidak bisa disatukan begitu saja. Inilah persoalan yang dijawab Daeng Soetigna pada 1938.',
    togetherPlay: 'Bunyikan berbarengan',
    togetherFirst: 'Laras pertama',
    togetherSecond: 'Laras kedua',
    togetherApart: 'Selisih terbesar {cents} sen pada derajat {degree} — sekitar {beats} adu bunyi per detik.',
    togetherSame: 'Dua laras yang sama tentu berpadu sempurna. Pilih laras yang berbeda untuk mendengar bedanya.',
    togetherModel:
      'Angka adu bunyi di sini adalah hitungan dari dua nada model, bukan hasil pengukuran perangkat sungguhan. Kekasaran bunyinya nyata; angkanya milik model.',
    beats: 'adu bunyi/detik',
    source: 'Sumber',
  },
  footer: {
    about: 'Tentang proyek ini',
    respect: 'Batas yang dijaga',
    source: 'Kode sumber',
  },
  diagnostik: {
    eyebrow: 'Uji perangkat',
    title: 'Diagnostik',
    lede: 'Halaman ini mengukur perangkat yang sedang Anda pegang. Tolok ukur di Node mengukur inti sintesisnya; yang menentukan justru apakah utas utama peramban masih sempat berjalan ketika ansambelnya ramai — karena utas itulah yang menjadwalkan nada berikutnya.',
    device: 'Perangkat',
    renderCost: 'Biaya render satu nada',
    run: 'Jalankan pengukuran',
    running: 'Mengukur…',
    voices: 'suara serentak',
    medianLate: 'keterlambatan tengah',
    worstLate: 'keterlambatan terburuk',
    missed: 'bangun terlambat melewati lookahead',
    verdict: 'Hasil',
    explain:
      'Penjadwal melihat 200 ms ke depan. Kalau satu bangun datang lebih dari 200 ms terlambat, nada yang seharusnya dia antrikan sudah lewat — itulah bunyi nada yang hilang, dan bisa diukur tanpa perlu mendengarkan.',
    copy: 'Salin hasil',
    copied: 'Tersalin',
    silentOk: 'Pengukuran ini tetap sahih walau sakelar senyap iPhone menyala: yang diukur adalah beban, bukan bunyinya.',
    soundCheck: 'Cek suara',
    soundCheckBody:
      'Kalau tidak ada yang terdengar, dua tombol ini memisahkan penyebabnya. Nada acuan adalah osilator biasa yang langsung menuju keluaran, melewati seluruh mesin sintesis proyek ini. Kalau nada acuan terdengar tetapi angklungnya tidak, yang salah ada di bunyi yang dihitung. Kalau dua-duanya diam, yang salah ada di konteks audio, perangkat keluaran, atau sakelar senyap.',
    referenceTone: 'Nada acuan (440 Hz)',
    oneAngklung: 'Satu angklung',
    bothSilent: 'Nyalakan suara dulu lewat tombol di kepala halaman.',
  },
  aransemen: {
    title: 'Aransemen',
    lede: 'Masukkan melodi, pilih set dan jumlah pemain, lihat pembagiannya — dan lihat apa yang tidak bisa dimainkan.',
    input: 'Melodi',
    inputHint:
      'Satu nada per baris: nama nada, ketukan mulai, panjang ketukan. Contoh: C4 0 1',
    solve: 'Bagikan',
    result: 'Hasil',
    feasible: 'Bisa dimainkan',
    notFeasible: 'Belum bisa dimainkan',
    nothingDropped: 'Tidak ada satu nada pun yang dibuang agar muat.',
  },
}

const en: Dictionary = {
  localeName: 'English',
  nav: {
    rak: 'Rack',
    ansambel: 'Ensemble',
    teknik: 'Technique',
    laras: 'Tuning',
    aransemen: 'Arrangement',
    menu: 'Menu',
    language: 'Language',
  },
  audio: {
    start: 'Start sound',
    starting: 'Starting…',
    ready: 'Sound is on',
    hint: 'Sound can only start from your own tap — browsers require it, iOS especially.',
    failed: 'Sound could not start in this browser.',
    voices: 'voices sounding',
    interrupted: 'Sound was interrupted — a call, Siri, or this tab losing focus. Touch the screen to bring it back.',
    resume: 'Resume sound',
    silentSwitch: 'Hearing nothing? On iPhone the silent switch mutes web audio too. Flip the switch and raise the volume.',
  },
  hero: {
    try: 'Sound an angklung',
    starting: 'Starting…',
    tapInvite: 'Tap any angklung above — or press the button.',
    tapHint: 'Tap any angklung. Hold it to keep it sounding.',
    step2Title: 'Now play one song',
    playMelody: 'Play “Twinkle, Twinkle”',
    stop: 'Stop',
    needs: 'This song needs',
    people: 'people',
    distinctNotes: 'distinct notes',
    awaiting: 'Play the song and these fill themselves in.',
    punchline: 'You have two hands. That is where the angklung parts company with every other instrument — and it is the thing this simulates.',
    explore: 'See how it splits up',
    stepsTitle: 'How it works',
    step1: 'One angklung, one note',
    step1Body: 'Shake it and the bamboo tubes strike the frame. Only one note can come out — there is no second note inside it.',
    step2: 'One song, many hands',
    step2Body: 'So a song has to be shared out. Each person holds one or two angklung and waits for their note to arrive.',
    step3: 'One conductor',
    step3Body: 'The leader signals numbers by hand. That number is each angklung’s identity — not the name of its note.',
    whereTitle: 'Where to next',
  },
  home: {
    title: 'One angklung, one note',
    subtitle:
      'An angklung simulator you can play right here in the browser. The sound is synthesised from a physical model of a bamboo tube — no recordings at all.',
    premise: 'An angklung can only sound one note.',
    premiseBody:
      'So a song is not one instrument but a room of people, each holding one or two angklung, each waiting for their note to arrive. The instrument is distributed. Playing it is a coordination problem, and that is what this simulates.',
    whyTitle: 'Why not a soundboard',
    whyBody:
      'Almost every angklung app is a soundboard: tap a picture of bamboo, hear a note. That models the sound and misses the instrument. Here the sound is synthesised from a physical model of a bamboo tube — no recordings at all — and the way the notes spread across players is the point.',
    techniquesTitle: 'Three techniques, one model',
    tengkepTitle: 'The interesting part: tengkep',
    tengkepBody:
      'On an angklung melodi, tengkep silences the octave tube, so you hear one pure note instead of the usual two. On a major angklung akompanimen it does something else: without tengkep four tubes sound a dominant seventh; hold one tube with the little finger and three remain, a major triad. The player’s little finger is a chord-quality switch.',
    startHere: 'Start at the rack',
    creditsTitle: 'The people',
    creditsBody:
      'Daeng Soetigna created the diatonic-chromatic angklung padaeng in 1938, specifically so angklung could play alongside Western instruments. Udjo Ngalagena developed the playing technique on laras salendro and pelog degung.',
    repertoireTitle: 'Why there is no Sundanese song here yet',
    repertoireBody:
      'Only public-domain or own-composition melodies ship, and so far none of them is Sundanese repertoire. Not for copyright reasons: Cing Cangkeling and Tokecang have no recorded composer. The reason is accuracy. Shipping a wrong melody under its real name misrepresents a living tradition, and copying cipher notation from a single unchecked source is not enough to rule that out. The gap is deliberate and ought to be filled — the requirements are written down in data/melodies/README.md.',
    disclaimer:
      'This is a personal educational project, not an authority. Tunings and techniques vary between traditions and between teachers; every figure here carries its source and can be edited.',
    ritual:
      'Angklung buhun lives inside rice-cultivation ritual and the veneration of Nyai Sri Pohaci. That context is noted here with respect, and is not simulated.',
    visit: 'Saung Angklung Udjo and local ensembles are where the instrument is actually learned.',
  },
  contoh: {
    title: 'A worked example you can follow to the end',
    lede: 'Four notes, three distinct pitches. Every figure below is computed by the same solver the rest of the site uses — none of it is written by hand.',
    phrase: 'The example phrase',
    step1: 'First, write down when each note sounds and for how long.',
    step2: 'Then compare each pair of pitches: is there any instant where both are sounding?',
    step3: 'Pitches that ever collide need different people. Pitches that never collide can share one pair of hands.',
    answer: 'So this phrase needs {players} people.',
    clashLine: '{a} and {b} collide at {atSec} seconds — two people',
    clearLine: '{a} and {b} are never together — one person can hold both',
    listen: 'Hear the phrase',
    pitchesLabel: 'Distinct pitches',
    caveat:
      'This example is deliberately as short as it can be, so it can be checked by hand. A real song has dozens of notes, but the rule is exactly the same one — no extra rule appears later.',
    whatIf: 'What if a note moved?',
    whatIfBody:
      'Drag G4 to the left until it sounds alongside C4 and E4. No note is added and none is removed — the only change is when one note begins — and the number of people needed changes with it. That is where the difficulty actually lives: not in how many notes there are, but in how many sound at once.',
    moveLabel: 'Start G4 at second',
    reset: 'Reset',
  },
  teknikNames: { kurulung: 'Kurulung', centok: 'Centok', tengkep: 'Tengkep' },
  teknikDesc: {
    kurulung:
      'Getar — the shake. The frame is held and the tabung dasar swung side to side for as long as the note lasts. Recommended 2–3 shakes per second.',
    centok:
      'Sentak — the pull. The tabung dasar is pulled sharply into the palm. It sounds once: short, like pizzicato.',
    tengkep:
      'Like kurulung, but one tube is held with the little finger so it cannot vibrate. Softer, fewer partials.',
  },
  rak: {
    title: 'The rack',
    lede: 'Angklung hanging in order, tube lengths genuinely graduated by pitch. The numbers are the numbers a conductor signals by hand.',
    howto:
      'Choose a technique, then press an angklung. Kurulung and tengkep sound for as long as you hold it; centok sounds once. Hold Shift while pressing to force tengkep.',
    setLabel: 'Angklung set',
    techniqueLabel: 'Technique on click',
    keyboardHint: 'By keyboard: Tab to move, space or Enter to sound, Shift for tengkep.',
    nomor: 'Number',
    warming: 'Preparing the instrument…',
    stateYourPart: 'your part',
    stateCued: 'cued now',
  },
  ansambel: {
    title: 'Ensemble',
    lede: 'One melody spread across players. Watch the rests: for an angklung player, waiting is most of the job.',
    melodyLabel: 'Melody',
    playersLabel: 'Players',
    minimum: 'at least',
    needs: 'This piece needs',
    listen: 'Listen',
    yourPart: 'Play your part',
    everyPart: 'Play every part',
    listenHint: 'The whole ensemble plays itself. Watch how many rows are idle at any moment.',
    yourPartHint:
      'Every other player is played for you. Your part is left silent — coming in on time is your job.',
    everyPartHint: 'Nothing is played for you. Try to play the whole piece yourself.',
    mode: 'Mode',
    groupPiece: 'The piece',
    groupRoom: 'The room',
    groupTransport: 'Run it',
    tempo: 'Tempo',
    countIn: 'Count-in',
    cueLane: 'Cue lane',
    legend: 'Reading the timeline',
    legendYours: 'your part',
    legendOthers: 'other players',
    legendAbsent: 'nobody holding it',
    legendPeak: 'the busiest instant',
    rowSummary: '{notes} notes, first entry at {first} seconds, waiting {rest} per cent of the piece',
    timelineRegion: 'Timeline, scrollable',
    pairRuleTitle: 'Why those numbers are held together',
    pairRule:
      'There is one rule and only one: two angklung may be held by the same person when their notes never sound at the same time. If they collide even once, they need two different people.',
    pairRuleSource: 'This is the rule the solver in lib/distribute runs — PRD §6.',
    pairCompatible: 'can be held with {pitchId}',
    pairClash: 'collides with {pitchId} at {atSec} seconds',
    pairHolds: 'Player {player} holds {pitches}',
    wholePieceCaveat:
      'A simplification used here: one person holds the same angklung from the beginning of the piece to the end. A real ensemble can swap between sections, and if it does, the number of people needed can be lower than the figure above.',
    nextCue: 'Next number',
    cueAnnounce: 'Number {nomor}, in {beats} beats',
    cueNone: 'No cue yet',
    play: 'Play',
    stop: 'Stop',
    player: 'Player',
    holds: 'holds',
    holdsNothing: 'holds no angklung',
    rests: 'resting',
    notesCount: 'notes',
    cannotAlone: 'Try to play all of it yourself. You will fail, and the failing is the answer.',
    pickPlayer: 'Choose a player',
    waiting: 'waiting',
    infeasible: 'Cannot be played like this',
    infeasibleOutsideSet:
      'The note {pitchId} is not in this set — {count} notes cannot be played. Change the set, or change the arrangement.',
    infeasibleSelfOverlap:
      'The note {pitchId} would have to sound twice at once. One angklung sounds once — a second angklung of the same note is needed.',
    infeasibleTooFewPlayers:
      'This needs {needed} players and {available} are available. The piece is not cut down to fit.',
    whyThisNumber: 'Why this number?',
    hideWhy: 'Close',
    driverOverlap:
      'At {atSec} seconds, {count} notes sound together. That many hands have to be in the air at the same instant — which is exactly where one person runs out of hands.',
    driverOverlapTied: 'That busiest moment happens more than once; the first is the one marked.',
    driverNoteCount:
      'Nothing overlaps in this piece. What decides it is the count: {distinct} distinct notes, and one person holds at most {perPlayer} angklung.',
    driverPacking:
      '{distinct} distinct notes cannot be split between fewer people without two of them colliding somewhere.',
    perPlayerLabel: 'Angklung per person',
    perPlayerOne: 'one',
    perPlayerTwo: 'two',
    perPlayerHint:
      'Two hands, two angklung — that is the limit used here. In many classrooms each child holds exactly one, and the number of people needed changes with it.',
    markAbsent: 'Mark absent',
    bringBack: 'Bring back',
    absenceTitle: 'Somebody did not come',
    absenceBody:
      '{players} absent. {silenced} of {total} notes have nobody holding them, so those notes do not sound.',
    absenceHint:
      'The notes are not removed from the piece — the melody is intact, there is simply a hole where a person should have been standing. This is what happens when one person misses a rehearsal.',
    restoreAll: 'Bring everyone back',
    andMore: '+{rest} more',
    withAkompanimen: 'Accompaniment',
    akompanimenOff: 'without',
    akompanimenOn: 'with',
    akompanimenNone: 'This piece has no accompaniment part that could be defended yet.',
    akompanimenBody:
      'An angklung akompanimen is not a note but a chord — four tubes at once, and the player\u2019s little finger is a chord-quality switch. Watch the rows on the timeline: melody players spend most of the piece waiting, accompanists almost never stop. Two different jobs in one room.',
    roleAkompanimen: 'accompaniment',
    akompanimenAdds: 'The accompaniment adds {added} more people, so {total} in the room.',
  },
  teknik: {
    title: 'Technique lab',
    lede: 'One angklung, isolated, with its strike pattern exposed. What you see is what the synthesis hears.',
    shakeRate: 'Shake rate',
    shakeRateCited: 'Documented range: 2–3 Hz. Outside it, this is no longer the kurulung that is taught.',
    hardness: 'Strike hardness',
    hold: 'Hold a tube (tengkep)',
    strikes: 'strikes',
    strikeTrain: 'Strike train',
    chainTitle: 'One chain, not three pictures',
    chainStep1:
      '1 · The technique becomes a train of strikes. Kurulung shakes the base tube and every reversal of direction is one strike, so 2–3 shakes per second gives 4–6 strikes. Centok is a single harder strike. Tengkep is kurulung with one tube held.',
    chainStep2:
      '2 · Each strike excites the tube\u2019s modal bank. A tube is not one frequency but several modes sounding together and decaying at their own rates. The list below is that model, and you can edit it.',
    chainStep3:
      '3 · Every sounding tube is summed into the waveform. This is where tengkep acts: a held tube never enters the sum, so its modes are genuinely absent — not lowered, not filtered.',
    chainCaveat:
      'What is simplified: a shake has no predetermined length, so kurulung and tengkep are rendered here at six seconds and faded on release. Hold one longer than that and what you hear is an approximation.',
    render: 'Rendered sound',
    sounding: 'sounding',
    muted: 'held',
    modes: 'Tube mode bank',
    modesHint:
      'This is the model itself, not a preview of it: one resonant mode per row — its multiple of the fundamental, its strength, and how long it takes to fall by 60 dB. Pitch and onset counts are settled by measurement; timbre cannot be, which is why this part is tuned by ear here.',
    amplitude: 'Strength',
    decay: 'Decay',
    octaveWarning:
      'A ratio near 2 collides with the octave tube, and the absence of anything at 2f is what makes tengkep measurable. The tengkep tests will fail.',
    exportTitle: 'Take the tuning with you',
    exportHint:
      'Nothing on this page is saved. Paste this into lib/synth/resonator.ts, then run pnpm test:synth — if pitch or partials miss, the model is wrong, not the tolerance.',
  },
  akor: {
    title: 'Angklung akompanimen',
    septimDominan: 'Dominant seventh chord',
    trinadaMayor: 'Major triad',
    septimMinor: 'Minor seventh chord',
    trinadaMinor: 'Minor triad',
    hold: 'Hold a tube with the little finger',
    release: 'Let go',
    tubes: 'tubes sounding',
    interval: 'interval above the root',
    which: 'Angklung',
    degreeRoot: 'root',
    degreeTertsMayor: 'major third',
    degreeTertsMinor: 'minor third',
    degreeKuint: 'perfect fifth',
    degreeSeptim: 'minor seventh',
    whyChord:
      'These four tubes — root, third, fifth, seventh — are what make this a seventh chord. The name does not decide it; those four distances do.',
    whyTriad:
      'The little finger holds the seventh tube. The three that remain — root, third, fifth — are the triad. Nothing is damped or filtered: one tube simply does not vibrate, so its interval is absent from the sum.',
    removedDegree: 'Gone: {degree} ({cents} cents)',
  },
  laras: {
    title: 'Laras',
    lede: 'The same phrase, three tunings. The fastest way to hear why the 1938 innovation mattered — and why a set tuned one way cannot simply join an ensemble tuned another.',
    oneAtATime: 'One at a time',
    samePhrase: 'The phrase is identical; only the laras changes.',
    cents: 'cents',
    centsExplained:
      'A cent is a unit of musical distance, not of frequency. An octave is divided into 1200 cents, so one piano key to the next is 100 cents. The unit is used here because the ear hears ratios rather than differences: 100 cents sounds like the same step low or high, where a difference in Hz does not.',
    edit: 'Edit the cents',
    reset: 'Reset',
    notAuthority:
      'Salendro and pelog degung have no fixed standard and vary between sets. These are one documented interval set, not the only correct one.',
    togetherTitle: 'Two laras at once',
    togetherBody:
      'Until now these have played one after another, and playing them in turn makes all three sound equally pleasant. Sound two of them together and you hear what is actually going on: the matching degrees do not land on the same frequency, and the two collide. Not because either is wrong — each is right where it belongs — but because they cannot simply be combined. This is the problem Daeng Soetigna answered in 1938.',
    togetherPlay: 'Play them together',
    togetherFirst: 'First laras',
    togetherSecond: 'Second laras',
    togetherApart: 'Widest gap {cents} cents at degree {degree} — roughly {beats} beats per second.',
    togetherSame: 'A laras agrees perfectly with itself. Pick two different ones to hear the difference.',
    togetherModel:
      'The beat rates here are arithmetic on two modelled pitches, not a measurement of any real set. The roughness is real; the number belongs to the model.',
    beats: 'beats/sec',
    source: 'Source',
  },
  footer: {
    about: 'About this project',
    respect: 'A line kept',
    source: 'Source code',
  },
  diagnostik: {
    eyebrow: 'Device test',
    title: 'Diagnostics',
    lede: 'This page measures the device in your hand. The Node benchmark measures the synthesis core; what decides the outcome is whether the browser main thread still gets to run while the ensemble is loud — because that thread is what schedules the next note.',
    device: 'Device',
    renderCost: 'Cost of rendering one note',
    run: 'Run the measurement',
    running: 'Measuring…',
    voices: 'simultaneous voices',
    medianLate: 'median lateness',
    worstLate: 'worst lateness',
    missed: 'wakeups later than the lookahead',
    verdict: 'Verdict',
    explain:
      'The scheduler looks 200 ms ahead. A wakeup arriving more than 200 ms late means a note it should have queued is already in the past — that is what a dropped note sounds like, and it is measurable without listening.',
    copy: 'Copy the results',
    copied: 'Copied',
    silentOk: 'These numbers hold even with the iPhone silent switch on: what is measured is load, not sound.',
    soundCheck: 'Sound check',
    soundCheckBody:
      'If you hear nothing, these two buttons separate the causes. The reference tone is a plain oscillator wired straight to the output, bypassing this project’s synthesis entirely. If the tone sounds and the angklung does not, the fault is in the computed sound. If neither sounds, the fault is in the audio context, the output device, or a silent switch.',
    referenceTone: 'Reference tone (440 Hz)',
    oneAngklung: 'One angklung',
    bothSilent: 'Start sound first, using the control in the header.',
  },
  aransemen: {
    title: 'Arrangement',
    lede: 'Enter a melody, choose a set and a number of players, see the distribution — and see what cannot be played.',
    input: 'Melody',
    inputHint: 'One note per line: pitch, start beat, length in beats. For example: C4 0 1',
    solve: 'Distribute',
    result: 'Result',
    feasible: 'Playable',
    notFeasible: 'Not playable yet',
    nothingDropped: 'Not one note was dropped to make it fit.',
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { id, en }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/** Prefix a path with the locale, for links inside the app. */
export function localePath(locale: Locale, path = ''): string {
  return `/${locale}${path}`
}
