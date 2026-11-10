import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { Galat, Kosong, Memuat, PageTitle, StatusAksi, ambilPesan } from '../components/PageState.jsx'

const awal = { nama: '', satuan: '', kategori: '', stok_minimum: '', stok_target: '', ukuran_kemasan: '1' }
const angka = (n) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(Number(n))

export default function Bahan() {
  const [bahan, setBahan] = useState(null)
  const [form, setForm] = useState(awal)
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
      await api.post('/bahan', { ...form, stok_minimum: Number(form.stok_minimum), stok_target: Number(form.stok_target), ukuran_kemasan: Number(form.ukuran_kemasan) })
      setForm(awal); setStatus({ type: 'berhasil', text: 'Bahan berhasil disimpan.' }); muat()
    } catch (err) { setStatus({ type: 'gagal', text: ambilPesan(err) }) }
  }
  if (error) return <Galat pesan={error} onUlang={muat} />
  if (!bahan) return <Memuat />
  return <section>
    <PageTitle>Bahan</PageTitle>
    <div className="two-col">
      <form className="card form-card" onSubmit={simpan}>
        <h2>Tambah bahan</h2>
        {['nama', 'satuan', 'kategori'].map((name) => <label key={name}>{name[0].toUpperCase() + name.slice(1)}
          <input name={name} value={form[name]} onChange={ubah} required={name !== 'kategori'} /></label>)}
        <div className="form-grid">{[['stok_minimum', 'Minimum'], ['stok_target', 'Target'], ['ukuran_kemasan', 'Ukuran kemasan']].map(([name, label]) => <label key={name}>{label}
          <input name={name} type="number" inputMode="decimal" min="0" step="any" value={form[name]} onChange={ubah} required /></label>)}</div>
        <button className="button" type="submit">Simpan bahan</button><StatusAksi status={status} />
      </form>
      <div className="card table-wrap"><h2>Daftar bahan</h2>{!bahan.length ? <Kosong>Belum ada bahan.</Kosong> : <table><thead><tr><th>Bahan</th><th>Stok</th><th>Min.</th><th>Status</th></tr></thead><tbody>{bahan.map((b) => <tr key={b.id}><td>{b.nama}<small className="muted">{b.kategori || b.satuan}</small></td><td>{angka(b.stok)} {b.satuan}</td><td>{angka(b.stok_minimum)}</td><td><span className={`chip ${b.status}`}>{b.status === 'menipis' ? '▲ Menipis' : '✓ Aman'}</span></td></tr>)}</tbody></table>}</div>
    </div>
  </section>
}
