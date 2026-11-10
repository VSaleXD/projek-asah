import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Galat, Kosong, Memuat, PageTitle, ambilPesan } from '../components/PageState.jsx'
export default function Riwayat() {
  const [bahan, setBahan] = useState([]); const [rows, setRows] = useState(null); const [filter, setFilter] = useState({ bahan_id: '', dari: '', sampai: '' }); const [error, setError] = useState('')
  const muatBahan = useCallback(() => api.get('/bahan').then((r) => setBahan(r.data.data)).catch((e) => setError(ambilPesan(e))), [])
  const muat = useCallback(() => api.get('/stok/pergerakan', { params: filter }).then((r) => setRows(r.data.data)).catch((e) => setError(ambilPesan(e))), [filter])
  useEffect(() => { muatBahan() }, [muatBahan]); useEffect(() => { muat() }, [muat])
  if (error) return <Galat pesan={error} onUlang={() => { setError(''); muat() }} />; if (!rows) return <Memuat />
  return <section><PageTitle>Riwayat stok</PageTitle><div className="card filters"><label>Bahan<select value={filter.bahan_id} onChange={(e) => setFilter({ ...filter, bahan_id: e.target.value })}><option value="">Semua bahan</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}</select></label><label>Dari<input type="date" value={filter.dari} onChange={(e) => setFilter({ ...filter, dari: e.target.value })} /></label><label>Sampai<input type="date" value={filter.sampai} onChange={(e) => setFilter({ ...filter, sampai: e.target.value })} /></label></div>{!rows.length ? <Kosong>Tidak ada pergerakan pada filter ini.</Kosong> : <div className="card table-wrap"><table><thead><tr><th>Tanggal</th><th>Bahan</th><th>Jenis</th><th>Jumlah</th><th>Catatan</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.tanggal}</td><td>{r.nama}</td><td>{r.tipe}</td><td>{r.jumlah} {r.satuan}</td><td>{r.catatan || '-'}</td></tr>)}</tbody></table></div>}</section>
}
