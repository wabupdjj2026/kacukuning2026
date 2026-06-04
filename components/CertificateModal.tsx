'use client';

import React, { useRef, useState } from 'react';
import { X, Award, Printer, Download, Calendar, Tag, ShieldCheck, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  participantNo: string;
  clubName: string;
  jemaatName: string;
  className: string;
  classId: string;
  instructorName: string;
  completionDate: string;
  notes?: string;
  googleAccessToken?: string;
  slideTemplateId?: string;
}

export default function CertificateModal({
  isOpen,
  onClose,
  participantName,
  participantNo,
  clubName,
  jemaatName,
  className,
  classId,
  instructorName,
  completionDate,
  notes,
  googleAccessToken,
  slideTemplateId,
}: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleGenerateGoogleSlidesPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfError(null);
    try {
      const response = await fetch('/api/google/generate-slides-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: slideTemplateId,
          nama: participantName,
          instruktur: instructorName,
          namaKelas: className,
          noPeserta: participantNo,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menghasilkan PDF dari Google Slides');
      }

      // Read PDF binary and download it
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Sertifikat_${participantName.replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      setPdfError(err.message || 'Gagal membuat salinan PDF Google Slides');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    const printContent = certificateRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sertifikat_${participantName}_${className}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Quicksand:wght@500;700&display=swap');
              body {
                background: white;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: 'Quicksand', sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .cert-print-container {
                width: 297mm;
                height: 210mm;
                padding: 15mm;
                box-sizing: border-box;
                background: #faf8f5;
                border: 15px double #c5a880;
                position: relative;
                color: #2c2c2c;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                box-shadow: none;
              }
              .cert-bg-watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.03;
                width: 300px;
                height: 300px;
                pointer-events: none;
              }
              .cert-header {
                text-align: center;
              }
              .cert-badge-text {
                font-family: 'Cinzel', serif;
                font-weight: 800;
                font-size: 26px;
                color: #926d3e;
                letter-spacing: 3px;
                margin: 0;
              }
              .cert-sub {
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #5c5c5c;
                margin: 5px 0 0 0;
              }
              .cert-body {
                text-align: center;
                max-width: 800px;
              }
              .cert-award-to {
                font-style: italic;
                font-size: 16px;
                color: #7a7a7a;
                margin-bottom: 5px;
                font-family: 'Playfair Display', serif;
              }
              .cert-name {
                font-family: 'Cinzel', serif;
                font-size: 34px;
                color: #1a2e40;
                margin: 10px 0;
                border-bottom: 2px solid #e0d4c3;
                display: inline-block;
                padding-bottom: 5px;
                min-width: 400px;
              }
              .cert-info-txt {
                font-size: 13px;
                color: #4a4a4a;
                line-height: 1.6;
                margin: 15px auto;
                max-width: 650px;
              }
              .cert-class {
                font-family: 'Playfair Display', serif;
                font-size: 24px;
                font-weight: bold;
                color: #926d3e;
                margin: 5px 0;
                background: #f1ebd9;
                padding: 6px 20px;
                border-radius: 4px;
                display: inline-block;
              }
              .cert-footer-row {
                display: flex;
                justify-content: space-around;
                width: 100%;
                margin-top: 30px;
              }
              .cert-sign-col {
                text-align: center;
                width: 250px;
              }
              .cert-sign-img {
                font-family: 'Playfair Display', serif;
                font-style: italic;
                color: #555;
                font-size: 20px;
                height: 50px;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                border-bottom: 1px solid #c5a880;
                margin-bottom: 5px;
              }
              .cert-sign-title {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: #888;
                margin-top: 2px;
              }
              .cert-serial {
                font-size: 10px;
                font-family: monospace;
                color: #999;
                position: absolute;
                bottom: 10px;
                right: 20px;
              }
              @page {
                size: landscape;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div>\${printContent}</div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formattedDate = (dateStr: string) => {
    try {
      if (!dateStr || dateStr === '-') return new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          id="certificate-modal-wrapper"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600 animate-pulse" />
              <h3 className="font-display font-bold text-slate-800 text-lg">Pratinjau Sertifikat</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 shadow-sm shadow-amber-600/10"
                id="btn-print-certificate-top"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                aria-label="Tutup"
                id="btn-close-certificate-top"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Certificate Container */}
          <div className="p-6 md:p-8 bg-slate-100 overflow-x-auto flex justify-center">
            {/* The Actual Certificate Visual Sheet (Landscape 297mm x 210mm scaled) */}
            <div
              ref={certificateRef}
              className="w-[840px] h-[594px] min-w-[840px] bg-[#faf8f5] border-[12px] border-double border-[#c5a880] p-10 relative text-slate-800 shadow-lg flex flex-col justify-between items-center rounded-sm transition-shadow hover:shadow-xl select-none"
              id="certificate-print-sheet"
            >
              {/* Decorative Subtle Watermark Background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none">
                <svg width="240" height="240" viewBox="0 0 240 240" fill="currentColor" className="text-amber-800">
                  <path d="M120 0l35 83h85l-70 51 27 83-77-52-77 52 27-83-70-51h85z" />
                </svg>
              </div>

              {/* Certificate Header */}
              <div className="text-center w-full">
                <p className="font-display font-extrabold text-[28px] text-[#926d3e] tracking-[4px] uppercase m-0 leading-tight">
                  Piagam Kepahaman
                </p>
                <p className="text-[11px] text-[#5c5c5c] font-semibold uppercase tracking-[2px] mt-2 mb-0">
                  Pathfinder & Youth Association &bull; Uni Indonesia Kawasan Barat
                </p>
                <div className="w-[120px] h-[1px] bg-[#c5a880] mx-auto mt-3"></div>
              </div>

              {/* Certificate Body */}
              <div className="text-center max-w-[680px]">
                <p className="font-serif italic text-sm text-[#7a7a7a] m-0 mb-2">
                  Dengan penuh apresiasi, penghargaan ini dianugerahkan kepada:
                </p>
                <p className="font-serif italic font-bold text-[32px] text-[#1a2e40] border-b border-[#e0d4c3] px-10 pb-1.5 inline-block min-w-[380px] my-1">
                  {participantName}
                </p>
                <p className="text-[11px] text-[#64748b] uppercase tracking-wider mt-1 m-0">
                  No. Peserta: <span className="font-mono font-bold text-slate-800">{participantNo}</span> &bull; Klub: <span className="font-semibold text-slate-800">{clubName}</span> &bull; Jemaat: <span className="font-semibold text-slate-800">{jemaatName}</span>
                </p>

                <p className="text-[13px] text-[#4a4a4a] leading-relaxed mt-4 mx-auto max-w-[550px]">
                  Telah berhasil menyelesaikan rangkaian pelatihan kelompok, demonstrasi lapangan, dan modul evaluasi kecakapan secara teliti, serta dinyatakan <strong className="text-amber-800">LULUS</strong> pada kelas kepahaman materi:
                </p>

                <div className="my-2 inline-block bg-[#f4ebd4] text-[#825e2e] font-serif font-bold text-xl px-8 py-2 border-l-4 border-[#926d3e] rounded-sm shadow-sm select-text">
                  {className} <span className="font-mono text-xs font-normal opacity-75">({classId})</span>
                </div>

                {notes && (
                  <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-1">
                    Evaluasi: &ldquo;{notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Certificate Footer Signatures */}
              <div className="flex justify-around items-center w-full mt-2">
                <div className="text-center w-[180px]">
                  <div className="font-serif italic text-slate-800 text-[18px] h-[40px] flex items-end justify-center border-b border-[#c5a880] pb-0.5 font-semibold">
                    {instructorName}
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1.5 m-0 leading-tight">Instruktur Kelas</p>
                </div>

                <div>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] relative">
                    <ShieldCheck className="w-8 h-8 opacity-40 absolute" />
                    <span className="text-[7px] rotate-12 uppercase tracking-tight text-[#c5a880] font-mono text-center font-bold px-1 select-none">
                      TERVALIDASI<br/>PANITIA
                    </span>
                  </div>
                </div>

                <div className="text-center w-[180px]">
                  <div className="font-serif italic text-slate-800 text-[18px] h-[40px] flex items-end justify-center border-b border-[#c5a880] pb-0.5 font-semibold">
                    Lembaga Kepahaman
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-1.5 m-0 leading-tight">Kepala Panitia</p>
                </div>
              </div>

              {/* Footer Serial */}
              <div className="absolute bottom-2 right-4 text-[8px] font-mono text-[#a1a1aa] tracking-widest uppercase">
                ID Kelulusan: REG-{classId}-{participantNo}-{completionDate ? completionDate.replaceAll('-', '') : '20260602'}
              </div>
              <div className="absolute bottom-2 left-4 text-[8px] font-mono text-[#a1a1aa] tracking-wider">
                Tanggal Lulus: {formattedDate(completionDate)}
              </div>
            </div>
          </div>

          {/* PDF Error Display */}
          {pdfError && (
            <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal generate melalui Google Slides:</p>
                <p className="opacity-95">{pdfError}</p>
              </div>
            </div>
          )}

          {/* Dialog Action Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-wrap">
            <div className="flex flex-col gap-1 mr-auto pb-2 md:pb-0 text-left">
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tuntaskan pemahaman untuk cetak fisik kartu sertifikat kelulusan
              </span>
              {!googleAccessToken ? (
                <span className="text-[10px] text-slate-400 italic">
                  * Hubungkan Google Mail Anda di tab Pengaturan untuk membuka sertifikat kustom Google Slides.
                </span>
              ) : !slideTemplateId ? (
                <span className="text-[10px] text-slate-400 italic">
                  * Konfigurasikan template Slide ID di menu Admin untuk tombol unduh PDF Google Slides.
                </span>
              ) : null}
            </div>
            
            {googleAccessToken && slideTemplateId && (
              <button
                onClick={handleGenerateGoogleSlidesPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                id="btn-generate-google-slides-pdf"
              >
                {isGeneratingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Download Google Slides PDF'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-sm"
              id="btn-print-certificate-bottom"
            >
              <Download className="w-4 h-4" />
              <span>Lokalan Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-all"
              id="btn-close-certificate-bottom"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
