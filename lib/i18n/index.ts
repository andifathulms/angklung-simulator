/**
 * Indonesian first, English secondary. Sundanese terminology is never translated
 * away in either locale — kurulung, centok, tengkep, tabung dasar, laras stay as
 * they are and are glossed on first use (invariant 16).
 */
export const LOCALES = ['id', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'id'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export interface Dictionary {
  readonly localeName: string
  readonly nav: {
    readonly beranda: string
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
    readonly tempo: string
    readonly countIn: string
    readonly cueLane: string
    readonly nextCue: string
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
  }
  readonly laras: {
    readonly title: string
    readonly lede: string
    readonly samePhrase: string
    readonly cents: string
    readonly edit: string
    readonly reset: string
    readonly notAuthority: string
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
    beranda: 'Beranda',
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
    tempo: 'Tempo',
    countIn: 'Aba-aba masuk',
    cueLane: 'Jalur aba-aba',
    nextCue: 'Nomor berikutnya',
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
  },
  laras: {
    title: 'Laras',
    lede: 'Frasa yang sama, tiga laras. Cara tercepat mendengar kenapa temuan 1938 itu penting — dan kenapa perangkat berlaras satu tidak bisa begitu saja bergabung dengan yang lain.',
    samePhrase: 'Frasa yang dimainkan sama persis; yang berbeda hanya larasnya.',
    cents: 'sen',
    edit: 'Ubah nilai sen',
    reset: 'Kembalikan',
    notAuthority:
      'Salendro dan pelog degung tidak punya standar baku dan berbeda antar perangkat. Angka di sini satu set terdokumentasi, bukan satu-satunya yang benar.',
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
    beranda: 'Home',
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
    tempo: 'Tempo',
    countIn: 'Count-in',
    cueLane: 'Cue lane',
    nextCue: 'Next number',
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
  },
  laras: {
    title: 'Laras',
    lede: 'The same phrase, three tunings. The fastest way to hear why the 1938 innovation mattered — and why a set tuned one way cannot simply join an ensemble tuned another.',
    samePhrase: 'The phrase is identical; only the laras changes.',
    cents: 'cents',
    edit: 'Edit the cents',
    reset: 'Reset',
    notAuthority:
      'Salendro and pelog degung have no fixed standard and vary between sets. These are one documented interval set, not the only correct one.',
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

/**
 * Fill `{name}` placeholders in a dictionary string. Copy that has to wrap around
 * a number belongs in the dictionary as one sentence, not as three fragments a
 * component concatenates — Indonesian and English do not put the number in the
 * same place, and concatenation quietly assumes they do.
 */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  )
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/** Prefix a path with the locale, for links inside the app. */
export function localePath(locale: Locale, path = ''): string {
  return `/${locale}${path}`
}
