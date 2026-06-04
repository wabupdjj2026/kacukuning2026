'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, BookOpen, Users, Calendar, LogIn, LogOut, Search, 
  Plus, Edit, Trash2, QrCode, FileSpreadsheet, 
  ShieldCheck, CheckCircle2, XCircle, Info, Database, Printer, Trophy, Compass, HeartPulse, Sparkles, UserPlus, ExternalLink, Sliders, Settings,
  MessageSquare, Send, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents import
import CertificateModal from '../components/CertificateModal';
import QrScannerPanel from '../components/QrScannerPanel';

// Firebase config and helpers
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';

// State Types definition
interface KelasKepahaman {
  id_kelas: string;
  nama_kelas: string;
  instruktur: string;
  deskripsi: string;
  kategori: 'Alkitab' | 'Alam Bebas' | 'Keterampilan' | 'Seni & Sosial' | 'Lainnya';
}

interface Peserta {
  username: string;
  password: string;
  nama_lengkap: string;
  no_peserta: string;
  Nama_Klub: string;
  Nama_Jemaat: string;
}

interface KelasMulai {
  id_transaksi: string;
  no_peserta: string;
  id_kelas: string;
  Kelas_mulai: string;
  Kelas_Selesai: string;
  status: 'Mulai' | 'Lulus' | 'Tidak Lulus';
  Instruktur: string;
  catatan_instruktur: string;
  link_sertifikat?: string;
}

interface SystemSettings {
  sheetId: string;
  appsScriptUrl: string;
  slideTemplateId: string;
  driveFolderId: string;
  isSyncEnabled: boolean;
  externalLink?: string;
  externalLinkLabel?: string;
  externalLink2?: string;
  externalLinkLabel2?: string;
}

interface Pertanyaan {
  id_pertanyaan: string;
  no_peserta: string;
  nama_lengkap: string;
  judul: string;
  isi: string;
  tanggal_kirim: string;
  status: 'Menunggu Jawaban' | 'Dijawab';
  jawaban?: string;
  tanggal_dijawab?: string;
}

// SEED DATA FOR FRESH INSTANCES
const INITIAL_CLASSES: KelasKepahaman[] = [
  { id_kelas: 'KHP01', nama_kelas: 'Membaca Alkitab', instruktur: 'Pdt. Yohanes S.', deskripsi: 'Kelas pemahaman tentang cara membaca, meneliti, dan merenungkan isi Alkitab secara mendalam serta terstruktur setiap hari.', kategori: 'Alkitab' },
  { id_kelas: 'KHP02', nama_kelas: 'Pertolongan Pertama (First Aid)', instruktur: 'Dr. Amelia Siregar', deskripsi: 'Pemahaman dasar tentang CPR, pertolongan tersedak, merawat luka luar, pembidaian fraktur, dan tindakan darurat medis di lapangan.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP03', nama_kelas: 'Berkemah di Alam Bebas', instruktur: 'Kak Andre Wijaya', deskripsi: 'Seni memilih kontur tanah yang aman, mendirikan tenda dome, menghadapi jalur cuaca, dan etika pelestarian lingkungan selama perkemahan.', kategori: 'Alam Bebas' },
  { id_kelas: 'KHP04', nama_kelas: 'Knot Tying (Tali Temali)', instruktur: 'Kak Andre Wijaya', deskripsi: 'Menguasai pembuatan lebih dari 15 jenis simpul penting seperti simpul kambing, tiang jangkar, pangkal untuk konstruksi gapura pionering.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP05', nama_kelas: 'Astronomi Bintang Dasar', instruktur: 'Prof. Budi Hartono', deskripsi: 'Memandu pengamatan rasi bintang penunjuk arah mata angin, siklus perputaran planet, bulan, serta navigasi malam tanpa instrumen.', kategori: 'Alam Bebas' },
  { id_kelas: 'KHP06', nama_kelas: 'Kepedulian Lingkungan Hidup', instruktur: 'Ir. Sarah Lestari', deskripsi: 'Pemilahan limbah organik mendasar, teknik mengolah kompos rumahan, pembatasan sampah plastik, dan pelestarian ekosistem sungai.', kategori: 'Alam Bebas' },
  { id_kelas: 'KHP07', nama_kelas: 'Berkebun Sayur & Toga', instruktur: 'Ibu Retno Wati', deskripsi: 'Panduan tata cara pembenihan tanah gembur, pembuatan pupuk hijau kompos mandiri, perawatan hortikultura, dan tanaman obat.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP08', nama_kelas: 'Memasak Rimba (Outdoor Cooking)', instruktur: 'Chef Ronald Siregar', deskripsi: 'Teori membuat masakan higienis seimbang tanpa kompor elpiji; menguasai pembuatan tungku sirkulasi udara dari tumpukan tanah/batu.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP09', nama_kelas: 'Berenang & Water Rescue', instruktur: 'Kak Glen Sitorus', deskripsi: 'Peningkatan daya tahan fisik di air, teknik menyelamatkan diri saat tergulung arus, dan metode membantu penarik korban tenggelam.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP10', nama_kelas: 'Bible Study Guide (Penelaah Alkitab)', instruktur: 'Pdt. Yohanes S.', deskripsi: 'Pelajaran mendalam berbobot mengenai analisis doktrin iman kekristenan, nubuatan Daniel, Wahyu, serta sejarah suci gereja.', kategori: 'Alkitab' },
  { id_kelas: 'KHP11', nama_kelas: 'Wilderness Survival (Survival Hutan)', instruktur: 'Kak Glen Sitorus', deskripsi: 'Cara membuat bivak darurat daun, menguji air minum alami layak konsumsi, bernavigasi kompas silva, dan memicu bara api kayu gesek.', kategori: 'Alam Bebas' },
  { id_kelas: 'KHP12', nama_kelas: 'Kesehatan Tubuh & Gizi Nutrisi', instruktur: 'Dr. Amelia Siregar', deskripsi: 'Anatomi nutrisi berimbang, prinsip mengonsumsi air murni, olahraga aerobik pemuda, serta pembagian pola istirahat 8 hukum kesehatan.', kategori: 'Seni & Sosial' },
  { id_kelas: 'KHP13', nama_kelas: 'Pionering Bambu Konstruksi', instruktur: 'Kak Andre Wijaya', deskripsi: 'Perancangan jembatan darurat penyeberangan sungai kecil, menara pantau mini tiga kaki, dan gapura bendera memakai ikatan simpul tali.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP14', nama_kelas: 'Seni Musik & Paduan Suara', instruktur: 'Ibu Levina Monica', deskripsi: 'Teknik mengatur pernapasan diafragma vokal paduan suara, memahami not balok kunci dasar, dan memimpin partitur lagu mars.', kategori: 'Seni & Sosial' },
  { id_kelas: 'KHP15', nama_kelas: 'Menjahit Pakaian Sederhana', instruktur: 'Sdr. Indah Permata', deskripsi: 'Praktik menjahit tusuk tikam jejak, menjahit keliman, memasang kancing lepas celana, serta melakukan permak robekan darurat.', kategori: 'Keterampilan' },
  { id_kelas: 'KHP16', nama_kelas: 'Basic Drawing (Seni Sketsa)', instruktur: 'Kak Donny Setiawan', deskripsi: 'Penguasaan dasar proporsi wajah, arsiran degradasi (shading), penentuan titik hilang ruang perspektif, serta gambar lanskap objek.', kategori: 'Seni & Sosial' },
  { id_kelas: 'KHP17', nama_kelas: 'Digital Photography Kreatif', instruktur: 'Kak Donny Setiawan', deskripsi: 'Rahasia mengunci fokus kamera HP, merangkai komposisi Rule of Thirds, pencahayaan alami golden-hour, dan dasar penyuntingan tonal.', kategori: 'Seni & Sosial' },
  { id_kelas: 'KHP18', nama_kelas: 'Kepemimpinan Pemuda (Youth Leadership)', instruktur: 'Ibu Levina Monica', deskripsi: 'Pemecahan masalah konflik regu, strategi memotivasi anggota pasif, administrasi notulen kepanduan, dan kepengurusan baksos.', kategori: 'Seni & Sosial' }
];

const INITIAL_PARTICIPANTS: Peserta[] = [
  { username: 'yocku', password: '123', nama_lengkap: 'Yocku Haris', no_peserta: 'PST01', Nama_Klub: 'Eagle Pathfinder Club', Nama_Jemaat: 'Jemaat Kelapa Gading' },
  { username: 'budi', password: '123', nama_lengkap: 'Budi Handoko', no_peserta: 'PST02', Nama_Klub: 'Lion Pathfinder Club', Nama_Jemaat: 'Jemaat Bekasi' },
  { username: 'clara', password: '123', nama_lengkap: 'Clara Sitorus', no_peserta: 'PST03', Nama_Klub: 'Dove Club', Nama_Jemaat: 'Jemaat Salemba' },
  { username: 'danang', password: '123', nama_lengkap: 'Danang Wijayanto', no_peserta: 'PST04', Nama_Klub: 'Eagle Pathfinder Club', Nama_Jemaat: 'Jemaat Kelapa Gading' },
  { username: 'elisabeth', password: '123', nama_lengkap: 'Elisabeth Siregar', no_peserta: 'PST05', Nama_Klub: 'Lion Pathfinder Club', Nama_Jemaat: 'Jemaat Bekasi' }
];

const INITIAL_LOGS: KelasMulai[] = [
  { id_transaksi: 'TX001', no_peserta: 'PST02', id_kelas: 'KHP01', Kelas_mulai: '2026-06-01T09:00:00.000Z', Kelas_Selesai: '2026-06-01T11:30:00.000Z', status: 'Lulus', Instruktur: 'Pdt. Yohanes S.', catatan_instruktur: 'Sangat mengagumkan! Mampu merenungkan ayat naratif secara logis.' },
  { id_transaksi: 'TX002', no_peserta: 'PST03', id_kelas: 'KHP02', Kelas_mulai: '2026-06-01T13:00:00.000Z', Kelas_Selesai: '2026-06-01T15:00:00.000Z', status: 'Lulus', Instruktur: 'Dr. Amelia Siregar', catatan_instruktur: 'Pemanfaatan mitela pembidaian patah tulang rusuk dikerjakan cepat.' },
  { id_transaksi: 'TX003', no_peserta: 'PST01', id_kelas: 'KHP04', Kelas_mulai: '2026-06-02T08:00:00.000Z', Kelas_Selesai: '', status: 'Mulai', Instruktur: 'Kak Andre Wijaya', catatan_instruktur: '' },
  { id_transaksi: 'TX004', no_peserta: 'PST04', id_kelas: 'KHP03', Kelas_mulai: '2026-06-02T10:15:00.000Z', Kelas_Selesai: '', status: 'Mulai', Instruktur: 'Kak Andre Wijaya', catatan_instruktur: '' }
];

const INITIAL_QUESTIONS: Pertanyaan[] = [
  {
    id_pertanyaan: 'QST01',
    no_peserta: 'PST01',
    nama_lengkap: 'Yocku Haris',
    judul: 'Bagaimana cara mendaftar ujian kelas Berkemah?',
    isi: 'Shalom Kak, saya ingin mengambil kelas Berkemah di Alam Bebas (KHP03). Apakah ada perlengkapan khusus yang wajib dibawa saat ujian praktis?',
    tanggal_kirim: '2026-06-03T08:00:00Z',
    status: 'Dijawab',
    jawaban: 'Halo Yocku! Untuk KHP03 Berkemah, perlengkapan wajib yang harus dibawa adalah ransel, jas hujan, kompas bidik, dan matras. Koordinasikan dengan Kak Andre Wijaya ya.',
    tanggal_dijawab: '2026-06-03T09:30:00Z'
  },
  {
    id_pertanyaan: 'QST02',
    no_peserta: 'PST02',
    nama_lengkap: 'Budi Handoko',
    judul: 'Kapan kelas tali-temali dibuka kembali?',
    isi: 'Halo panitia, apakah kelas Knot Tying (KHP04) ada sesi her atau susulan untuk simpul penambat?',
    tanggal_kirim: '2026-06-04T05:22:00Z',
    status: 'Menunggu Jawaban'
  }
];

const INITIAL_SETTINGS: SystemSettings = {
  sheetId: '',
  appsScriptUrl: '',
  slideTemplateId: '',
  driveFolderId: '',
  isSyncEnabled: false,
  externalLink: '',
  externalLinkLabel: 'Buka Link Pendukung 1',
  externalLink2: '',
  externalLinkLabel2: 'Buka Link Pendukung 2'
};

