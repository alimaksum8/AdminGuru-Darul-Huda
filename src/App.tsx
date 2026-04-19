/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, 
  BookOpen, 
  FileText, 
  Calendar, 
  UserCheck, 
  Download, 
  Settings, 
  PenTool, 
  GraduationCap,
  Sparkles,
  ClipboardList,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const App = () => {
  // State for Form Identity
  const [formData, setFormData] = useState({
    kurikulum: 'Kurikulum Merdeka',
    fase: 'Fase D',
    mapel: '',
    namaGuru: '',
    namaSekolah: 'AdminGuru Darul Huda',
    namaKepalaSekolah: '',
    kabupaten: 'Bondowoso',
    tanggalTtd: new Date().toISOString().split('T')[0],
    kelas: 'VII',
    semester: 'Ganjil',
    tahunAjaran: '2024/2025'
  });

  // State for Dynamic Materials
  const [materiList, setMateriList] = useState(['']);

  // State for Selected Documents (Multi-select)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const documentTypes = [
    { id: 'CP', name: 'CP', icon: <BookOpen size={18} /> },
    { id: 'TP', name: 'TP', icon: <Sparkles size={18} /> },
    { id: 'ATP', name: 'ATP', icon: <PenTool size={18} /> },
    { id: 'MODUL', name: 'Modul Ajar', icon: <FileText size={18} /> },
    { id: 'LKPD', name: 'LKPD', icon: <ClipboardList size={18} /> },
    { id: 'ASESMEN', name: 'Asesmen', icon: <UserCheck size={18} /> },
    { id: 'KKTP', name: 'KKTP', icon: <GraduationCap size={18} /> },
    { id: 'PEKAN', name: 'Pekan Efektif', icon: <Calendar size={18} /> },
    { id: 'PROTA', name: 'Prota', icon: <FileText size={18} /> },
    { id: 'PROSEM', name: 'Promis', icon: <ClipboardList size={18} /> },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsGenerated(false);
  };

  const addMateri = () => setMateriList([...materiList, '']);
  const removeMateri = (index: number) => {
    const newList = materiList.filter((_, i) => i !== index);
    setMateriList(newList.length ? newList : ['']);
  };
  const handleMateriChange = (index: number, value: string) => {
    const newList = [...materiList];
    newList[index] = value;
    setMateriList(newList);
    setIsGenerated(false);
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    setIsGenerated(false);
  };

  const selectAll = () => {
    if (selectedDocs.length === documentTypes.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(documentTypes.map(d => d.id));
    }
    setIsGenerated(false);
  };

  const handleGenerate = () => {
    if (selectedDocs.length === 0) {
      alert("Pilih minimal satu perangkat untuk di-generate.");
      return;
    }
    if (materiList.every(m => m.trim() === "")) {
      alert("Harap isi setidaknya satu materi pokok.");
      return;
    }
    
    setIsGenerating(true);
    // Simulate generation delay for feedback
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Modern PDF-style Page Wrapper
  const PageContainer = ({ children, title, id }: { children: React.ReactNode, title: string, id: string, key?: React.Key }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id={id} 
      className="bg-white p-12 shadow-2xl mx-auto my-8 border border-gray-100 print:shadow-none print:m-0 print:p-8 min-h-[1123px] w-full max-w-[800px] relative overflow-hidden break-after-page"
    >
      <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-8">
        <h1 className="text-xl font-bold uppercase tracking-wider leading-tight">{formData.namaSekolah || 'NAMA SEKOLAH ANDA'}</h1>
        <p className="text-[10px] italic text-gray-600">Jl. KH. Moch. Chozin Toyib No.2 Rt 01/ Rw 01 Desa pengarang Kec. Jambesari Darus Sholah Kab. Bondowoso</p>
        <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-500 uppercase">
          <span>Mapel: {formData.mapel || '...'}</span>
          <span>{formData.kurikulum}</span>
          <span>{formData.fase}</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-10 text-gray-800 underline decoration-indigo-500 underline-offset-8 uppercase">
        {title}
      </h2>

      <div className="text-sm leading-relaxed text-gray-800">
        {children}
      </div>

      <div className="mt-16 grid grid-cols-2 gap-20 text-center">
        <div className="print:break-inside-avoid">
          <p className="mb-20">Mengetahui,<br/>Kepala Sekolah</p>
          <p className="font-bold underline uppercase">{formData.namaKepalaSekolah || '..........................'}</p>
          <p className="text-xs text-gray-500 italic">NIP. ..........................</p>
        </div>
        <div className="print:break-inside-avoid">
          <p className="mb-20 uppercase">{formData.kabupaten || 'Kabupaten'}, {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(formData.tanggalTtd))}<br/>Guru Mata Pelajaran</p>
          <p className="font-bold underline uppercase">{formData.namaGuru || '..........................'}</p>
          <p className="text-xs text-gray-500 italic">NIP. ..........................</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 space-y-6 overflow-y-auto max-h-screen sticky top-0 print:hidden shadow-xl z-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"
          >
            <GraduationCap size={24} />
          </motion.div>
          <h1 className="text-xl font-bold text-gray-800 leading-tight tracking-tight">AdminGuru <span className="text-indigo-600 block text-xs tracking-widest font-black uppercase">Darul Huda</span></h1>
        </div>

        {/* Identity Inputs */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Settings size={12} /> Data Identitas
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select name="semester" value={formData.semester} onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
              <input name="tahunAjaran" value={formData.tahunAjaran} onChange={handleInputChange} placeholder="Tahun Ajaran" className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <select name="kurikulum" value={formData.kurikulum} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
              <option value="Deep Learning">Deep Learning</option>
              <option value="Kurikulum Berbasis Cinta">Kurikulum Berbasis Cinta</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select name="fase" value={formData.fase} onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Fase A">Fase A</option><option value="Fase B">Fase B</option><option value="Fase C">Fase C</option>
                <option value="Fase D">Fase D</option><option value="Fase E">Fase E</option><option value="Fase F">Fase F</option>
              </select>
              <input name="mapel" placeholder="Mata Pelajaran" onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <input name="namaGuru" placeholder="Nama Guru Pengampu" onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input name="namaSekolah" placeholder="Nama Instansi/Sekolah" onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input name="namaKepalaSekolah" placeholder="Nama Kepala Sekolah" onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input name="kabupaten" placeholder="Kabupaten/Kota" onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="date" name="tanggalTtd" value={formData.tanggalTtd} onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Dynamic Materi Inputs */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <PenTool size={12} /> Materi Pokok (Detail)
            </h3>
            <button onClick={addMateri} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
            {materiList.map((materi, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={idx} 
                className="flex gap-1 group"
              >
                <input 
                  value={materi} 
                  onChange={(e) => handleMateriChange(idx, e.target.value)}
                  placeholder={`Judul Materi ${idx + 1}`}
                  className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <button onClick={() => removeMateri(idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Selection Area */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pilih Perangkat</h3>
            <button onClick={selectAll} className="text-[10px] font-bold text-indigo-600 hover:underline uppercase">
              {selectedDocs.length === documentTypes.length ? 'Hapus' : 'Semua'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {documentTypes.map((doc) => (
              <label key={doc.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all border text-[10px] ${selectedDocs.includes(doc.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50'}`}>
                <input type="checkbox" className="hidden" checked={selectedDocs.includes(doc.id)} onChange={() => toggleDoc(doc.id)}/>
                {selectedDocs.includes(doc.id) ? <CheckSquare size={12} /> : <Square size={12} />}
                <span className="font-bold uppercase truncate">{doc.name}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="space-y-2 pt-4">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 group uppercase text-xs disabled:opacity-50"
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Wand2 size={18} />
              </motion.div>
            ) : (
              <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Full Perangkat'}
          </button>
          
          <AnimatePresence>
            {isGenerated && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-black transition-all shadow-md active:scale-95 uppercase text-xs"
              >
                <Download size={18} /> Download Paket PDF
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-12 print:p-0 print:bg-white bg-slate-200/50">
        <div className="max-w-[800px] mx-auto">
          
          {!isGenerated && !isGenerating && (
            <div className="h-[70vh] flex flex-col items-center justify-center text-gray-400 border-4 border-dashed border-gray-300 rounded-3xl bg-white/50 backdrop-blur-sm">
              <div className="p-6 bg-white rounded-full shadow-inner mb-6">
                <Wand2 size={64} className="opacity-20 text-indigo-600" />
              </div>
              <p className="font-black text-xl text-gray-500 uppercase tracking-tighter">Ready to Generate?</p>
              <p className="text-sm max-w-sm text-center mt-2 leading-relaxed">
                Silakan isi data di sidebar kiri. <br/>
                Sistem akan menyusun <strong>Capaian, Tujuan, Alur, hingga Modul Ajar</strong> yang saling berkesinambungan secara detail.
              </p>
            </div>
          )}

          {isGenerating && (
             <div className="h-[70vh] flex flex-col items-center justify-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="mb-8 text-indigo-600"
                >
                  <Sparkles size={64} />
                </motion.div>
                <p className="font-bold text-gray-600 animate-pulse uppercase tracking-widest text-sm">Menyusun dokumen pembelajaran...</p>
             </div>
          )}

          <AnimatePresence>
            {isGenerated && !isGenerating && (
              <>
                {selectedDocs.includes('CP') && (
                  <PageContainer key="CP" id="CP" title="CAPAIAN PEMBELAJARAN (CP)">
                    <div className="space-y-8 text-justify">
                      <div>
                        <h4 className="font-bold text-indigo-900 mb-2 border-b-2 border-indigo-100 pb-1">I. RASIONALISASI</h4>
                        <p>Mata pelajaran {formData.mapel || '[Mapel]'} merupakan pilar penting dalam membentuk kompetensi abad-21 bagi peserta didik pada {formData.fase}. Kurikulum <strong>{formData.kurikulum}</strong> menekankan pada penguasaan konsep esensial yang memungkinkan siswa untuk mengeksplorasi {formData.mapel} secara mendalam, kritis, dan reflektif. {formData.kurikulum === 'Deep Learning' ? 'Siswa didorong untuk melampaui sekadar hafalan dan mencapai pemahaman tingkat tinggi melalui penyelidikan terarah.' : ''}</p>
                      </div>

                      <div>
                        <h4 className="font-bold text-indigo-900 mb-3 border-b-2 border-indigo-100 pb-1 uppercase">II. Capaian Per Materi Pokok</h4>
                        <div className="space-y-4">
                          {materiList.map((m, i) => (
                            <div key={i} className="p-4 border rounded-lg bg-gray-50">
                              <p className="font-bold text-indigo-700 underline mb-1">Elemen: {m || 'Materi Pokok'}</p>
                              <p className="text-sm">Pada akhir {formData.fase}, peserta didik mampu mendeskripsikan, menganalisis, serta mengevaluasi konsep-konsep yang berkaitan dengan <strong>{m}</strong>. Peserta didik dapat mengintegrasikan pengetahuan tersebut untuk memecahkan masalah kontekstual dalam kehidupan masyarakat serta mampu mengomunikasikan ide secara terstruktur dan ilmiah.</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('TP') && (
                  <PageContainer key="TP" id="TP" title="TUJUAN PEMBELAJARAN (TP)">
                    <div className="space-y-8">
                      <p className="font-semibold italic border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50 text-indigo-900 uppercase text-xs">Penjabaran Indikator Kompetensi ({formData.kurikulum})</p>
                      
                      {materiList.map((m, i) => (
                        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-800 text-white px-4 py-2 font-bold text-sm flex justify-between">
                            <span>UNIT 0{i+1}: {m || '...'}</span>
                            <span className="text-[10px] opacity-70">Fase {formData.fase.split(' ')[1]}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div className="p-2 border rounded-md bg-green-50">
                                <p className="font-black text-green-700 uppercase mb-1">Kognitif</p>
                                <p>Mampu menganalisis struktur dan konsep dasar {m}.</p>
                              </div>
                              <div className="p-2 border rounded-md bg-blue-50">
                                <p className="font-black text-blue-700 uppercase mb-1">Psikomotor</p>
                                <p>Terampil menyajikan data hasil eksperimen terkait {m}.</p>
                              </div>
                              <div className="p-2 border rounded-md bg-amber-50">
                                <p className="font-black text-amber-700 uppercase mb-1">Afektif</p>
                                <p>Menunjukkan sikap gotong royong dan berpikir kritis.</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium leading-relaxed pt-2">
                              <strong>Tujuan Akhir:</strong> Melalui serangkaian kegiatan mandiri dan kelompok, peserta didik dapat mengaplikasikan prinsip {m} untuk menciptakan solusi nyata yang berdaya guna bagi lingkungan sekitar.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('ATP') && (
                  <PageContainer key="ATP" id="ATP" title="ALUR TUJUAN PEMBELAJARAN (ATP)">
                     <div className="space-y-6">
                      <table className="w-full border-collapse border-2 border-slate-800 text-[11px]">
                        <thead className="bg-slate-800 text-white uppercase">
                          <tr>
                            <th className="border border-slate-600 p-2 w-12 text-center">No</th>
                            <th className="border border-slate-600 p-2 text-left">Alur Tujuan Pembelajaran (ATP)</th>
                            <th className="border border-slate-600 p-2 w-20 text-center">Estimasi JP</th>
                            <th className="border border-slate-600 p-2 text-left">Profil Pelajar Pancasila</th>
                          </tr>
                        </thead>
                        <tbody>
                          {materiList.map((m, i) => (
                            <tr key={i}>
                              <td className="border border-slate-300 p-3 text-center font-bold">{i+1}</td>
                              <td className="border border-slate-300 p-3 leading-relaxed">
                                <strong>Materi: {m}</strong><br/>
                                Menjelaskan hubungan antara konsep dasar {m} dengan fenomena yang terjadi di masyarakat secara logis.
                              </td>
                              <td className="border border-slate-300 p-3 text-center font-bold italic">4 JP</td>
                              <td className="border border-slate-300 p-3 italic">Beriman, Mandiri, Bernalar Kritis, Kreatif.</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="bg-indigo-50 p-4 border rounded italic text-xs">
                        <strong>Catatan:</strong> Urutan materi disusun berdasarkan tingkat kesulitan dari yang paling konkret menuju abstrak untuk memastikan pemahaman berkelanjutan.
                      </div>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('MODUL') && (
                  <PageContainer key="MODUL" id="MODUL" title="MODUL AJAR / RPP LENGKAP">
                    <div className="space-y-6">
                      {/* Informasi Umum */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold border-b-2 border-indigo-600 pb-4">
                        <div className="space-y-1">
                          <p>PENYUSUN: {formData.namaGuru}</p>
                          <p>SEKOLAH: {formData.namaSekolah}</p>
                          <p>JENJANG: {formData.kelas}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p>MAPEL: {formData.mapel}</p>
                          <p>TAHUN: {formData.tahunAjaran}</p>
                          <p>METODE: {formData.kurikulum === 'Deep Learning' ? 'Exploration & Deep Thinking' : 'Problem Based Learning'}</p>
                        </div>
                      </div>

                      {/* Komponen Inti per Materi */}
                      <div className="space-y-10 mt-6">
                        {materiList.slice(0, 3).map((m, i) => (
                          <div key={i} className="border-l-4 border-indigo-600 pl-6 space-y-4">
                            <h4 className="bg-indigo-600 text-white px-3 py-1 inline-block font-black uppercase text-xs">Modul Materi {i+1}: {m}</h4>
                            
                            <div className="space-y-2">
                              <p className="font-bold underline text-xs">1. Pertanyaan Pemantik:</p>
                              <p className="italic text-slate-600">"Pernahkah Anda terpikir bagaimana konsep {m} mempengaruhi kenyamanan hidup kita setiap harinya? Apa yang terjadi jika {m} tidak ada?"</p>
                            </div>

                            <div className="space-y-3">
                              <p className="font-bold underline text-xs uppercase">2. Rincian Kegiatan Pembelajaran:</p>
                              <ul className="list-decimal ml-5 space-y-3 text-xs leading-relaxed">
                                <li>
                                  <span className="font-bold">Kegiatan Awal (15 Menit):</span> Melakukan teknik K-W-L (Know, Want, Learn) dan memberikan stimulasi berupa video atau demonstrasi fisik terkait {m}.
                                </li>
                                <li>
                                  <span className="font-bold">Kegiatan Inti (50 Menit):</span> Peserta didik dibagi menjadi kelompok kecil untuk melakukan investigasi literasi dan eksperimen terbimbing mengenai struktur {m}. Guru bertindak sebagai fasilitator yang memberikan pertanyaan pelacak.
                                </li>
                                <li>
                                  <span className="font-bold">Kegiatan Penutup (15 Menit):</span> Melakukan konfirmasi pemahaman melalui kuis interaktif dan penarikan kesimpulan secara kolaboratif.
                                </li>
                              </ul>
                            </div>

                            <div className="bg-slate-50 p-3 rounded text-[10px] border border-slate-200">
                              <p className="font-bold mb-1">Media & Sumber Belajar:</p>
                              <p>Buku Teks, Platform Merdeka Mengajar (PMM), Objek fisik sekitar, dan Lembar Kerja.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('LKPD') && (
                  <PageContainer key="LKPD" id="LKPD" title="LEMBAR KERJA PESERTA DIDIK (LKPD)">
                    <div className="border-4 border-double border-indigo-900 p-8 rounded-lg min-h-[800px]">
                      <div className="flex justify-between border-b pb-4 mb-6">
                        <div className="space-y-1 font-bold">
                          <p>Nama Kelompok: .................................</p>
                          <p>Anggota: ...........................................</p>
                        </div>
                        <div className="font-bold">Kelas: {formData.kelas}</div>
                      </div>

                      <h3 className="text-center text-xl font-black mb-10 tracking-widest uppercase">Eksplorasi Materi: {materiList[0]}</h3>
                      
                      <div className="space-y-6 text-sm">
                        <p className="font-bold">A. Petunjuk Kerja:</p>
                        <ol className="list-decimal ml-5 space-y-2">
                          <li>Diskusikan bersama kelompok mengenai kaitan antara {materiList[0]} dengan lingkungan sekitar.</li>
                          <li>Lakukan pengamatan pada objek yang telah disediakan guru.</li>
                          <li>Isilah tabel pengamatan di bawah ini berdasarkan hasil diskusi.</li>
                        </ol>

                        <div className="mt-8">
                          <p className="font-bold mb-2">B. Tabel Pengamatan & Analisis:</p>
                          <div className="grid grid-cols-3 border-2 border-black">
                            <div className="border border-black p-4 font-bold bg-slate-100 uppercase text-center">Faktor Pengamatan</div>
                            <div className="border border-black p-4 font-bold bg-slate-100 uppercase text-center">Data Temuan</div>
                            <div className="border border-black p-4 font-bold bg-slate-100 uppercase text-center">Analisis Kritis</div>
                            {[1,2,3,4].map(n => (
                              <React.Fragment key={n}>
                                <div className="border border-black p-6"></div>
                                <div className="border border-black p-6"></div>
                                <div className="border border-black p-6"></div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('ASESMEN') && (
                  <PageContainer key="ASESMEN" id="ASESMEN" title="ASESMEN & PENILAIAN">
                    <div className="space-y-10">
                      <section>
                        <h4 className="font-bold text-indigo-900 border-b pb-1 mb-4">A. ASESMEN KOGNITIF (SUMATIF)</h4>
                        <div className="space-y-6">
                          {materiList.slice(0, 3).map((m, i) => (
                            <div key={i} className="pl-4">
                              <p className="font-bold mb-2">{i+1}. Analisislah peran materi <strong>{m}</strong> dalam konteks {formData.kurikulum}. Mengapa pemahaman ini menjadi prasyarat penting dalam penguasaan {formData.mapel}?</p>
                              <div className="grid grid-cols-1 gap-1 text-xs opacity-80">
                                <p>A. Jawaban pengecoh yang logis</p>
                                <p>B. Jawaban yang menunjukkan pemahaman dangkal</p>
                                <p>C. Jawaban yang paling tepat dan analitis</p>
                                <p>D. Jawaban yang tidak relevan dengan konteks</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section>
                        <h4 className="font-bold text-indigo-900 border-b pb-1 mb-4">B. RUBRIK PENILAIAN SIKAP</h4>
                        <table className="w-full border-collapse border border-slate-300 text-xs">
                          <thead>
                            <tr className="bg-slate-100">
                              <th className="border p-2">Aspek</th>
                              <th className="border p-2">Mulai Berkembang (1)</th>
                              <th className="border p-2">Berkembang (2)</th>
                              <th className="border p-2">Sangat Berkembang (3)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border p-2 font-bold uppercase">Kritikalitas</td>
                              <td className="border p-2 italic text-[10px]">Pasif dalam diskusi.</td>
                              <td className="border p-2 italic text-[10px]">Memberikan pendapat sederhana.</td>
                              <td className="border p-2 italic text-[10px]">Mampu membedah masalah secara tajam.</td>
                            </tr>
                          </tbody>
                        </table>
                      </section>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('KKTP') && (
                  <PageContainer key="KKTP" id="KKTP" title="KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)">
                    <div className="space-y-8">
                      <p className="text-justify bg-amber-50 p-4 border-l-4 border-amber-400 text-xs italic">
                        KKTP ini disusun menggunakan pendekatan interval nilai untuk menentukan ketuntasan pemahaman peserta didik terhadap materi <strong>{formData.mapel}</strong> pada {formData.fase}.
                      </p>

                      {materiList.map((m, i) => (
                        <div key={i} className="space-y-4">
                          <h4 className="font-bold text-sm bg-slate-100 p-2 border rounded uppercase">Materi {i+1}: {m}</h4>
                          <table className="w-full border-collapse border border-slate-300 text-[11px]">
                            <thead className="bg-slate-800 text-white uppercase">
                              <tr>
                                <th className="border p-2">Kriteria Ketuntasan</th>
                                <th className="border p-2">0 - 64 (Perlu Bimbingan)</th>
                                <th className="border p-2">65 - 75 (Cukup)</th>
                                <th className="border p-2">76 - 85 (Baik)</th>
                                <th className="border p-2">86 - 100 (Sangat Baik)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border p-2 font-bold">Pemahaman Konsep {m}</td>
                                <td className="border p-2 text-center italic opacity-60">Belum mampu menjelaskan</td>
                                <td className="border p-2 text-center font-medium bg-amber-50">Mampu menjelaskan secara parsial</td>
                                <td className="border p-2 text-center font-medium bg-green-50 text-green-700">Mampu menjelaskan dengan detail</td>
                                <td className="border p-2 text-center font-medium bg-indigo-50 text-indigo-700">Mampu menganalisis & mengaitkan</td>
                              </tr>
                              <tr>
                                <td className="border p-2 font-bold">Aplikasi Praktis {m}</td>
                                <td className="border p-2 text-center italic opacity-60">Tidak dapat menerapkan</td>
                                <td className="border p-2 text-center font-medium bg-amber-50">Menerapkan dengan bantuan</td>
                                <td className="border p-2 text-center font-medium bg-green-50 text-green-700">Menerapkan secara mandiri</td>
                                <td className="border p-2 text-center font-medium bg-indigo-50 text-indigo-700">Menciptakan solusi inovatif</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('PEKAN') && (
                  <PageContainer key="PEKAN" id="PEKAN" title="ANALISIS PEKAN EFEKTIF">
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="p-3 border rounded-lg bg-indigo-50 border-indigo-200">
                          <p className="font-bold text-indigo-900 mb-1 uppercase">Identitas Waktu</p>
                          <p>Semester: {formData.semester}</p>
                          <p>Tahun Ajaran: {formData.tahunAjaran}</p>
                        </div>
                        <div className="p-3 border rounded-lg bg-slate-50 border-slate-200 text-right">
                          <p className="font-bold text-slate-900 mb-1 uppercase">Total Jam Pelajaran</p>
                          <p className="text-2xl font-black text-indigo-600">72 JP</p>
                        </div>
                      </div>

                      <section>
                        <h4 className="font-bold border-b-2 mb-4 text-sm uppercase">I. Perhitungan Pekan (Distribusi Waktu)</h4>
                        <table className="w-full border-collapse border border-slate-300 text-[11px]">
                          <thead className="bg-slate-200 uppercase font-bold text-center">
                            <tr>
                              <th className="border p-2">Bulan</th>
                              <th className="border p-2">Jml Pekan</th>
                              <th className="border p-2">Pekan Tidak Efektif</th>
                              <th className="border p-2">Pekan Efektif</th>
                              <th className="border p-2">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { bln: 'Juli', tot: 4, non: 2, ket: 'Libur Semester' },
                              { bln: 'Agustus', tot: 5, non: 0, ket: '-' },
                              { bln: 'September', tot: 4, non: 1, ket: 'STS / Jeda Semester' },
                              { bln: 'Oktober', tot: 4, non: 0, ket: '-' },
                              { bln: 'November', tot: 4, non: 0, ket: '-' },
                              { bln: 'Desember', tot: 5, non: 3, ket: 'SAS / Libur Semester' },
                            ].map((row, i) => (
                              <tr key={i} className="text-center">
                                <td className="border p-2 font-bold text-left px-4">{row.bln}</td>
                                <td className="border p-2">{row.tot}</td>
                                <td className="border p-2 text-red-500 font-medium">{row.non}</td>
                                <td className="border p-2 bg-green-50 font-bold">{row.tot - row.non}</td>
                                <td className="border p-2 text-left italic">{row.ket}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-800 text-white font-bold text-center uppercase">
                            <tr>
                              <td className="border p-2">JUMLAH</td>
                              <td className="border p-2">26</td>
                              <td className="border p-2">6</td>
                              <td className="border p-2">20</td>
                              <td className="border p-2">-</td>
                            </tr>
                          </tfoot>
                        </table>
                      </section>

                      <section>
                        <h4 className="font-bold border-b-2 mb-4 text-sm uppercase">II. Distribusi Jam Pelajaran</h4>
                        <ul className="space-y-2 text-xs">
                          <li className="flex justify-between border-b pb-1">
                            <span>Materi Inti (Regular):</span>
                            <span className="font-bold">60 JP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>Cadangan / Pengayaan:</span>
                            <span className="font-bold">4 JP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>Asesmen Sumatif Tengah Semester:</span>
                            <span className="font-bold">4 JP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>Asesmen Sumatif Akhir Semester:</span>
                            <span className="font-bold">4 JP</span>
                          </li>
                          <li className="flex justify-between pt-2 text-indigo-600 font-black text-sm">
                            <span>Total Distribusi Jam Pelajaran:</span>
                            <span>72 JP</span>
                          </li>
                        </ul>
                      </section>
                    </div>
                  </PageContainer>
                )}
                {selectedDocs.includes('PROTA') && (
                  <PageContainer key="PROTA" id="PROTA" title="PROGRAM TAHUNAN (PROTA)">
                    <div className="space-y-6">
                      <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-1">
                        <p>Mata Pelajaran: {formData.mapel}</p>
                        <p>Satuan Pendidikan: {formData.namaSekolah}</p>
                        <p>Tahun Pelajaran: {formData.tahunAjaran}</p>
                        <p>Fase: {formData.fase} / Kelas: {formData.kelas}</p>
                      </div>

                      <table className="w-full border-collapse border-2 border-slate-800 text-[11px]">
                        <thead className="bg-slate-800 text-white uppercase text-center">
                          <tr>
                            <th className="border p-2 w-12">SMT</th>
                            <th className="border p-2">Tujuan Pembelajaran / Lingkup Materi</th>
                            <th className="border p-2 w-24">Alokasi Waktu</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-slate-100 font-bold">
                            <td className="border p-2 text-center">I</td>
                            <td className="border p-2">SEMESTER GANJIL</td>
                            <td className="border p-2 text-center">36 JP</td>
                          </tr>
                          {materiList.map((m, i) => (
                            <tr key={i}>
                              <td className="border p-2 text-center">{i + 1}</td>
                              <td className="border p-2">{m || '...'}</td>
                              <td className="border p-2 text-center">4 JP</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-bold">
                            <td className="border p-2 text-center">II</td>
                            <td className="border p-2">SEMESTER GENAP</td>
                            <td className="border p-2 text-center">36 JP</td>
                          </tr>
                          <tr className="italic opacity-70">
                            <td className="border p-2 text-center">...</td>
                            <td className="border p-2 text-center italic">Materi Lanjutan Semester Genap</td>
                            <td className="border p-2 text-center">...</td>
                          </tr>
                        </tbody>
                        <tfoot className="bg-slate-200 font-bold text-center">
                          <tr>
                            <td colSpan={2} className="border p-2 text-right px-4">TOTAL ALOKASI WAKTU TAHUNAN</td>
                            <td className="border p-2">72 JP</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('PROSEM') && (
                  <PageContainer key="PROSEM" id="PROSEM" title="PROGRAM SEMESTER (PROSEM/PROMIS)">
                    <div className="space-y-6 overflow-x-auto">
                      <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-1">
                        <p>Semester: {formData.semester}</p>
                        <p>Mata Pelajaran: {formData.mapel}</p>
                        <p>Tahun Pelajaran: {formData.tahunAjaran}</p>
                      </div>

                      <table className="w-full border-collapse border-2 border-slate-800 text-[9px]">
                        <thead className="bg-slate-800 text-white uppercase text-center">
                          <tr>
                            <th rowSpan={2} className="border p-1 w-8">No</th>
                            <th rowSpan={2} className="border p-1">Materi Pokok / Tujuan Pembelajaran</th>
                            <th rowSpan={2} className="border p-1 w-10">JML JP</th>
                            <th colSpan={4} className="border p-1">Juli</th>
                            <th colSpan={4} className="border p-1">Agustus</th>
                            <th colSpan={4} className="border p-1">September</th>
                            <th colSpan={4} className="border p-1">Oktober</th>
                            <th colSpan={4} className="border p-1">November</th>
                            <th colSpan={4} className="border p-1">Desember</th>
                          </tr>
                          <tr>
                            {[...Array(24)].map((_, i) => (
                              <th key={i} className="border p-1 w-4 text-[7px]">{ (i % 4) + 1 }</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {materiList.map((m, i) => (
                            <tr key={i}>
                              <td className="border p-1 text-center font-bold">{i + 1}</td>
                              <td className="border p-1 font-medium">{m || '...'}</td>
                              <td className="border p-1 text-center font-bold">4 JP</td>
                              {[...Array(24)].map((_, j) => (
                                <td key={j} className={`border p-1 text-center font-bold ${j === (i * 2) % 24 ? 'bg-indigo-400 text-white' : ''}`}>
                                  {j === (i * 2) % 24 ? '4' : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-bold">
                            <td colSpan={2} className="border p-1 text-right px-2 uppercase">Sumatif Tengah Semester</td>
                            <td className="border p-1 text-center">4 JP</td>
                            {[...Array(24)].map((_, j) => (
                              <td key={j} className={`border p-1 text-center ${j === 10 ? 'bg-red-400 text-white' : ''}`}>
                                {j === 10 ? 'S' : ''}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-slate-100 font-bold">
                            <td colSpan={2} className="border p-1 text-right px-2 uppercase">Sumatif Akhir Semester</td>
                            <td className="border p-1 text-center">4 JP</td>
                            {[...Array(24)].map((_, j) => (
                              <td key={j} className={`border p-1 text-center ${j === 22 ? 'bg-red-400 text-white' : ''}`}>
                                {j === 22 ? 'S' : ''}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                      
                      <div className="flex gap-4 text-[8px] font-bold">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-400"></div> KBM Terjadwal</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400"></div> Asesmen Sumatif</div>
                      </div>
                    </div>
                  </PageContainer>
                )}
              </>
            )}
          </AnimatePresence>

        </div>
      </div>

      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          .break-after-page { page-break-after: always; margin: 0 !important; border: none !important; box-shadow: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default App;
