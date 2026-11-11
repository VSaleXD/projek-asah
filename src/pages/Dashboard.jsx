import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, pesanError } from '../api/client.js'
import { Galat, Kosong, Memuat } from '../components/Status.jsx'

const angka = (nilai) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(nilai))
const hariIni = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const muat = useCallback(() => {
    setError('')
    Promise.all([api.get('/bahan'), api.get('/belanja'), api.get('/penjualan')])
      .then(([bahan, belanja, penjualan]) => setData({
        bahan: bahan.data.data,
        belanja: belanja.data.data,
        penjualan: penjualan.data.data,
      }))
      .catch((e) => setError(pesanError(e)))
  }, [])
  useEffect(() => { muat() }, [muat])

  const ringkasan = useMemo(() => {
    if (!data) return null
    const tanggal = hariIni()
    const penjualanHariIni = data.penjualan.filter((p) => String(p.tanggal).slice(0, 10) === tanggal)
    return {
      menipis: data.bahan.filter((b) => b.aktif && b.status === 'menipis'),
      belumDibeli: data.belanja.filter((b) => !b.sudah_dibeli),
      transaksi: penjualanHariIni.length,
      porsi: penjualanHariIni.reduce((total, item) => total + Number(item.total_porsi || 0), 0),
    }
  }, [data])

  if (error) return <Galat pesan={error} onUlang={muat} />
  if (!data || !ringkasan) return <Memuat />
  return <section>
    <div className="page-title"><div><h1>Dashboard</h1></div><Link className="button" to="/penjualan">Catat penjualan</Link></div>
    <div className="dashboard-grid">
      <Link className="summary-card" to="/penjualan"><span>Penjualan hari ini</span><strong>{ringkasan.porsi} porsi</strong><small>{ringkasan.transaksi} transaksi</small></Link>
      <Link className={`summary-card ${ringkasan.menipis.length ? 'warning' : ''}`} to="/bahan"><span>Stok menipis</span><strong>{ringkasan.menipis.length} bahan</strong><small>{ringkasan.menipis.length ? 'Perlu diperiksa' : 'Semua aman'}</small></Link>
      <Link className={`summary-card ${ringkasan.belumDibeli.length ? 'warning' : ''}`} to="/belanja"><span>Belanja belum selesai</span><strong>{ringkasan.belumDibeli.length} item</strong><small>{ringkasan.belumDibeli.length ? 'Buka daftar belanja' : 'Tidak ada yang tertunda'}</small></Link>
      <Link className="summary-card" to="/opname"><span>Cek stok</span><strong>Stok malam</strong><small>Isi jumlah fisik bahan</small></Link>
    </div>
    <div className="dashboard-columns">
      <div className="card"><h2>Stok bahan yang perlu diperhatikan</h2>{!ringkasan.menipis.length ? <Kosong>Tidak ada bahan di bawah minimum.</Kosong> : <table><thead><tr><th>Bahan</th><th>Stok</th><th>Minimum</th></tr></thead><tbody>{ringkasan.menipis.slice(0, 8).map((b) => <tr key={b.id}><td>{b.nama}</td><td>{angka(b.stok)} {b.satuan}</td><td>{angka(b.stok_minimum)}</td></tr>)}</tbody></table>}</div>
      <div className="card"><h2>Daftar belanja</h2>{!ringkasan.belumDibeli.length ? <Kosong>Belum ada belanja yang tertunda.</Kosong> : <ul className="dashboard-list">{ringkasan.belumDibeli.slice(0, 8).map((b) => <li key={b.id}><span>{b.nama}</span><strong>{b.jumlah_beli} {b.satuan}</strong></li>)}</ul>}<Link className="text-link" to="/belanja">Lihat semua belanja</Link></div>
    </div>
    <div className="quick-links"><h2>Menu utama</h2><Link to="/bahan">Kelola bahan</Link><Link to="/menu">Kelola menu & resep</Link><Link to="/opname">Simpan cek stok malam</Link><Link to="/riwayat">Lihat riwayat stok</Link></div>
  </section>
}
