import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { Galat, Kosong, Memuat, PageTitle, StatusAksi, ambilPesan } from '../components/PageState.jsx'
export default function Belanja() {
  const [params] = useSearchParams(); const [items, setItems] = useState(null); const [error, setError] = useState(''); const [status, setStatus] = useState(null)
  const tanggal = params.get('tanggal') || ''
  const muat = useCallback(() => api.get('/belanja', { params: tanggal ? { tanggal } : {} }).then((r) => setItems(r.data.data)).catch((e) => setError(ambilPesan(e))), [tanggal])
  useEffect(() => { muat() }, [muat])
  const toggle = async (item) => { setStatus({ type: 'memuat', text: 'Memperbarui daftar belanja...' }); try { await api.patch(`/belanja/${item.id}`, { sudah_dibeli: !item.sudah_dibeli }); setStatus({ type: 'berhasil', text: 'Status belanja diperbarui.' }); muat() } catch (e) { setStatus({ type: 'gagal', text: ambilPesan(e) }) } }
  const bagikan = () => { const teks = `Daftar belanja Stok Dapur${tanggal ? ` ${tanggal}` : ''}%0A${items.filter((i) => !i.sudah_dibeli).map((i) => `- ${i.nama}: ${i.jumlah_beli} ${i.satuan}`).join('%0A')}`; window.open(`https://wa.me/?text=${teks}`, '_blank', 'noopener,noreferrer') }
  if (error) return <Galat pesan={error} onUlang={muat} />; if (!items) return <Memuat />; return <section className="print-area"><PageTitle aksi={<div className="toolbar"><button className="button secondary no-print" onClick={bagikan}>Bagikan WhatsApp</button><button className="button secondary no-print" onClick={() => window.print()}>Cetak</button></div>}>Belanja</PageTitle>{!items.length ? <Kosong>Belum ada rekomendasi belanja. Simpan cek stok terlebih dahulu.</Kosong> : <div className="card"><p className="muted">Cek stok: {items[0].tanggal_cek}</p><ul className="shopping-list">{items.map((item) => <li key={item.id} className={item.sudah_dibeli ? 'bought' : ''}><label><input type="checkbox" checked={item.sudah_dibeli} onChange={() => toggle(item)} /><span><strong>{item.nama}</strong><small>{item.jumlah_kemasan} kemasan · {item.jumlah_beli} {item.satuan} · {item.alasan === 'prediksi_pemakaian' ? 'prediksi pemakaian' : 'di bawah minimum'}</small></span></label></li>)}</ul><StatusAksi status={status} /></div>}</section>
}
