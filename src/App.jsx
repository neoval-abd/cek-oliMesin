import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // <--- Import ini penting!
import './App.css';

const STANDAR_OLI = {
  motor: { km: 2000, bulan: 2, label: 'Motor' },
  mobil: { km: 5000, bulan: 6, label: 'Mobil' }
};

function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('dataOli_v2'); 
    return saved ? JSON.parse(saved) : {
      jenisKendaraan: 'motor',
      kmTerakhir: '',          
      tanggalTerakhir: ''      
    };
  });

  const [kmSekarang, setKmSekarang] = useState(() => {
    return localStorage.getItem('kmSekarang_v2') || '';
  });

  useEffect(() => {
    localStorage.setItem('dataOli_v2', JSON.stringify(data));
    localStorage.setItem('kmSekarang_v2', kmSekarang);
  }, [data, kmSekarang]);

  const hitungStatus = () => {
    if (!data.kmTerakhir || !data.tanggalTerakhir || !kmSekarang) {
      return { status: 'netral', pesan: 'Menunggu Data...', sisaKM: '-', sisaHari: '-' };
    }

    const standar = STANDAR_OLI[data.jenisKendaraan];
    const batasKM = parseInt(data.kmTerakhir) + standar.km;
    const sisaKM = batasKM - parseInt(kmSekarang);

    const tglGanti = new Date(data.tanggalTerakhir);
    tglGanti.setMonth(tglGanti.getMonth() + standar.bulan);
    
    const hariIni = new Date();
    hariIni.setHours(0,0,0,0);
    tglGanti.setHours(0,0,0,0);

    const sisaWaktuMs = tglGanti - hariIni;
    const sisaHari = Math.ceil(sisaWaktuMs / (1000 * 60 * 60 * 24));

    let status = 'aman';
    let pesan = 'Oli Aman';

    if (sisaKM <= 0 || sisaHari <= 0) {
      status = 'bahaya';
      pesan = 'GANTI SEKARANG!';
    } else if (sisaKM <= 500 || sisaHari <= 14) {
      status = 'waspada';
      pesan = 'Persiapkan Ganti';
    }

    return { 
      sisaKM, sisaHari, status, pesan, 
      tglEstimasi: tglGanti.toLocaleDateString('id-ID'),
      batasKM
    };
  };

  const info = hitungStatus();

  // --- LOGIC BARU DENGAN SWEETALERT ---
  const handleGantiOliBaru = () => {
    // Validasi jika input kosong
    if (!kmSekarang) { 
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Isi dulu KM Speedometer saat ini!',
        confirmButtonColor: '#3085d6',
      });
      return; 
    }

    // Konfirmasi Ganti Oli (Pop-up Bagus)
    Swal.fire({
      title: 'Yakin sudah ganti oli?',
      text: "Data lama akan diperbarui ke tanggal hari ini.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2c3e50', // Sesuai warna tema
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Update Data!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        // Proses Simpan
        const today = new Date().toISOString().split('T')[0];
        setData({ ...data, kmTerakhir: kmSekarang, tanggalTerakhir: today });
        
        // Notifikasi Sukses
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data ganti oli telah diperbarui.',
          icon: 'success',
          confirmButtonColor: '#2c3e50',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🛢️ Cek Oli {data.jenisKendaraan === 'motor' ? 'Motor' : 'Mobil'}</h1>
      </header>

      <div className="dashboard-grid">
        {/* PANEL KIRI */}
        <div className="left-panel">
          <div className={`card status-card status-${info.status}`}>
            <div className="status-header">
              <span className="status-icon">
                {info.status === 'aman' ? '✅' : info.status === 'waspada' ? '⚠️' : info.status === 'bahaya' ? '🚨' : 'ℹ️'}
              </span>
              <h2>{info.pesan}</h2>
            </div>
            
            <div className="stats-container">
              <div className="stat-box">
                <span className="stat-label">Sisa Jarak</span>
                <strong className="stat-value">{info.sisaKM !== '-' ? `${info.sisaKM}` : '-'} <small>KM</small></strong>
              </div>
              <div className="stat-box">
                <span className="stat-label">Sisa Waktu</span>
                <strong className="stat-value">{info.sisaHari !== '-' ? `${info.sisaHari}` : '-'} <small>Hari</small></strong>
              </div>
            </div>
            
            {info.tglEstimasi && (
              <div className="status-footer">
                <p>Estimasi habis pada <b>{info.tglEstimasi}</b> atau di KM <b>{info.batasKM}</b></p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL KANAN */}
        <div className="right-panel">
          <div className="card input-card">
            <label>KM Speedometer Saat Ini</label>
            <div className="input-wrapper">
              <input 
                type="number" 
                value={kmSekarang} 
                onChange={(e) => setKmSekarang(e.target.value)}
                placeholder="0"
                className="main-input"
              />
              <span className="input-unit">KM</span>
            </div>
          </div>

          <div className="card settings-card">
            <h3>⚙️ Pengaturan & Riwayat</h3>
            
            <div className="form-group">
              <label>Jenis Kendaraan</label>
              <select 
                value={data.jenisKendaraan} 
                onChange={(e) => setData({...data, jenisKendaraan: e.target.value})}
                className="custom-select"
              >
                <option value="motor">Motor (2.000 KM / 2 Bulan)</option>
                <option value="mobil">Mobil (5.000 KM / 6 Bulan)</option>
              </select>
            </div>

            <div className="row-group">
              <div className="form-group">
                <label>KM Ganti Terakhir</label>
                <input 
                  type="number" value={data.kmTerakhir} 
                  onChange={e => setData({...data, kmTerakhir: e.target.value})} 
                  className="secondary-input"
                />
              </div>
              <div className="form-group">
                <label>Tgl Ganti Terakhir</label>
                <input 
                  type="date" value={data.tanggalTerakhir} 
                  onChange={e => setData({...data, tanggalTerakhir: e.target.value})} 
                  className="secondary-input"
                />
              </div>
            </div>
            
            <button className="btn-action" onClick={handleGantiOliBaru}>
              🛠️ Saya Baru Saja Ganti Oli
            </button>
          </div>
        </div>
      </div>
      <footer className="app-footer">
        <p>Created with 💌 by <a href="https://instagram.com/novalabd_" target="_blank" rel="noopener noreferrer">@novalabd_</a></p>
      </footer>
    </div>
  );
}

export default App;