import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, pesanError } from '../api/client.js'
import { PageTitle, StatusAksi } from '../components/PageState.jsx'
export default function Login() {
  const [kode, setKode] = useState(sessionStorage.getItem('kode_akses') || ''); const [status, setStatus] = useState(null); const navigate = useNavigate()
  const masuk = async (e) => { e.preventDefault(); sessionStorage.setItem('kode_akses', kode); setStatus({ type: 'memuat', text: 'Memeriksa kode akses...' }); try { await api.get('/bahan'); setStatus({ type: 'berhasil', text: 'Kode akses diterima.' }); setTimeout(() => navigate('/'), 400) } catch (err) { sessionStorage.removeItem('kode_akses'); setStatus({ type: 'gagal', text: pesanError(err) }) } }
  return <section><PageTitle>Masuk staf</PageTitle><form className="card form-card narrow" onSubmit={masuk}><p className="muted">Gunakan satu kode akses bersama dari pengelola.</p><label>Kode akses<input type="password" value={kode} onChange={(e) => setKode(e.target.value)} autoComplete="current-password" required /></label><button className="button">Masuk</button><StatusAksi status={status} /></form></section>
}
