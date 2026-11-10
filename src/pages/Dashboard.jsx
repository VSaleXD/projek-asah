import { useCallback, useEffect, useState } from 'react'
import { api, pesanError } from '../api/client.js'
import { Galat, Kosong, Memuat } from '../components/Status.jsx'

const angka = (nilai) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(nilai)

export default function Dashboard() {
  const [bahan, setBahan] = useState(null)
  const [error, setError] = useState('')

  const muatBahan = useCallback(() => {
    setError('')
    setBahan(null)
    api
      .get('/bahan')
      .then((response) => setBahan(response.data.data))
      .catch((requestError) => setError(pesanError(requestError)))
  }, [])

  useEffect(() => {
    muatBahan()
  }, [muatBahan])

  if (error) return <Galat pesan={error} onUlang={muatBahan} />
  if (!bahan) return <Memuat />

  const aktif = bahan.filter((item) => item.aktif)
  if (!aktif.length) {
    return <Kosong>Belum ada bahan. Tambahkan bahan terlebih dahulu.</Kosong>
  }

  return (
    <section>
      <h1>Stok saat ini</h1>
      <p>
        {aktif.filter((item) => item.status === 'menipis').length} bahan di
        bawah batas minimum.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Bahan</th>
              <th scope="col">Stok</th>
              <th scope="col">Minimum</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {aktif.map((item) => (
              <tr key={item.id}>
                <td>{item.nama}</td>
                <td>
                  {angka(item.stok)} {item.satuan}
                </td>
                <td>{angka(item.stok_minimum)}</td>
                <td>{item.status === 'menipis' ? '▲ Menipis' : '✓ Aman'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
