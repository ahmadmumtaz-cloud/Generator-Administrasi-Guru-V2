
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Select, Button, DataListInput, ProgressModal } from '../../components/UI';
import { generateTextContentStream } from '../../services/geminiService';
import { Calculator, FileText, Building2 } from 'lucide-react';
import { SUBJECTS } from '../../utils/data';

const QuestionBankGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [streamLog, setStreamLog] = useState('');
  
  const [formData, setFormData] = useState({
    sekolah: 'SMA ISLAM AL-GHOZALI',
    jenjang: 'SMA',
    kelas: '10',
    tahunAjaran: '2025/2026',
    mapel: '',
    topik: '',
    difficulty: 'Sedang',
    pgOptionCount: '5',
    bahasa: 'Bahasa Indonesia'
  });

  const [distribution, setDistribution] = useState({
    pg: 0,
    pgTka: 0,
    uraian: 0,
    uraianTka: 0,
    simpleTotal: 10,
    simpleType: 'Pilihan Ganda'
  });

  // Auto-configure defaults based on Jenjang
  useEffect(() => {
    if (formData.jenjang === 'SMA') {
        setFormData(prev => ({ ...prev, pgOptionCount: '5' }));
    } else if (formData.jenjang === 'SMP') {
        setFormData(prev => ({ ...prev, pgOptionCount: '4' }));
    } else {
        setFormData(prev => ({ ...prev, pgOptionCount: '3' }));
    }
  }, [formData.jenjang]);

  const getTotalQuestions = () => {
      if (['SMA', 'SMP'].includes(formData.jenjang)) {
          return (
              (parseInt(distribution.pg as any) || 0) +
              (parseInt(distribution.pgTka as any) || 0) +
              (parseInt(distribution.uraian as any) || 0) +
              (parseInt(distribution.uraianTka as any) || 0)
          );
      }
      return distribution.simpleTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = getTotalQuestions();
    
    if (total === 0) {
        alert("Jumlah total soal tidak boleh 0.");
        return;
    }

    setLoading(true);
    setStreamLog("Menghubungkan ke AI Bank Soal...");

    const isComplexLevel = ['SMA', 'SMP'].includes(formData.jenjang);
    let distributionPrompt = "";

    if (isComplexLevel) {
        distributionPrompt = `
    RINCIAN DISTRIBUSI SOAL (Total ${total} Butir):
    1. Pilihan Ganda (Reguler): ${distribution.pg} butir.
    2. Pilihan Ganda TKA (Tes Kemampuan Akademik/HOTS): ${distribution.pgTka} butir.
    3. Uraian/Essay (Reguler): ${distribution.uraian} butir.
    4. Uraian TKA (Analisis Mendalam): ${distribution.uraianTka} butir.
        `;
    } else {
        distributionPrompt = `
    SPESIFIKASI SOAL:
    - Jumlah Total: ${distribution.simpleTotal} butir.
    - Tipe Soal: ${distribution.simpleType}.
        `;
    }

    // STRICT AL-GHOZALI HEADER TEMPLATE AS REQUESTED (Reduced Font Sizes)
    const headerTemplate = `
    <div style="border: 1px solid black; padding: 0; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
        <table style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="border-bottom: 1px solid black;">
                <td style="width: 15%; text-align: center; padding: 5px; border-right: 1px solid black; border-left: none; border-top: none;">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/Logo_YPI_Al-Ghozali.png" alt="Logo" width="80" height="80" style="display:block; margin:auto;">
                   <br><span style="font-size:9px;">YPI AL-GHOZALI</span>
                </td>
                <td style="width: 85%; text-align: center; padding: 5px; border: none;">
                    <h3 style="margin:0; font-size: 11pt; font-weight: normal;">YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI</h3>
                    <h2 style="margin:2px 0; font-size: 14pt; font-weight: bold;">${formData.sekolah.toUpperCase()}</h2>
                    <p style="margin:0; font-size: 9pt;">Telp. (0251) 8614072, e-mail: smaislamalghozalisma@ymail.com</p>
                </td>
            </tr>
        </table>
        <div style="text-align: center; border-bottom: 1px solid black; padding: 5px; background-color: #fff;">
            <h3 style="margin: 0; font-size: 12pt; font-weight: bold; letter-spacing: 1px;">PENILAIAN SUMATIF AKHIR SEMESTER GANJIL</h3>
            <h4 style="margin: 2px 0 0 0; font-size: 11pt; font-weight: bold;">TAHUN PELAJARAN ${formData.tahunAjaran}</h4>
        </div>
        <div style="padding: 8px;">
            <table style="width: 100%; font-size: 11pt; border: none;">
                <tr>
                    <td style="width: 15%; font-weight: bold; border: none;">Mata Pelajaran</td>
                    <td style="width: 35%; border: none;">: ${formData.mapel}</td>
                    <td style="width: 15%; font-weight: bold; border: none;">Hari/Tanggal</td>
                    <td style="width: 35%; border: none;">: ....................................</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; border: none;">Kelas</td>
                    <td style="border: none;">: ${formData.kelas}</td>
                    <td style="font-weight: bold; border: none;">Jam Ke-</td>
                    <td style="border: none;">: ....................................</td>
                </tr>
                <tr>
                    <td style="font-weight: bold; border: none;">Waktu</td>
                    <td style="border: none;">: 90 Menit</td>
                    <td style="border: none;"></td>
                    <td style="border: none;"></td>
                </tr>
            </table>
        </div>
    </div>
    `;

    let prompt = `Bertindaklah sebagai ahli pembuat soal profesional di YPI Al-Ghozali. Buatkan **Paket Asesmen Lengkap** untuk:
    - Nama Sekolah: **${formData.sekolah}**
    - Jenjang: **${formData.jenjang}**
    - Kelas: **${formData.kelas}**
    - Tahun Ajaran: **${formData.tahunAjaran}**
    - Mata Pelajaran: **${formData.mapel}**
    - Topik: **${formData.topik}**
    - Bahasa Soal: **${formData.bahasa}**
    
    ${distributionPrompt}

    PENGATURAN OPSI JAWABAN (STRICT & WAJIB):
    1. Gunakan tag HTML: <ol type="A" style="list-style-type: upper-alpha;">
       Ini WAJIB agar saat di-export ke Word, opsinya tetap A, B, C, D, E (bukan angka 1, 2, 3).
    2. Buatkan **${formData.pgOptionCount} opsi jawaban** per soal.

    INSTRUKSI LAYOUT & HEADER (KOP SOAL):
    - JANGAN BUAT HEADER SENDIRI.
    - GUNAKAN KODE HTML BERIKUT SECARA PERSIS UNTUK BAGIAN ATAS DOKUMEN:
    ${headerTemplate}

    INSTRUKSI KONTEN (WAJIB ADA 6 BAGIAN):
    Generate body content HTML lengkap yang terdiri dari 6 Bagian Utama:
    1. NASKAH SOAL (Gunakan <ol> untuk nomor soal, dan <ol type="A" style="list-style-type: upper-alpha;"> untuk opsi).
    2. KISI-KISI PENULISAN SOAL (Tabel: No, KD, Materi, Indikator, Level Kognitif, No Soal).
    3. KUNCI JAWABAN & PEMBAHASAN (Tabel).
    4. ANALISIS SOAL KUALITATIF (Tabel aspek penelaahan materi/konstruksi/bahasa).
    5. RUBRIK PENILAIAN/PENSKORAN (Rumus nilai akhir).
    6. RINGKASAN MATERI (Rangkuman singkat materi yang diujikan).

    Pisahkan setiap bagian dengan <hr style="border: 2px solid black; margin: 30px 0;">.
    Gunakan Bahasa Indonesia yang baku (kecuali mapel bahasa asing).
    `;

    try {
      const result = await generateTextContentStream(
          prompt,
          (chunk) => setStreamLog(prev => prev + chunk),
          "Anda adalah pembuat soal ujian standar nasional yang sangat rapi."
      );
      if (result) {
          const safeMapel = formData.mapel.replace(/[^a-zA-Z0-9 ]/g, "").trim();
          const fileTitle = `Bank Soal ${safeMapel || 'Umum'} Kelas ${formData.kelas}`;

          localStorage.setItem('lastResult', JSON.stringify({
            title: fileTitle,
            content: result,
            type: 'BANK_SOAL',
            date: new Date().toISOString()
          }));
          navigate('/results');
      }
    } catch (error) {
      alert('Gagal membuat soal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressModal isOpen={loading} logs={streamLog} />

      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
            <Calculator size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Bank Soal Umum</h1>
            <p className="text-slate-400">Generator Soal Pilihan Ganda, Essay & HOTS.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-400 flex items-center gap-2">
                     <Building2 size={14} /> Nama Sekolah
                </label>
                <input 
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                    value={formData.sekolah}
                    onChange={(e) => setFormData({...formData, sekolah: e.target.value})}
                    placeholder="Masukkan nama sekolah..."
                />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Select label="Jenjang" value={formData.jenjang} onChange={(e) => setFormData({...formData, jenjang: e.target.value})}>
                  <option value="SD">SD / MI</option>
                  <option value="SMP">SMP / MTs</option>
                  <option value="SMA">SMA / MA</option>
              </Select>
              <Input 
                  label="Kelas" 
                  placeholder="Contoh: 10" 
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                  required
              />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <Input 
                  label="Tahun Ajaran" 
                  placeholder="Contoh: 2025/2026"
                  value={formData.tahunAjaran}
                  onChange={(e) => setFormData({...formData, tahunAjaran: e.target.value})}
                  required
              />
              <DataListInput 
                label="Mata Pelajaran"
                placeholder="Contoh: Sosiologi"
                value={formData.mapel}
                onChange={(val) => setFormData({...formData, mapel: val})}
                options={SUBJECTS}
                required
              />
          </div>

          <Input 
            label="Topik / Materi Utama" 
            placeholder="Topik yang diujikan..."
            value={formData.topik}
            onChange={(e) => setFormData({...formData, topik: e.target.value})}
            required
          />

          {/* Complex Distribution for SMA/SMP */}
          {['SMA', 'SMP'].includes(formData.jenjang) ? (
              <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-700 space-y-4">
                  <h3 className="font-semibold text-slate-300 border-b border-slate-600 pb-2">Distribusi Soal</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Jumlah PG (Reguler)" 
                        type="number"
                        value={distribution.pg}
                        onChange={(e) => setDistribution({...distribution, pg: parseInt(e.target.value)})}
                      />
                      <Input 
                        label="Jumlah PG (HOTS/TKA)" 
                        type="number"
                        value={distribution.pgTka}
                        onChange={(e) => setDistribution({...distribution, pgTka: parseInt(e.target.value)})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Jumlah Uraian (Reguler)" 
                        type="number"
                        value={distribution.uraian}
                        onChange={(e) => setDistribution({...distribution, uraian: parseInt(e.target.value)})}
                      />
                      <Input 
                        label="Jumlah Uraian (TKA)" 
                        type="number"
                        value={distribution.uraianTka}
                        onChange={(e) => setDistribution({...distribution, uraianTka: parseInt(e.target.value)})}
                      />
                  </div>
                  <div className="text-right text-sm text-indigo-400 font-bold">
                      Total Soal: {getTotalQuestions()}
                  </div>
              </div>
          ) : (
             /* Simple Distribution for SD */
             <div className="grid grid-cols-2 gap-4">
                 <Input 
                    label="Jumlah Soal" 
                    type="number"
                    value={distribution.simpleTotal}
                    onChange={(e) => setDistribution({...distribution, simpleTotal: parseInt(e.target.value)})}
                 />
                 <Select 
                    label="Tipe Soal"
                    value={distribution.simpleType}
                    onChange={(e) => setDistribution({...distribution, simpleType: e.target.value})}
                 >
                     <option>Pilihan Ganda</option>
                     <option>Isian Singkat</option>
                     <option>Uraian</option>
                 </Select>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <Select label="Bahasa Soal" value={formData.bahasa} onChange={(e) => setFormData({...formData, bahasa: e.target.value})}>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Bahasa Arab">Bahasa Arab</option>
             </Select>
             <Select label="Tingkat Kesulitan" value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
                  <option>Mudah</option>
                  <option>Sedang</option>
                  <option>Sukar / HOTS</option>
              </Select>
          </div>

          <Button type="submit" className="w-full h-14 shadow-lg shadow-indigo-500/20 text-lg font-semibold" disabled={loading}>
            <FileText className="mr-2" /> Generate Bank Soal
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default QuestionBankGenerator;
