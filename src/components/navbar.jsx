import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../assets/Logo.jpg'

const links = [
  ['/', 'Stok'],
  ['/opname', 'Cek stok'],
  ['/belanja', 'Belanja'],
  ['/penjualan', 'Penjualan'],
  ['/bahan', 'Bahan'],
  ['/menu', 'Menu'],
  ['/riwayat', 'Riwayat'],
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="site-header" >  
      <div className="header-inner">
        <NavLink className="brand" to="/" aria-label="Stok Dapur">
          <img src={logo} alt="Stok Dapur" className="logo" />
          <span>Stok Dapur</span>
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-label="Buka menu navigasi"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Navigasi utama">
          {links.map(([path, label]) => (
            <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/masuk" className="access-link">Kode akses</NavLink>
        </nav>
      </div>
    </header>
  )
}
