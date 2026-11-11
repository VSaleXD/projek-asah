import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../assets/Logo.jpg'

const groups = [
  { title: '', links: [['/', 'Dashboard']] },
  { title: 'Database', links: [['/bahan', 'Bahan'], ['/menu', 'Menu & resep']] },
  { title: 'Operasional', links: [['/penjualan', 'Penjualan'], ['/opname', 'Cek stok'], ['/belanja', 'Belanja'], ['/riwayat', 'Riwayat']] },
]

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const keluar = () => {
    sessionStorage.removeItem('kode_akses')
    window.location.href = '/masuk'
  }

  return (
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <NavLink className="sidebar-brand" to="/" onClick={() => setMenuOpen(false)}>
          <img src={logo} alt="Stok Dapur" className ="sidebar-logo"/>
          <span>Stok Dapur</span>
        </NavLink>
        <button type="button" className="menu-toggle" aria-label="Buka navigasi" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Navigasi utama">
        {groups.map((group) => <div className="nav-group" key={group.title}>
          <div className="nav-group-title">{group.title}</div>
          {group.links.map(([path, label]) => (
            <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
          ))}
        </div>)}
      </nav>
    </aside>
  )
}
