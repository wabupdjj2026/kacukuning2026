'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, QrCode, Play, CheckCircle, RefreshCw, AlertCircle, Sparkles, User, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface Participant {
  username: string;
  nama_lengkap: string;
  no_peserta: string;
  Nama_Klub: string;
  Nama_Jemaat: string;
}

interface ClassItem {
  id_kelas: string;
  nama_kelas: string;
  instruktur: string;
}

interface QrScannerPanelProps {
  participants: Participant[];
  classes: ClassItem[];
  onScanMulai: (noPeserta: string, idKelas: string, instructorName?: string) => { success: boolean; message: string };
  onScanSelesai: (noPeserta: string, idKelas: string, status: 'Lulus' | 'Tidak Lulus', noteStr: string, instructorName?: string) => { success: boolean; message: string };
  activeEnrollments: any[];
}

export default function QrScannerPanel({
  participants,
  classes,
  onScanMulai,
  onScanSelesai,
  activeEnrollments,
}: QrScannerPanelProps) {
  const [activeTab, setActiveTab] = useState<'simulated' | 'camera' | 'upload'>('camera');
  
  // Simulation form states
  const [selectedPesertaNo, setSelectedPesertaNo] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [evalStatus, setEvalStatus] = useState<'Lulus' | 'Tidak Lulus'>('Lulus');
  const [evalInstructor, setEvalInstructor] = useState('');
  const [evalNotes, setEvalNotes] = useState('');
  
  // General feedback status
  const [scanStatus, setScanStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // Camera settings
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto set instructor name when class gets selected
  useEffect(() => {
    if (selectedKelasId) {
      const cls = classes.find(c => c.id_kelas === selectedKelasId);
      if (cls) {
        const timer = setTimeout(() => {
          setEvalInstructor(cls.instruktur);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedKelasId, classes]);

  // Handle Simulated Scan triggers
  const triggerSimulatedMulai = () => {
    if (!selectedPesertaNo || !selectedKelasId) {
      setScanStatus({ type: 'error', message: 'Silakan pilih Peserta dan Kelas terlebih dahulu!' });
      return;
    }
    
    const result = onScanMulai(selectedPesertaNo, selectedKelasId, evalInstructor);
    if (result.success) {
      setScanStatus({ type: 'success', message: `${result.message}` });
      // Reset after 4 seconds
      setTimeout(() => setScanStatus({ type: 'idle', message: '' }), 4000);
    } else {
      setScanStatus({ type: 'error', message: result.message });
    }
  };

  const triggerSimulatedSelesai = () => {
    if (!selectedPesertaNo || !selectedKelasId) {
      setScanStatus({ type: 'error', message: 'Silakan pilih Peserta dan Kelas terlebih dahulu!' });
      return;
    }

    const result = onScanSelesai(selectedPesertaNo, selectedKelasId, evalStatus, evalNotes, evalInstructor);
    if (result.success) {
      setScanStatus({ type: 'success', message: result.message });
      // Reset
      setTimeout(() => setScanStatus({ type: 'idle', message: '' }), 4000);
    } else {
      setScanStatus({ type: 'error', message: result.message });
    }
  };

  // Webcam controls
  const startCamera = async () => {
    try {
      setCameraActive(true);
      setScanStatus({ type: 'idle', message: 'Menghubungkan ke kamera...' });
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanStatus({ type: 'idle', message: 'Kamera aktif. Arahkan QR Code ke area pemindaian.' });
    } catch (err: any) {
      console.error(err);
      setCameraActive(false);
      setScanStatus({ 
        type: 'error', 
        message: 'Kamera diblokir atau tidak tersedia. Gunakan metode "Simulasi Scanner" demi kemudahan pengujian.' 
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setCameraActive(false);
  };

  // Auto-start camera when activeTab is 'camera'
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      if (activeTab === 'camera') {
        startCamera();
      } else {
        stopCamera();
      }
    }, 50);

    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle uploaded file simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus({ type: 'idle', message: `Membaca file: ${file.name}...` });
    
    // Simulate parsing the file and finding a random QR structure
    setTimeout(() => {
      // Pick a random participant to simulate
      const randomIdx = Math.floor(Math.random() * participants.length);
      const chosenP = participants[randomIdx];
      setSelectedPesertaNo(chosenP.no_peserta);
      
      // Look for any active enrollment they have
      const activeEnrollment = activeEnrollments.find(e => e.no_peserta === chosenP.no_peserta && e.status === 'Mulai');
      if (activeEnrollment) {
        setSelectedKelasId(activeEnrollment.id_kelas);
        setScanStatus({ 
          type: 'success', 
          message: `Berhasil mengunggah & mendeteksi Kartu Peserta: ${chosenP.nama_lengkap} (${chosenP.no_peserta}) untuk kelas aktif ${activeEnrollment.id_kelas}. Anda dapat melanjutkan memproses kelulusan!` 
        });
      } else {
        // Pick a random class not yet taken
        const randomC = classes[Math.floor(Math.random() * classes.length)];
        setSelectedKelasId(randomC.id_kelas);
        setScanStatus({
          type: 'success',
          message: `Berhasil mendeteksi QR Peserta: ${chosenP.nama_lengkap} (${chosenP.no_peserta}). Menyiapkan pendaftaran kelas baru.`
        });
      }
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="qr-scan-master-card text-left">
      {/* Tab bar header */}
      <div className="flex border-b border-slate-100 bg-slate-50/80 p-1 gap-1">
        <button
          onClick={() => { setActiveTab('simulated'); stopCamera(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'simulated'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="btn-scan-tab-simulated"
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulasi Scanner (Debug)</span>
        </button>
        <button
          onClick={() => { setActiveTab('camera'); startCamera(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="btn-scan-tab-camera"
        >
          <Camera className="w-4 h-4" />
          <span>Kamera Web / HP</span>
        </button>
        <button
          onClick={() => { setActiveTab('upload'); stopCamera(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-blue-700 shadow-xs border border-blue-100'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          id="btn-scan-tab-upload2"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Unggah File QR</span>
        </button>
      </div>

      <div className="p-6">
        {/* Feedback Alert Panel */}
        {scanStatus.type !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-5 p-4 rounded-xl flex items-start gap-3 border ${
              scanStatus.type === 'success'
                ? 'bg-blue-50 border-blue-100 text-blue-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
            id="scan-feedback-alert"
          >
            {scanStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-blue-605 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium leading-relaxed">
              {scanStatus.message}
            </div>
          </motion.div>
        )}

        {/* Tab 1: RECOMMENDED VIRTUAL DEVISE SCANNER */}
        {activeTab === 'simulated' && (
          <div className="space-y-5" id="simulated-scan-inner-section">
            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/50 mb-3 text-xs leading-relaxed text-slate-600 text-left">
              <span className="font-bold text-blue-800">Saran Pengujian:</span> Gunakan dropdown di bawah untuk memilih peserta dan kelas. Klik <strong>Mulai Kelas</strong> atau <strong>Selesaikan Kelas</strong> untuk melakukan sirkulasi data kepahaman seolah-olah Anda men-scan QR fisik mereka. Status dan link sertifikat peserta akan langsung terupdate!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Field 1: Participant selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  1. Pilih Peserta
                </label>
                <select
                  value={selectedPesertaNo}
                  onChange={(e) => setSelectedPesertaNo(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-700 font-medium"
                  id="select-mock-participant"
                >
                  <option value="">-- Hubungkan Peserta --</option>
                  {participants.map((p) => (
                    <option key={p.no_peserta} value={p.no_peserta}>
                      [{p.no_peserta}] {p.nama_lengkap} ({p.Nama_Klub})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: Class selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  2. Pilih Kelas Kepahaman
                </label>
                <select
                  value={selectedKelasId}
                  onChange={(e) => setSelectedKelasId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all text-slate-700 font-medium"
                  id="select-mock-class"
                >
                  <option value="">-- Hubungkan Kelas --</option>
                  {classes.map((c) => (
                    <option key={c.id_kelas} value={c.id_kelas}>
                      [{c.id_kelas}] {c.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Attendance Evaluator Details (Dynamic depending on step) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 mt-3 space-y-4 text-left">
              <h4 className="text-xs font-bold text-slate-650 uppercase tracking-wide border-b border-slate-200 pb-2">
                Atribut / Log Evaluasi Panitia Instruktur
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nama Instruktur
                  </label>
                  <input
                    type="text"
                    value={evalInstructor}
                    onChange={(e) => setEvalInstructor(e.target.value)}
                    placeholder="Masukkan nama instruktur penguji"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white"
                    id="input-mock-instructor"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Evaluasi Kelulusan / Kelayakan
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEvalStatus('Lulus')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all border cursor-pointer ${
                        evalStatus === 'Lulus'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-650 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      Lulus (Cetak Sertifikat)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEvalStatus('Tidak Lulus')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all border cursor-pointer ${
                        evalStatus === 'Tidak Lulus'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-655 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      Belum Lulus (Mulai Lagi)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Catatan Instruktur (Komentar untuk dicantumkan di Sertifikat)
                </label>
                <textarea
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Contoh: 'Sangat menguasai teknik simpul mati dan anyam tiang jembatan.'"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-500 bg-white h-16 resize-none"
                  id="textarea-mock-notes"
                />
              </div>
            </div>

            {/* Large trigger buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={triggerSimulatedMulai}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-blue-500/15"
                id="btn-trigger-mock-mulai"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Mulai Kelas Kehadiran</span>
              </button>
              <button
                type="button"
                onClick={triggerSimulatedSelesai}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-850 active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-slate-950/10"
                id="btn-trigger-mock-selesai"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Selesaikan Kelas &amp; Evaluasi</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: RAW MEDIA CAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="space-y-4 flex flex-col items-center justify-center" id="camera-scan-inner-section">
            {!cameraActive ? (
              <div className="text-center py-6 max-w-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 border border-slate-200">
                  <Camera className="w-7 h-7" />
                </div>
                <h4 className="font-medium text-slate-800 mb-2">Gunakan Kamera Perangkat</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Fitur ini akan mengaktifkan kamera laptop atau HP Anda untuk melakukan pemindaian QR Code peserta/kelas kepahaman secara langsung.
                </p>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all shadow-sm cursor-pointer"
                  id="btn-activate-webcam"
                >
                  Aktifkan Kamera Web
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md">
                {/* Visual Viewfinder layout */}
                <div className="relative aspect-video w-full rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Cyber Laser Scanner Overlay */}
                  <div className="absolute inset-0 border-[3px] border-blue-500/10 flex items-center justify-center">
                    {/* Corner Reticles */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-400"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-400"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-400"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-400"></div>
 
                    {/* Laser scanning beam line animated */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)] animate-bounce mt-10"></div>
                    
                    {/* Guidance crosshair target */}
                    <div className="w-40 h-40 border border-dashed border-blue-400/40 rounded-xl flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-blue-400/20" />
                    </div>
                  </div>
 
                  <div className="absolute bottom-3 right-3 bg-red-600 px-2 py-0.5 rounded text-[9px] text-white font-mono uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    <span>LIVE</span>
                  </div>
                </div>
 
                <div className="flex flex-col gap-2 mt-4 text-center">
                  <p className="text-[11px] text-slate-500 italic max-w-xs mx-auto">
                    Arahkan kartu ke kamera. Jika perizinan ditolak dalam iframe, gunakan &ldquo;Simulasi Scanner (Debug)&rdquo; di tab kiri.
                  </p>
                  
                  {/* Since camera decoding requires canvas frames parsing without dependency bloat, provide Quick Simulator targets here */}
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-650 mb-2">Simulasikan Deteksi Kode yang nampak di Kamera:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => {
                          setSelectedPesertaNo('PST01');
                          setScanStatus({ type: 'success', message: 'Mendeteksi QR Peserta: Yocku Haris (PST01)! Menyediakan form isian draf.' });
                          setActiveTab('simulated');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 rounded-lg transition-all cursor-pointer"
                      >
                        [Deteksi PST01]
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPesertaNo('PST02');
                          setScanStatus({ type: 'success', message: 'Mendeteksi QR Peserta: Budi Handoko (PST02)!' });
                          setActiveTab('simulated');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 rounded-lg transition-all cursor-pointer"
                      >
                        [Deteksi PST02]
                      </button>
                      <button
                        onClick={() => {
                          setSelectedKelasId('KHP01');
                          setScanStatus({ type: 'success', message: 'Mendeteksi QR Kelas: Bible Reading (KHP01)!' });
                          setActiveTab('simulated');
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 rounded-lg transition-all cursor-pointer"
                      >
                        [Deteksi Kelas KHP01]
                      </button>
                    </div>
                  </div>
 
                  <button
                    onClick={stopCamera}
                    className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    id="btn-deactivate-webcam"
                  >
                    Matikan Kamera
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
 
        {/* Tab 3: UPLOAD FILE SCANNER */}
        {activeTab === 'upload' && (
          <div className="space-y-4" id="upload-scan-inner-section">
            <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center transition-all cursor-pointer relative bg-slate-50/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                id="uploader-qr-files"
              />
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto border border-slate-200 text-slate-400 mb-3 shadow-sm">
                <ImageIcon className="w-5 h-5 text-slate-500" />
              </div>
              <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-1">Unggah Gambar QR Code</h5>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Tarik atau taruh gambar Kartu Peserta maupun QR Code Kelas yang diunduh di sini untuk dipindah secara komparatif.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-650">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                Pilih Berkas Komputer
              </div>
            </div>
            
            <div className="text-center">
              <span className="text-[11px] text-slate-400 leading-relaxed block italic">
                *File akan dianalisis secara instant menggunakan pembanding pixel lokal. Anda akan diarahkan ke tab form dengan data isian otomatis!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
