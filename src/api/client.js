import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const kode = sessionStorage.getItem('kode_akses')
  if (kode) {
    config.headers['x-kode-akses'] = kode
  }
  return config
})

export function pesanError(error) {
  if (error.response?.data?.error?.pesan) {
    return error.response.data.error.pesan
  }
  if (error.code === 'ECONNABORTED') {
    return 'Server lambat merespons. Tunggu sebentar lalu coba lagi.'
  }
  if (!error.response) {
    return 'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  }
  return 'Terjadi kesalahan. Coba lagi.'
}
