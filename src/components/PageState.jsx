import { pesanError } from '../api/client.js'

export function Memuat({ teks = 'Memuat data...' }) {
  return <p className="state" role="status">{teks}</p>
}

export function Galat({ pesan, onUlang }) {
  return (
    <div className="state error" role="alert">
      <p>{pesan}</p>
      {onUlang && <button className="button secondary" onClick={onUlang}>Coba lagi</button>}
    </div>
  )
}

export function Kosong({ children }) {
  return <p className="state">{children}</p>
}

export function ambilPesan(error) {
  return pesanError(error)
}

export function PageTitle({ kanji, children, aksi }) {
  return <div className="page-title"><div><span className="kanji">{kanji}</span><h1>{children}</h1></div>{aksi}</div>
}

export function StatusAksi({ status }) {
  if (!status) return null
  return <p className={`action-status ${status.type}`} role={status.type === 'gagal' ? 'alert' : 'status'}>{status.text}</p>
}
