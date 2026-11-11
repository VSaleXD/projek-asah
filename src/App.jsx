import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Bahan from './pages/Bahan.jsx'
import Menu from './pages/Menu.jsx'
import Penjualan from './pages/Penjualan.jsx'
import Opname from './pages/Opname.jsx'
import Belanja from './pages/Belanja.jsx'
import Riwayat from './pages/Riwayat.jsx'
import Login from './pages/Login.jsx'
import './style/japanese.css'

function RuteTerlindungi() {
  const sudahMasuk = Boolean(sessionStorage.getItem('kode_akses'))

  if (!sudahMasuk) {
    return <Navigate to="/masuk" replace />
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bahan" element={<Bahan />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/penjualan" element={<Penjualan />} />
          <Route path="/opname" element={<Opname />} />
          <Route path="/belanja" element={<Belanja />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/masuk" element={<Login />} />
        <Route path="/*" element={<RuteTerlindungi />} />
      </Routes>
    </BrowserRouter>
  )
}
