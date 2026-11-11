import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Galat, Kosong, Memuat, PageTitle, StatusAksi, ambilPesan } from '../components/PageState.jsx'

const awal = { nama: '', satuan: '', kategori: '', stok_minimum: '', stok_target: '', ukuran_kemasan: '1' }
const angka = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(Number(n))

export default function Bahan() {
  const [bahan, setBahan] = useState(null)
  const [form, setForm] = useState(awal)
  const [editId, setEditId] = useState(null)
  const [formTerbuka, setFormTerbuka] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState(null)
  const muat = useCallback(() => {
    setError('')
    api.get('/bahan').then((r) => setBahan(r.data.data)).catch((e) => setError(ambilPesan(e)))
  }, [])
  useEffect(() => { muat() }, [muat])
  const ubah = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const simpan = async (e) => {
    e.preventDefault(); setStatus({ type: 'memuat', text: 'Menyimpan bahan...' })
    try {
      const data = { ...form, stok_minimum: Number(form.stok_minimum), stok_target: Number(form.stok_target), ukuran_kemasan: Number(form.ukuran_kemasan) }
      if (editId) {
        await api.patch(`/bahan/${editId}`, { ...data, stok: Number(form.stok) })
      } else {
        await api.post('/bahan', data)
      }
      setForm(awal); setEditId(null); setFormTerbuka(false); setStatus({ type: 'berhasil', text: editId ? 'Bahan berhasil diperbarui.' : 'Bahan berhasil disimpan.' }); muat()
    } catch (err) { setStatus({ type: 'gagal', text: ambilPesan(err) }) }
  }
  const mulaiEdit = (item) => {
    setEditId(item.id)
    setFormTerbuka(true)
    setForm({ nama: item.nama, satuan: item.satuan, kategori: item.kategori || '', stok_minimum: item.stok_minimum, stok_target: item.stok_target, ukuran_kemasan: item.ukuran_kemasan, stok: item.stok })
    setStatus(null)
  }
  const batalEdit = () => { setEditId(null); setForm(awal); setFormTerbuka(false); setStatus(null) }
  const bukaTambah = () => { setEditId(null); setForm(awal); setStatus(null); setFormTerbuka(true) }
  if (error) return <Galat pesan={error} onUlang={muat} />
  if (!bahan) return <Memuat />
  return <section>
    <PageTitle aksi={<button className="button" type="button" onClick={bukaTambah}>+ Tambah bahan</button>}>Bahan</PageTitle>
    {formTerbuka && <form className="card form-card master-form" onSubmit={simpan}>
        <h2>{editId ? 'Edit bahan' : 'Tambah bahan'}</h2>
        {['nama', 'satuan', 'kategori'].map((name) => <label key={name}>{name[0].toUpperCase() + name.slice(1)}
          <input name={name} value={form[name]} onChange={ubah} required={name !== 'kategori'} /></label>)}
        <div className="form-grid">{[...(editId ? [['stok', 'Stok saat ini']] : []), ['stok_minimum', 'Minimum'], ['stok_target', 'Target'], ['ukuran_kemasan', 'Ukuran kemasan']].map(([name, label]) => <label key={name}>{label}
          <input name={name} type="number" inputMode="decimal" min="0" step="any" value={form[name]} onChange={ubah} required /></label>)}</div>
        <div className="toolbar"><button className="button" type="submit">{editId ? 'Simpan perubahan' : 'Simpan bahan'}</button>{editId && <button className="button secondary" type="button" onClick={batalEdit}>Batal</button>}</div><StatusAksi status={status} />
      </form>}
    <div className="card table-wrap master-list"><h2>Daftar bahan</h2>{!bahan.length ? <Kosong>Belum ada bahan.</Kosong> : <table><thead><tr><th>Bahan</th><th>Stok saat ini</th><th>Minimum</th><th>Target</th><th>Kemasan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{bahan.map((b) => <tr key={b.id}><td>{b.nama}<small className="muted">{b.kategori || 'Tanpa kategori'}</small></td><td>{angka(b.stok)} {b.satuan}</td><td>{angka(b.stok_minimum)} {b.satuan}</td><td>{angka(b.stok_target)} {b.satuan}</td><td>{angka(b.ukuran_kemasan)} {b.satuan}</td><td><span className={`chip ${b.status}`}>{b.status === 'menipis' ? '▲ Menipis' : '✓ Aman'}</span></td><td><button className="button secondary small-button" type="button" onClick={() => mulaiEdit(b)}>Edit</button></td></tr>)}</tbody></table>}</div>
  </section>
}
