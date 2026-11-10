import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Galat, Kosong, Memuat, PageTitle, StatusAksi, ambilPesan } from '../components/PageState.jsx'

export default function Menu() {
  const [menu, setMenu] = useState(null); const [bahan, setBahan] = useState([]); const [form, setForm] = useState({ nama: '', harga: '' }); const [error, setError] = useState(''); const [status, setStatus] = useState(null)
  const muat = useCallback(() => { Promise.all([api.get('/menu'), api.get('/bahan')]).then(([m, b]) => { setMenu(m.data.data); setBahan(b.data.data) }).catch((e) => setError(ambilPesan(e))) }, [])
  useEffect(() => { muat() }, [muat])
  const buatMenu = async (e) => { e.preventDefault(); setStatus({ type: 'memuat', text: 'Menyimpan menu...' }); try { await api.post('/menu', { nama: form.nama, harga: form.harga ? Number(form.harga) : null }); setForm({ nama: '', harga: '' }); setStatus({ type: 'berhasil', text: 'Menu berhasil disimpan.' }); muat() } catch (err) { setStatus({ type: 'gagal', text: ambilPesan(err) }) } }
  if (error) return <Galat pesan={error} onUlang={muat} />; if (!menu) return <Memuat />
  return <section><PageTitle>Menu & Resep</PageTitle><div className="two-col"><form className="card form-card" onSubmit={buatMenu}><h2>Tambah menu</h2><label>Nama menu<input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required /></label><label>Harga<input type="number" inputMode="decimal" min="0" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} /></label><button className="button">Simpan menu</button><StatusAksi status={status} /></form><div className="card menu-list">{!menu.length ? <Kosong>Belum ada menu.</Kosong> : menu.map((m) => <MenuItem key={m.id} item={m} bahan={bahan} onSaved={muat} />)}</div></div></section>
}

function MenuItem({ item, bahan, onSaved }) {
  const [rows, setRows] = useState(item.resep.map((r) => ({ bahan_id: r.bahan_id, jumlah: r.jumlah }))); const [status, setStatus] = useState(null)
  const save = async () => { setStatus({ type: 'memuat', text: 'Menyimpan resep...' }); try { await api.put(`/menu/${item.id}/resep`, { resep: rows.filter((r) => r.bahan_id && Number(r.jumlah) > 0).map((r) => ({ bahan_id: r.bahan_id, jumlah: Number(r.jumlah) })) }); setStatus({ type: 'berhasil', text: 'Resep tersimpan.' }); onSaved() } catch (e) { setStatus({ type: 'gagal', text: ambilPesan(e) }) } }
  return <article className="recipe"><h2>{item.nama}</h2><p className="muted">{item.harga ? `Rp ${Number(item.harga).toLocaleString('id-ID')}` : 'Harga belum diisi'}</p>{rows.map((r, i) => <div className="recipe-row" key={`${r.bahan_id}-${i}`}><select value={r.bahan_id} onChange={(e) => { const next = [...rows]; next[i].bahan_id = e.target.value; setRows(next) }}><option value="">Pilih bahan</option>{bahan.map((b) => <option key={b.id} value={b.id}>{b.nama} ({b.satuan})</option>)}</select><input type="number" inputMode="decimal" step="any" min="0" value={r.jumlah} onChange={(e) => { const next = [...rows]; next[i].jumlah = e.target.value; setRows(next) }} /><button type="button" className="icon-button" onClick={() => setRows(rows.filter((_, n) => n !== i))} aria-label="Hapus bahan">×</button></div>)}<button type="button" className="button secondary" onClick={() => setRows([...rows, { bahan_id: '', jumlah: '' }])}>Tambah bahan</button> <button type="button" className="button" onClick={save}>Simpan resep</button><StatusAksi status={status} /></article>
}
