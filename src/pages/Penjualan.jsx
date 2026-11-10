import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Galat, Kosong, Memuat, PageTitle, StatusAksi, ambilPesan } from '../components/PageState.jsx'

const hariIni = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
export default function Penjualan() {
  const [menu, setMenu] = useState(null); const [items, setItems] = useState([]); const [tanggal, setTanggal] = useState(hariIni()); const [status, setStatus] = useState(null); const [error, setError] = useState('')
  const muat = useCallback(() => api.get('/menu').then((r) => { setMenu(r.data.data); setItems(r.data.data.map((m) => ({ menu_id: m.id, qty: '' }))) }).catch((e) => setError(ambilPesan(e))), [])
  useEffect(() => { muat() }, [muat])
  const simpan = async (e) => { e.preventDefault(); const pilih = items.filter((i) => Number(i.qty) > 0).map((i) => ({ ...i, qty: Number(i.qty) })); if (!pilih.length) { setStatus({ type: 'gagal', text: 'Isi jumlah porsi minimal satu menu.' }); return } setStatus({ type: 'memuat', text: 'Menyimpan penjualan...' }); try { const r = await api.post('/penjualan', { tanggal, items: pilih }); const tanpa = r.data.data.menu_tanpa_resep; setStatus({ type: tanpa.length ? 'gagal' : 'berhasil', text: tanpa.length ? `Penjualan tersimpan, tetapi menu tanpa resep: ${tanpa.join(', ')}. Tambahkan resep agar stok terpotong.` : 'Penjualan tersimpan dan stok diperbarui.' }); setItems(menu.map((m) => ({ menu_id: m.id, qty: '' }))) } catch (err) { setStatus({ type: 'gagal', text: ambilPesan(err) }) } }
  if (error) return <Galat pesan={error} onUlang={muat} />; if (!menu) return <Memuat />
  return <section><PageTitle>Penjualan</PageTitle><form className="card form-card narrow" onSubmit={simpan}><label>Tanggal<input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required /></label>{!menu.length ? <Kosong>Belum ada menu. Tambahkan menu terlebih dahulu.</Kosong> : <div className="sales-list">{items.map((item, i) => <label key={item.menu_id}>{menu[i].nama}<span className="muted">{menu[i].resep.length ? `${menu[i].resep.length} bahan resep` : 'Belum ada resep'}</span><input type="number" inputMode="decimal" min="0" step="1" value={item.qty} onChange={(e) => { const next = [...items]; next[i].qty = e.target.value; setItems(next) }} placeholder="0" /></label>)}</div>}<button className="button">Simpan penjualan</button><StatusAksi status={status} /></form></section>
}
