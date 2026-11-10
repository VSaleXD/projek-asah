import { useState } from "react";


const WA_NUMBER = "628XXXXXXXXXX"; // ganti dengan nomor WhatsApp restoran

const HEADING = "font-['Shippori_Mincho',serif]";
const HARD_SHADOW = "shadow-[4px_4px_0_0_#1A1A1A]";
const PRESS =
  "transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none";

// ---------- Stempel hanko ----------
function Hanko({ children }) {
  return (
    <div className="absolute -top-3 -right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1A1A1A] bg-[#F0B429] text-xs font-extrabold text-[#1A1A1A]">

// ---------- Pemisah bergelombang (seigaiha sederhana) ----------
export function WaveDivider() {
  const tile =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20'%3E%3Cpath d='M0 20a20 20 0 0 1 40 0' fill='none' stroke='%239B1F2B' stroke-width='2'/%3E%3Cpath d='M8 20a12 12 0 0 1 24 0' fill='none' stroke='%239B1F2B' stroke-width='2'/%3E%3C/svg%3E\")";
  return (
    <div
      aria-hidden="true"
      className="my-10 h-5 w-full opacity-70"
      style={{ backgroundImage: tile, backgroundRepeat: "repeat-x" }}
    />
  );
}

// ---------- Kartu menu ----------
export function MenuCard({ name, desc, price, image, badge }) {
  return (
    <article
      className={`relative flex flex-col border-2 border-[#1A1A1A] bg-[#F5ECD9] ${HARD_SHADOW}`}
    >
      {badge && <Hanko>{badge}</Hanko>}

      <div className="h-40 overflow-hidden border-b-2 border-[#1A1A1A] bg-[#9B1F2B]">
        {image && (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className={`${HEADING} text-xl font-extrabold text-[#1A1A1A]`}>
          {name}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-[#1A1A1A]/80">
          {desc}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="border-2 border-[#1A1A1A] bg-[#F0B429] px-3 py-1 text-sm font-extrabold text-[#1A1A1A]">
            Rp {price.toLocaleString("id-ID")}
          </span>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
              `Halo, saya mau pesan ${name}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`border-2 border-[#1A1A1A] bg-[#9B1F2B] px-4 py-1.5 text-sm font-bold text-[#F5ECD9] ${HARD_SHADOW} ${PRESS}`}
          >
            Pesan
          </a>
        </div>
      </div>
    </article>
  );
}

// ---------- Form reservasi via WhatsApp ----------
const inputCls =
  "w-full border-2 border-[#1A1A1A] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:bg-[#F0B429]/30";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ReservationForm() {
  const [f, setF] = useState({
    nama: "",
    tanggal: "",
    jam: "",
    orang: 2,
    catatan: "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const text =
      `Halo Ale's Place Cipoho, saya mau reservasi.\n` +
      `Nama: ${f.nama}\nTanggal: ${f.tanggal}\nJam: ${f.jam}\n` +
      `Jumlah orang: ${f.orang}\nCatatan: ${f.catatan || "-"}`;
    window.open(
      `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <form
      onSubmit={submit}
      className={`mx-auto flex max-w-md flex-col gap-4 border-2 border-[#1A1A1A] bg-[#F5ECD9] p-6 ${HARD_SHADOW}`}
    >
      <h2 className={`${HEADING} text-2xl font-extrabold text-[#9B1F2B]`}>
        Reservasi Meja
      </h2>

      <Field label="Nama">
        <input required className={inputCls} value={f.nama} onChange={set("nama")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal">
          <input required type="date" className={inputCls} value={f.tanggal} onChange={set("tanggal")} />
        </Field>
        <Field label="Jam">
          <input required type="time" className={inputCls} value={f.jam} onChange={set("jam")} />
        </Field>
      </div>

      <Field label="Jumlah orang">
        <input required type="number" min="1" max="30" className={inputCls} value={f.orang} onChange={set("orang")} />
      </Field>

      <Field label="Catatan">
        <textarea rows="3" className={inputCls} value={f.catatan} onChange={set("catatan")} />
      </Field>

      <button
        type="submit"
        className={`border-2 border-[#1A1A1A] bg-[#9B1F2B] px-4 py-3 font-extrabold text-[#F5ECD9] ${HARD_SHADOW} ${PRESS}`}
      >
        Kirim lewat WhatsApp
      </button>
    </form>
  );
}

// ---------- Demo (hapus kalau sudah ditempel ke halaman asli) ----------
const DEMO_MENU = [
  { name: "Ramen Shoyu", desc: "Kuah kaldu shoyu gurih, mi kenyal, telur, dan chashu.", price: 28000, badge: "人気" },
  { name: "Chicken Katsu Don", desc: "Ayam katsu renyah di atas nasi hangat dengan saus telur.", price: 25000 },
  { name: "Takoyaki", desc: "Bola gurita panggang dengan saus dan katsuobushi.", price: 18000, badge: "新" },
];

export default function NeoWafuDemo() {
  return (
    <div className="min-h-screen bg-[#F5ECD9] p-6">
      <div className="mx-auto max-w-5xl">
        <h2 className={`${HEADING} mb-6 text-3xl font-extrabold text-[#9B1F2B]`}>
          Menu Favorit
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_MENU.map((m) => (
            <MenuCard key={m.name} {...m} />
          ))}
        </div>
        <WaveDivider />
        <ReservationForm />
      </div>
    </div>
  );
}