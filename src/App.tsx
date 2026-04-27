/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  BarChart2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Wand2,
  X,
  Zap,
  Upload,
  Loader2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import * as XLSX from 'xlsx';

interface SubMateri {
  judul: string;
  jp: string;
}

interface Materi {
  judul: string;
  jp: string;
  subMateri: SubMateri[];
}

const App = () => {
  // State for Form Identity
  const [formData, setFormData] = useState({
    kurikulum: 'Kurikulum Merdeka',
    fase: 'Fase D',
    mapel: '',
    namaGuru: '',
    namaSekolah: 'MTs DARUL HUDA',
    namaKepalaSekolah: '',
    kabupaten: 'Bondowoso',
    tanggalTtd: new Date().toISOString().split('T')[0],
    kelas: 'Kelas VII',
    semester: ['Ganjil'], // Changed to array for multiple selection
    tahunAjaran: '2024/2025',
    paperSize: 'A4',
    jpUlanganHarianGanjil: '',
    jpCadanganGanjil: '',
    jpUlanganHarianGenap: '',
    jpCadanganGenap: '',
    jpPerPertemuan: '2',
    totalJpGanjil: '',
    totalJpGenap: ''
  });

  const paperStyles = {
    A4: { width: '210mm', height: '297mm' },
    F4: { width: '215mm', height: '330mm' },
    A3: { width: '297mm', height: '420mm' }
  };

  // State for Dynamic Materials - Split by Semester
  const [materiGanjil, setMateriGanjil] = useState<Materi[]>([{ judul: '', jp: '', subMateri: [{ judul: '', jp: '' }] }]);
  const [materiGenap, setMateriGenap] = useState<Materi[]>([{ judul: '', jp: '', subMateri: [{ judul: '', jp: '' }] }]);

  const [pekanDataGanjil, setPekanDataGanjil] = useState([
    { bulan: 'Juli', total: 4, nonEfektif: 2, keterangan: 'Libur Semester' },
    { bulan: 'Agustus', total: 5, nonEfektif: 0, keterangan: '-' },
    { bulan: 'September', total: 4, nonEfektif: 1, keterangan: 'STS / Jeda Semester' },
    { bulan: 'Oktober', total: 4, nonEfektif: 0, keterangan: '-' },
    { bulan: 'November', total: 4, nonEfektif: 0, keterangan: '-' },
    { bulan: 'Desember', total: 5, nonEfektif: 3, keterangan: 'SAS / Libur Semester' },
  ]);

  const [pekanDataGenap, setPekanDataGenap] = useState([
    { bulan: 'Januari', total: 4, nonEfektif: 1, keterangan: 'Libur Semester' },
    { bulan: 'Februari', total: 4, nonEfektif: 0, keterangan: '-' },
    { bulan: 'Maret', total: 5, nonEfektif: 1, keterangan: 'STS / Jeda Semester' },
    { bulan: 'April', total: 4, nonEfektif: 0, keterangan: '-' },
    { bulan: 'Mei', total: 4, nonEfektif: 0, keterangan: '-' },
    { bulan: 'Juni', total: 5, nonEfektif: 3, keterangan: 'SAS / Libur Semester' },
  ]);

  const [showPekanModal, setShowPekanModal] = useState(false);
  const [isScanningKaldik, setIsScanningKaldik] = useState(false);
  const [kaldikFile, setKaldikFile] = useState<File | null>(null);
  const [kaldikPreview, setKaldikPreview] = useState<string | null>(null);
  const [kaldikContent, setKaldikContent] = useState<string | null>(null);

  const handleKaldikUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKaldikFile(file);
      const isImage = file.type.startsWith('image/');
      const isSpreadsheet = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      const reader = new FileReader();
      if (isImage) {
        reader.onloadend = () => {
          setKaldikPreview(reader.result as string);
          setKaldikContent(null);
        };
        reader.readAsDataURL(file);
      } else if (isSpreadsheet) {
        setKaldikPreview(null);
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            let fullText = "";
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              fullText += `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(worksheet)}\n\n`;
            });
            setKaldikContent(fullText);
          } catch (err) {
            console.error("Error parsing spreadsheet:", err);
            alert("Gagal membaca file Excel. Coba simpan sebagai PDF.");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // For other documents
        setKaldikPreview(null);
        if (file.type === 'text/csv' || file.type === 'text/xml' || file.name.endsWith('.csv') || file.name.endsWith('.xml')) {
          reader.onloadend = () => {
            setKaldikContent(reader.result as string);
          };
          reader.readAsText(file);
        } else {
          // For PDF etc, prepare for base64 scan
          reader.onloadend = () => {
             setKaldikContent(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleKaldikScan = async () => {
    if (!kaldikFile) return;
    
    setIsScanningKaldik(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key tidak ditemukan. Pastikan Anda menjalankan aplikasi di lingkungan yang mendukung.");
      
      const ai = new GoogleGenAI({ apiKey });
      
      let part;
      if (kaldikFile.type.startsWith('image/') || kaldikFile.type === 'application/pdf') {
        const base64Data = (kaldikPreview || kaldikContent)?.split(',')[1];
        if (!base64Data) throw new Error("Gagal membaca data file");
        part = {
          inlineData: {
            mimeType: kaldikFile.type || "application/octet-stream",
            data: base64Data
          }
        };
      } else if (kaldikContent && !kaldikContent.startsWith('data:')) {
        // Text based (Spreadsheet converted to CSV, or direct CSV/XML)
        part = { text: `Konten file ${kaldikFile.name}:\n\n${kaldikContent}` };
      } else {
        // Fallback
        const base64Data = kaldikContent?.split(',')[1];
        if (!base64Data) throw new Error("Gagal membaca data file");
        part = {
          inlineData: {
            mimeType: kaldikFile.type || "application/octet-stream",
            data: base64Data
          }
        };
      }

      const prompt = `
        Analisis data dari file Kalender Pendidikan (Kaldik) ini. 
        Ekstrak data jumlah minggu total dan jumlah minggu tidak efektif untuk setiap bulan dari Juli hingga Juni (Tahun Pelajaran).
        Kembalikan data dalam format JSON yang sangat ketat dengan struktur ganjil (Juli-Desember) dan genap (Januari-Juni).
        Jika data tidak ditemukan, gunakan estimasi standar hari efektif pendidikan di Indonesia (rata-rata 4-5 minggu total per bulan).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }, part] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ganjil: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    bulan: { type: Type.STRING },
                    total: { type: Type.NUMBER },
                    nonEfektif: { type: Type.NUMBER },
                    keterangan: { type: Type.STRING }
                  },
                  required: ["bulan", "total", "nonEfektif"]
                }
              },
              genap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    bulan: { type: Type.STRING },
                    total: { type: Type.NUMBER },
                    nonEfektif: { type: Type.NUMBER },
                    keterangan: { type: Type.STRING }
                  },
                  required: ["bulan", "total", "nonEfektif"]
                }
              }
            },
            required: ["ganjil", "genap"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Tidak ada respon dari model");
      
      const result = JSON.parse(text);
      if (result.ganjil) setPekanDataGanjil(result.ganjil);
      if (result.genap) setPekanDataGenap(result.genap);
      
      alert("Pemindaian berhasil! Data telah diterapkan.");
    } catch (error) {
      console.error("Scan error:", error);
      alert("Gagal memindai Kaldik: " + (error instanceof Error ? error.message : "Terjadi kesalahan tidak dikenal"));
    } finally {
      setIsScanningKaldik(false);
    }
  };

  // Derived combined list for backward compatibility where needed
  const materiList = [
    ...(formData.semester.includes('Ganjil') ? materiGanjil : []),
    ...(formData.semester.includes('Genap') ? materiGenap : [])
  ];

  const flatSubMateriList = materiList.flatMap(m => 
    m.subMateri.map(sub => ({
      materiJudul: m.judul,
      judul: sub.judul,
      jp: sub.jp
    }))
  );

  const sumJp = (list: Materi[]) => list.reduce((acc, curr) => acc + (Number(curr.jp) || 0), 0);
  
  const jpMateriGanjil = sumJp(materiGanjil);
  const jpExtraGanjil = (Number(formData.jpUlanganHarianGanjil) || 0) + (Number(formData.jpCadanganGanjil) || 0);
  const totalGanjil = jpMateriGanjil + jpExtraGanjil; 

  const jpMateriGenap = sumJp(materiGenap);
  const jpExtraGenap = (Number(formData.jpUlanganHarianGenap) || 0) + (Number(formData.jpCadanganGenap) || 0);
  const totalGenap = jpMateriGenap + jpExtraGenap; 

  const totalJpKeseluruhan = 
    (formData.semester.includes('Ganjil') ? totalGanjil : 0) + 
    (formData.semester.includes('Genap') ? totalGenap : 0);
  
  const totalJpMateri = 
    (formData.semester.includes('Ganjil') ? jpMateriGanjil : 0) + 
    (formData.semester.includes('Genap') ? jpMateriGenap : 0);

  const totalJpExtra = 
    (formData.semester.includes('Ganjil') ? jpExtraGanjil : 0) + 
    (formData.semester.includes('Genap') ? jpExtraGenap : 0);

  const totalPekanGanjil = pekanDataGanjil.reduce((acc, curr) => acc + curr.total, 0);
  const totalNonGanjil = pekanDataGanjil.reduce((acc, curr) => acc + curr.nonEfektif, 0);
  const totalEfektifGanjil = totalPekanGanjil - totalNonGanjil;

  const totalPekanGenap = pekanDataGenap.reduce((acc, curr) => acc + curr.total, 0);
  const totalNonGenap = pekanDataGenap.reduce((acc, curr) => acc + curr.nonEfektif, 0);
  const totalEfektifGenap = totalPekanGenap - totalNonGenap;

  const jpSessi = Number(formData.jpPerPertemuan) || 0;
  
  const countAnalisisGanjil = (formData.semester.includes('Ganjil') && jpSessi > 0) ? Math.ceil(Number(formData.jpUlanganHarianGanjil) / jpSessi) : 0;
  const countAnalisisGenap = (formData.semester.includes('Genap') && jpSessi > 0) ? Math.ceil(Number(formData.jpUlanganHarianGenap) / jpSessi) : 0;

  const hasilJpEfektifGanjil = totalPekanGanjil * jpSessi;
  const hasilJpTidakEfektifGanjil = totalNonGanjil * jpSessi;
  const hasilJpNettoGanjil = hasilJpEfektifGanjil - hasilJpTidakEfektifGanjil;

  const hasilJpEfektifGenap = totalPekanGenap * jpSessi;
  const hasilJpTidakEfektifGenap = totalNonGenap * jpSessi;
  const hasilJpNettoGenap = hasilJpEfektifGenap - hasilJpTidakEfektifGenap;

  const hasilAkhirJpGanjil = hasilJpNettoGanjil - jpExtraGanjil;
  const hasilAkhirJpGenap = hasilJpNettoGenap - jpExtraGenap;

  const totalPekanTahun = (formData.semester.includes('Ganjil') ? totalPekanGanjil : 0) + (formData.semester.includes('Genap') ? totalPekanGenap : 0);
  const totalNonTahun = (formData.semester.includes('Ganjil') ? totalNonGanjil : 0) + (formData.semester.includes('Genap') ? totalNonGenap : 0);
  const totalEfektifTahun = totalPekanTahun - totalNonTahun;
  
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalJpGanjil: hasilJpNettoGanjil.toString(),
      totalJpGenap: hasilJpNettoGenap.toString()
    }));
  }, [hasilJpNettoGanjil, hasilJpNettoGenap]);

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
    { id: 'ANALISIS', name: 'Analisis Hasil Ulangan', icon: <BarChart2 size={18} /> },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && name === 'semester') {
      const checkbox = e.target as HTMLInputElement;
      const currentSemesters = [...formData.semester];
      if (checkbox.checked) {
        setFormData(prev => ({ ...prev, semester: [...prev.semester, value] }));
      } else {
        setFormData(prev => ({ ...prev, semester: prev.semester.filter(s => s !== value) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setIsGenerated(false);
  };

  const addMateri = (sem: 'Ganjil' | 'Genap') => {
    const defaultMateri = { judul: '', jp: '', subMateri: [{ judul: '', jp: '' }] };
    if (sem === 'Ganjil') setMateriGanjil([...materiGanjil, defaultMateri]);
    else setMateriGenap([...materiGenap, defaultMateri]);
  };

  const removeMateri = (sem: 'Ganjil' | 'Genap', index: number) => {
    if (sem === 'Ganjil') {
      const newList = materiGanjil.filter((_, i) => i !== index);
      setMateriGanjil(newList.length ? newList : [{ judul: '', jp: '', subMateri: [{ judul: '', jp: '' }] }]);
    } else {
      const newList = materiGenap.filter((_, i) => i !== index);
      setMateriGenap(newList.length ? newList : [{ judul: '', jp: '', subMateri: [{ judul: '', jp: '' }] }]);
    }
  };

  const handleMateriChange = (sem: 'Ganjil' | 'Genap', index: number, field: 'judul' | 'jp', value: string) => {
    let finalValue = value;
    if (field === 'jp' && value !== '') {
      const num = Number(value);
      if (num % 2 !== 0) finalValue = (num + 1).toString();
    }

    if (sem === 'Ganjil') {
      const newList = [...materiGanjil];
      newList[index] = { ...newList[index], [field]: finalValue };
      setMateriGanjil(newList);
    } else {
      const newList = [...materiGenap];
      newList[index] = { ...newList[index], [field]: finalValue };
      setMateriGenap(newList);
    }
    setIsGenerated(false);
  };

  const addSubMateri = (sem: 'Ganjil' | 'Genap', materiIdx: number) => {
    if (sem === 'Ganjil') {
      const newList = [...materiGanjil];
      newList[materiIdx].subMateri.push({ judul: '', jp: '' });
      setMateriGanjil(newList);
    } else {
      const newList = [...materiGenap];
      newList[materiIdx].subMateri.push({ judul: '', jp: '' });
      setMateriGenap(newList);
    }
  };

  const removeSubMateri = (sem: 'Ganjil' | 'Genap', materiIdx: number, subIdx: number) => {
    if (sem === 'Ganjil') {
      const newList = [...materiGanjil];
      newList[materiIdx].subMateri = newList[materiIdx].subMateri.filter((_, i) => i !== subIdx);
      if (newList[materiIdx].subMateri.length === 0) newList[materiIdx].subMateri = [{ judul: '', jp: '' }];
      setMateriGanjil(newList);
    } else {
      const newList = [...materiGenap];
      newList[materiIdx].subMateri = newList[materiIdx].subMateri.filter((_, i) => i !== subIdx);
      if (newList[materiIdx].subMateri.length === 0) newList[materiIdx].subMateri = [{ judul: '', jp: '' }];
      setMateriGenap(newList);
    }
  };

  const handleSubMateriChange = (sem: 'Ganjil' | 'Genap', materiIdx: number, subIdx: number, field: 'judul' | 'jp', value: string) => {
    let finalValue = value;
    if (field === 'jp' && value !== '') {
      const num = Number(value);
      if (num % 2 !== 0) finalValue = (num + 1).toString();
    }

    if (sem === 'Ganjil') {
      const newList = [...materiGanjil];
      newList[materiIdx].subMateri[subIdx] = { ...newList[materiIdx].subMateri[subIdx], [field]: finalValue };
      setMateriGanjil(newList);
    } else {
      const newList = [...materiGenap];
      newList[materiIdx].subMateri[subIdx] = { ...newList[materiIdx].subMateri[subIdx], [field]: finalValue };
      setMateriGenap(newList);
    }
    setIsGenerated(false);
  };

  const distributeJp = (sem: 'Ganjil' | 'Genap', materiIdx: number) => {
    const list = sem === 'Ganjil' ? [...materiGanjil] : [...materiGenap];
    const materi = list[materiIdx];
    
    // Ensure total JP is even (Snap to nearest even up)
    let totalJp = Number(materi.jp) || 0;
    if (totalJp % 2 !== 0) totalJp += 1;

    const subCount = materi.subMateri.length;
    if (totalJp <= 0 || subCount === 0) return;

    let remaining = totalJp;
    const newSubMateri = materi.subMateri.map((sub, idx) => {
      if (idx === subCount - 1) {
        return { ...sub, jp: remaining.toString() };
      }
      
      // Calculate even share
      let share = Math.floor(totalJp / subCount);
      if (share % 2 !== 0) share += 1; // Round to even
      
      // Ensure we leave at least 2 for each remaining sub
      const minNeededForOthers = (subCount - 1 - idx) * 2;
      share = Math.min(share, remaining - minNeededForOthers);
      if (share < 2) share = 2;
      
      remaining -= share;
      return { ...sub, jp: share.toString() };
    });

    list[materiIdx] = { ...materi, jp: totalJp.toString(), subMateri: newSubMateri };
    if (sem === 'Ganjil') setMateriGanjil(list);
    else setMateriGenap(list);
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
    if (materiList.every(m => m.judul.trim() === "")) {
      alert("Harap isi setidaknya satu materi pokok.");
      return;
    }
    
    // Validation for JP Materi Pokok
    if (formData.semester.includes('Ganjil')) {
      const target = hasilAkhirJpGanjil;
      if (jpMateriGanjil > target) {
        alert(`Kelebihan JP Semester Ganjil!\nAlokasi Materi: ${jpMateriGanjil} JP\nTersedia: ${target} JP\n(Total Kaldik: ${hasilJpNettoGanjil} JP, UH+Cadangan: ${jpExtraGanjil} JP)`);
        return;
      } else if (jpMateriGanjil < target) {
        alert(`Kekurangan JP Semester Ganjil!\nAlokasi Materi: ${jpMateriGanjil} JP\nTersedia: ${target} JP\n(Total Kaldik: ${hasilJpNettoGanjil} JP, UH+Cadangan: ${jpExtraGanjil} JP)`);
        return;
      }
    }
    
    if (formData.semester.includes('Genap')) {
      const target = hasilAkhirJpGenap;
      if (jpMateriGenap > target) {
        alert(`Kelebihan JP Semester Genap!\nAlokasi Materi: ${jpMateriGenap} JP\nTersedia: ${target} JP\n(Total Kaldik: ${hasilJpNettoGenap} JP, UH+Cadangan: ${jpExtraGenap} JP)`);
        return;
      } else if (jpMateriGenap < target) {
        alert(`Kekurangan JP Semester Genap!\nAlokasi Materi: ${jpMateriGenap} JP\nTersedia: ${target} JP\n(Total Kaldik: ${hasilJpNettoGenap} JP, UH+Cadangan: ${jpExtraGenap} JP)`);
        return;
      }
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
      className="bg-white shadow-2xl mx-auto my-8 border border-gray-100 print:shadow-none print:p-0 relative break-after-page"
      style={{ 
        width: paperStyles[formData.paperSize as keyof typeof paperStyles].width,
        minHeight: paperStyles[formData.paperSize as keyof typeof paperStyles].height,
        paddingTop: '12.5mm',
        paddingBottom: '12.5mm',
        paddingLeft: '30mm',
        paddingRight: '15mm'
      }}
    >
      <div className="print:block">
        <div className="text-center border-b-4 border-double border-gray-800 pb-4 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">YAYASAN PON-PES DARUL HUDA</h2>
          <h1 className="text-xl font-bold uppercase tracking-wider leading-tight">{formData.namaSekolah || 'NAMA SEKOLAH ANDA'}</h1>
          <p className="text-[10px] italic text-gray-600">Jl. KH. Moch. Chozin Toyib No.2 Rt 01/ Rw 01 Desa pengarang Kec. Jambesari Darus Sholah Kab. Bondowoso</p>
          <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-500 uppercase">
            <span>Mapel: {formData.mapel || '...'}</span>
            <span>Semester: {formData.semester.join(' / ')}</span>
            <span>{formData.kurikulum}</span>
            <span>{formData.fase}</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800 underline decoration-indigo-500 underline-offset-8 uppercase">
          {title}
        </h2>

        <div className="text-sm leading-relaxed text-gray-800 printable-content">
          {children}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-20 text-center print:break-inside-avoid">
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
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans print:bg-white print:block">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 space-y-6 overflow-y-auto max-h-screen sticky top-0 print:hidden shadow-xl z-20">
        <div className="flex items-center gap-3 mb-6">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg"
          >
            <GraduationCap size={24} />
          </motion.div>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 leading-tight tracking-tight">Kurikulum <span className="text-indigo-600 block text-xs tracking-widest font-black uppercase">Cinta Darul Huda</span></h1>
            <button 
              onClick={() => setShowPekanModal(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all border border-slate-200 shadow-sm"
              title="Pengaturan Pekan Efektif"
            >
              <Calendar size={18} />
            </button>
          </div>
        </div>

        {/* Identity Inputs */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Settings size={12} /> Data Identitas
          </h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Semester</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="semester" value="Ganjil" checked={formData.semester.includes('Ganjil')} onChange={handleInputChange} className="w-3 h-3 accent-indigo-600" />
                    <span className="text-[10px] font-bold uppercase">Ganjil</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" name="semester" value="Genap" checked={formData.semester.includes('Genap')} onChange={handleInputChange} className="w-3 h-3 accent-indigo-600" />
                    <span className="text-[10px] font-bold uppercase">Genap</span>
                  </label>
                </div>
              </div>
              <select name="paperSize" value={formData.paperSize} onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none self-end">
                <option value="A4">Ukuran A4</option>
                <option value="F4">Ukuran F4</option>
                <option value="A3">Ukuran A3</option>
              </select>
            </div>
            <input name="tahunAjaran" value={formData.tahunAjaran} onChange={handleInputChange} placeholder="Tahun Ajaran" className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            
            <div className={`grid ${formData.semester.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
              {formData.semester.includes('Ganjil') && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total JP Ganjil</label>
                  <input type="number" name="totalJpGanjil" value={formData.totalJpGanjil} readOnly placeholder="JP" className="w-full p-2 bg-gray-100 border border-gray-200 rounded text-sm outline-none cursor-not-allowed font-bold text-indigo-600" />
                  <div className="p-1.5 bg-amber-50 border border-amber-200 rounded flex justify-between items-center">
                    <span className="text-[8px] font-bold text-amber-700 uppercase">Materi Pokok:</span>
                    <span className="text-[10px] font-black text-amber-900">{hasilAkhirJpGanjil} JP</span>
                  </div>
                </div>
              )}
              {formData.semester.includes('Genap') && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Total JP Genap</label>
                  <input type="number" name="totalJpGenap" value={formData.totalJpGenap} readOnly placeholder="JP" className="w-full p-2 bg-gray-100 border border-gray-200 rounded text-sm outline-none cursor-not-allowed font-bold text-indigo-600" />
                  <div className="p-1.5 bg-orange-50 border border-orange-200 rounded flex justify-between items-center">
                    <span className="text-[8px] font-bold text-orange-700 uppercase">Materi Pokok:</span>
                    <span className="text-[10px] font-black text-orange-900">{hasilAkhirJpGenap} JP</span>
                  </div>
                </div>
              )}
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
            <select name="kelas" value={formData.kelas} onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Pilih Kelas</option>
              <option value="Kelas I">Kelas I</option>
              <option value="Kelas II">Kelas II</option>
              <option value="Kelas III">Kelas III</option>
              <option value="Kelas IV">Kelas IV</option>
              <option value="Kelas V">Kelas V</option>
              <option value="Kelas VI">Kelas VI</option>
              <option value="Kelas VII">Kelas VII</option>
              <option value="Kelas VIII">Kelas VIII</option>
              <option value="Kelas IX">Kelas IX</option>
              <option value="Kelas X">Kelas X</option>
              <option value="Kelas XI">Kelas XI</option>
              <option value="Kelas XII">Kelas XII</option>
            </select>
            <input name="namaGuru" placeholder="Nama Guru Pengampu" onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input name="namaSekolah" placeholder="Nama Instansi/Sekolah" onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input name="namaKepalaSekolah" placeholder="Nama Kepala Sekolah" onChange={handleInputChange} className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input name="kabupaten" placeholder="Kabupaten/Kota" onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input type="date" name="tanggalTtd" value={formData.tanggalTtd} onChange={handleInputChange} className="p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Extra JP Inputs */}
        <section className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <ClipboardList size={12} /> Jam Pelajaran (JP) Tambahan
          </h3>
          
          {formData.semester.includes('Ganjil') && (
            <div className="space-y-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Semester Ganjil</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Ulangan Harian</label>
                  <input type="number" min="0" name="jpUlanganHarianGanjil" value={formData.jpUlanganHarianGanjil} onChange={handleInputChange} placeholder="JP" className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Cadangan</label>
                  <input type="number" min="0" name="jpCadanganGanjil" value={formData.jpCadanganGanjil} onChange={handleInputChange} placeholder="JP" className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {formData.semester.includes('Genap') && (
            <div className="space-y-2 p-2 bg-orange-50/50 rounded-lg border border-orange-100">
              <p className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Semester Genap</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Ulangan Harian</label>
                  <input type="number" min="0" name="jpUlanganHarianGenap" value={formData.jpUlanganHarianGenap} onChange={handleInputChange} placeholder="JP" className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Cadangan</label>
                  <input type="number" min="0" name="jpCadanganGenap" value={formData.jpCadanganGenap} onChange={handleInputChange} placeholder="JP" className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Dynamic Materi Inputs (GANJIL) */}
        {formData.semester.includes('Ganjil') && (
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <PenTool size={12} className="text-indigo-600" /> Materi Pokok (Ganjil)
              </h3>
              <button 
                onClick={() => addMateri('Ganjil')} 
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-100"
              >
                <Plus size={12} /> Materi
              </button>
            </div>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {materiGanjil.map((materi, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={`ganjil-${idx}`} 
                  className="space-y-2 p-3 bg-slate-50/50 rounded-xl border border-slate-200"
                >
                  <div className="flex gap-1 group items-center">
                    <input 
                      value={materi.judul} 
                      onChange={(e) => handleMateriChange('Ganjil', idx, 'judul', e.target.value)}
                      placeholder={`Materi Ganjil ${idx + 1}`}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex flex-col items-center">
                      <label className="text-[8px] font-bold text-gray-400 uppercase">Tot JP</label>
                      <input 
                        type="number"
                        min="2"
                        step="2"
                        value={materi.jp} 
                        onChange={(e) => handleMateriChange('Ganjil', idx, 'jp', e.target.value)}
                        placeholder="JP"
                        className="w-12 p-2 bg-white border border-gray-200 rounded-lg text-xs font-black focus:ring-1 focus:ring-indigo-500 outline-none text-center"
                      />
                    </div>
                    <button onClick={() => removeMateri('Ganjil', idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Sub Materi Section */}
                  <div className="pl-4 space-y-2 border-l-2 border-indigo-100 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-indigo-400 uppercase">Sub Materi</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => distributeJp('Ganjil', idx)}
                          className="flex items-center gap-1 text-[8px] font-bold text-slate-500 hover:text-indigo-600 bg-white border px-1.5 py-0.5 rounded shadow-sm"
                          title="Bagi JP Otomatis"
                        >
                          <Wand2 size={10} /> Auto JP
                        </button>
                        <button 
                          onClick={() => addSubMateri('Ganjil', idx)}
                          className="flex items-center gap-1 text-[8px] font-bold text-indigo-600 hover:bg-white border border-indigo-100 px-1.5 py-0.5 rounded shadow-sm"
                        >
                          <Plus size={10} /> Sub
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {materi.subMateri.map((sub, sIdx) => (
                        <div key={`sub-ganjil-${idx}-${sIdx}`} className="flex gap-1 items-center animate-in fade-in slide-in-from-left-2">
                          <input 
                            value={sub.judul} 
                            onChange={(e) => handleSubMateriChange('Ganjil', idx, sIdx, 'judul', e.target.value)}
                            placeholder={`Sub ${sIdx + 1}`}
                            className="flex-1 p-1.5 bg-white border border-gray-100 rounded text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <input 
                            type="number"
                            min="2"
                            step="2"
                            value={sub.jp} 
                            onChange={(e) => handleSubMateriChange('Ganjil', idx, sIdx, 'jp', e.target.value)}
                            placeholder="jp"
                            className="w-10 p-1.5 bg-white border border-gray-100 rounded text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none text-center font-bold"
                          />
                          <button onClick={() => removeSubMateri('Ganjil', idx, sIdx)} className="text-gray-200 hover:text-red-400 p-1">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Dynamic Materi Inputs (GENAP) */}
        {formData.semester.includes('Genap') && (
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <PenTool size={12} className="text-orange-600" /> Materi Pokok (Genap)
              </h3>
              <button 
                onClick={() => addMateri('Genap')} 
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-all border border-orange-100"
              >
                <Plus size={12} /> Materi
              </button>
            </div>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {materiGenap.map((materi, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={`genap-${idx}`} 
                  className="space-y-2 p-3 bg-slate-50/50 rounded-xl border border-slate-200"
                >
                  <div className="flex gap-1 group items-center">
                    <input 
                      value={materi.judul} 
                      onChange={(e) => handleMateriChange('Genap', idx, 'judul', e.target.value)}
                      placeholder={`Materi Genap ${idx + 1}`}
                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                    <div className="flex flex-col items-center">
                      <label className="text-[8px] font-bold text-gray-400 uppercase">Tot JP</label>
                      <input 
                        type="number"
                        min="2"
                        step="2"
                        value={materi.jp} 
                        onChange={(e) => handleMateriChange('Genap', idx, 'jp', e.target.value)}
                        placeholder="JP"
                        className="w-12 p-2 bg-white border border-gray-200 rounded-lg text-xs font-black focus:ring-1 focus:ring-orange-500 outline-none text-center"
                      />
                    </div>
                    <button onClick={() => removeMateri('Genap', idx)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Sub Materi Section */}
                  <div className="pl-4 space-y-2 border-l-2 border-orange-100 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-orange-400 uppercase">Sub Materi</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => distributeJp('Genap', idx)}
                          className="flex items-center gap-1 text-[8px] font-bold text-slate-500 hover:text-orange-600 bg-white border px-1.5 py-0.5 rounded shadow-sm"
                          title="Bagi JP Otomatis"
                        >
                          <Wand2 size={10} /> Auto JP
                        </button>
                        <button 
                          onClick={() => addSubMateri('Genap', idx)}
                          className="flex items-center gap-1 text-[8px] font-bold text-orange-600 hover:bg-white border border-orange-100 px-1.5 py-0.5 rounded shadow-sm"
                        >
                          <Plus size={10} /> Sub
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {materi.subMateri.map((sub, sIdx) => (
                        <div key={`sub-genap-${idx}-${sIdx}`} className="flex gap-1 items-center animate-in fade-in slide-in-from-left-2">
                          <input 
                            value={sub.judul} 
                            onChange={(e) => handleSubMateriChange('Genap', idx, sIdx, 'judul', e.target.value)}
                            placeholder={`Sub ${sIdx + 1}`}
                            className="flex-1 p-1.5 bg-white border border-gray-100 rounded text-[10px] focus:ring-1 focus:ring-orange-500 outline-none"
                          />
                          <input 
                            type="number"
                            min="2"
                            step="2"
                            value={sub.jp} 
                            onChange={(e) => handleSubMateriChange('Genap', idx, sIdx, 'jp', e.target.value)}
                            placeholder="jp"
                            className="w-10 p-1.5 bg-white border border-gray-100 rounded text-[10px] focus:ring-1 focus:ring-orange-500 outline-none text-center font-bold"
                          />
                          <button onClick={() => removeSubMateri('Genap', idx, sIdx)} className="text-gray-200 hover:text-red-400 p-1">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

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

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
             <Calendar size={12} /> JP Satu Kali Pertemuan (Promis)
          </label>
          <input 
            type="number" 
            name="jpPerPertemuan" 
            value={formData.jpPerPertemuan} 
            onChange={handleInputChange} 
            min="1"
            className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            placeholder="Contoh: 2"
          />
        </div>

        <section className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
          <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <ClipboardList size={12} /> Ringkasan Alokasi JP
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between border-b border-indigo-100 pb-1">
              <span className="text-gray-500">Materi Pokok:</span>
              <span className="font-bold text-indigo-700">{totalJpMateri} JP</span>
            </div>
            <div className="flex justify-between border-b border-indigo-100 pb-1">
              <span className="text-gray-500">Extra (UH/Cad):</span>
              <span className="font-bold text-indigo-700">{totalJpExtra} JP</span>
            </div>
            <div className="flex justify-between border-b border-indigo-100 pb-1">
              <span className="text-gray-500">Total Akhir:</span>
              <span className="font-bold text-indigo-900">{totalJpKeseluruhan} JP</span>
            </div>
          </div>
        </section>

        {formData.semester.includes('Ganjil') && (
          <div className="space-y-2 border-l-2 border-indigo-200 pl-2 bg-indigo-50/20 py-2 rounded-r-xl">
            <h4 className="text-[9px] font-black text-indigo-500 uppercase px-1">Semester Ganjil</h4>
            
            <section className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Pekan Efektif (Ganjil)
              </h3>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-gray-500">Total Minggu:</span>
                  <span className="font-bold text-slate-700">{totalPekanGanjil} Minggu</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1 text-red-600">
                  <span className="opacity-70">Tidak Efektif:</span>
                  <span className="font-bold">-{totalNonGanjil} Minggu</span>
                </div>
                <div className="flex justify-between border-b border-indigo-100 pb-1 pt-1 bg-indigo-50/30 px-1 rounded">
                  <span className="text-indigo-600 font-black">Pekan Efektif:</span>
                  <span className="font-black text-indigo-700">{totalEfektifGanjil} Minggu</span>
                </div>
              </div>
            </section>

            <section className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} /> Parameter JP (Ganjil)
              </h3>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-gray-600">Hasil JP Efektif:</span>
                  <span className="font-bold text-slate-700">{hasilJpEfektifGanjil} JP</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-1 text-red-600">
                  <span className="opacity-70">JP Tidak Efektif:</span>
                  <span className="font-bold">-{hasilJpTidakEfektifGanjil} JP</span>
                </div>
                {(Number(formData.jpUlanganHarianGanjil) > 0 || Number(formData.jpCadanganGanjil) > 0) && (
                  <div className="flex justify-between border-b border-amber-100 pb-1 text-orange-600">
                    <span className="opacity-70">UH + Cadangan:</span>
                    <span className="font-bold">-{jpExtraGanjil} JP</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-amber-300 pb-1 pt-1 bg-amber-100/50 px-1 rounded">
                  <span className="text-amber-800 font-black uppercase tracking-tighter">Hasil Akhir JP (Materi):</span>
                  <span className="font-black text-amber-900">{hasilAkhirJpGanjil} JP</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {formData.semester.includes('Genap') && (
          <div className="space-y-2 border-l-2 border-orange-200 pl-2 bg-orange-50/20 py-2 rounded-r-xl">
            <h4 className="text-[9px] font-black text-orange-500 uppercase px-1">Semester Genap</h4>

            <section className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Pekan Efektif (Genap)
              </h3>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-gray-500">Total Minggu:</span>
                  <span className="font-bold text-slate-700">{totalPekanGenap} Minggu</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1 text-red-600">
                  <span className="opacity-70">Tidak Efektif:</span>
                  <span className="font-bold">-{totalNonGenap} Minggu</span>
                </div>
                <div className="flex justify-between border-b border-orange-100 pb-1 pt-1 bg-orange-50/30 px-1 rounded">
                  <span className="text-orange-600 font-black">Pekan Efektif:</span>
                  <span className="font-black text-orange-700">{totalEfektifGenap} Minggu</span>
                </div>
              </div>
            </section>

            <section className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} /> Parameter JP (Genap)
              </h3>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <div className="flex justify-between border-b border-amber-100 pb-1">
                  <span className="text-gray-600">Hasil JP Efektif:</span>
                  <span className="font-bold text-slate-700">{hasilJpEfektifGenap} JP</span>
                </div>
                <div className="flex justify-between border-b border-amber-100 pb-1 text-red-600">
                  <span className="opacity-70">JP Tidak Efektif:</span>
                  <span className="font-bold">-{hasilJpTidakEfektifGenap} JP</span>
                </div>
                {(Number(formData.jpUlanganHarianGenap) > 0 || Number(formData.jpCadanganGenap) > 0) && (
                  <div className="flex justify-between border-b border-amber-100 pb-1 text-orange-600">
                    <span className="opacity-70">UH + Cadangan:</span>
                    <span className="font-bold">-{jpExtraGenap} JP</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-amber-300 pb-1 pt-1 bg-amber-100/50 px-1 rounded">
                  <span className="text-amber-800 font-black uppercase tracking-tighter">Hasil Akhir JP (Materi):</span>
                  <span className="font-black text-amber-900">{hasilAkhirJpGenap} JP</span>
                </div>
              </div>
            </section>
          </div>
        )}

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
      <div className="flex-1 overflow-y-auto p-4 md:p-12 print:overflow-visible print:p-0 print:bg-white bg-slate-200/50">
        <div 
          className="mx-auto print:max-w-none print:w-full"
          style={{ width: paperStyles[formData.paperSize as keyof typeof paperStyles].width }}
        >
          
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
                              <p className="font-bold text-indigo-700 underline mb-1">Elemen: {m.judul || 'Materi Pokok'}</p>
                              <p className="text-sm">Pada akhir {formData.fase}, peserta didik mampu mendeskripsikan, menganalisis, serta mengevaluasi konsep-konsep yang berkaitan dengan <strong>{m.judul}</strong>. Peserta didik dapat mengintegrasikan pengetahuan tersebut untuk memecahkan masalah kontekstual dalam kehidupan masyarakat serta mampu mengomunikasikan ide secara terstruktur dan ilmiah.</p>
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
                            <span>UNIT 0{i+1}: {m.judul || '...'}</span>
                            <span className="text-[10px] opacity-70">Fase {formData.fase.split(' ')[1]}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div className="p-2 border rounded-md bg-green-50">
                                <p className="font-black text-green-700 uppercase mb-1">Kognitif</p>
                                <p>Mampu menganalisis struktur dan konsep dasar {m.judul}.</p>
                              </div>
                              <div className="p-2 border rounded-md bg-blue-50">
                                <p className="font-black text-blue-700 uppercase mb-1">Psikomotor</p>
                                <p>Terampil menyajikan data hasil eksperimen terkait {m.judul}.</p>
                              </div>
                              <div className="p-2 border rounded-md bg-amber-50">
                                <p className="font-black text-amber-700 uppercase mb-1">Afektif</p>
                                <p>Menunjukkan sikap gotong royong dan berpikir kritis.</p>
                              </div>
                            </div>
                            <p className="text-sm font-medium leading-relaxed pt-2">
                              <strong>Tujuan Akhir:</strong> Melalui serangkaian kegiatan mandiri dan kelompok, peserta didik dapat mengaplikasikan prinsip {m.judul} untuk menciptakan solusi nyata yang berdaya guna bagi lingkungan sekitar.
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
                                <strong>Materi: {m.judul}</strong><br/>
                                Menjelaskan hubungan antara konsep dasar {m.judul} dengan fenomena yang terjadi di masyarakat secara logis.
                              </td>
                              <td className="border border-slate-300 p-3 text-center font-bold italic">{m.jp || '4'} JP</td>
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
                        {flatSubMateriList.slice(0, 5).map((sm, i) => {
                          const jpPerSessi = Number(formData.jpPerPertemuan) || 2;
                          const totalJp = Number(sm.jp) || 0;
                          const jmlPertemuan = Math.ceil(totalJp / jpPerSessi);

                          return (
                            <div key={i} className="border-l-4 border-indigo-600 pl-6 space-y-4 break-inside-avoid">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h4 className="bg-indigo-600 text-white px-3 py-1 inline-block font-black uppercase text-[10px]">
                                    Modul {i+1}: {sm.materiJudul}
                                  </h4>
                                  <p className="text-[11px] font-bold text-slate-700">SUB MATERI: <span className="text-indigo-600 uppercase">{sm.judul || '...'}</span></p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Alokasi Waktu</p>
                                  <p className="text-xs font-bold">{sm.jp} JP ({jmlPertemuan} Pertemuan)</p>
                                </div>
                              </div>

                              {/* Checklist Pertemuan */}
                              <div className="flex gap-4 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 mb-4">
                                <span className="text-[9px] font-black text-indigo-400 uppercase self-center">Pertemuan Ke:</span>
                                <div className="flex gap-3 flex-wrap">
                                  {[...Array(jmlPertemuan || 1)].map((_, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-1.5">
                                      <div className="w-4 h-4 border-2 border-indigo-300 rounded flex items-center justify-center">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-sm opacity-20"></div>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-600">{pIdx + 1}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="font-bold underline text-xs">1. Pertanyaan Pemantik:</p>
                                <p className="italic text-slate-600">"Pernahkah Anda terpikir bagaimana konsep {sm.judul} mempengaruhi kenyamanan hidup kita setiap harinya? Apa yang terjadi jika {sm.judul} tidak ada?"</p>
                              </div>

                              <div className="space-y-3">
                                <p className="font-bold underline text-xs uppercase">2. Rincian Kegiatan Pembelajaran:</p>
                                <ul className="list-decimal ml-5 space-y-3 text-xs leading-relaxed">
                                  <li>
                                    <span className="font-bold">Kegiatan Awal (15 Menit):</span> Melakukan teknik K-W-L (Know, Want, Learn) dan memberikan stimulasi berupa video atau demonstrasi fisik terkait {sm.judul}.
                                  </li>
                                  <li>
                                    <span className="font-bold">Kegiatan Inti (50 Menit):</span> Peserta didik dibagi menjadi kelompok kecil untuk melakukan investigasi literasi and eksperimen terbimbing mengenai struktur {sm.judul}. Guru bertindak sebagai fasilitator yang memberikan pertanyaan pelacak.
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
                          );
                        })}
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
                        <div className="font-bold">{formData.kelas}</div>
                      </div>

                      <h3 className="text-center text-xl font-black mb-10 tracking-widest uppercase">Eksplorasi Materi: {materiList[0].judul}</h3>
                      
                      <div className="space-y-6 text-sm">
                        <p className="font-bold">A. Petunjuk Kerja:</p>
                        <ol className="list-decimal ml-5 space-y-2">
                          <li>Diskusikan bersama kelompok mengenai kaitan antara {materiList[0].judul} dengan lingkungan sekitar.</li>
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
                              <p className="font-bold mb-2">{i+1}. Analisislah peran materi <strong>{m.judul}</strong> dalam konteks {formData.kurikulum}. Mengapa pemahaman ini menjadi prasyarat penting dalam penguasaan {formData.mapel}?</p>
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
                          <h4 className="font-bold text-sm bg-slate-100 p-2 border rounded uppercase">Materi {i+1}: {m.judul}</h4>
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
                                <td className="border p-2 font-bold">Pemahaman Konsep {m.judul}</td>
                                <td className="border p-2 text-center italic opacity-60">Belum mampu menjelaskan</td>
                                <td className="border p-2 text-center font-medium bg-amber-50">Mampu menjelaskan secara parsial</td>
                                <td className="border p-2 text-center font-medium bg-green-50 text-green-700">Mampu menjelaskan dengan detail</td>
                                <td className="border p-2 text-center font-medium bg-indigo-50 text-indigo-700">Mampu menganalisis & mengaitkan</td>
                              </tr>
                              <tr>
                                <td className="border p-2 font-bold">Aplikasi Praktis {m.judul}</td>
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
                          <p>Semester: {formData.semester.join(' / ')}</p>
                          <p>Tahun Ajaran: {formData.tahunAjaran}</p>
                          {(formData.totalJpGanjil && formData.semester.includes('Ganjil')) && <p>Total JP Ganjil: {formData.totalJpGanjil} JP</p>}
                          {(formData.totalJpGenap && formData.semester.includes('Genap')) && <p>Total JP Genap: {formData.totalJpGenap} JP</p>}
                        </div>
                        <div className="p-3 border rounded-lg bg-slate-50 border-slate-200 text-right">
                          <p className="font-bold text-slate-900 mb-1 uppercase">Total Jam Pelajaran</p>
                          <p className="text-2xl font-black text-indigo-600">{totalJpKeseluruhan} JP</p>
                        </div>
                      </div>

                      <section>
                        <h4 className="font-bold border-b-2 mb-4 text-sm uppercase">I. Perhitungan Pekan (Distribusi Waktu)</h4>
                        
                        {formData.semester.includes('Ganjil') && (
                          <div className="mb-8">
                            <h5 className="text-[10px] font-bold text-indigo-700 mb-2 uppercase tracking-wider italic bg-indigo-50 px-2 py-1 inline-block rounded">Semester Ganjil (Gasal)</h5>
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
                                {pekanDataGanjil.map((row, i) => (
                                  <tr key={`ganjil-pekan-${i}`} className="text-center">
                                    <td className="border p-2 font-bold text-left px-4">{row.bulan}</td>
                                    <td className="border p-2">{row.total}</td>
                                    <td className="border p-2 text-red-500 font-medium">{row.nonEfektif}</td>
                                    <td className="border p-2 bg-green-50 font-bold">{row.total - row.nonEfektif}</td>
                                    <td className="border p-2 text-left italic">{row.keterangan}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-800 text-white font-bold text-center uppercase">
                                <tr>
                                  <td className="border p-2 text-left px-4">JUMLAH GANJIL</td>
                                  <td className="border p-2">{totalPekanGanjil}</td>
                                  <td className="border p-2">{totalNonGanjil}</td>
                                  <td className="border p-2">{totalEfektifGanjil}</td>
                                  <td className="border p-2">-</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {formData.semester.includes('Genap') && (
                          <div>
                            <h5 className="text-[10px] font-bold text-orange-700 mb-2 uppercase tracking-wider italic bg-orange-50 px-2 py-1 inline-block rounded">Semester Genap (Dua)</h5>
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
                                {pekanDataGenap.map((row, i) => (
                                  <tr key={`genap-pekan-${i}`} className="text-center">
                                    <td className="border p-2 font-bold text-left px-4">{row.bulan}</td>
                                    <td className="border p-2">{row.total}</td>
                                    <td className="border p-2 text-red-500 font-medium">{row.nonEfektif}</td>
                                    <td className="border p-2 bg-green-50 font-bold">{row.total - row.nonEfektif}</td>
                                    <td className="border p-2 text-left italic">{row.keterangan}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-slate-800 text-white font-bold text-center uppercase">
                                <tr>
                                  <td className="border p-2 text-left px-4">JUMLAH GENAP</td>
                                  <td className="border p-2">{totalPekanGenap}</td>
                                  <td className="border p-2">{totalNonGenap}</td>
                                  <td className="border p-2">{totalEfektifGenap}</td>
                                  <td className="border p-2">-</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}

                        {formData.semester.length > 1 && (
                          <div className="mt-4 p-2 bg-slate-100 border border-slate-300 flex justify-between items-center text-[10px] font-black uppercase text-slate-800">
                             <span>TOTAL PEKAN EFEKTIF SELURUH TAHUN:</span>
                             <span className="text-indigo-700 text-xs">{totalEfektifTahun} PEKAN</span>
                          </div>
                        )}
                      </section>

                      <section>
                        <h4 className="font-bold border-b-2 mb-4 text-sm uppercase">II. Distribusi Jam Pelajaran</h4>
                        <ul className="space-y-2 text-xs">
                          <li className="flex justify-between border-b pb-1">
                            <span>Materi Inti (Regular):</span>
                            <span className="font-bold">{totalJpMateri} JP</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                            <span>Cadangan / Ulangan Harian (Extra):</span>
                            <span className="font-bold">{totalJpExtra} JP</span>
                          </li>
                          <li className="flex justify-between pt-2 text-indigo-600 font-black text-sm">
                            <span>Total Distribusi Jam Pelajaran:</span>
                            <span>{totalJpKeseluruhan} JP</span>
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
                        <p>Fase: {formData.fase} / {formData.kelas}</p>
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
                          {(formData.semester.includes('Ganjil') || formData.semester.length === 0) && (
                            <>
                              <tr className="bg-slate-100 font-bold">
                                <td className="border p-2 text-center">I</td>
                                <td className="border p-2">SEMESTER GANJIL</td>
                                <td className="border p-2 text-center">{totalGanjil} JP</td>
                              </tr>
                              {materiGanjil.map((m, i) => (
                                <React.Fragment key={`prota-ganjil-${i}`}>
                                  <tr className="bg-slate-50/50 font-bold">
                                    <td className="border p-2 text-center">{i + 1}</td>
                                    <td className="border p-2">{m.judul || '...'}</td>
                                    <td className="border p-2 text-center">{m.jp || '...'} JP</td>
                                  </tr>
                                  {m.subMateri.map((sub, sIdx) => (
                                    <tr key={`prota-ganjil-sub-${i}-${sIdx}`}>
                                      <td className="border p-2 text-center text-[10px] text-gray-400 opacity-50">•</td>
                                      <td className="border p-2 pl-6 italic text-gray-600">{sub.judul || '...'}</td>
                                      <td className="border p-2 text-center text-gray-500 font-medium">{sub.jp || '...'} JP</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                              {formData.jpUlanganHarianGanjil && (
                                <tr className="bg-slate-50 italic">
                                  <td className="border p-2 text-center">-</td>
                                  <td className="border p-2 text-indigo-700 font-medium">Ulangan Harian (Ganjil)</td>
                                  <td className="border p-2 text-center">{formData.jpUlanganHarianGanjil} JP</td>
                                </tr>
                              )}
                              {formData.jpCadanganGanjil && (
                                <tr className="bg-slate-50 italic">
                                  <td className="border p-2 text-center">-</td>
                                  <td className="border p-2 text-indigo-700 font-medium">Materi Cadangan (Ganjil)</td>
                                  <td className="border p-2 text-center">{formData.jpCadanganGanjil} JP</td>
                                </tr>
                              )}
                            </>
                          )}
                          
                          {(formData.semester.includes('Genap') || formData.semester.length === 0) && (
                            <>
                              <tr className="bg-slate-100 font-bold">
                                <td className="border p-2 text-center">II</td>
                                <td className="border p-2">SEMESTER GENAP</td>
                                <td className="border p-2 text-center">{totalGenap} JP</td>
                              </tr>
                              {materiGenap.map((m, i) => (
                                <React.Fragment key={`prota-genap-${i}`}>
                                  <tr className="bg-slate-50/50 font-bold">
                                    <td className="border p-2 text-center">{(formData.semester.includes('Ganjil') ? materiGanjil.length : 0) + i + 1}</td>
                                    <td className="border p-2">{m.judul || '...'}</td>
                                    <td className="border p-2 text-center">{m.jp || '...'} JP</td>
                                  </tr>
                                  {m.subMateri.map((sub, sIdx) => (
                                    <tr key={`prota-genap-sub-${i}-${sIdx}`}>
                                      <td className="border p-2 text-center text-[10px] text-gray-400 opacity-50">•</td>
                                      <td className="border p-2 pl-6 italic text-gray-600">{sub.judul || '...'}</td>
                                      <td className="border p-2 text-center text-gray-500 font-medium">{sub.jp || '...'} JP</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              ))}
                              {formData.jpUlanganHarianGenap && (
                                <tr className="bg-slate-50 italic">
                                  <td className="border p-2 text-center">-</td>
                                  <td className="border p-2 text-orange-700 font-medium">Ulangan Harian (Genap)</td>
                                  <td className="border p-2 text-center">{formData.jpUlanganHarianGenap} JP</td>
                                </tr>
                              )}
                              {formData.jpCadanganGenap && (
                                <tr className="bg-slate-50 italic">
                                  <td className="border p-2 text-center">-</td>
                                  <td className="border p-2 text-orange-700 font-medium">Materi Cadangan (Genap)</td>
                                  <td className="border p-2 text-center">{formData.jpCadanganGenap} JP</td>
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                        <tfoot className="bg-slate-200 font-bold text-center">
                          <tr>
                            <td colSpan={2} className="border p-2 text-right px-4">TOTAL ALOKASI WAKTU TAHUNAN</td>
                            <td className="border p-2">{totalJpKeseluruhan} JP</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('PROSEM') && (
                  <PageContainer key="PROSEM" id="PROSEM" title="PROGRAM SEMESTER (PROSEM/PROMIS)">
                    <div className="space-y-12">
                      <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-1">
                        <p>Semester: {formData.semester.join(' / ')}</p>
                        <p>Mata Pelajaran: {formData.mapel}</p>
                        <p>Tahun Pelajaran: {formData.tahunAjaran}</p>
                        {(formData.totalJpGanjil && formData.semester.includes('Ganjil')) && <p>Total JP Semester Ganjil: {formData.totalJpGanjil} JP</p>}
                        {(formData.totalJpGenap && formData.semester.includes('Genap')) && <p>Total JP Semester Genap: {formData.totalJpGenap} JP</p>}
                      </div>

                      {/* SEMESTER GANJIL TABLE */}
                      {formData.semester.includes('Ganjil') && (
                        <div className="space-y-4">
                          <h4 className="font-bold text-sm bg-indigo-50 p-2 border-l-4 border-indigo-500 uppercase tracking-widest">Semester Ganjil (Juli - Desember)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border-2 border-slate-800 text-[9px]">
                              <thead className="bg-slate-800 text-white uppercase text-center">
                                <tr>
                                  <th rowSpan={2} className="border p-1 w-8">No</th>
                                  <th rowSpan={2} className="border p-1">Materi Pokok / Tujuan Pembelajaran</th>
                                  <th rowSpan={2} className="border p-1 w-10">JML JP</th>
                                  <th colSpan={5} className="border p-1">Juli</th>
                                  <th colSpan={5} className="border p-1">Agustus</th>
                                  <th colSpan={5} className="border p-1">September</th>
                                  <th colSpan={5} className="border p-1">Oktober</th>
                                  <th colSpan={5} className="border p-1">November</th>
                                  <th colSpan={5} className="border p-1">Desember</th>
                                </tr>
                                <tr>
                                  {[...Array(30)].map((_, i) => (
                                    <th key={i} className="border p-1 w-4 text-[7px]">{ (i % 5) + 1 }</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {materiGanjil.map((m, i) => (
                                  <React.Fragment key={`prosem-ganjil-${i}`}>
                                    <tr className="bg-slate-50/50 font-bold">
                                      <td className="border p-1 text-center">{i + 1}</td>
                                      <td className="border p-1">{m.judul || '...'}</td>
                                      <td className="border p-1 text-center">{m.jp || '...'} JP</td>
                                      {[...Array(30)].map((_, j) => (
                                        <td key={j} className="border p-1 text-center h-6"></td>
                                      ))}
                                    </tr>
                                    {m.subMateri.map((sub, sIdx) => (
                                      <tr key={`prosem-ganjil-sub-${i}-${sIdx}`}>
                                        <td className="border p-1 text-center text-[10px] text-gray-400 opacity-50">•</td>
                                        <td className="border p-1 pl-4 italic text-gray-600 font-medium">{sub.judul || '...'}</td>
                                        <td className="border p-1 text-center text-gray-500 font-bold">{sub.jp || '...'} JP</td>
                                        {[...Array(30)].map((_, j) => (
                                          <td key={j} className="border p-1 text-center h-6"></td>
                                        ))}
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                                {formData.jpUlanganHarianGanjil && (
                                  <tr className="bg-slate-50 italic">
                                    <td className="border p-1 text-center font-bold">-</td>
                                    <td className="border p-1 font-medium text-indigo-700">Ulangan Harian (Ganjil)</td>
                                    <td className="border p-1 text-center font-bold">{formData.jpUlanganHarianGanjil} JP</td>
                                    {[...Array(30)].map((_, j) => (
                                      <td key={j} className="border p-1 text-center font-bold"></td>
                                    ))}
                                  </tr>
                                )}
                                {formData.jpCadanganGanjil && (
                                  <tr className="bg-slate-50 italic">
                                    <td className="border p-1 text-center font-bold">-</td>
                                    <td className="border p-1 font-medium text-indigo-700">Materi Cadangan (Ganjil)</td>
                                    <td className="border p-1 text-center font-bold">{formData.jpCadanganGanjil} JP</td>
                                    {[...Array(30)].map((_, j) => (
                                      <td key={j} className="border p-1 text-center font-bold"></td>
                                    ))}
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* SEMESTER GENAP TABLE */}
                      {formData.semester.includes('Genap') && (
                        <div className="space-y-4">
                          <h4 className="font-bold text-sm bg-orange-50 p-2 border-l-4 border-orange-500 uppercase tracking-widest">Semester Genap (Januari - Juni)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border-2 border-slate-800 text-[9px]">
                              <thead className="bg-slate-800 text-white uppercase text-center">
                                <tr>
                                  <th rowSpan={2} className="border p-1 w-8">No</th>
                                  <th rowSpan={2} className="border p-1">Materi Pokok / Tujuan Pembelajaran</th>
                                  <th rowSpan={2} className="border p-1 w-10">JML JP</th>
                                  <th colSpan={5} className="border p-1">Januari</th>
                                  <th colSpan={5} className="border p-1">Februari</th>
                                  <th colSpan={5} className="border p-1">Maret</th>
                                  <th colSpan={5} className="border p-1">April</th>
                                  <th colSpan={5} className="border p-1">Mei</th>
                                  <th colSpan={5} className="border p-1">Juni</th>
                                </tr>
                                <tr>
                                  {[...Array(30)].map((_, i) => (
                                    <th key={i} className="border p-1 w-4 text-[7px]">{ (i % 5) + 1 }</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {materiGenap.map((m, i) => (
                                  <React.Fragment key={`prosem-genap-${i}`}>
                                    <tr className="bg-slate-50/50 font-bold">
                                      <td className="border p-1 text-center font-bold">{(formData.semester.includes('Ganjil') ? materiGanjil.length : 0) + i + 1}</td>
                                      <td className="border p-1">{m.judul || '...'}</td>
                                      <td className="border p-1 text-center font-bold">{m.jp || '...'} JP</td>
                                      {[...Array(30)].map((_, j) => (
                                        <td key={j} className="border p-1 text-center h-6"></td>
                                      ))}
                                    </tr>
                                    {m.subMateri.map((sub, sIdx) => (
                                      <tr key={`prosem-genap-sub-${i}-${sIdx}`}>
                                        <td className="border p-1 text-center text-[10px] text-gray-400 opacity-50">•</td>
                                        <td className="border p-1 pl-4 italic text-gray-600 font-medium">{sub.judul || '...'}</td>
                                        <td className="border p-1 text-center text-gray-500 font-bold">{sub.jp || '...'} JP</td>
                                        {[...Array(30)].map((_, j) => (
                                          <td key={j} className="border p-1 text-center h-6"></td>
                                        ))}
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ))}
                                {formData.jpUlanganHarianGenap && (
                                  <tr className="bg-slate-50 italic border-t-2 border-orange-100">
                                    <td className="border p-1 text-center font-bold">-</td>
                                    <td className="border p-1 font-medium text-orange-700">Ulangan Harian (Genap)</td>
                                    <td className="border p-1 text-center font-bold">{formData.jpUlanganHarianGenap} JP</td>
                                    {[...Array(30)].map((_, j) => (
                                      <td key={j} className="border p-1 text-center font-bold"></td>
                                    ))}
                                  </tr>
                                )}
                                {formData.jpCadanganGenap && (
                                  <tr className="bg-slate-50 italic">
                                    <td className="border p-1 text-center font-bold">-</td>
                                    <td className="border p-1 font-medium text-orange-700">Materi Cadangan (Genap)</td>
                                    <td className="border p-1 text-center font-bold">{formData.jpCadanganGenap} JP</td>
                                    {[...Array(30)].map((_, j) => (
                                      <td key={j} className="border p-1 text-center font-bold"></td>
                                    ))}
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-4 text-[8px] font-bold">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-400"></div> KBM Terjadwal</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400"></div> Asesmen Sumatif</div>
                      </div>
                    </div>
                  </PageContainer>
                )}

                {selectedDocs.includes('ANALISIS') && (
                  <>
                    {[...Array(countAnalisisGanjil)].map((_, idx) => (
                      <PageContainer key={`ANALISIS-GANJIL-${idx}`} id={`ANALISIS-GANJIL-${idx}`} title={`ANALISIS HASIL ULANGAN ${idx + 1} (GANJIL)`}>
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-1">
                            <p>Mata Pelajaran: {formData.mapel}</p>
                            <p>Kelas / Semester: {formData.kelas} / Ganjil</p>
                            <p>Tahun Pelajaran: {formData.tahunAjaran}</p>
                            <p>Materi: {materiGanjil[idx]?.judul || '...'}</p>
                          </div>

                          <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                            <thead className="bg-slate-100 text-center font-bold">
                              <tr>
                                <th rowSpan={2} className="border p-2 w-8">No</th>
                                <th rowSpan={2} className="border p-2">Nama Peserta Didik</th>
                                <th colSpan={10} className="border p-1">Skor Per Nomor Soal</th>
                                <th rowSpan={2} className="border p-2 w-12">Total Skor</th>
                                <th rowSpan={2} className="border p-2 w-16">Nilai</th>
                                <th rowSpan={2} className="border p-2 w-20">Ketuntasan</th>
                              </tr>
                              <tr>
                                {[...Array(10)].map((_, i) => (
                                  <th key={i} className="border p-1 w-6">{i + 1}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[...Array(20)].map((_, i) => (
                                <tr key={i} className="h-8">
                                  <td className="border p-1 text-center">{i + 1}</td>
                                  <td className="border p-1"></td>
                                  {[...Array(10)].map((_, j) => (
                                    <td key={j} className="border p-1 text-center"></td>
                                  ))}
                                  <td className="border p-1 text-center"></td>
                                  <td className="border p-1 text-center"></td>
                                  <td className="border p-1 text-center font-bold text-gray-300 italic text-[8px]">TUNTAS / TIDAK</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="grid grid-cols-2 gap-8 text-[10px]">
                            <div className="p-3 border rounded">
                              <p className="font-bold border-b mb-2">Statistik Hasil:</p>
                              <div className="space-y-1">
                                <div className="flex justify-between"><span>Jumlah Peserta:</span> <span>........ Orang</span></div>
                                <div className="flex justify-between"><span>Rata-rata Nilai:</span> <span>........</span></div>
                                <div className="flex justify-between"><span>Nilai Tertinggi:</span> <span>........</span></div>
                                <div className="flex justify-between"><span>Nilai Terendah:</span> <span>........</span></div>
                              </div>
                            </div>
                            <div className="p-3 border rounded">
                              <p className="font-bold border-b mb-2">Rencana Tindak Lanjut:</p>
                              <div className="space-y-1 italic text-gray-500">
                                <p>1. Remedial bagi yang tidak tuntas</p>
                                <p>2. Pengayaan bagi yang melampaui KKTP</p>
                                <p>3. Evaluasi butir soal sulit</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </PageContainer>
                    ))}

                    {[...Array(countAnalisisGenap)].map((_, idx) => (
                      <PageContainer key={`ANALISIS-GENAP-${idx}`} id={`ANALISIS-GENAP-${idx}`} title={`ANALISIS HASIL ULANGAN ${idx + 1} (GENAP)`}>
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-50 border rounded-lg text-xs space-y-1">
                            <p>Mata Pelajaran: {formData.mapel}</p>
                            <p>Kelas / Semester: {formData.kelas} / Genap</p>
                            <p>Tahun Pelajaran: {formData.tahunAjaran}</p>
                            <p>Materi: {materiGenap[idx]?.judul || '...'}</p>
                          </div>

                          <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                            <thead className="bg-slate-100 text-center font-bold">
                              <tr>
                                <th rowSpan={2} className="border p-2 w-8">No</th>
                                <th rowSpan={2} className="border p-2">Nama Peserta Didik</th>
                                <th colSpan={10} className="border p-1">Skor Per Nomor Soal</th>
                                <th rowSpan={2} className="border p-2 w-12">Total Skor</th>
                                <th rowSpan={2} className="border p-2 w-16">Nilai</th>
                                <th rowSpan={2} className="border p-2 w-20">Ketuntasan</th>
                              </tr>
                              <tr>
                                {[...Array(10)].map((_, i) => (
                                  <th key={i} className="border p-1 w-6">{i + 1}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[...Array(20)].map((_, i) => (
                                <tr key={i} className="h-8">
                                  <td className="border p-1 text-center">{i + 1}</td>
                                  <td className="border p-1"></td>
                                  {[...Array(10)].map((_, j) => (
                                    <td key={j} className="border p-1 text-center"></td>
                                  ))}
                                  <td className="border p-1 text-center"></td>
                                  <td className="border p-1 text-center"></td>
                                  <td className="border p-1 text-center font-bold text-gray-300 italic text-[8px]">TUNTAS / TIDAK</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="grid grid-cols-2 gap-8 text-[10px]">
                            <div className="p-3 border rounded">
                              <p className="font-bold border-b mb-2">Statistik Hasil:</p>
                              <div className="space-y-1">
                                <div className="flex justify-between"><span>Jumlah Peserta:</span> <span>........ Orang</span></div>
                                <div className="flex justify-between"><span>Rata-rata Nilai:</span> <span>........</span></div>
                                <div className="flex justify-between"><span>Nilai Tertinggi:</span> <span>........</span></div>
                                <div className="flex justify-between"><span>Nilai Terendah:</span> <span>........</span></div>
                              </div>
                            </div>
                            <div className="p-3 border rounded">
                              <p className="font-bold border-b mb-2">Rencana Tindak Lanjut:</p>
                              <div className="space-y-1 italic text-gray-500">
                                <p>1. Remedial bagi yang tidak tuntas</p>
                                <p>2. Pengayaan bagi yang melampaui KKTP</p>
                                <p>3. Evaluasi butir soal sulit</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </PageContainer>
                    ))}
                  </>
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
          @page { 
            size: ${formData.paperSize === 'F4' ? '215mm 330mm' : formData.paperSize}; 
            margin-top: 12.5mm;
            margin-bottom: 12.5mm;
            margin-left: 30mm;
            margin-right: 15mm; 
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; }
          .min-h-screen { min-height: 0 !important; }
          .break-after-page { page-break-after: always; border: none !important; box-shadow: none !important; width: 100% !important; max-width: none !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; }
          .print\\:hidden, #sidebar, header, nav { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:overflow-visible { overflow: visible !important; }
          .printable-content table { break-inside: auto; width: 100% !important; border-collapse: collapse !important; }
          .printable-content tr { break-inside: avoid; break-after: auto; }
          .printable-content thead { display: table-header-group; }
          .printable-content tfoot { display: table-footer-group; }
          .shadow-2xl, .shadow-xl, .shadow-md, .shadow-lg { box-shadow: none !important; }
          .border { border-color: #000 !important; }
        }
      `}</style>
      {/* Modal Pengaturan Pekan */}
      <AnimatePresence>
        {showPekanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <Calendar size={24} />
                  <h2 className="text-xl font-bold uppercase tracking-tight">Pengaturan Pekan Efektif</h2>
                </div>
                <button 
                  onClick={() => setShowPekanModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Kaldik Upload & Scan Section */}
                  <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Upload Kalender Pendidikan (Kaldik)</label>
                        <div className="flex gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all group">
                            <Upload size={18} className="text-gray-400 group-hover:text-indigo-600" />
                            <span className="text-xs font-bold text-gray-500">{kaldikFile ? kaldikFile.name : 'Pilih File Kaldik'}</span>
                            <input type="file" className="hidden" accept="image/*,application/pdf,.csv,.xml,.xlsx,.xls" onChange={handleKaldikUpload} />
                          </label>
                          {kaldikFile && (
                            <button 
                              onClick={handleKaldikScan}
                              disabled={isScanningKaldik}
                              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg transition-all ${isScanningKaldik ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            >
                              {isScanningKaldik ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                              {isScanningKaldik ? 'Memindai...' : 'Pindai'}
                            </button>
                          )}
                        </div>
                      </div>
                      {kaldikPreview && (
                        <div className="w-32 h-20 bg-white border rounded-lg overflow-hidden flex-shrink-0">
                          <img src={kaldikPreview} alt="Kaldik Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>

                 <div className="grid md:grid-cols-2 gap-8">
                   {/* Semester Ganjil */}
                   <div className="space-y-4">
                     <h3 className="font-black text-indigo-600 uppercase tracking-widest text-xs flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Semester Ganjil
                     </h3>
                     <div className="space-y-2">
                       {pekanDataGanjil.map((row, i) => (
                         <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                           <div className="col-span-3 font-bold text-[10px] uppercase text-slate-500">{row.bulan}</div>
                           <div className="col-span-2">
                             <label className="text-[8px] block uppercase text-gray-400 font-bold">Total</label>
                             <input 
                               type="number" 
                               value={row.total} 
                               onChange={(e) => {
                                 const newData = [...pekanDataGanjil];
                                 newData[i].total = Number(e.target.value);
                                 setPekanDataGanjil(newData);
                               }}
                               className="w-full text-xs font-bold p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                           </div>
                           <div className="col-span-2">
                             <label className="text-[8px] block uppercase text-gray-400 font-bold">Non</label>
                             <input 
                               type="number" 
                               value={row.nonEfektif} 
                               onChange={(e) => {
                                 const newData = [...pekanDataGanjil];
                                 newData[i].nonEfektif = Number(e.target.value);
                                 setPekanDataGanjil(newData);
                               }}
                               className="w-full text-xs font-bold p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                           </div>
                           <div className="col-span-5">
                             <label className="text-[8px] block uppercase text-gray-400 font-bold">Keterangan</label>
                             <input 
                               type="text" 
                               value={row.keterangan} 
                               onChange={(e) => {
                                 const newData = [...pekanDataGanjil];
                                 newData[i].keterangan = e.target.value;
                                 setPekanDataGanjil(newData);
                               }}
                               className="w-full text-xs font-medium p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Semester Genap */}
                   <div className="space-y-4">
                     <h3 className="font-black text-orange-600 uppercase tracking-widest text-xs flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-orange-600"></div> Semester Genap
                     </h3>
                     <div className="space-y-2">
                       {pekanDataGenap.map((row, i) => (
                         <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded-lg border border-slate-200">
                           <div className="col-span-3 font-bold text-[10px] uppercase text-slate-500">{row.bulan}</div>
                           <div className="col-span-2">
                             <label className="text-[8px] block uppercase text-gray-400 font-bold">Total</label>
                             <input 
                               type="number" 
                               value={row.total} 
                               onChange={(e) => {
                                 const newData = [...pekanDataGenap];
                                 newData[i].total = Number(e.target.value);
                                 setPekanDataGenap(newData);
                               }}
                               className="w-full text-xs font-bold p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                           </div>
                           <div className="col-span-2">
                             <label className="text-[8px] block uppercase text-gray-400 font-bold">Non</label>
                             <input 
                               type="number" 
                               value={row.nonEfektif} 
                               onChange={(e) => {
                                 const newData = [...pekanDataGenap];
                                 newData[i].nonEfektif = Number(e.target.value);
                                 setPekanDataGenap(newData);
                               }}
                               className="w-full text-xs font-bold p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                           </div>
                           <div className="col-span-5">
                             <label className="text-[8px] block uppercase text-gray-400 font-bold">Keterangan</label>
                             <input 
                               type="text" 
                               value={row.keterangan} 
                               onChange={(e) => {
                                 const newData = [...pekanDataGenap];
                                 newData[i].keterangan = e.target.value;
                                 setPekanDataGenap(newData);
                               }}
                               className="w-full text-xs font-medium p-1 border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                             />
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
              </div>
              
              <div className="p-6 bg-slate-50 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={() => setShowPekanModal(false)}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