const FIREBASE_COLLECTIONS_INFO = `// Struktur Koleksi Firestore Terintegrasi:
1. classes/      -> Dokumen Kelas Kepahaman (18 Kelas)
2. participants/ -> Profil & Kredensial Peserta
3. sirkulasi/    -> Log & Status Sirkulasi Kelas
4. settings/     -> Konfigurasi Link Sertifikasi (Dokumen id: "system")
5. questions/    -> Pusat Bantuan Tanya Jawab Peserta

Keamanan & Integritas Data diatur via Zero-Trust Security Rules.`;

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  // Database states
  const [classesList, setClassesList] = useState<KelasKepahaman[]>([]);
  const [participantsList, setParticipantsList] = useState<Peserta[]>([]);
  const [sirkulasiList, setSirkulasiList] = useState<KelasMulai[]>([]);
  const [questionsList, setQuestionsList] = useState<Pertanyaan[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [acknowledgedLulus, setAcknowledgedLulus] = useState<string[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [newlyPassedClasses, setNewlyPassedClasses] = useState<KelasMulai[]>([]);
  const [firebaseErrorState, setFirebaseErrorState] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  
  // Question Form states
  const [questionJudul, setQuestionJudul] = useState('');
  const [questionIsi, setQuestionIsi] = useState('');
  const [answeringQId, setAnsweringQId] = useState<string | null>(null);
  const [adminAnswerText, setAdminAnswerText] = useState('');
  const handleCopySql = () => {
    navigator.clipboard.writeText(FIREBASE_COLLECTIONS_INFO);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showToast('Skema Koleksi Firestore berhasil disalin ke clipboard!', 'success');
  };

  // Authentication states
  const [currentUser, setCurrentUser] = useState<{ role: 'admin' | 'peserta'; info: any } | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regNamaLengkap, setRegNamaLengkap] = useState('');
  const [regNamaKlub, setRegNamaKlub] = useState('');
  const [regNamaJemaat, setRegNamaJemaat] = useState('');

  // Custom non-blocking Alert & Confirm state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // UI state managers
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'scanner' | 'classes' | 'participants' | 'sirkulasi' | 'settings' | 'questions'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [participantCategoryFilter, setParticipantCategoryFilter] = useState<string>('Semua');

  // Modal Detail states
  const [selectedClass, setSelectedClass] = useState<KelasKepahaman | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Certificate Modal controllers
  const [certificateData, setCertificateData] = useState<any>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  // CRUD Forms states
  const [classForm, setClassForm] = useState({ id_kelas: '', nama_kelas: '', instruktur: '', deskripsi: '', kategori: 'Keterampilan' });
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [pesertaForm, setPesertaForm] = useState({ username: '', password: '', nama_lengkap: '', no_peserta: '', Nama_Klub: '', Nama_Jemaat: '' });
  const [isEditingPeserta, setIsEditingPeserta] = useState(false);

  // Print cards preview controller
  const [printCardPeserta, setPrintCardPeserta] = useState<Peserta | null>(null);
  const [printPosterKelas, setPrintPosterKelas] = useState<KelasKepahaman | null>(null);

  // Use Client Effect to avoid Server hydration mismatch and seed localStorage if empty
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClient(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle dynamically loading and subscribing to Firestore collections based on current user session role
  useEffect(() => {
    if (!isClient) return;

    let unsubClasses = () => {};
    let unsubSettings = () => {};
    let unsubParticipants = () => {};
    let unsubSirkulasi = () => {};
    let unsubQuestions = () => {};

    const timer = setTimeout(() => {
      // Seed and retrieve database from localStorage as immediate fast loading
      const savedClasses = localStorage.getItem('sistem_kelas_kepahaman_classes');
      if (savedClasses) {
        setClassesList(JSON.parse(savedClasses));
      } else {
        setClassesList(INITIAL_CLASSES);
      }

      const savedParticipants = localStorage.getItem('sistem_kelas_kepahaman_participants');
      if (savedParticipants) {
        setParticipantsList(JSON.parse(savedParticipants));
      } else {
        setParticipantsList(INITIAL_PARTICIPANTS);
      }

      const savedSirkulasi = localStorage.getItem('sistem_kelas_kepahaman_sirkulasi');
      if (savedSirkulasi) {
        setSirkulasiList(JSON.parse(savedSirkulasi));
      } else {
        setSirkulasiList(INITIAL_LOGS);
      }

      const savedQuestions = localStorage.getItem('sistem_kelas_kepahaman_questions');
      if (savedQuestions) {
        setQuestionsList(JSON.parse(savedQuestions));
      } else {
        setQuestionsList(INITIAL_QUESTIONS);
      }

      const savedSettings = localStorage.getItem('sistem_kelas_kepahaman_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Auto restoring session if saved
      const savedUser = sessionStorage.getItem('sistem_kelas_kepahaman_session');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        // Query active Firebase session
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
          if (user) {
            const email = user.email || '';
            const isFireAdmin = email === 'admin@gmail.com' || email === 'yockuharis172@gmail.com';
            
            // Reconstruct or match participant data
            const matchedLocal = (JSON.parse(localStorage.getItem('sistem_kelas_kepahaman_participants') || '[]') as Peserta[])
              .find(p => p.username.toLowerCase() === email.toLowerCase());

            const sessionData = {
              role: isFireAdmin ? ('admin' as const) : ('peserta' as const),
              info: matchedLocal || {
                username: email,
                password: '',
                nama_lengkap: user.displayName || email.split('@')[0] || 'Peserta Firebase',
                no_peserta: 'PST_FIRE',
                Nama_Klub: 'Umum',
                Nama_Jemaat: 'Umum'
              }
            };
            setCurrentUser(sessionData);
            sessionStorage.setItem('sistem_kelas_kepahaman_session', JSON.stringify(sessionData));
          }
        });
        sessionStorage.setItem('sistem_kelas_kepahaman_auth_listener', 'active');
      }

      const token = sessionStorage.getItem('google_access_token');
      if (token) {
        setGoogleAccessToken(token);
      }

      const savedAck = localStorage.getItem('sistem_kelas_kepahaman_acknowledged_lulus');
      if (savedAck) {
        setAcknowledgedLulus(JSON.parse(savedAck));
      }

      // Validate connection to Firestore initially
      const validateFirestoreConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'classes', 'connection_test'));
        } catch (error: any) {
          const isOffline = !navigator.onLine || (error instanceof Error && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
          if (isOffline) {
            console.warn('Initial connection: Firebase client is offline. Operating in local-first fallback mode.');
          } else if (error instanceof Error && error.message.includes('permission-denied')) {
            console.warn('Initial connection validated correctly with permission checks');
          }
        }
      };
      validateFirestoreConnection();

      // Firebase loader helper functions
      const loadClasses = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'classes'));
          const data = snapshot.docs.map(doc => doc.data() as KelasKepahaman);
          
          if (data && data.length > 0) {
            const sorted = [...data];
            sorted.sort((a, b) => a.id_kelas.localeCompare(b.id_kelas));
            setClassesList(sorted);
            localStorage.setItem('sistem_kelas_kepahaman_classes', JSON.stringify(sorted));
          } else {
            // Seed Firestore table if empty
            try {
              for (const item of INITIAL_CLASSES) {
                await setDoc(doc(db, 'classes', item.id_kelas), item);
              }
            } catch (seedErr) {
              console.warn("Seeding classes skipped (insufficient write permission or already synced)");
            }
            setClassesList(INITIAL_CLASSES);
            localStorage.setItem('sistem_kelas_kepahaman_classes', JSON.stringify(INITIAL_CLASSES));
          }
        } catch (err: any) {
          const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
          if (isOffline) {
            console.warn("error syncing classes with Firestore (offline fallback): ", err.message || err);
          } else {
            console.error("error syncing classes with Firestore: ", err);
          }
          if (err.message && err.message.includes('permission-denied')) {
            setFirebaseErrorState('uninitialized');
          }
          // Graceful fallback to localStorage
          const saved = localStorage.getItem('sistem_kelas_kepahaman_classes');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setClassesList(parsed);
            } catch (jsonErr) {
              setClassesList(INITIAL_CLASSES);
            }
          } else {
            setClassesList(INITIAL_CLASSES);
          }
        }
      };

      const loadSettings = async () => {
        try {
          const docRef = doc(db, 'settings', 'system');
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            try {
              await setDoc(docRef, { id: 'system', ...INITIAL_SETTINGS });
            } catch (seedErr) {
              console.warn("Seeding settings skipped (insufficient write permission)");
            }
            setSettings(INITIAL_SETTINGS);
            localStorage.setItem('sistem_kelas_kepahaman_settings', JSON.stringify(INITIAL_SETTINGS));
          } else {
            const data = docSnap.data();
            const systemData: SystemSettings = {
              sheetId: data.sheetId || '',
              appsScriptUrl: data.appsScriptUrl || '',
              slideTemplateId: data.slideTemplateId || '',
              driveFolderId: data.driveFolderId || '',
              isSyncEnabled: !!data.isSyncEnabled,
              externalLink: data.externalLink || '',
              externalLinkLabel: data.externalLinkLabel || '',
              externalLink2: data.externalLink2 || '',
              externalLinkLabel2: data.externalLinkLabel2 || '',
            };
            setSettings(systemData);
            localStorage.setItem('sistem_kelas_kepahaman_settings', JSON.stringify(systemData));
          }
        } catch (err: any) {
          const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
          if (isOffline) {
            console.warn("error syncing settings with Firestore (offline fallback): ", err.message || err);
          } else {
            console.error("error syncing settings with Firestore: ", err);
          }
          if (err.message && err.message.includes('permission-denied')) {
            setFirebaseErrorState('uninitialized');
          }
          // Graceful fallback to localStorage
          const saved = localStorage.getItem('sistem_kelas_kepahaman_settings');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setSettings(parsed);
            } catch (jsonErr) {
              setSettings(INITIAL_SETTINGS);
            }
          } else {
            setSettings(INITIAL_SETTINGS);
          }
        }
      };

      // Trigger public loads
      loadClasses();
      loadSettings();

      // Subscribe to public collections
      const uClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
        const updated = snapshot.docs.map(d => d.data() as KelasKepahaman);
        if (updated.length > 0) {
          updated.sort((a, b) => a.id_kelas.localeCompare(b.id_kelas));
          setClassesList(updated);
          localStorage.setItem('sistem_kelas_kepahaman_classes', JSON.stringify(updated));
        }
      }, (error) => {
        const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
        if (isOffline) {
          console.warn("Classes subscription offline fallback triggered:", error.message);
        } else {
          handleFirestoreError(error, OperationType.GET, 'classes');
        }
      });
      unsubClasses = () => uClasses();

      const uSettings = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const systemData: SystemSettings = {
            sheetId: data.sheetId || '',
            appsScriptUrl: data.appsScriptUrl || '',
            slideTemplateId: data.slideTemplateId || '',
            driveFolderId: data.driveFolderId || '',
            isSyncEnabled: !!data.isSyncEnabled,
            externalLink: data.externalLink || '',
            externalLinkLabel: data.externalLinkLabel || '',
            externalLink2: data.externalLink2 || '',
            externalLinkLabel2: data.externalLinkLabel2 || '',
          };
          setSettings(systemData);
          localStorage.setItem('sistem_kelas_kepahaman_settings', JSON.stringify(systemData));
        }
      }, (error) => {
        const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
        if (isOffline) {
          console.warn("Settings subscription offline fallback triggered:", error.message);
        } else {
          handleFirestoreError(error, OperationType.GET, 'settings/system');
        }
      });
      unsubSettings = () => uSettings();

      // Load and subscribe to private collections depending on role
      if (currentUser) {
        if (currentUser.role === 'admin') {
          const loadParticipants = async () => {
            try {
              const snapshot = await getDocs(collection(db, 'participants'));
              const data = snapshot.docs.map(doc => doc.data() as Peserta);
              
              if (data && data.length > 0) {
                const sorted = [...data];
                sorted.sort((a, b) => a.no_peserta.localeCompare(b.no_peserta));
                setParticipantsList(sorted);
                localStorage.setItem('sistem_kelas_kepahaman_participants', JSON.stringify(sorted));
              } else {
                try {
                  for (const item of INITIAL_PARTICIPANTS) {
                    await setDoc(doc(db, 'participants', item.no_peserta), item);
                  }
                } catch (seedErr) {
                  console.warn("Seeding participants skipped (insufficient write permission)");
                }
                setParticipantsList(INITIAL_PARTICIPANTS);
                localStorage.setItem('sistem_kelas_kepahaman_participants', JSON.stringify(INITIAL_PARTICIPANTS));
              }
            } catch (err: any) {
              const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
              if (isOffline) {
                console.warn("error syncing participants with Firestore (offline fallback): ", err.message || err);
              } else {
                console.error("error syncing participants with Firestore: ", err);
              }
              // Graceful fallback to localStorage
              const saved = localStorage.getItem('sistem_kelas_kepahaman_participants');
              if (saved) {
                try {
                  setParticipantsList(JSON.parse(saved));
                } catch (jsonErr) {
                  setParticipantsList(INITIAL_PARTICIPANTS);
                }
              } else {
                setParticipantsList(INITIAL_PARTICIPANTS);
              }
            }
          };

          const loadSirkulasi = async () => {
            try {
              const snapshot = await getDocs(collection(db, 'sirkulasi'));
              const data = snapshot.docs.map(doc => doc.data() as KelasMulai);
              
              if (data && data.length > 0) {
                const sorted = [...data];
                sorted.sort((a, b) => a.id_transaksi.localeCompare(b.id_transaksi));
                setSirkulasiList(sorted);
                localStorage.setItem('sistem_kelas_kepahaman_sirkulasi', JSON.stringify(sorted));
              } else {
                try {
                  for (const item of INITIAL_LOGS) {
                    await setDoc(doc(db, 'sirkulasi', item.id_transaksi), item);
                  }
                } catch (seedErr) {
                  console.warn("Seeding sirkulasi skipped (insufficient write permission)");
                }
                setSirkulasiList(INITIAL_LOGS);
                localStorage.setItem('sistem_kelas_kepahaman_sirkulasi', JSON.stringify(INITIAL_LOGS));
              }
            } catch (err: any) {
              const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
              if (isOffline) {
                console.warn("error syncing sirkulasi with Firestore (offline fallback): ", err.message || err);
              } else {
                console.error("error syncing sirkulasi with Firestore: ", err);
              }
              // Graceful fallback to localStorage
              const saved = localStorage.getItem('sistem_kelas_kepahaman_sirkulasi');
              if (saved) {
                try {
                  setSirkulasiList(JSON.parse(saved));
                } catch (jsonErr) {
                  setSirkulasiList(INITIAL_LOGS);
                }
              } else {
                setSirkulasiList(INITIAL_LOGS);
              }
            }
          };

          const loadQuestions = async () => {
            try {
              const snapshot = await getDocs(collection(db, 'questions'));
              const data = snapshot.docs.map(doc => doc.data() as Pertanyaan);
              
              if (data && data.length > 0) {
                const sorted = [...data];
                sorted.sort((a, b) => b.tanggal_kirim.localeCompare(a.tanggal_kirim));
                setQuestionsList(sorted);
                localStorage.setItem('sistem_kelas_kepahaman_questions', JSON.stringify(sorted));
              } else {
                try {
                  for (const item of INITIAL_QUESTIONS) {
                    await setDoc(doc(db, 'questions', item.id_pertanyaan), item);
                  }
                } catch (seedErr) {
                  console.warn("Seeding questions skipped (insufficient write permission)");
                }
                setQuestionsList(INITIAL_QUESTIONS);
                localStorage.setItem('sistem_kelas_kepahaman_questions', JSON.stringify(INITIAL_QUESTIONS));
              }
            } catch (err: any) {
              const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
              if (isOffline) {
                console.warn("error syncing questions with Firestore (offline fallback): ", err.message || err);
              } else {
                console.error("error syncing questions with Firestore: ", err);
              }
              // Graceful fallback to localStorage
              const saved = localStorage.getItem('sistem_kelas_kepahaman_questions');
              if (saved) {
                try {
                  setQuestionsList(JSON.parse(saved));
                } catch (jsonErr) {
                  setQuestionsList(INITIAL_QUESTIONS);
                }
              } else {
                setQuestionsList(INITIAL_QUESTIONS);
              }
            }
          };

          loadParticipants();
          loadSirkulasi();
          loadQuestions();

          const uParticipants = onSnapshot(collection(db, 'participants'), (snapshot) => {
            const updated = snapshot.docs.map(d => d.data() as Peserta);
            if (updated.length > 0) {
              updated.sort((a, b) => a.no_peserta.localeCompare(b.no_peserta));
              setParticipantsList(updated);
              localStorage.setItem('sistem_kelas_kepahaman_participants', JSON.stringify(updated));
            }
          }, (error) => {
            const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
            if (isOffline) {
              console.warn("Participants subscription offline fallback triggered:", error.message);
            } else {
              handleFirestoreError(error, OperationType.GET, 'participants');
            }
          });
          unsubParticipants = () => uParticipants();

          const uSirkulasi = onSnapshot(collection(db, 'sirkulasi'), (snapshot) => {
            const updated = snapshot.docs.map(d => d.data() as KelasMulai);
            if (updated.length > 0) {
              updated.sort((a, b) => a.id_transaksi.localeCompare(b.id_transaksi));
              setSirkulasiList(updated);
              localStorage.setItem('sistem_kelas_kepahaman_sirkulasi', JSON.stringify(updated));
            }
          }, (error) => {
            const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
            if (isOffline) {
              console.warn("Sirkulasi subscription offline fallback triggered:", error.message);
            } else {
              handleFirestoreError(error, OperationType.GET, 'sirkulasi');
            }
          });
          unsubSirkulasi = () => uSirkulasi();

          const uQuestions = onSnapshot(collection(db, 'questions'), (snapshot) => {
            const updated = snapshot.docs.map(d => d.data() as Pertanyaan);
            if (updated.length > 0) {
              updated.sort((a, b) => b.tanggal_kirim.localeCompare(a.tanggal_kirim));
              setQuestionsList(updated);
              localStorage.setItem('sistem_kelas_kepahaman_questions', JSON.stringify(updated));
            }
          }, (error) => {
            const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
            if (isOffline) {
              console.warn("Questions subscription offline fallback triggered:", error.message);
            } else {
              handleFirestoreError(error, OperationType.GET, 'questions');
            }
          });
          unsubQuestions = () => uQuestions();
        } else if (currentUser.role === 'peserta' && currentUser.info?.no_peserta) {
          const noPeserta = currentUser.info.no_peserta;

          const loadParticipantSirkulasi = async () => {
            try {
              const q = query(collection(db, 'sirkulasi'), where('no_peserta', '==', noPeserta));
              const snapshot = await getDocs(q);
              const data = snapshot.docs.map(doc => doc.data() as KelasMulai);
              if (data && data.length > 0) {
                const sorted = [...data];
                sorted.sort((a, b) => a.id_transaksi.localeCompare(b.id_transaksi));
                setSirkulasiList(sorted);
              }
            } catch (err: any) {
              const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
              if (isOffline) {
                console.warn("error syncing filtered sirkulasi with Firestore (offline fallback): ", err.message || err);
              } else {
                console.error("error syncing filtered sirkulasi with Firestore: ", err);
              }
            }
          };

          const loadParticipantQuestions = async () => {
            try {
              const q = query(collection(db, 'questions'), where('no_peserta', '==', noPeserta));
              const snapshot = await getDocs(q);
              const data = snapshot.docs.map(doc => doc.data() as Pertanyaan);
              if (data && data.length > 0) {
                const sorted = [...data];
                sorted.sort((a, b) => b.tanggal_kirim.localeCompare(a.tanggal_kirim));
                setQuestionsList(sorted);
              }
            } catch (err: any) {
              const isOffline = !navigator.onLine || (err.message && (err.message.toLowerCase().includes('offline') || err.message.toLowerCase().includes('failed to get document')));
              if (isOffline) {
                console.warn("error syncing filtered questions with Firestore (offline fallback): ", err.message || err);
              } else {
                console.error("error syncing filtered questions with Firestore: ", err);
              }
            }
          };

          loadParticipantSirkulasi();
          loadParticipantQuestions();

          const uParticipants = onSnapshot(doc(db, 'participants', noPeserta), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as Peserta;
              setParticipantsList(prev => {
                const cleaned = prev.filter(p => p.no_peserta !== noPeserta);
                return [...cleaned, data].sort((a, b) => a.no_peserta.localeCompare(b.no_peserta));
              });
            }
          }, (error) => {
            const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
            if (isOffline) {
              console.warn("Participants (single) subscription offline fallback triggered:", error.message);
            } else {
              handleFirestoreError(error, OperationType.GET, `participants/${noPeserta}`);
            }
          });
          unsubParticipants = () => uParticipants();

          const sirkulasiQuery = query(collection(db, 'sirkulasi'), where('no_peserta', '==', noPeserta));
          const uSirkulasi = onSnapshot(sirkulasiQuery, (snapshot) => {
            const updated = snapshot.docs.map(d => d.data() as KelasMulai);
            updated.sort((a, b) => a.id_transaksi.localeCompare(b.id_transaksi));
            setSirkulasiList(updated);
          }, (error) => {
            const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
            if (isOffline) {
              console.warn("Sirkulasi query subscription offline fallback triggered:", error.message);
            } else {
              handleFirestoreError(error, OperationType.GET, 'sirkulasi_query');
            }
          });
          unsubSirkulasi = () => uSirkulasi();

          const questionsQuery = query(collection(db, 'questions'), where('no_peserta', '==', noPeserta));
          const uQuestions = onSnapshot(questionsQuery, (snapshot) => {
            const updated = snapshot.docs.map(d => d.data() as Pertanyaan);
            updated.sort((a, b) => b.tanggal_kirim.localeCompare(a.tanggal_kirim));
            setQuestionsList(updated);
          }, (error) => {
            const isOffline = !navigator.onLine || (error.message && (error.message.toLowerCase().includes('offline') || error.message.toLowerCase().includes('failed to get document')));
            if (isOffline) {
              console.warn("Questions query subscription offline fallback triggered:", error.message);
            } else {
              handleFirestoreError(error, OperationType.GET, 'questions_query');
            }
          });
          unsubQuestions = () => uQuestions();
        }
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      unsubClasses();
      unsubSettings();
      unsubParticipants();
      unsubSirkulasi();
      unsubQuestions();
    };
  }, [currentUser, isClient]);

  // Sync methods save to localStorage & Firestore
  const saveClassesToDb = async (newList: KelasKepahaman[]) => {
    setClassesList(newList);
    localStorage.setItem('sistem_kelas_kepahaman_classes', JSON.stringify(newList));
    
    try {
      const snapshot = await getDocs(collection(db, 'classes'));
      const dbIds = snapshot.docs.map(doc => doc.id);
      const newIds = newList.map(item => item.id_kelas);
      const deletedIds = dbIds.filter(id => !newIds.includes(id));
      
      for (const id of deletedIds) {
        await deleteDoc(doc(db, 'classes', id));
      }
      for (const item of newList) {
        await setDoc(doc(db, 'classes', item.id_kelas), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'classes');
    }
  };

  const saveParticipantsToDb = async (newList: Peserta[]) => {
    setParticipantsList(newList);
    localStorage.setItem('sistem_kelas_kepahaman_participants', JSON.stringify(newList));
    
    try {
      const snapshot = await getDocs(collection(db, 'participants'));
      const dbIds = snapshot.docs.map(doc => doc.id);
      const newIds = newList.map(item => item.no_peserta);
      const deletedIds = dbIds.filter(id => !newIds.includes(id));
      
      for (const id of deletedIds) {
        await deleteDoc(doc(db, 'participants', id));
      }
      for (const item of newList) {
        await setDoc(doc(db, 'participants', item.no_peserta), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'participants');
    }
  };

  const saveSirkulasiToDb = async (newList: KelasMulai[]) => {
    setSirkulasiList(newList);
    localStorage.setItem('sistem_kelas_kepahaman_sirkulasi', JSON.stringify(newList));
    
    try {
      const snapshot = await getDocs(collection(db, 'sirkulasi'));
      const dbIds = snapshot.docs.map(doc => doc.id);
      const newIds = newList.map(item => item.id_transaksi);
      const deletedIds = dbIds.filter(id => !newIds.includes(id));
      
      for (const id of deletedIds) {
        await deleteDoc(doc(db, 'sirkulasi', id));
      }
      for (const item of newList) {
        await setDoc(doc(db, 'sirkulasi', item.id_transaksi), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'sirkulasi');
    }
  };

  const saveQuestionsToDb = async (newList: Pertanyaan[]) => {
    setQuestionsList(newList);
    localStorage.setItem('sistem_kelas_kepahaman_questions', JSON.stringify(newList));
    
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      const dbIds = snapshot.docs.map(doc => doc.id);
      const newIds = newList.map(item => item.id_pertanyaan);
      const deletedIds = dbIds.filter(id => !newIds.includes(id));
      
      for (const id of deletedIds) {
        await deleteDoc(doc(db, 'questions', id));
      }
      for (const item of newList) {
        await setDoc(doc(db, 'questions', item.id_pertanyaan), item);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'questions');
    }
  };

  const handleSaveSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('sistem_kelas_kepahaman_settings', JSON.stringify(newSettings));
    
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        id: 'system',
        ...newSettings
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/system');
    }
  };

  const handleGoogleSheetsSync = async (targetSettings = settings) => {
    const token = googleAccessToken || sessionStorage.getItem('google_access_token');
    if (!token) {
      showToast('Harap hubungkan akun Google Anda di pengaturan terlebih dahulu.', 'info');
      return;
    }
    setIsSyncingSheets(true);
    let previousSheetId = targetSettings.sheetId;
    try {
      showToast('Menghubungkan ke Google Sheets API...', 'info');
      const response = await fetch('/api/google/sync-sheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetId: previousSheetId,
          classes: classesList,
          participants: participantsList,
          sirkulasi: sirkulasiList,
          questions: questionsList,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal sinkronisasi data ke Google Sheets');
      }

      const resData = await response.json();
      if (resData.success && resData.sheetId) {
        if (resData.sheetId !== previousSheetId) {
          const updatedSettings = { ...targetSettings, sheetId: resData.sheetId };
          await handleSaveSettings(updatedSettings);
        }
        showToast('Sinkronisasi Google Sheets Berhasil! 4 Tab tabulasi dibuat/diperbarui.', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Terjadi kesalahan saat sinkronisasi Google Sheets', 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Login handler using Firebase Auth and local profile matching
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanUser = usernameInput.trim();
    const cleanPwd = passwordInput.trim();

    if (!cleanUser || !cleanPwd) {
      setAuthError('Email / Username & password harus diisi!');
      return;
    }

    // 1. Check Admin
    if (cleanUser.toLowerCase() === 'admin' && cleanPwd === 'admin') {
      const session = { role: 'admin' as const, info: { nama_lengkap: 'Panitia Kepahaman', username: 'admin' } };
      setCurrentUser(session);
      sessionStorage.setItem('sistem_kelas_kepahaman_session', JSON.stringify(session));
      setUsernameInput('');
      setPasswordInput('');
      setShowLoginModal(false);
      showToast('Masuk sebagai Admin berhasil!', 'success');
      return;
    }

    // 2. Check Participant (Local Mock Bypass for trial users)
    const matchedP = participantsList.find(p => p.username.toLowerCase() === cleanUser.toLowerCase() && p.password === cleanPwd);
    if (matchedP) {
      const session = { role: 'peserta' as const, info: matchedP };
      setCurrentUser(session);
      sessionStorage.setItem('sistem_kelas_kepahaman_session', JSON.stringify(session));
      setUsernameInput('');
      setPasswordInput('');
      setShowLoginModal(false);
      showToast(`Masuk berhasil! Selamat datang, ${matchedP.nama_lengkap}`, 'success');
      return;
    }

    // 3. Try real Firebase Email Auth
    if (cleanUser.includes('@')) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanUser, cleanPwd);
        const user = userCredential.user;

        if (user) {
          const email = user.email || cleanUser;
          let dbParticipant = participantsList.find(p => p.username.toLowerCase() === email.toLowerCase());

          if (!dbParticipant) {
            const nextNo = generateNoPeserta();
            dbParticipant = {
              username: email,
              password: cleanPwd,
              nama_lengkap: user.displayName || email.split('@')[0],
              no_peserta: nextNo,
              Nama_Klub: 'Eagle Pathfinder Club',
              Nama_Jemaat: 'Jemaat Kelapa Gading'
            };
            const updatedList = [...participantsList, dbParticipant];
            await saveParticipantsToDb(updatedList);
          }

          const session = { role: 'peserta' as const, info: dbParticipant };
          setCurrentUser(session);
          sessionStorage.setItem('sistem_kelas_kepahaman_session', JSON.stringify(session));
          setUsernameInput('');
          setPasswordInput('');
          setShowLoginModal(false);
          showToast(`Masuk via Firebase berhasil! Selamat datang, ${dbParticipant.nama_lengkap}`, 'success');
          return;
        }
      } catch (err: any) {
        console.error("Firebase Login Error:", err);
        setAuthError(err.message || 'Gagal masuk. Periksa kembali email & password Anda.');
        return;
      }
    }

    setAuthError('Kredensial tidak valid. Silakan gunakan format email untuk login Firebase atau kredensial akun lokal Anda.');
  };

  const generateNoPeserta = () => {
    let maxNum = 0;
    participantsList.forEach(p => {
      const match = p.no_peserta.match(/^PST(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `PST${String(nextNum).padStart(2, '0')}`;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const username = regUsername.trim();
    const password = regPassword.trim();
    const namaLengkap = regNamaLengkap.trim();
    const namaKlub = regNamaKlub.trim();
    const namaJemaat = regNamaJemaat.trim();

    if (!username || !password || !namaLengkap || !namaKlub || !namaJemaat) {
      setAuthError('Semua kolom data pendaftaran harus diisi!');
      return;
    }

    if (username.toLowerCase() === 'admin') {
      setAuthError('Username "admin" tidak diperbolehkan!');
      return;
    }

    if (!username.includes('@')) {
      setAuthError('Pendaftaran memerlukan alamat email yang valid (contoh: nama@email.com) untuk integrasi Firebase.');
      return;
    }

    if (participantsList.some(p => p.username.toLowerCase() === username.toLowerCase())) {
      setAuthError('Email ini sudah terdaftar sebagai peserta lain.');
      return;
    }

    const nextNoPeserta = generateNoPeserta();

    try {
      // 1. Sign Up using Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;

      // 2. Save participant metadata into participants table
      const newParticipant: Peserta = {
        username: username,
        password: password,
        nama_lengkap: namaLengkap,
        no_peserta: nextNoPeserta,
        Nama_Klub: namaKlub,
        Nama_Jemaat: namaJemaat
      };

      const updatedList = [...participantsList, newParticipant];
      await saveParticipantsToDb(updatedList);

      const session = { role: 'peserta' as const, info: newParticipant };
      setCurrentUser(session);
      sessionStorage.setItem('sistem_kelas_kepahaman_session', JSON.stringify(session));
      showToast(`Pendaftaran Berhasil! Anda otomatis masuk. Nomor Peserta: ${nextNoPeserta}`, 'success');

      // Reset forms
      setRegUsername('');
      setRegPassword('');
      setRegNamaLengkap('');
      setRegNamaKlub('');
      setRegNamaJemaat('');
      
      setLoginMode('login');
      setShowLoginModal(false);
    } catch (err: any) {
      console.error("Firebase Registration Error:", err);
      setAuthError(err.message || 'Proses pendaftaran ke pihak Firebase gagal.');
    }
  };

  // Logout handler using Firebase signOut
  const handleLogout = () => {
    setConfirmState({
      message: 'Apakah Anda yakin ingin keluar dari sistem sirkulasi kelas kepahaman?',
      onConfirm: async () => {
        try {
          await signOut(auth);
        } catch (err) {
          console.error("Gagal keluar dari session Firebase:", err);
        }
        setCurrentUser(null);
        sessionStorage.removeItem('sistem_kelas_kepahaman_session');
        setActiveAdminTab('dashboard');
        showToast('Anda telah berhasil keluar dari sistem.', 'info');
      }
    });
  };

  // Google Login handling and registration matching
  const handleGoogleAuthSuccess = (googleUser: { name: string; email: string; googleId: string; picture: string; accessToken?: string }) => {
    if (googleUser.accessToken) {
      setGoogleAccessToken(googleUser.accessToken);
      sessionStorage.setItem('google_access_token', googleUser.accessToken);
    }

    // Recover current admin session
    const savedUser = sessionStorage.getItem('sistem_kelas_kepahaman_session');
    const parsedUser = savedUser ? JSON.parse(savedUser) : null;

    if (parsedUser && parsedUser.role === 'admin') {
      showToast(`Koneksi Akun Google Admin (${googleUser.email}) Berhasil!`, 'success');
      setShowLoginModal(false);
      return;
    }

    const saved = localStorage.getItem('sistem_kelas_kepahaman_participants');
    const list: Peserta[] = saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;

    const emailPrefix = googleUser.email.toLowerCase().split('@')[0];
    
    // Attempt match with email prefix (username matches prefix) or matching complete full name
    const matched = list.find(p => 
      p.username.toLowerCase() === emailPrefix || 
      p.nama_lengkap.toLowerCase().replace(/\s+/g, '') === googleUser.name.toLowerCase().replace(/\s+/g, '')
    );

    let loggedInPeserta: Peserta;

    if (matched) {
      loggedInPeserta = matched;
      showToast(`Selamat datang kembali, ${matched.nama_lengkap}! Berhasil masuk via Google.`, 'success');
    } else {
      // Create and auto-register new Google participant
      const maxNum = list.reduce((max, p) => {
        const num = parseInt(p.no_peserta.replace('PST', ''), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newNoPeserta = `PST${String(maxNum + 1).padStart(2, '0')}`;

      const newPeserta: Peserta = {
        username: emailPrefix,
        password: "google_" + newNoPeserta,
        nama_lengkap: googleUser.name,
        no_peserta: newNoPeserta,
        Nama_Klub: "Eagle Pathfinder Club",
        Nama_Jemaat: "Jemaat Kelapa Gading"
      };

      const updatedList = [...list, newPeserta];
      saveParticipantsToDb(updatedList);
      loggedInPeserta = newPeserta;
      showToast(`Akun berhasil dibuat secara otomatis (${newNoPeserta}) via Google Anda.`, 'success');
    }

    const session = { role: 'peserta' as const, info: loggedInPeserta };
    setCurrentUser(session);
    sessionStorage.setItem('sistem_kelas_kepahaman_session', JSON.stringify(session));
    setShowLoginModal(false);
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) {
        throw new Error('Gagal menghubungi penunjuk konfigurasi Google.');
      }
      const { url } = await response.json();
      
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'google_oauth_popup',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      if (!popup) {
        setAuthError('Popup diblokir! Izinkan popup browser Anda untuk masuk dengan Google.');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(`Gagal menghubungi server otentikasi Google: ${err?.message || err}`);
    }
  };

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow relative or dev subdomain preview addresses
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.payload) {
        handleGoogleAuthSuccess(event.data.payload);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for newly passed classes for the currently logged in participant
  useEffect(() => {
    let active = true;
    if (isClient && currentUser && currentUser.role === 'peserta') {
      const myPassed = sirkulasiList.filter(
        s => s.no_peserta === currentUser.info.no_peserta && s.status === 'Lulus'
      );
      
      // Get ones that are not in acknowledgedLulus
      const unacknowledged = myPassed.filter(
        s => !acknowledgedLulus.includes(s.id_transaksi)
      );
      
      const timer = setTimeout(() => {
        if (!active) return;
        if (unacknowledged.length > 0) {
          setNewlyPassedClasses(unacknowledged);
          setShowNotificationModal(true);
        } else {
          setNewlyPassedClasses([]);
          setShowNotificationModal(false);
        }
      }, 50);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    }
  }, [currentUser, sirkulasiList, acknowledgedLulus, isClient]);

  const acknowledgePassedClass = (txIds: string[]) => {
    const updated = [...acknowledgedLulus, ...txIds];
    setAcknowledgedLulus(updated);
    localStorage.setItem('sistem_kelas_kepahaman_acknowledged_lulus', JSON.stringify(updated));
    setShowNotificationModal(false);
  };


  // Circulation Engine: Mulai Kelas
  const processMulaiKelas = (noPeserta: string, idKelas: string, instructorName?: string) => {
    // Check if participant already has active class currently
    const alreadyEnrolled = sirkulasiList.some(s => s.no_peserta === noPeserta && s.id_kelas === idKelas && s.status === 'Mulai');
    if (alreadyEnrolled) {
      return { success: false, message: 'Peserta ini telah didaftarkan dan sedang aktif dalam kelas ini!' };
    }

    const participant = participantsList.find(p => p.no_peserta === noPeserta);
    const classDetail = classesList.find(c => c.id_kelas === idKelas);

    if (!participant || !classDetail) {
      return { success: false, message: 'Peserta atau Kelas tidak terdaftar dalam catatan database!' };
    }

    const newTx: KelasMulai = {
      id_transaksi: 'TX' + Date.now().toString().slice(-6),
      no_peserta: noPeserta,
      id_kelas: idKelas,
      Kelas_mulai: new Date().toISOString(),
      Kelas_Selesai: '',
      status: 'Mulai',
      Instruktur: instructorName || classDetail.instruktur,
      catatan_instruktur: ''
    };

    const updatedList = [newTx, ...sirkulasiList];
    saveSirkulasiToDb(updatedList);

    return { 
      success: true, 
      message: `Berhasil mendaftarkan ${participant.nama_lengkap} ke kelas ${classDetail.nama_kelas}! Status: SEDANG BERLANGSUNG.` 
    };
  };

  // Circulation Engine: Selesai Kelas
  const processSelesaiKelas = (noPeserta: string, idKelas: string, status: 'Lulus' | 'Tidak Lulus', noteStr: string, instructorName?: string) => {
    // Search active sirkulasi log
    const txIndex = sirkulasiList.findIndex(s => s.no_peserta === noPeserta && s.id_kelas === idKelas && s.status === 'Mulai');
    
    if (txIndex === -1) {
      return { success: false, message: 'Data sirkulasi "Mulai" aktif tidak ditemukan untuk koordinasi kelas ini.' };
    }

    const participant = participantsList.find(p => p.no_peserta === noPeserta);
    const classDetail = classesList.find(c => c.id_kelas === idKelas);
    
    if (!participant || !classDetail) {
      return { success: false, message: 'Data peserta atau kelas tidak ditemukan!' };
    }

    const updated = [...sirkulasiList];
    updated[txIndex] = {
      ...updated[txIndex],
      Kelas_Selesai: new Date().toISOString(),
      status: status,
      Instruktur: instructorName || updated[txIndex].Instruktur || classDetail.instruktur,
      catatan_instruktur: noteStr,
      link_sertifikat: status === 'Lulus' ? `simulated-pdf-id-${updated[txIndex].id_transaksi}` : ''
    };

    saveSirkulasiToDb(updated);

    return { 
      success: true, 
      message: `Konfirmasi evaluasi sukses! ${participant.nama_lengkap} dinilai [${status.toUpperCase()}] untuk kelas ${classDetail.nama_kelas}. ${status === 'Lulus' ? 'Sertifikat telah diterbitkan!' : ''}` 
    };
  };



  // CRUD Classes
  const handleClassFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.id_kelas || !classForm.nama_kelas || !classForm.instruktur) {
      showToast('Mohon isi kode kelas, nama kelas, dan instruktur!', 'error');
      return;
    }

    if (isEditingClass) {
      const idx = classesList.findIndex(c => c.id_kelas === classForm.id_kelas);
      if (idx !== -1) {
        const updated = [...classesList];
        updated[idx] = classForm as any;
        saveClassesToDb(updated);
        setIsEditingClass(false);
        showToast('Berhasil mengubah rincian kelas.', 'success');
      }
    } else {
      // Check duplicated id
      if (classesList.some(c => c.id_kelas.toUpperCase() === classForm.id_kelas.toUpperCase())) {
        showToast('Kode kelas sudah ada dalam database!', 'error');
        return;
      }
      const updated = [...classesList, { ...classForm, id_kelas: classForm.id_kelas.toUpperCase() } as any];
      saveClassesToDb(updated);
      showToast('Kelas baru berhasil ditambahkan.', 'success');
    }

    setClassForm({ id_kelas: '', nama_kelas: '', instruktur: '', deskripsi: '', kategori: 'Keterampilan' });
  };

  const deleteClass = (id: string) => {
    setConfirmState({
      message: `Apakah Anda yakin ingin menghapus kelas ${id}? Seluruh catalog kompetensi ini akan dicabut secara permanen.`,
      onConfirm: () => {
        const updated = classesList.filter(c => c.id_kelas !== id);
        saveClassesToDb(updated);
        showToast(`Kelas ${id} berhasil dihapus.`, 'success');
      }
    });
  };

  // CRUD Participants
  const handlePesertaFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesertaForm.no_peserta || !pesertaForm.nama_lengkap || !pesertaForm.Nama_Klub || !pesertaForm.username || !pesertaForm.password) {
      showToast('Mohon lengkapi semua kolom pendaftaran peserta!', 'error');
      return;
    }

    if (isEditingPeserta) {
      const idx = participantsList.findIndex(p => p.no_peserta === pesertaForm.no_peserta);
      if (idx !== -1) {
        const updated = [...participantsList];
        updated[idx] = pesertaForm;
        saveParticipantsToDb(updated);
        setIsEditingPeserta(false);
        showToast('Rincian profil peserta berhasil diperbarui.', 'success');
      }
    } else {
      if (participantsList.some(p => p.no_peserta.toUpperCase() === pesertaForm.no_peserta.toUpperCase())) {
        showToast('Nomor Peserta sudah terdaftar!', 'error');
        return;
      }
      if (participantsList.some(p => p.username.toLowerCase() === pesertaForm.username.toLowerCase())) {
        showToast('Username sudah terpakai orang lain!', 'error');
        return;
      }
      const updated = [...participantsList, { ...pesertaForm, no_peserta: pesertaForm.no_peserta.toUpperCase() }];
      saveParticipantsToDb(updated);
      showToast('Akun peserta baru berhasil dibuat.', 'success');
    }

    setPesertaForm({ username: '', password: '', nama_lengkap: '', no_peserta: '', Nama_Klub: '', Nama_Jemaat: '' });
  };

  const deletePeserta = (noPeserta: string) => {
    setConfirmState({
      message: `Apakah Anda yakin ingin menghapus peserta dengan nomor peserta ${noPeserta}? Tindakan ini akan menghilangkan data peserta secara permanen.`,
      onConfirm: () => {
        const updated = participantsList.filter(p => p.no_peserta !== noPeserta);
        saveParticipantsToDb(updated);
        showToast(`Peserta dengan nomor ${noPeserta} berhasil dihapus.`, 'success');
      }
    });
  };

  // Certificate Open trigger
  const triggerCertificateView = (tx: KelasMulai) => {
    const matchedP = participantsList.find(p => p.no_peserta === tx.no_peserta);
    const matchedC = classesList.find(c => c.id_kelas === tx.id_kelas);

    if (matchedP && matchedC) {
      setCertificateData({
        participantName: matchedP.nama_lengkap,
        participantNo: matchedP.no_peserta,
        clubName: matchedP.Nama_Klub,
        jemaatName: matchedP.Nama_Jemaat,
        className: matchedC.nama_kelas,
        classId: matchedC.id_kelas,
        instructorName: tx.Instruktur || matchedC.instruktur,
        completionDate: tx.Kelas_Selesai,
        notes: tx.catatan_instruktur
      });
      setIsCertOpen(true);
    } else {
      showToast('Data kelulusan terdeteksi, namun metadata peserta atau kelas sudah terhapus secara fisik.', 'error');
    }
  };

  // Circulation list delete row
  const deleteSirkulasiRow = (idTx: string) => {
    setConfirmState({
      message: `Apakah Anda yakin ingin menghapus entri riwayat sirkulasi transaksi ${idTx}?`,
      onConfirm: () => {
        const updated = sirkulasiList.filter(s => s.id_transaksi !== idTx);
        saveSirkulasiToDb(updated);
        showToast(`Riwayat sirkulasi ${idTx} berhasil dihapus.`, 'success');
      }
    });
  };

  // Export Log to CSV spreadsheet representation
  const handleExportCSV = () => {
    if (sirkulasiList.length === 0) {
      showToast('Tidak ada riwayat sirkulasi untuk diekspor.', 'error');
      return;
    }
    
    const headers = ['ID Transaksi', 'No Peserta', 'Nama Peserta', 'ID Kelas', 'Nama Kelas', 'Kelas Mulai', 'Kelas Selesai', 'Status', 'Instruktur', 'Catatan'];
    const csvRows = [headers.join(',')];

    sirkulasiList.forEach(item => {
      const p = participantsList.find(x => x.no_peserta === item.no_peserta);
      const c = classesList.find(x => x.id_kelas === item.id_kelas);
      
      const row = [
        item.id_transaksi,
        item.no_peserta,
        p ? `"${p.nama_lengkap}"` : '"TDK DIKENAL"',
        item.id_kelas,
        c ? `"${c.nama_kelas}"` : '"TDK DIKENAL"',
        item.Kelas_mulai ? `"${new Date(item.Kelas_mulai).toLocaleDateString()}"` : '""',
        item.Kelas_Selesai ? `"${new Date(item.Kelas_Selesai).toLocaleDateString()}"` : '""',
        item.status,
        `"${item.Instruktur || ''}"`,
        `"${item.catatan_instruktur || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Laporan_Sirkulasi_Kepahaman.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers for Question Form
  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const trimJudul = questionJudul.trim();
    const trimIsi = questionIsi.trim();
    
    if (!trimJudul || !trimIsi) {
      showToast('Judul dan isi pertanyaan harus diisi!', 'error');
      return;
    }
    
    const newId = 'QST' + String(Date.now()).substring(7);
    const newQ: Pertanyaan = {
      id_pertanyaan: newId,
      no_peserta: currentUser.info.no_peserta || 'UMUM',
      nama_lengkap: currentUser.info.nama_lengkap || 'Username Anonim',
      judul: trimJudul,
      isi: trimIsi,
      tanggal_kirim: new Date().toISOString(),
      status: 'Menunggu Jawaban'
    };
    
    const updated = [newQ, ...questionsList];
    await saveQuestionsToDb(updated);
    setQuestionJudul('');
    setQuestionIsi('');
    showToast('Pertanyaan Anda berhasil dikirim ke Panitia!', 'success');
  };

  const handleAnswerQuestionSubmit = async (qId: string) => {
    const trimAnswer = adminAnswerText.trim();
    if (!trimAnswer) {
      showToast('Isi jawaban tidak boleh kosong!', 'error');
      return;
    }
    
    const updated = questionsList.map(q => {
      if (q.id_pertanyaan === qId) {
        return {
          ...q,
          status: 'Dijawab' as const,
          jawaban: trimAnswer,
          tanggal_dijawab: new Date().toISOString()
        };
      }
      return q;
    });
    
    await saveQuestionsToDb(updated);
    setAnsweringQId(null);
    setAdminAnswerText('');
    showToast('Jawaban berhasil dikirim!', 'success');
  };

  const handleDeleteQuestion = async (qId: string) => {
    setConfirmState({
      message: 'Apakah Anda yakin ingin menghapus pertanyaan ini secara permanen dari basis data?',
      onConfirm: async () => {
        const filtered = questionsList.filter(q => q.id_pertanyaan !== qId);
        await saveQuestionsToDb(filtered);
        showToast('Pertanyaan berhasil dihapus!', 'success');
      }
    });
  };

  // Filter & Search katalog calculation for Public / Dashboard Class listing
  const filteredClasses = classesList.filter(cls => {
    const matchesSearch = cls.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cls.instruktur.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cls.id_kelas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || cls.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats summaries
  const totalClasses = classesList.length;
  const totalParticipants = participantsList.length;
  const activeEnrollmentsCount = sirkulasiList.filter(s => s.status === 'Mulai').length;
  const totalGraduated = sirkulasiList.filter(s => s.status === 'Lulus').length;

  // Print-Card specific markup trigger
  const handlePrintCard = (p: Peserta) => {
    setPrintCardPeserta(p);
    setTimeout(() => {
      window.print();
      setPrintCardPeserta(null);
    }, 500);
  };

  const handlePrintPoster = (c: KelasKepahaman) => {
    setPrintPosterKelas(c);
    setTimeout(() => {
      window.print();
      setPrintPosterKelas(null);
    }, 500);
  };

  if (!isClient) return null; // Avoid render dehydration hydration errors

  // RENDER PRINT CARD VIEW OVERLAY (Will only show during raw print process via media queries)
  if (printCardPeserta) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center p-10 font-sans text-slate-800">
        <div className="w-[10.5cm] h-[7.4cm] border-4 border-slate-900 rounded-2xl p-6 relative flex flex-col justify-between bg-white text-slate-900 shadow-xl overflow-hidden">
          {/* Scout Strip Header */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-emerald-600"></div>
          
          <div className="flex justify-between items-start pt-2">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-extrabold">Peserta Cert</span>
              <h2 className="text-xl font-display font-black leading-tight text-slate-950 mt-1">{printCardPeserta.nama_lengkap}</h2>
              <p className="text-xs text-slate-600 font-semibold">{printCardPeserta.Nama_Klub}</p>
              <p className="text-[10px] text-slate-500">{printCardPeserta.Nama_Jemaat}</p>
            </div>
            
            {/* Visual QR badges from Server */}
            <div className="w-20 h-20 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(printCardPeserta.no_peserta)}`} 
                alt="QR Peserta"
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="flex justify-between items-end mt-4">
            <div>
              <span className="text-[9px] text-slate-400 block font-mono">Nomor Registrasi</span>
              <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-900 border border-slate-200">{printCardPeserta.no_peserta}</span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-slate-400 block font-mono">Panitia Pelaksana</span>
              <span className="text-xs font-serif italic text-slate-800 border-t border-slate-400 pt-0.5 inline-block">Sirkulasi 18 Kelas</span>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-300">Sistem Kelas Kepahaman</div>
        </div>
      </div>
    );
  }

  // RENDER PRINT POSTER VIEW OVERLAY
  if (printPosterKelas) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-20 text-slate-900 font-sans">
        <div className="w-[18cm] h-[25cm] border-[12px] border-[#926d3e] p-10 flex flex-col justify-between items-center text-center bg-[#fdfaf5]">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-[4px] text-amber-800">QR Code Kelas Kepahaman</span>
            <h1 className="text-4xl font-display font-black text-slate-950 mt-4 leading-tight">{printPosterKelas.nama_kelas}</h1>
            <div className="w-20 h-1 bg-amber-500 mx-auto mt-4"></div>
            <p className="text-sm text-slate-600 mt-2 font-semibold">Instruktur: {printPosterKelas.instruktur}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 italic">Kategori: {printPosterKelas.kategori}</p>
          </div>

          {/* GIANT QR CODE FOR CLASSROOM CAMERA SCANS */}
          <div className="w-80 h-80 bg-white border-2 border-dashed border-amber-600/30 p-4 rounded-3xl shadow-lg">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(printPosterKelas.id_kelas)}`} 
              alt="QR Kelas"
              className="w-full h-full"
            />
          </div>

          <div>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto italic mb-6">
              &ldquo;{printPosterKelas.deskripsi}&rdquo;
            </p>
            <div className="font-mono text-lg font-extrabold bg-[#f1ebd9] px-6 py-2 rounded text-[#926d3e] border border-[#e0d4c3] tracking-widest inline-block">
              {printPosterKelas.id_kelas}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-4">Pindai QR Code di atas menggunakan Scanner Panitia untuk memproses sirkulasi keikutsertaan.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" id="application-root">
      
      {/* 1. APP TOP CONSOLIDATED HEADER BAR */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-base shadow-sm shadow-blue-600/20">
              18
            </div>
            <div>
              <h1 className="font-display font-black tracking-wider text-slate-900 text-sm md:text-base leading-none uppercase">SISTEM KEPAHAMAN PATHFINDER</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-blue-600 font-extrabold mt-0.5">Sirkulasi &amp; Sertifikat</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">System Online</span>
            </span>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800">{currentUser.info.nama_lengkap}</span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide capitalize">{currentUser.role === 'admin' ? 'Panitia Admin' : 'Peserta'}</span>
                </span>
                
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1 px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 border border-slate-200 bg-slate-50 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  id="btn-signout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 active:scale-95 transition-all cursor-pointer border border-transparent"
                id="btn-signin"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span>Masuk Akun</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. MAIN HUB CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PUBLIC PRE-LOGGED VIEW: CATALOG SEARCH & WELCOME */}
        {!currentUser && (
          <div className="space-y-8" id="public-screen-container">
            {/* Elegant Hero card block */}
            <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
              <div className="absolute inset-0 opacity-5 select-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="max-w-2xl relative space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-400/20 rounded-full text-xs font-bold text-blue-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Katalog 18 Kelas Kepahaman Terbuka</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-black leading-tight tracking-tight uppercase">
                  Tingkatkan Kepahaman &amp; Tuntaskan Kelas Kepahaman Anda!
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                  Pelajari beragam keterampilan kepanduan, dari Pertolongan Pertama, Berkemah di Hutan, hingga Pendalaman Alkitab. Cari materi kelas di bawah, atau masuk ke dasbor untuk mengunduh Sertifikat kelulusan sah Anda!
                </p>

                <div className="flex flex-wrap gap-2.5 pt-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs tracking-wider uppercase transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                  >
                    Buka Panel Peserta
                  </button>
                  <a
                    href="#catalog-lookup-section"
                    className="px-6 py-3 rounded-xl font-bold border border-blue-500/30 hover:bg-white/5 text-xs text-slate-200 tracking-wider uppercase transition-all"
                  >
                    Cari Kelas Katalog
                  </a>
                </div>
              </div>
            </div>

            {/* Catalog lookup section */}
            <div id="catalog-lookup-section" className="scroll-mt-20 spacing-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-800 uppercase tracking-tight">Daftar Kategori Kelas</h3>
                  <p className="text-slate-500 text-xs">Mengeksplorasi seluruh pembagian kompetensi materi kepramukaan</p>
                </div>

                {/* Filter and search controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                  <div className="relative w-full sm:w-64 animate-fade-in-up">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari materi / instruktur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>

                  {/* Category select */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-[11px] font-semibold text-slate-600">
                    {['Semua', 'Alkitab', 'Alam Bebas', 'Keterampilan', 'Seni & Sosial'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                          selectedCategory === cat ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid of Class Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.length === 0 ? (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                    <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-550 text-xs">Materi kelas kepahaman yang dicari tidak ditemukan.</p>
                  </div>
                ) : (
                  filteredClasses.map(cls => (
                    <div
                      key={cls.id_kelas}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
                    >
                      <div className="p-5 space-y-4">
                        {/* Class category pill and ID */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase border ${
                            cls.kategori === 'Alkitab' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            cls.kategori === 'Alam Bebas' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                            cls.kategori === 'Keterampilan' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                          }`}>
                            {cls.kategori}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{cls.id_kelas}</span>
                        </div>

                        {/* Title & Desc */}
                        <div className="space-y-1">
                          <h4 className="font-display font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{cls.nama_kelas}</h4>
                          <p className="text-[11px] text-slate-500 font-semibold">Penguji: <span className="text-slate-700 font-bold">{cls.instruktur}</span></p>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-2">{cls.deskripsi}</p>
                        </div>
                      </div>

                      {/* Card Footer action button */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10.5px] font-semibold text-blue-600 bg-blue-50/50 flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-100">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                          <span>Kelas Tersedia</span>
                        </span>
                        
                        <button
                          onClick={() => { setSelectedClass(cls); setIsDetailOpen(true); }}
                          className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline flex items-center gap-0.5"
                          id={`btn-view-detail-${cls.id_kelas}`}
                        >
                          <span>Rincian Modul</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Static Information Footer Callout */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-650 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800">E-Sertifikat Terintegrasi Otomatis</h4>
                  <p className="text-xs text-slate-500 max-w-lg mt-0.5">Seluruh peserta yang mengikuti 18 kelas dapat dilacak kehadirannya dengan melampirkan kartu absensi QR fisik ke panitia, dan sertifikat PDF resmi akan otomatis mendarat di dasbor akun.</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl transition-all w-full md:w-auto shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Masuk Untuk Memulai
              </button>
            </div>
          </div>
        )}

        {/* LOGGED IN SYSTEM VIEW: SECTION 1 - PANEL PESERTA */}
        {currentUser && currentUser.role === 'peserta' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="participant-screen-container">
            
            {/* Left Box: Card and Progress Stats - spans 4 cols */}
            <div className="lg:col-span-4 space-y-6">
              {/* Printable Participant Badge */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-xl border border-slate-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                
                <p className="text-[9px] uppercase font-mono tracking-widest text-blue-400 font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                  <span>Kartu Absensi Peserta</span>
                </p>

                <h3 className="font-display font-black text-xl text-white mt-3 truncate">{currentUser.info.nama_lengkap}</h3>
                <p className="text-xs text-slate-300 font-medium truncate">{currentUser.info.Nama_Klub}</p>
                <p className="text-[10px] text-slate-400">{currentUser.info.Nama_Jemaat}</p>

                {/* Simulated high-quality QR center code */}
                <div className="my-6 bg-white rounded-xl p-3 w-40 h-40 mx-auto shadow-inner flex items-center justify-center relative group">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUser.info.no_peserta)}`}
                    alt="QR Absen Peserta"
                    className="w-full h-full animate-fade-in"
                  />
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-mono">Kode No. Peserta</span>
                    <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-white">{currentUser.info.no_peserta}</span>
                  </div>

                  <button
                    onClick={() => handlePrintCard(currentUser.info)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-md shadow-blue-650/20 cursor-pointer"
                    id="btn-print-my-card"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Kartu</span>
                  </button>
                </div>
              </div>

              {/* Progress and Streaks calculator card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <h4 className="font-display font-bold text-sm text-slate-800 uppercase tracking-tight">Evaluasi Progress Kelas</h4>
                
                {/* Completed ratio */}
                {(() => {
                  const completedCount = sirkulasiList.filter(s => s.no_peserta === currentUser.info.no_peserta && s.status === 'Lulus').length;
                  const ratio = Math.round((completedCount / totalClasses) * 100);
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="text-left">
                          <span className="text-2xl font-black text-slate-900 leading-tight block">{completedCount} / {totalClasses}</span>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Kelas Lulus</span>
                        </div>
                        <span className="text-xs font-mono font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{ratio}% Tuntas</span>
                      </div>
                      
                      {/* Bar progress */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" 
                          style={{ width: `${ratio}%` }}
                        ></div>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1.5 pt-1 text-left">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>Selesaikan seluruh 18 sirkulasi kepahaman dasar pandu untuk meraih Lencana Agung Pathfinder.</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Right Box: Enrollment Details and Lookup list - spans 8 cols */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Subsection 1: Historical Enrollments (Status: Mulai & Lulus) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-left">
                    <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-tight">Riwayat Ambil Kelas Kepahaman</h3>
                    <p className="text-slate-500 text-xs">Maju dan laporkan kartu absen ke panitia untuk merubah status kelas</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {settings.externalLink && (
                      <a
                        href={settings.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 hover:text-blue-700 text-blue-600 rounded-xl border border-blue-100 transition-all cursor-pointer shadow-xs active:scale-95"
                        id="btn-riwayat-external-link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{settings.externalLinkLabel ?? 'Link Pendukung 1'}</span>
                      </a>
                    )}
                    {settings.externalLink2 && (
                      <a
                        href={settings.externalLink2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 hover:text-purple-700 text-purple-600 rounded-xl border border-purple-100 transition-all cursor-pointer shadow-xs active:scale-95"
                        id="btn-riwayat-external-link-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{settings.externalLinkLabel2 ?? 'Link Pendukung 2'}</span>
                      </a>
                    )}
                    <Trophy className="w-5 h-5 text-amber-500 hidden sm:block ml-1" />
                  </div>
                </div>

                {(() => {
                  const myEnrollments = sirkulasiList.filter(s => s.no_peserta === currentUser.info.no_peserta);
                  
                  if (myEnrollments.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-550 text-xs leading-relaxed">
                        <Award className="w-10 h-10 text-slate-350 mx-auto mb-2 animate-pulse" />
                        <span>Belum memiliki kelas aktif saat ini. Mintalah Panitia Kepahaman di lapangan menscan kartu QR Anda untuk mendaftar kelas baru.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-slate-100">
                      {myEnrollments.map(item => {
                        const classInfo = classesList.find(c => c.id_kelas === item.id_kelas);
                        
                        return (
                          <div key={item.id_transaksi} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all">
                            <div className="space-y-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                  {item.id_kelas}
                                </span>
                                <h4 className="font-display font-bold text-sm text-slate-800">{classInfo?.nama_kelas || 'Kelas Tidak Diketahui'}</h4>
                              </div>
                              <p className="text-xs text-slate-500">Mulai: <b className="font-mono text-slate-700">{new Date(item.Kelas_mulai).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</b> &bull; Penguji: <span className="font-bold text-slate-700">{item.Instruktur}</span></p>
                              {item.catatan_instruktur && (
                                <p className="text-[11px] text-slate-500 italic pt-1 line-clamp-1">Komentar: &ldquo;{item.catatan_instruktur}&rdquo;</p>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Status Badges */}
                              {item.status === 'Mulai' ? (
                                <span className="text-[10px] font-bold px-3 py-1 rounded-full text-amber-700 bg-amber-50 border border-amber-100 inline-flex items-center gap-1 leading-none select-none">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                  <span>Berlangsung</span>
                                </span>
                              ) : item.status === 'Lulus' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold px-3 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-100 inline-flex items-center gap-0.5 select-none text-left">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Lulus</span>
                                  </span>
                                  <button
                                    onClick={() => triggerCertificateView(item)}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                                    id={`btn-cert-my-${item.id_transaksi}`}
                                  >
                                    Lihat Sertifikat
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold px-3 py-1 rounded-full text-slate-500 bg-slate-50 border border-slate-200 inline-flex items-center gap-1 select-none">
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  <span>Gagal</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Subsection 2: Lookup and browse upcoming available certifications */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                  <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-widest flex items-center gap-1.5 text-left">
                    <BookOpen className="w-4 h-4 text-blue-600 animate-pulse" />
                    Katalog Silabus Kelas Kepahaman
                  </h3>
                  {/* Category toggle options filter */}
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-semibold text-slate-600">
                    {['Semua', 'Alkitab', 'Alam Bebas', 'Keterampilan', 'Seni & Sosial'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setParticipantCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                          participantCategoryFilter === cat ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classesList
                    .filter(cls => participantCategoryFilter === 'Semua' || cls.kategori === participantCategoryFilter)
                    .map(cls => {
                    const myCompletion = sirkulasiList.find(s => s.no_peserta === currentUser.info.no_peserta && s.id_kelas === cls.id_kelas);
                    const isPassed = myCompletion?.status === 'Lulus';
                    const isBusy = myCompletion?.status === 'Mulai';

                    return (
                      <div key={cls.id_kelas} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:shadow-xs transition-shadow">
                        <div className="text-left">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">{cls.id_kelas}</span>
                            {isPassed ? (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">&#10003; Selesai</span>
                            ) : isBusy ? (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">&bull;&bull;&bull; Sedang Kelas</span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Tersedia</span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 truncate">{cls.nama_kelas}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">Penguji: {cls.instruktur}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">{cls.deskripsi}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedClass(cls); setIsDetailOpen(true); }}
                          className="mt-3 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:underline text-left block cursor-pointer"
                        >
                          Lihat Rincian &raquo;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subsection 3: Layanan Tanya Jawab & Konsultasi */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-left" id="participant-qna-section">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <div className="text-left">
                    <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-tight">Pusat Bantuan &amp; Tanya Jawab</h3>
                    <p className="text-slate-505 text-[11px] leading-none">Kirim pertanyaan kesulitan silabus langsung ke Panitia</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Form Kirim Pertanyaan */}
                  <form onSubmit={handleSendQuestion} className="space-y-4 text-left">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Ajukan Pertanyaan Baru</h4>
                    
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-1 font-mono text-indigo-600">Judul / Subjek Pertanyaan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Sesi susulan ujian praktik KHP04..."
                        value={questionJudul}
                        onChange={(e) => setQuestionJudul(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-505 uppercase tracking-wider mb-1 font-mono text-indigo-600">Isi Detail Pertanyaan Anda</label>
                      <textarea
                        required
                        placeholder="Tulis detail kesulitan atau pertanyaan Anda di sini agar panitia dapat membantu..."
                        value={questionIsi}
                        onChange={(e) => setQuestionIsi(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all h-28 resize-none font-medium text-left"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim ke Panitia</span>
                    </button>
                  </form>

                  {/* List Riwayat Pertanyaan Saya */}
                  <div className="space-y-4 flex flex-col">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider text-left">Riwayat Pertanyaan Anda</h4>
                    
                    <div className="flex-1 max-h-[280px] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                      {(() => {
                        const myQs = questionsList.filter(q => q.no_peserta === currentUser.info.no_peserta);
                        
                        if (myQs.length === 0) {
                          return (
                            <div className="py-12 text-center text-slate-400 text-xs">
                              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              <span>Belum mengajukan pertanyaan. Silakan gunakan formulir di samping jika ada kesulitan.</span>
                            </div>
                          );
                        }

                        return myQs.map((q) => (
                          <div key={q.id_pertanyaan} className="text-left pt-3 first:pt-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{q.judul}</h5>
                              
                              {q.status === 'Dijawab' ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5 shrink-0">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                  <span>Dijawab</span>
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5 shrink-0">
                                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                  <span>Menunggu</span>
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-600 leading-relaxed mb-2 break-all">{q.isi}</p>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              ID: {q.id_pertanyaan} &bull; Dikirim: {new Date(q.tanggal_kirim).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {q.status === 'Dijawab' && q.jawaban && (
                              <div className="mt-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-left">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest font-mono">Jawaban Panitia:</span>
                                </div>
                                <p className="text-[11px] text-slate-700 leading-relaxed italic">&ldquo;{q.jawaban}&rdquo;</p>
                                {q.tanggal_dijawab && (
                                  <span className="text-[8px] text-slate-400 block mt-1 font-mono">
                                    Dijawab pada: {new Date(q.tanggal_dijawab).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* LOGGED IN SYSTEM VIEW: SECTION 2 - PANEL ADMIN */}
        {currentUser && currentUser.role === 'admin' && (
          <div className="space-y-6" id="admin-panel-screen-container">
            {/* Horizontal panel dashboard links tabs navbar */}
            <div className="flex flex-wrap border-b border-slate-200 bg-white p-1 gap-1 rounded-xl border">
              {[
                { id: 'dashboard', label: 'Dasbor Ringkasan', icon: Compass },
                { id: 'scanner', label: 'Scanner QR Pembaca', icon: QrCode },
                { id: 'classes', label: 'Kelola 18 Kelas', icon: BookOpen },
                { id: 'participants', label: 'Kelola Peserta', icon: Users },
                { id: 'sirkulasi', label: 'Laporan Sirkulasi', icon: FileSpreadsheet },
                { id: 'settings', label: 'Link Sertifikat & Pendukung', icon: Sliders },
                { id: 'questions', label: 'Tanya Jawab', icon: MessageSquare }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAdminTab(tab.id as any)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeAdminTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  id={`btn-admin-tab-${tab.id}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT SPACES */}
            
            {/* Tab: Dashboard Summary STATS */}
            {activeAdminTab === 'dashboard' && (
              <div className="space-y-6" id="admin-tab-space-dashboard">
                {/* Visual stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-left">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Katalog Kelas</span>
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900 leading-none">{totalClasses}</span>
                      <span className="text-[11px] text-slate-500 block mt-1.5 font-medium">18 Materi Pokok Tuntas</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Peserta</span>
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900 leading-none">{totalParticipants}</span>
                      <span className="text-[11px] text-slate-500 block mt-1.5 font-medium">Registrasi Akun Lapangan</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Aktif Berlangsung</span>
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900 leading-none">{activeEnrollmentsCount}</span>
                      <span className="text-[11px] text-slate-500 block mt-1.5 font-medium">Pembelajaran di Lapangan</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sertifikat Keluar</span>
                      <Award className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900 leading-none">{totalGraduated}</span>
                      <span className="text-[11px] text-slate-500 block mt-1.5 font-medium">Peserta Lulus &amp; PDF</span>
                    </div>
                  </div>
                </div>

                {/* Grid layout with summary reports */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  {/* Left row summary action logs */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-600">Sirkulasi Kelas Berlangsung Hari Ini</h4>
                      <span className="text-[10px] bg-blue-55 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-100">Kehadiran Baru</span>
                    </div>

                    {sirkulasiList.filter(s => s.status === 'Mulai').length === 0 ? (
                      <p className="p-8 text-center text-xs text-slate-550 italic leading-relaxed">
                        Tidak ada kelas aktif di lapangan saat ini. Gunakan tab Scanner QR untuk mendaftarkan kehadiran mulai kelas.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {sirkulasiList.filter(s => s.status === 'Mulai').slice(0, 5).map(item => {
                          const pObj = participantsList.find(p => p.no_peserta === item.no_peserta);
                          const cObj = classesList.find(c => c.id_kelas === item.id_kelas);

                          return (
                            <div key={item.id_transaksi} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                              <div>
                                <p className="text-xs font-bold text-slate-800">{pObj?.nama_lengkap || 'Tidak Diketahui'}</p>
                                <p className="text-[11px] text-slate-500">Mengambil kelas: <span className="font-bold text-blue-800">{cObj?.nama_kelas}</span></p>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono italic">Mulai {new Date(item.Kelas_mulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Row class rankings */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-600">Statistik Kelulusan per Kelas</h4>
                    </div>
                    {classesList.slice(0, 5).map(cls => {
                      const completeForThisClass = sirkulasiList.filter(s => s.id_kelas === cls.id_kelas && s.status === 'Lulus').length;
                      return (
                        <div key={cls.id_kelas} className="p-4 flex items-center justify-between border-b border-slate-100 last:border-b-0">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase mr-2">{cls.id_kelas}</span>
                            <span className="text-xs font-bold text-slate-800">{cls.nama_kelas}</span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-0.5 rounded-full">
                            {completeForThisClass} Lulus
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Helpful prompt */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5 text-left">
                    <HeartPulse className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-605 leading-relaxed max-w-xl">
                      <b>Tips Operator Panitia:</b> Untuk mempercepat proses kelulusan peserta sewaktu pengujian di preview iFrame ini, gunakan menu tab <b>Scanner QR Pembaca</b> lalu gunakan dropdown &ldquo;Simulasi&rdquo; untuk langsung memproses sirkulasi mulai kelas dan kelulusan tanpa terhambat webcam.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveAdminTab('scanner')}
                    className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all select-none self-stretch sm:self-auto text-center shadow-md shadow-blue-500/15 cursor-pointer"
                  >
                    Buka Scan Panel
                  </button>
                </div>
              </div>
            )}

            {/* Tab: LIVE PORTABLE AND SIMULATOR SCANNER CONTAINER */}
            {activeAdminTab === 'scanner' && (
              <div id="admin-tab-space-scanner">
                <QrScannerPanel
                  participants={participantsList}
                  classes={classesList}
                  onScanMulai={processMulaiKelas}
                  onScanSelesai={processSelesaiKelas}
                  activeEnrollments={sirkulasiList}
                />
              </div>
            )}

            {/* Tab: CATALOG CLASSES CRUD MANAGER */}
            {activeAdminTab === 'classes' && (
              <div className="space-y-6" id="admin-tab-space-classes">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left form entry panel */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wide text-slate-800 pb-2 border-b border-slate-100 mb-4">
                      {isEditingClass ? 'Edit Kelas Kepahaman' : 'Tambah Kelas Baru'}
                    </h4>

                    <form onSubmit={handleClassFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">A. Kode ID Kelas</label>
                        <input
                          type="text"
                          placeholder="Contoh: KHP19"
                          disabled={isEditingClass}
                          value={classForm.id_kelas}
                          onChange={(e) => setClassForm({ ...classForm, id_kelas: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50 disabled:opacity-55"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">B. Nama Kelas Kepahaman</label>
                        <input
                          type="text"
                          placeholder="Membongkar Tenda"
                          value={classForm.nama_kelas}
                          onChange={(e) => setClassForm({ ...classForm, nama_kelas: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">C. Nama Instruktur Penguji</label>
                        <input
                          type="text"
                          placeholder="Kak Budi Prasetyo"
                          value={classForm.instruktur}
                          onChange={(e) => setClassForm({ ...classForm, instruktur: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">D. Kategori Kompetensi</label>
                        <select
                          value={classForm.kategori}
                          onChange={(e) => setClassForm({ ...classForm, kategori: e.target.value as any })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50"
                        >
                          <option value="Alkitab">Alkitab</option>
                          <option value="Alam Bebas">Alam Bebas</option>
                          <option value="Keterampilan">Keterampilan</option>
                          <option value="Seni & Sosial">Seni &amp; Sosial</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">E. Deskripsi Modul</label>
                        <textarea
                          placeholder="Deskripsi singkat cara pengerjaan ujian praktis lapangan materi ini..."
                          value={classForm.deskripsi}
                          onChange={(e) => setClassForm({ ...classForm, deskripsi: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50 h-24 resize-none"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
                        >
                          {isEditingClass ? 'Simpan Edit' : 'Daftarkan Kelas'}
                        </button>
                        {isEditingClass && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingClass(false);
                              setClassForm({ id_kelas: '', nama_kelas: '', instruktur: '', deskripsi: '', kategori: 'Keterampilan' });
                            }}
                            className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Right classes datatable panel */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 overflow-x-auto">
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wide text-slate-800 pb-2 border-b border-slate-100 mb-4 flex justify-between items-center">
                      <span>Daftar Kelas Terdaftar ({classesList.length})</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">Katalog Tabular</span>
                    </h4>

                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-600 font-bold uppercase tracking-wider bg-slate-50">
                          <th className="p-3">Kode</th>
                          <th className="p-3">Kategori</th>
                          <th className="p-3">Nama Kelas</th>
                          <th className="p-3">Instruktur Utama</th>
                          <th className="p-3 text-right">Opsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classesList.map(item => (
                          <tr key={item.id_kelas} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-800">{item.id_kelas}</td>
                            <td className="p-3">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                item.kategori === 'Alkitab' ? 'bg-emerald-50 text-emerald-800' :
                                item.kategori === 'Alam Bebas' ? 'bg-sky-50 text-sky-800' :
                                item.kategori === 'Keterampilan' ? 'bg-amber-50 text-amber-800' : 'bg-purple-50 text-purple-800'
                              }`}>{item.kategori}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-800 leading-tight">{item.nama_kelas}</td>
                            <td className="p-3 text-slate-600">{item.instruktur}</td>
                            <td className="p-3 text-right space-x-2">
                              {/* QR poster print trigger */}
                              <button
                                onClick={() => handlePrintPoster(item)}
                                className="p-1 px-2 text-[10px] font-bold bg-slate-100 rounded text-slate-700 hover:bg-amber-100 border border-slate-200"
                                title="Poster QR"
                              >
                                Cetak QR Banner
                              </button>
                              
                              <button
                                onClick={() => {
                                  setIsEditingClass(true);
                                  setClassForm(item);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => deleteClass(item.id_kelas)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* Tab: PARTICIPANTS CRUD REGISTRY MANAGER */}
            {activeAdminTab === 'participants' && (
              <div className="space-y-6" id="admin-tab-space-participants">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left register card form */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wide text-slate-800 pb-2 border-b border-slate-100 mb-4">
                      {isEditingPeserta ? 'Sunting Data Peserta' : 'Input Peserta Baru'}
                    </h4>

                    <form onSubmit={handlePesertaFormSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">A. No. Registrasi Peserta (QR ID)</label>
                        <input
                          type="text"
                          placeholder="Contoh: PST06"
                          disabled={isEditingPeserta}
                          value={pesertaForm.no_peserta}
                          onChange={(e) => setPesertaForm({ ...pesertaForm, no_peserta: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50 disabled:opacity-55"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5 font-bold">B. Nama Lengkap Peserta</label>
                        <input
                          type="text"
                          placeholder="Aris Setiawan"
                          value={pesertaForm.nama_lengkap}
                          onChange={(e) => setPesertaForm({ ...pesertaForm, nama_lengkap: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">C. Nama Klub Pathfinder</label>
                        <input
                          type="text"
                          placeholder="Eagle Pathfinder Club"
                          value={pesertaForm.Nama_Klub}
                          onChange={(e) => setPesertaForm({ ...pesertaForm, Nama_Klub: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">D. Nama Jemaat / Gereja</label>
                        <input
                          type="text"
                          placeholder="Jemaat Kelapa Gading"
                          value={pesertaForm.Nama_Jemaat}
                          onChange={(e) => setPesertaForm({ ...pesertaForm, Nama_Jemaat: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200/80 outline-none focus:border-slate-500 bg-slate-50"
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Akun Akses Portal:</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-650 uppercase">Username</label>
                            <input
                              type="text"
                              placeholder="aris"
                              value={pesertaForm.username}
                              onChange={(e) => setPesertaForm({ ...pesertaForm, username: e.target.value })}
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-650 uppercase">Password</label>
                            <input
                              type="password"
                              placeholder="123"
                              value={pesertaForm.password}
                              onChange={(e) => setPesertaForm({ ...pesertaForm, password: e.target.value })}
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
                        >
                          {isEditingPeserta ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                        </button>
                        {isEditingPeserta && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPeserta(false);
                              setPesertaForm({ username: '', password: '', nama_lengkap: '', no_peserta: '', Nama_Klub: '', Nama_Jemaat: '' });
                            }}
                            className="px-4 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Right participants table */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 overflow-x-auto">
                    <h4 className="font-display font-extrabold text-sm uppercase tracking-wide text-slate-800 pb-2 border-b border-slate-100 mb-4 flex justify-between items-center">
                      <span>Daftar Peserta terdaftar ({participantsList.length})</span>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">Database Akun</span>
                    </h4>

                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead>
                        <tr className="border-b border-slate-150 text-slate-600 font-bold uppercase tracking-wider bg-slate-50">
                          <th className="p-3">QR ID</th>
                          <th className="p-3">Nama Lengkap</th>
                          <th className="p-3">Nama Klub</th>
                          <th className="p-3">Username Portal</th>
                          <th className="p-3 text-right">Opsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {participantsList.map(item => (
                          <tr key={item.no_peserta} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-800">{item.no_peserta}</td>
                            <td className="p-3 font-bold text-slate-800">{item.nama_lengkap}</td>
                            <td className="p-3 text-slate-600 leading-tight">
                              <div>{item.Nama_Klub}</div>
                              <div className="text-[10px] text-slate-400">{item.Nama_Jemaat}</div>
                            </td>
                            <td className="p-3 text-slate-500 font-mono">{item.username}</td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => handlePrintCard(item)}
                                className="p-1 px-2 text-[10px] font-bold bg-slate-100 rounded text-slate-700 hover:bg-amber-100 border border-slate-200"
                              >
                                Cetak Kartu
                              </button>

                              <button
                                onClick={() => {
                                  setIsEditingPeserta(true);
                                  setPesertaForm({
                                    username: item.username,
                                    password: item.password || '',
                                    nama_lengkap: item.nama_lengkap,
                                    no_peserta: item.no_peserta,
                                    Nama_Klub: item.Nama_Klub,
                                    Nama_Jemaat: item.Nama_Jemaat
                                  });
                                }}
                                className="p-1 text-slate-500 hover:text-slate-800"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => deletePeserta(item.no_peserta)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            )}

            {/* Tab: CIRCULATION TRANSACTION REPORT TABLE */}
            {activeAdminTab === 'sirkulasi' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4" id="admin-tab-space-sirkulasi">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3.5">
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-800">Sirkulasi Transaksi Log Kehadiran ({sirkulasiList.length})</h3>
                    <p className="text-slate-500 text-xs text-left">Pencatatan sirkulasi kelas serta rekapitulasi evaluasi kelulusan panitia</p>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ml-auto sm:ml-0"
                    id="btn-export-csv-circulation"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Cetak Log Excel / CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="p-3">ID Tx</th>
                        <th className="p-3">Peserta</th>
                        <th className="p-3">Materi</th>
                        <th className="p-3">Mulai</th>
                        <th className="p-3">Tuntas</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Instruktur</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sirkulasiList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 italic">Belum ada riwayat transaksi kehadiran atau sirkulasi kelas kepahaman.</td>
                        </tr>
                      ) : (
                        sirkulasiList.map(item => {
                          const p = participantsList.find(x => x.no_peserta === item.no_peserta);
                          const c = classesList.find(x => x.id_kelas === item.id_kelas);

                          return (
                            <tr key={item.id_transaksi} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-[11px] text-slate-800">{item.id_transaksi}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800 leading-tight">{p?.nama_lengkap || 'TDK DIKENAL'}</div>
                                <div className="text-[10px] font-mono text-slate-400">{item.no_peserta}</div>
                              </td>
                              <td className="p-3 leading-tight">
                                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-700 mr-1">{item.id_kelas}</span>
                                <span className="font-bold text-slate-800">{c?.nama_kelas || 'TDK DIKENAL'}</span>
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">
                                {item.Kelas_mulai ? new Date(item.Kelas_mulai).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">
                                {item.Kelas_Selesai ? new Date(item.Kelas_Selesai).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </td>
                              <td className="p-3">
                                {item.status === 'Mulai' ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-amber-700 bg-amber-50">Berlangsung</span>
                                ) : item.status === 'Lulus' ? (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-800 bg-emerald-50">Lulus</span>
                                ) : (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-slate-600 bg-slate-50">Gagal</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-600 leading-none">
                                <div>{item.Instruktur || '-'}</div>
                                {item.catatan_instruktur && (
                                  <div className="text-[10px] text-slate-400 italic mt-1 truncate max-w-[120px]">{item.catatan_instruktur}</div>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {item.status === 'Lulus' && (
                                  <button
                                    onClick={() => triggerCertificateView(item)}
                                    className="p-1 px-2 text-[10px] font-bold bg-slate-100 rounded text-slate-700 hover:bg-emerald-100 border border-slate-200"
                                    id={`btn-cert-admin-view-${item.id_transaksi}`}
                                  >
                                    Sertifikat
                                  </button>
                                )}

                                <button
                                  onClick={() => deleteSirkulasiRow(item.id_transaksi)}
                                  className="p-1 hover:text-rose-600 text-slate-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeAdminTab === 'settings' && (
              <div id="admin-tab-space-settings" className="space-y-6 text-left">
                {/* Firebase Status and Setup Instructions */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                        <Database className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base text-slate-900">Koneksi Cloud Database Firebase</h3>
                        <p className="text-xs text-slate-500">Penyimpanan serverless dan real-time sinkronisasi semua data sirkulasi kelas kepahaman</p>
                      </div>
                    </div>
                    <div>
                      {firebaseErrorState === 'uninitialized' ? (
                        <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-full text-rose-700 bg-rose-50 border border-rose-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          Koleksi Belum Diinisialisasi
                        </span>
                      ) : (
                        <span className="text-xs font-bold font-mono px-3 py-1.5 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Terhubung Real-Time (Firestore)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                      <h4 className="font-bold text-amber-900 mb-1">Informasi Kredensial Firebase:</h4>
                      <p className="text-[11px]">
                        Aplikasi ini dihubungkan secara real-time ke Cloud Firestore Database &amp; Authentication (Project ID: <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono text-[11px] font-semibold text-slate-800">nomadic-tenure-6jlsj</code>).
                        Data tersimpan secara cloud dan ter-sinkronisasi instan lintas perangkat secara aman.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold">Skema Koleksi Blueprint:</label>
                        <button
                          onClick={handleCopySql}
                          type="button"
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md transition-all flex items-center gap-1.5 text-[11px]"
                        >
                          {copiedSql ? 'Tersalin!' : 'Salin Info Koleksi'}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Skema data blueprint ini didefinisikan secara modular di <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-850">firebase-blueprint.json</code> dan dilindungi oleh Zero-Trust security rules di Firestore.
                      </p>
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl overflow-x-auto text-[10px] font-mono leading-relaxed max-h-56">
                        {FIREBASE_COLLECTIONS_INFO}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                      <Sliders className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-900">Pengaturan Link Pendukung &amp; Sertifikat</h3>
                      <p className="text-xs text-slate-500">Konfigurasi link sertifikat eksternal dan link pelengkap untuk halaman portal/riwayat peserta</p>
                    </div>
                  </div>

                  {/* Settings Inputs Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                        <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold">2. Tombol Sertifikat Versi Indonesia</label>
                        <input
                          type="text"
                          placeholder="cth: Bergabung Grup WhatsApp"
                          value={settings.externalLinkLabel || ''}
                          onChange={(e) => {
                            const updated = { ...settings, externalLinkLabel: e.target.value };
                            handleSaveSettings(updated);
                          }}
                          className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-white outline-none text-slate-800 font-medium shadow-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                        <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold">Link Sertifikat Indonesia</label>
                        <input
                          type="text"
                          placeholder="cth: https://chat.whatsapp.com/..."
                          value={settings.externalLink || ''}
                          onChange={(e) => {
                            const updated = { ...settings, externalLink: e.target.value };
                            handleSaveSettings(updated);
                          }}
                          className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-white outline-none text-slate-800 font-medium shadow-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/50">
                        <label className="block text-xs uppercase tracking-wider text-purple-750 font-bold">3. Tombol Sertifikat Versi Inggris</label>
                        <input
                          type="text"
                          placeholder="cth: Panduan / Kontak Panitia"
                          value={settings.externalLinkLabel2 || ''}
                          onChange={(e) => {
                            const updated = { ...settings, externalLinkLabel2: e.target.value };
                            handleSaveSettings(updated);
                          }}
                          className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-550 bg-white outline-none text-slate-800 font-medium shadow-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5 p-4 rounded-2xl bg-purple-50/30 border border-purple-100/50">
                        <label className="block text-xs uppercase tracking-wider text-purple-750 font-bold">Link Sertifikat Inggris</label>
                        <input
                          type="text"
                          placeholder="cth: https://drive.google.com/..."
                          value={settings.externalLink2 || ''}
                          onChange={(e) => {
                            const updated = { ...settings, externalLink2: e.target.value };
                            handleSaveSettings(updated);
                          }}
                          className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-550 bg-white outline-none text-slate-800 font-medium shadow-xs font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Kedua link pendukung opsional di atas akan ditampilkan sebagai tombol penghubung berwarna di dahi bagian &ldquo;Riwayat Ambil Kelas Kepahaman&rdquo; halaman portal siswa.
                    </p>

                    {/* Google Workspace Cloud Sync Control Center */}
                    <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-display font-bold text-base text-slate-900">Google Workspace Integrasi Pintar</h4>
                          <p className="text-xs text-slate-500">Cadangkan database ke Google Sheets kustom dan kelola kustomisasi Google Slides untuk Sertifikat PDF</p>
                        </div>
                      </div>

                      {/* Google Account Connection Status Row */}
                      <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-left">
                          <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Status Google Session</span>
                          <div className="flex items-center gap-2">
                            {(googleAccessToken || sessionStorage.getItem('google_access_token')) ? (
                              <div className="flex items-center gap-1.5 py-1 px-3.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold font-mono border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Akun Google Terkoneksi
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 py-1 px-3.5 bg-amber-50 text-amber-700 rounded-full text-xs font-bold font-mono border border-amber-100">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Belum Terhubung
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-left">
                          {(googleAccessToken || sessionStorage.getItem('google_access_token')) ? (
                            <button
                              onClick={() => {
                                sessionStorage.removeItem('google_access_token');
                                setGoogleAccessToken('');
                                showToast('Koneksi Akun Google Admin berhasil diputuskan.', 'info');
                              }}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200"
                            >
                              Putuskan Sesi Google
                            </button>
                          ) : (
                            <button
                              onClick={handleGoogleLogin}
                              className="px-4 py-2.5 bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="font-bold">G</span>
                              <span>Hubungkan Akun Google Mail</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Configurations display and Sync operations */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 p-4 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 text-left">
                            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold">1. Google Sheets Spreadsheet ID</label>
                            <input
                              type="text"
                              placeholder="Kosong (Buat Spreadsheet Baru)"
                              value={settings.sheetId || ''}
                              onChange={(e) => {
                                const updated = { ...settings, sheetId: e.target.value };
                                handleSaveSettings(updated);
                              }}
                              className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 bg-white outline-none text-slate-800 font-semibold shadow-xs font-mono"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              ID Google Spreadsheet kustom Anda. Jika dikosongkan, spreadsheet baru bernama &ldquo;Sistem Kelas Kepahaman - Cloud Sync Backup&rdquo; akan otomatis terbuat di Drive Anda ketika Anda menaruh sinkronisasi pertama kali.
                            </p>
                          </div>

                          <div className="space-y-1.5 p-4 rounded-2xl bg-[#eff6ff]/30 border border-[#dbeafe]/50 text-left">
                            <label className="block text-xs uppercase tracking-wider text-slate-700 font-bold">2. Google Slides Certificate Template ID</label>
                            <input
                              type="text"
                              placeholder="cth: 1y_Ar7L6Z7S93E6h2fCgB4D..."
                              value={settings.slideTemplateId || ''}
                              onChange={(e) => {
                                const updated = { ...settings, slideTemplateId: e.target.value };
                                handleSaveSettings(updated);
                              }}
                              className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:border-blue-500 bg-white outline-none text-slate-800 font-semibold shadow-xs font-mono"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              ID file Google Slides template Sertifikat. Saat diunduh kustom dari detail sirkulasi, sistem menyalin template ini dan menerjemahkan variabel tag teks <code className="bg-slate-100 px-0.5 rounded font-bold text-slate-700">{"{{NAMA}}"}</code>, <code className="bg-slate-100 px-0.5 rounded font-bold text-slate-700">{"{{KELAS}}"}</code>, <code className="bg-slate-100 px-0.5 rounded font-bold text-slate-700">{"{{INSTRUKTUR}}"}</code>, <code className="bg-slate-100 px-0.5 rounded font-bold text-slate-700">{"{{NO_PESERTA}}"}</code> secara dinamis ke PDF.
                            </p>
                          </div>
                        </div>

                        {/* Force sync center */}
                        {(googleAccessToken || sessionStorage.getItem('google_access_token')) && (
                          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 flex items-center justify-between flex-wrap gap-4 text-left">
                            <div className="space-y-1 max-w-md">
                              <span className="text-xs font-bold text-emerald-800 block">Jalankan Sinkronisasi Manual:</span>
                              <p className="text-[10px] text-slate-500">
                                Ini akan membersihkan tabel sebelumnya di spreadsheet Anda kemudian mengekspor seluruh: <strong className="text-slate-800">Daftar_Kelas</strong>, <strong className="text-slate-800">Daftar_Peserta</strong>, <strong className="text-slate-800">Laporan_Sirkulasi</strong>, dan <strong className="text-slate-800">Pertanyaan_Siswa</strong> ke dalam tab lembar kerja terpisah.
                              </p>
                            </div>
                            <button
                              onClick={() => handleGoogleSheetsSync(settings)}
                              disabled={isSyncingSheets}
                              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-450 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto"
                            >
                              {isSyncingSheets ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                              )}
                              <span>{isSyncingSheets ? 'Sedang Sinkronisasi...' : 'Sinkronkan Data ke Google Sheets'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toast Save Confirmation Inline */}
                  <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50 p-4 rounded-2xl">
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Setiap perubahan disimpan otomatis ke penyimpanan lokal browser.
                    </span>
                    <button
                      onClick={() => showToast('Semua perubahan konfigurasi berhasil disimpan ke sistem!', 'success')}
                      className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md cursor-pointer"
                      id="btn-settings-manual-save"
                    >
                      Konfirmasi Penyimpanan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeAdminTab === 'questions' && (
              <div id="admin-tab-space-questions" className="space-y-6 text-left">
                {/* Info Panel & Stats count overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Pertanyaan</span>
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900 leading-none">{questionsList.length}</span>
                      <span className="text-[11px] text-slate-500 block mt-1 font-medium">Pengajuan terdaftar di sistem</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Menunggu Jawaban</span>
                      <HelpCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-amber-600 leading-none">
                        {questionsList.filter(q => q.status === 'Menunggu Jawaban').length}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-1 font-medium">Membutuhkan respons panitia</span>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sudah Dijawab</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-emerald-600 leading-none">
                        {questionsList.filter(q => q.status === 'Dijawab').length}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-1 font-medium">Pertanyaan selesai dilayani</span>
                    </div>
                  </div>
                </div>

                {/* List Pertanyaan */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50">
                    <div className="text-left">
                      <h3 className="font-display font-bold text-base text-slate-900">Pertanyaan &amp; Konsultasi Peserta</h3>
                      <p className="text-xs text-slate-500">Kelola jawaban untuk semua pertanyaan yang diajukan oleh peserta Pathfinder</p>
                    </div>
                  </div>

                  {questionsList.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 max-w-sm mx-auto">
                      <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-bold text-sm text-slate-705">Belum Ada Pertanyaan</p>
                      <p className="text-xs text-slate-400 mt-1">Belum ada pengajuan pertanyaan atau pusat bantuan dari peserta yang terdaftar di basis data.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {questionsList.map((q) => {
                        const isAnswering = answeringQId === q.id_pertanyaan;
                        const pInfo = participantsList.find(p => p.no_peserta === q.no_peserta);
                        
                        return (
                          <div key={q.id_pertanyaan} className="p-6 hover:bg-slate-50/30 transition-all text-left">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                    {q.no_peserta}
                                  </span>
                                  <h4 className="font-bold text-sm text-slate-900">{q.nama_lengkap}</h4>
                                  {pInfo && (
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      ({pInfo.Nama_Klub} &bull; {pInfo.Nama_Jemaat})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  ID: {q.id_pertanyaan} &bull; Dikirim: {new Date(q.tanggal_kirim).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {q.status === 'Dijawab' ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span>Sudah Dijawab</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1 animate-pulse">
                                    <HelpCircle className="w-3 h-3 text-amber-500" />
                                    <span>Menunggu Jawaban</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => handleDeleteQuestion(q.id_pertanyaan)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                  title="Hapus Pertanyaan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 mb-4">
                              <div className="font-extrabold text-xs text-slate-800 tracking-tight">{q.judul}</div>
                              <p className="text-xs text-slate-600 leading-relaxed break-all font-medium">{q.isi}</p>
                            </div>

                            {/* Response and Answers Controls */}
                            {isAnswering ? (
                              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4 text-indigo-650" />
                                  <h5 className="font-bold text-xs text-indigo-900 uppercase tracking-widest font-mono">Tulis Tanggapan / Jawaban</h5>
                                </div>
                                
                                <textarea
                                  value={adminAnswerText}
                                  onChange={(e) => setAdminAnswerText(e.target.value)}
                                  placeholder="Ketikkan jawaban instruktur/panitia secara lengkap dan solutif..."
                                  className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-205 focus:border-indigo-600 bg-white outline-none text-slate-800 font-medium h-24 resize-none text-left"
                                />

                                <div className="flex items-center justify-end gap-3 pt-1">
                                  <button
                                    onClick={() => { setAnsweringQId(null); setAdminAnswerText(''); }}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => handleAnswerQuestionSubmit(q.id_pertanyaan)}
                                    className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md cursor-pointer"
                                  >
                                    Kirim Jawaban Resmi
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {q.status === 'Dijawab' && q.jawaban ? (
                                  <div className="space-y-2">
                                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-left">
                                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                        <div className="flex items-center gap-1.5">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest font-mono">Tanggapan Panitia:</span>
                                        </div>
                                        {q.tanggal_dijawab && (
                                          <span className="text-[9px] text-slate-400 font-mono">
                                            Dijawab: {new Date(q.tanggal_dijawab).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-700 leading-relaxed italic font-medium">&ldquo;{q.jawaban}&rdquo;</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setAnsweringQId(q.id_pertanyaan);
                                        setAdminAnswerText(q.jawaban || '');
                                      }}
                                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 pl-1 cursor-pointer"
                                    >
                                      Ubah Tanggapan &raquo;
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAnsweringQId(q.id_pertanyaan);
                                      setAdminAnswerText('');
                                    }}
                                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Berikan Jawaban Resmi</span>
                                  </button>
                                )}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. CORE DESIGN FOOTER MARGIN LINES (Simple & literal human labels cleanly placed) */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-display font-black text-white text-base tracking-tight flex items-center justify-center md:justify-start gap-1">
              <Compass className="w-4 h-4 text-emerald-500" />
              Sistem Kelas Kepahaman
            </span>
            <p className="text-xs text-slate-500">Aplikasi sirkulasi pembacaan absen, evaluasi kelulusan &amp; cetak sertifikat</p>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-xs font-mono">Dikelola oleh Panitia Pembimbing Kepahaman Pathfinder</p>
            <p className="text-[10px] text-slate-600 font-mono">ID Applet: a6da75af-35e7-4362-b605-215dbc37f3c6 &bull; {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>

      {/* 4. MODALS SPA CONTROL CODES */}

      {/* Login Popup Portal Dialog */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            id="login-dialog-form"
          >
            {/* Header */}
            <div className="bg-emerald-950 text-white p-6 relative">
              <Compass className="w-8 h-8 text-emerald-400 absolute right-6 top-6 opacity-20" />
              <h3 className="font-display font-black text-xl">Portal Kepahaman Pathfinder</h3>
              <p className="text-xs text-emerald-200 mt-1 font-medium">
                {loginMode === 'login' 
                  ? 'Gunakan akun instruktur atau pendaftaran peserta Anda' 
                  : 'Buat pendaftaran peserta baru secara instan di sini'}
              </p>
            </div>

            {/* Toggle Mode Tabs */}
            <div className="flex border-b border-slate-150 bg-slate-50 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('login');
                  setAuthError('');
                }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  loginMode === 'login' 
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Masuk Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('register');
                  setAuthError('');
                }}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  loginMode === 'register' 
                    ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            {loginMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                {authError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-mono text-indigo-700">Email (Firebase) / Username (Lokal)</label>
                  <input
                    type="text"
                    placeholder="Masukkan email aktif atau username lokal..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    placeholder="Masukkan password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-98 transition-all shadow-md"
                    id="btn-login-submit"
                  >
                    Masuk Sekarang
                  </button>
                </div>



                <p className="text-center text-[11px] text-slate-505 pt-1">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('register');
                      setAuthError('');
                    }}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Daftar Akun Baru
                  </button>
                </p>

                <div className="flex justify-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="text-xs font-bold text-slate-450 hover:text-slate-600 transition-colors"
                  >
                    Batal Tutup
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
                {authError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block">ID Peserta Otomatis</span>
                    <span className="text-sm font-black text-emerald-950 font-mono">{generateNoPeserta()}</span>
                  </div>
                  <UserPlus className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 font-mono text-indigo-700">Email Baru (Firebase Auth)</label>
                  <input
                    type="email"
                    required
                    placeholder="Masukkan alamat email aktif (contoh: nama@email.com)..."
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="buat password..."
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap sesuai Akta..."
                    value={regNamaLengkap}
                    onChange={(e) => setRegNamaLengkap(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nama Klub Pathfinder</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Eagle Pathfinder Club"
                    value={regNamaKlub}
                    onChange={(e) => setRegNamaKlub(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Nama Jemaat</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jemaat Kelapa Gading"
                    value={regNamaJemaat}
                    onChange={(e) => setRegNamaJemaat(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-600 bg-slate-50 focus:bg-white outline-none text-slate-700 transition-all font-medium"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98 transition-all shadow-md"
                  >
                    Daftar Akun Baru &amp; Masuk
                  </button>
                </div>

                <p className="text-center text-[11px] text-slate-500 pt-1">
                  Sudah terdaftar?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('login');
                      setAuthError('');
                    }}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Masuk Sekarang
                  </button>
                </p>

                <div className="flex justify-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="text-xs font-bold text-slate-450 hover:text-slate-600 transition-colors"
                  >
                    Batal Tutup
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Class Module detail dialog */}
      {isDetailOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            id="class-detail-dialog"
          >
            <div className={`p-6 text-white ${
              selectedClass.kategori === 'Alkitab' ? 'bg-emerald-900' :
              selectedClass.kategori === 'Alam Bebas' ? 'bg-sky-900' :
              selectedClass.kategori === 'Keterampilan' ? 'bg-amber-800' : 'bg-purple-900'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 block mb-1">{selectedClass.kategori} &bull; {selectedClass.id_kelas}</span>
              <h3 className="font-display font-black text-xl">{selectedClass.nama_kelas}</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Instruktur Utama / Penguji</span>
                <span className="text-sm font-bold text-slate-800">{selectedClass.instruktur}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1">Metodologi &amp; Ketentuan Ujian</span>
                <p className="text-xs text-slate-605 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                  {selectedClass.deskripsi}
                </p>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-2 text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-semibold">
                  <b>Status Sertifikasi Mandiri:</b> Memenuhi tantangan praktik langsung dari Instruktur penguji lapangan, lalu minta instruktur menscan QR absen Anda untuk mencantumkan hasil kelulusan.
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setSelectedClass(null); setIsDetailOpen(false); }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 font-bold text-white text-xs rounded-xl transition-all cursor-pointer"
                  id="btn-close-class-detail"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Participant newly passed class congratulations popup */}
      <AnimatePresence>
        {showNotificationModal && newlyPassedClasses.length > 0 && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left relative pointer-events-auto"
            >
              {/* Decorative top pattern */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-600"></div>
              
              <div className="p-8 text-center space-y-6">
                {/* Huge animated Trophy/Star icon wrapper */}
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center bg-emerald-50 rounded-full border border-emerald-100 shadow-inner">
                  <Trophy className="w-12 h-12 text-emerald-600 animate-bounce" />
                  <Sparkles className="w-6 h-6 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  <Award className="w-6 h-6 text-blue-500 absolute -bottom-1 -left-1 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-black text-2xl text-slate-900 leading-tight">
                    Selamat! Anda Telah Lulus Kelas!
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Evaluasi ujian Anda telah ditinjau dan disetujui oleh panitia instruktur lapangan. E-sertifikat kelulusan Anda sekarang tersedia dan siap diunduh!
                  </p>
                </div>

                {/* List of newly passed classes */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 divide-y divide-slate-200">
                  {newlyPassedClasses.map(item => {
                    const classInfo = classesList.find(c => c.id_kelas === item.id_kelas);
                    return (
                      <div key={item.id_transaksi} className="py-3 flex items-center justify-between gap-4 text-left first:pt-0 last:pb-0">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-mono font-extrabold text-blue-600 tracking-wider">
                            Kode: {item.id_kelas}
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 leading-snug">
                            {classInfo?.nama_kelas || 'Kelas Kepahaman'}
                          </h4>
                          <p className="text-xs text-slate-450 font-medium">
                            Penguji: {item.Instruktur}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            triggerCertificateView(item);
                            acknowledgePassedClass([item.id_transaksi]);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
                        >
                          Sertifikat
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Confirm actions */}
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => acknowledgePassedClass(newlyPassedClasses.map(c => c.id_transaksi))}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md shadow-slate-900/10 cursor-pointer"
                  >
                    Tutup &amp; Konfirmasi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Certificate achiever overlay */}
      {isCertOpen && certificateData && (
        <CertificateModal
          isOpen={isCertOpen}
          onClose={() => { setCertificateData(null); setIsCertOpen(false); }}
          participantName={certificateData.participantName}
          participantNo={certificateData.participantNo}
          clubName={certificateData.clubName}
          jemaatName={certificateData.jemaatName}
          className={certificateData.className}
          classId={certificateData.classId}
          instructorName={certificateData.instructorName}
          completionDate={certificateData.completionDate}
          notes={certificateData.notes}
          googleAccessToken={googleAccessToken}
          slideTemplateId={settings.slideTemplateId}
        />
      )}

      {/* Elegant Toast notification overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors ml-2 font-black cursor-pointer"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant Custom Confirmation dialog */}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left"
            >
              <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span>Konfirmasi Tindakan</span>
              </h4>
              <p className="text-xs text-slate-605 leading-relaxed font-semibold">
                {confirmState.message}
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmState.onConfirm();
                    setConfirmState(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Setuju / Ya
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
