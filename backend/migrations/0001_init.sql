create table bahan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  satuan text not null,
  kategori text,
  stok_minimum numeric(12,3) not null check (stok_minimum >= 0),
  stok_target numeric(12,3) not null,
  ukuran_kemasan numeric(12,3) not null default 1 check (ukuran_kemasan > 0),
  aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  constraint target_tidak_di_bawah_minimum check (stok_target >= stok_minimum)
);

create table menu (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  harga numeric(12,0),
  aktif boolean not null default true
);

create table resep (
  menu_id uuid not null references menu(id) on delete cascade,
  bahan_id uuid not null references bahan(id),
  jumlah numeric(12,3) not null check (jumlah > 0),
  primary key (menu_id, bahan_id)
);

create table penjualan (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  sumber text not null default 'manual',   -- 'manual' | 'impor'
  dibuat_pada timestamptz not null default now()
);

create table penjualan_item (
  id uuid primary key default gen_random_uuid(),
  penjualan_id uuid not null references penjualan(id) on delete cascade,
  menu_id uuid not null references menu(id),
  qty integer not null check (qty > 0)
);

create table opname (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null unique,            -- satu cek stok per malam
  catatan text,
  dibuat_pada timestamptz not null default now()
);

create type tipe_pergerakan as enum ('penjualan', 'pembelian', 'koreksi', 'buang');

create table stok_movement (
  id uuid primary key default gen_random_uuid(),
  bahan_id uuid not null references bahan(id),
  tipe tipe_pergerakan not null,
  jumlah numeric(12,3) not null,           -- negatif = berkurang
  tanggal date not null,
  referensi_id uuid,                        -- penjualan.id / belanja_item.id / opname.id
  catatan text,
  dibuat_pada timestamptz not null default now()
);
create index on stok_movement (bahan_id, tanggal);
create index on stok_movement (referensi_id);
create unique index uniq_pembelian_per_belanja on stok_movement (referensi_id) where tipe = 'pembelian';

create table opname_item (
  id uuid primary key default gen_random_uuid(),
  opname_id uuid not null references opname(id) on delete cascade,
  bahan_id uuid not null references bahan(id),
  jumlah_aktual numeric(12,3) not null check (jumlah_aktual >= 0),
  jumlah_estimasi numeric(12,3) not null,
  selisih numeric(12,3) not null,
  unique (opname_id, bahan_id)
);

create table belanja_item (
  id uuid primary key default gen_random_uuid(),
  opname_id uuid not null references opname(id) on delete cascade,
  bahan_id uuid not null references bahan(id),
  jumlah_kemasan integer not null check (jumlah_kemasan > 0),
  jumlah_beli numeric(12,3) not null,
  alasan text not null check (alasan in ('di_bawah_minimum', 'prediksi_pemakaian')),
  sudah_dibeli boolean not null default false,
  unique (opname_id, bahan_id)
);

create table prediksi_pemakaian (
  tanggal date not null,
  bahan_id uuid not null references bahan(id),
  jumlah_prediksi numeric(12,3) not null check (jumlah_prediksi >= 0),
  model_versi text,
  dibuat_pada timestamptz not null default now(),
  primary key (tanggal, bahan_id)
);
