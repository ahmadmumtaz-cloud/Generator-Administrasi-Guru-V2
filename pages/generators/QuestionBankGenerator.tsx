
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
    tahunAjaran: '2025-2026',
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

    // Header Template String
    const headerTemplate = `
    <div style="border: 1px solid black; padding: 0; margin-bottom: 20px; font-family: 'Times New Roman', serif;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid black;">
                <td style="width: 20%; text-align: center; padding: 10px; border-right: 1px solid black;">
                   <img src="https://upload.wikimedia.org/wikipedia/commons/2/27/Logo_YPI_Al-Ghozali.png" alt="Logo" width="90" height="90" style="display:block; margin:auto;">
                   <br><span style="font-size:10px;">YPI AL-GHOZALI</span>
                </td>
                <td style="width: 80%; text-align: center; padding: 5px;">
                    <h3 style="margin:0; font-size: 14pt; font-weight: normal;">YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI</h3>
                    <h2 style="margin:5px 0; font-size: 18pt; font-weight: bold;">${formData.sekolah.toUpperCase()}</h2>
                    <p style="margin:0; font-size: 10pt;">Telp. (0251) 8614072, e-mail: smaislamalghozalisma@ymail.com</p>
                </td>
            </tr>
        </table>
        <div style="text-align: center; border-bottom: 1px solid black; padding: 8px; background-color: #fff;">
            <h3 style="margin: 0; font-size: 14pt; font-weight: bold; letter-spacing: 1px;">PENILAIAN SUMATIF AKHIR SEMESTER GANJIL</h3>
            <h4 style="margin: 5px 0 0 0; font-size: 12pt; font-weight: bold;">TAHUN PELAJARAN ${formData.tahunAjaran}</h4>
        </div>
        <div style="padding: 10px;">
            <table style="width: 100%; font-size: 12pt; border: none;">
                <tr>
                    <td style="width: 15%; font-weight: bold;">Mata Pelajaran</td>
                    <td style="width: 35%;">: ${formData.mapel}</td>
                    <td style="width: 15%; font-weight: bold;">Hari/Tanggal</td>
                    <td style="width: 35%;">: ....................................</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Kelas</td>
                    <td>: ${formData.kelas}</td>
                    <td style="font-weight: bold;">Jam Ke-</td>
                    <td>: ....................................</td>
                </tr>
                <tr>
                    <td style="font-weight: bold;">Waktu</td>
                    <td>: 90 Menit</td>
                    <td></td>
                    <td></td>
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

    INSTRUKSI KONTEN:
    1. NASKAH SOAL (Gunakan <ol> untuk nomor soal, dan <ol type="A" style="list-style-type: upper-alpha;"> untuk opsi)
    2. KUNCI JAWABAN (Di akhir dokumen, pisahkan dengan garis)

    TUGAS ANDA:
    Generate body content HTML lengkap mulai dari Header yang saya berikan di atas, dilanjutkan dengan Naskah Soal, lalu Kunci Jawaban.
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
            <FileText size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-white mb-1">Bank Soal Adaptif</h1>
            <p className="text-slate-400">Generator soal standar YPI Al-Ghozali dengan Header Resmi.</p>
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
                    placeholder="Contoh: SMA ISLAM AL-GHOZALI"
                />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Select label="Jenjang" value={formData.jenjang} onChange={(e) => setFormData({...formData, jenjang: e.target.value})}>
                  <option value="SD">SD / MI</option>
                  <option value="SMP">SMP / MTs</option>
                  <option value="SMA">SMA / MA / SMK</option>
              </Select>
              <Input 
                  label="Kelas" 
                  placeholder="Contoh: 10, 12 IPA 1" 
                  value={formData.kelas}
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                  required
              />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
                label="Tahun Ajaran" 
                value={formData.tahunAjaran}
                onChange={(e) => setFormData({...formData, tahunAjaran: e.target.value})}
            />
            <Select 
                label="Bahasa Soal" 
                value={formData.bahasa} 
                onChange={(e) => setFormData({...formData, bahasa: e.target.value})}
            >
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Bahasa Sunda">Bahasa Sunda</option>
            </Select>
          </div>

          <DataListInput 
            label="Mata Pelajaran"
            placeholder="Pilih atau ketik mata pelajaran"
            value={formData.mapel}
            onChange={(val) => setFormData({...formData, mapel: val})}
            options={SUBJECTS}
            required
          />

          <Input 
            label="Topik / Materi" 
            placeholder="Materi yang diujikan..."
            value={formData.topik}
            onChange={(e) => setFormData({...formData, topik: e.target.value})}
            required
          />

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
              <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                  <Calculator size={18} className="text-indigo-400" />
                  <h3 className="font-semibold text-slate-200">Distribusi Soal</h3>
                  <span className="ml-auto text-xs bg-indigo-600 px-2 py-1 rounded text-white">
                      Total: {getTotalQuestions()} Soal
                  </span>
              </div>

              {['SMA', 'SMP'].includes(formData.jenjang) ? (
                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                          label="Jumlah PG (Reguler)" 
                          type="number" min="0" 
                          value={distribution.pg}
                          onChange={(e) => setDistribution({...distribution, pg: parseInt(e.target.value) || 0})}
                      />
                      <Input 
                          label="Jumlah PG TKA (HOTS)" 
                          type="number" min="0"
                          value={distribution.pgTka}
                          onChange={(e) => setDistribution({...distribution, pgTka: parseInt(e.target.value) || 0})}
                      />
                      <Input 
                          label="Jumlah Uraian" 
                          type="number" min="0"
                          value={distribution.uraian}
                          onChange={(e) => setDistribution({...distribution, uraian: parseInt(e.target.value) || 0})}
                      />
                      <Input 
                          label="Jumlah Uraian TKA" 
                          type="number" min="0"
                          value={distribution.uraianTka}
                          onChange={(e) => setDistribution({...distribution, uraianTka: parseInt(e.target.value) || 0})}
                      />
                  </div>
              ) : (
                  <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Jumlah Soal" 
                        type="number" min="1" max="100"
                        value={distribution.simpleTotal}
                        onChange={(e) => setDistribution({...distribution, simpleTotal: parseInt(e.target.value) || 0})}
                      />
                      <Select 
                        label="Tipe Soal" 
                        value={distribution.simpleType} 
                        onChange={(e) => setDistribution({...distribution, simpleType: e.target.value})}
                      >
                          <option value="Pilihan Ganda">Pilihan Ganda</option>
                          <option value="Isian Singkat">Isian Singkat</option>
                          <option value="Uraian">Uraian / Essay</option>
                          <option value="Campuran">Campuran</option>
                      </Select>
                  </div>
              )}
          </div>

          <div className="grid grid-cols-2 gap-4">
              <Select label="Opsi Jawaban PG" value={formData.pgOptionCount} onChange={(e) => setFormData({...formData, pgOptionCount: e.target.value})}>
                  <option value="3">3 Opsi (A, B, C)</option>
                  <option value="4">4 Opsi (A, B, C, D)</option>
                  <option value="5">5 Opsi (A, B, C, D, E)</option>
              </Select>

              <Select label="Tingkat Kesulitan" value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})}>
                  <option>Mudah</option>
                  <option>Sedang</option>
                  <option>Sulit (HOTS)</option>
              </Select>
          </div>

          <Button type="submit" className="w-full h-12 shadow-lg shadow-indigo-500/20" disabled={loading}>
             Generate Bank Soal Umum
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default QuestionBankGenerator;
