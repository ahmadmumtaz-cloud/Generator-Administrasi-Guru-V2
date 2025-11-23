
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Button, DataListInput, ProgressModal } from '../../components/UI';
import { generateTextContentStream } from '../../services/geminiService';
import { Scroll, BookOpen, Building2 } from 'lucide-react';
import { SUBJECTS } from '../../utils/data';

const PesantrenBankGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [streamLog, setStreamLog] = useState('');
  
  const [formData, setFormData] = useState({
    sekolah: 'YPI Pondok Modern Al-Ghozali',
    jenjang: 'Pesantren',
    kelas: '1 (Ula)',
    tahunAjaran: '2025/2026',
    mapel: '',
    topik: '',
    difficulty: 'Sedang',
    bahasa: 'Bahasa Arab'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStreamLog("Menghubungkan ke Ma'had AI System...");

    // INSYA CHECK
    const isInsya = formData.mapel.toLowerCase().includes("insya") || formData.mapel.includes("الإِنْشَاءُ");

    // HARAKAT INSTRUCTION (STRICT)
    const harakatInstruction = `
    ATURAN WAJIB PENULISAN BAHASA ARAB (HARAKAT/SYAKAL):
    1. SETIAP KATA Bahasa Arab (Soal, Instruksi, Teks Bacaan) WAJIB DIBERI HARAKAT LENGKAP (Fathah, Kasrah, Dhammah, Sukun, Shaddah, Tanwin).
    2. JANGAN ADA ARAB GUNDUL. Tujuannya agar santri mudah membaca dan tidak salah tafsir.
    3. Gunakan font standar yang jelas (Traditional Arabic / Amiri).
    `;

    let structurePrompt = "";

    if (isInsya) {
        structurePrompt = `
    STRUKTUR KHUSUS "AL-INSYA" (4 BAGIAN - BERHARAKAT):
    1. HEADER (KOP):
       - Teks Tengah: "${formData.sekolah}" (Tulis dalam Arab)
       - Judul: "الِامْتِحَانُ التَّحْرِيْرِيُّ..."
       - Tahun Ajaran (السنة الدراسية): ${formData.tahunAjaran}
       - Tabel Identitas: الْمَادَّةُ (Insya), الْيَوْمُ, الْحِصَّةُ, الْفَصْلُ. (Gunakan tabel width=100%)

    2. ISI SOAL (WAJIB BERHARAKAT):
       أ. Bagian Alif: أَكْمِلِ الفَرَاغَ... (Melengkapi Kalimat - 5 Soal).
       ب. Bagian Ba: كَوِّنْ جُمَلًا مُفِيدَةً... (Membuat Kalimat - 5 Soal).
       ج. Bagian Jim: اكْتُبْ فِقْرَةً... (Mengarang Paragraf tentang ${formData.topik}).
       د. Bagian Dal: تَرْجِمِ الْجُمَلَ... (Menerjemahkan Indo-Arab - 6 Soal).
        `;
    } else {
        structurePrompt = `
    STRUKTUR STANDAR PESANTREN (7 BAGIAN / ALIF-ZAY - BERHARAKAT):
    1. HEADER (KOP) SAMA SEPERTI DI ATAS (Nama Sekolah: ${formData.sekolah}).
       - Pastikan mencantumkan Tahun Ajaran: ${formData.tahunAjaran} (السنة الدراسية) di bawah judul ujian.
       - Pastikan tabel identitas menggunakan <table style="width:100%; direction:rtl;">.

    2. ISI SOAL (Gunakan penomoran Abjadiyah Arab: أ، ب، ج، د، هـ، و، ز):
       أ. Bagian Alif (أ): Al-Mufradat / Kosakata (أَكْمِلِ الْفَرَاغَ / هَاتِ مُفْرَدَاتِ...).
       ب. Bagian Ba (ب): At-Tarakib / Membuat Kalimat (كَوِّنْ جُمَلًا...).
       ج. Bagian Jim (ج): Al-Qira'ah / Pemahaman Teks (أَجِبْ عَنِ الْأَسْئِلَةِ...).
       د. Bagian Dal (د): At-Tarjamah / Menerjemahkan (تَرْجِمْ...).
       هـ. Bagian Ha (هـ): Al-Qawaid / I'rab / Tashrif (أَعْرِبْ / صَرِّفْ...).
       و. Bagian Waw (و): Al-Insya / Pendapat Singkat (اُكْتُبْ رَأْيَكَ...).
       ز. Bagian Zay (ز): Al-Mahfudzot / Hafalan (أَكْمِلِ الْمَحْفُوْظَاتِ...).
        `;
    }

    let prompt = `Bertindaklah sebagai Musyrif/Ustadz ahli kurikulum pesantren salaf & modern.
    Buatkan **Naskah Ujian Pesantren (Imtihan Tahriri)**.
    
    Detail:
    - Nama Madrasah/Pesantren: ${formData.sekolah}
    - Jenjang: ${formData.jenjang}
    - Kelas: ${formData.kelas}
    - Tahun Ajaran (Sanah Dirasiyah): ${formData.tahunAjaran}
    - Mata Pelajaran: ${formData.mapel}
    - Topik Utama: ${formData.topik}
    
    ${harakatInstruction}
    
    Output WAJIB format HTML dengan 'dir="rtl"' (Right-to-Left) untuk bagian Arab.
    Pastikan semua tabel memiliki style="width:100%; border-collapse:collapse; border:1px solid black;" agar rapi saat dicetak.
    
    ${structurePrompt}
    
    Pastikan soal relevan, menantang, dan sesuai kaidah Bahasa Arab Fusha.
    `;

    try {
      const result = await generateTextContentStream(
          prompt,
          (chunk) => setStreamLog(prev => prev + chunk),
          "Anda adalah Ustadz senior yang sangat teliti dalam Nahwu, Shorof, dan Harakat."
      );
      if (result) {
          // Format Title untuk Nama File: Soal Pesantren [Mapel] Kelas [Kelas]
          const safeMapel = formData.mapel.replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, "").trim(); // Allow Arabic chars in filename safe cleaning
          const fileTitle = `Soal Pesantren ${safeMapel || 'Maddah'} Kelas ${formData.kelas}`;

          localStorage.setItem('lastResult', JSON.stringify({
            title: fileTitle,
            content: result,
            type: 'BANK_SOAL',
            date: new Date().toISOString()
          }));
          navigate('/results');
      }
    } catch (error) {
      alert('Gagal membuat soal pesantren.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressModal isOpen={loading} logs={streamLog} />

      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-green-600 rounded-xl text-white shadow-lg shadow-green-600/30">
            <Scroll size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Bank Soal Pesantren</h1>
            <p className="text-slate-400">Generator soal khas Ma'had dengan format Arab Pegon/Gondul/Berharakat & Struktur Alif-Zay.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Pesantren */}
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg mb-6">
              <h3 className="text-green-400 font-semibold flex items-center gap-2 mb-2">
                  <BookOpen size={18}/> Mode Kitab / Ma'had
              </h3>
              <p className="text-slate-300 text-sm">
                  Modul ini khusus menghasilkan soal dengan format <strong>RTL (Kanan-ke-Kiri)</strong>, Kop Surat Bahasa Arab, dan struktur 7 Bagian (Mufradat s/d Mahfudzot).
                  Semua output otomatis diberi <strong>Harakat Lengkap</strong>.
              </p>
          </div>
        
          <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                     <Building2 size={14} /> Nama Ma'had / Madrasah
                </label>
                <input 
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                    value={formData.sekolah}
                    onChange={(e) => setFormData({...formData, sekolah: e.target.value})}
                    placeholder="Masukkan nama pesantren..."
                />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Select label="Tingkat / Marhalah" value={formData.jenjang} onChange={(e) => setFormData({...formData, jenjang: e.target.value})}>
                  <option value="I'dadi (Persiapan)">I'dadi (Persiapan)</option>
                  <option value="Ula (Awal)">Ula (Awal)</option>
                  <option value="Wustha (Menengah)">Wustha (Menengah)</option>
                  <option value="Ulya (Atas)">Ulya (Atas)</option>
              </Select>
              <Input 
                  label="Kelas / Fashl" 
                  placeholder="Contoh: 1 Int, 3B" 
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                  required
              />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <Input 
                  label="Tahun Ajaran / Sanah Dirasiyah" 
                  placeholder="Contoh: 2025/2026"
                  value={formData.tahunAjaran}
                  onChange={(e) => setFormData({...formData, tahunAjaran: e.target.value})}
                  required
              />
              <DataListInput 
                label="Mata Pelajaran (Maddah)"
                placeholder="Contoh: Nahwu, Fiqih, Insya"
                value={formData.mapel}
                onChange={(val) => setFormData({...formData, mapel: val})}
                options={SUBJECTS.filter(s => s.match(/[\u0600-\u06FF]/))} // Filter subject yang ada arabnya
                required
              />
          </div>

          <Input 
            label="Topik / Materi (Maudhu')" 
            placeholder="Materi yang diujikan..."
            value={formData.topik}
            onChange={(e) => setFormData({...formData, topik: e.target.value})}
            required
          />

          <div className="grid grid-cols-2 gap-4">
             <Select label="Bahasa Pengantar Soal" value={formData.bahasa} onChange={(e) => setFormData({...formData, bahasa: e.target.value})}>
                <option value="Bahasa Arab">Bahasa Arab (Full)</option>
                <option value="Arab & Indonesia">Campuran (Arab & Indo)</option>
                <option value="Arab Pegon">Arab Pegon (Jawa/Sunda)</option>
             </Select>
             
             <Select label="Tingkat Kesulitan" value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
                  <option>Sedang (Mutawasith)</option>
                  <option>Sulit (HOTS / 'Ali)</option>
              </Select>
          </div>

          <Button type="submit" className="w-full h-14 shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700 text-lg font-semibold" disabled={loading}>
             Buat Soal Pesantren (Imtihan)
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default PesantrenBankGenerator;
