"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  Thermometer,
  Layers,
  CalendarDays,
  BarChart2,
  Cpu,
  Cloud,
  Database,
  Monitor,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Droplets,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoomStatus = "Active" | "Booked" | "Scheduled" | "Empty";

interface RoomData {
  id: string;
  name: string;
  status: RoomStatus;
  temp: number;
  humidity: number;
  people: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fluctuate(value: number, delta: number, min: number, max: number): number {
  const next = value + (Math.random() * delta * 2 - delta);
  return Math.min(max, Math.max(min, parseFloat(next.toFixed(1))));
}

const STATUS_STYLES: Record<RoomStatus, { badge: string; dot: string; label: string }> = {
  Active:    { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500", label: "Aktif" },
  Booked:    { badge: "bg-violet-50  text-violet-700  border border-violet-200",  dot: "bg-violet-500",  label: "Dibooking" },
  Scheduled: { badge: "bg-sky-50     text-sky-700     border border-sky-200",     dot: "bg-sky-500",     label: "Terjadwal" },
  Empty:     { badge: "bg-slate-50   text-slate-600   border border-slate-200",   dot: "bg-slate-400",   label: "Kosong" },
};

// ─── Initial room data ────────────────────────────────────────────────────────

const INITIAL_ROOMS: RoomData[] = [
  { id: "TI-1A", name: "TI-1A", status: "Active",    temp: 24.3, humidity: 58, people: 28 },
  { id: "TI-1B", name: "TI-1B", status: "Booked",    temp: 23.8, humidity: 62, people: 12 },
  { id: "TI-2A", name: "TI-2A", status: "Scheduled", temp: 25.1, humidity: 55, people: 0  },
  { id: "TI-2B", name: "TI-2B", status: "Empty",     temp: 22.9, humidity: 60, people: 0  },
];

// ─── Features data ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Users,
    title: "People Counting (IR)",
    desc: "Sensor infrared menghitung jumlah mahasiswa yang masuk dan keluar kelas secara presisi dan real-time.",
    color: "text-[var(--color-primary)]",
    bg: "bg-blue-50",
  },
  {
    icon: Activity,
    title: "Deteksi Gerakan (PIR)",
    desc: "Sensor PIR mendeteksi kehadiran fisik di dalam ruangan untuk memvalidasi status aktif tidaknya kelas.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Thermometer,
    title: "Suhu & Kelembaban (DHT11)",
    desc: "Pantau kondisi thermal ruangan secara live. Data diperbarui setiap beberapa detik dari sensor DHT11.",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    icon: Layers,
    title: "Status Otomatis",
    desc: "Sistem menentukan status kelas (Active / Scheduled / Uncertain / Empty / Booked) secara otomatis berdasarkan jadwal dan data sensor.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: CalendarDays,
    title: "Booking Ruangan",
    desc: "Mahasiswa dan dosen dapat mengajukan booking ruangan kosong langsung dari dashboard tanpa perlu antrian manual.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: BarChart2,
    title: "Analitik & Log",
    desc: "Rekam histori penggunaan ruangan, grafik tren per hari/minggu, dan ekspor log sensor untuk keperluan evaluasi.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

// ─── How-it-works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: Cpu,
    title: "ESP32 Sensor",
    desc: "Node ESP32 membaca data IR, PIR, dan DHT11 di setiap ruangan secara berkala.",
  },
  {
    number: "02",
    icon: Cloud,
    title: "Azure IoT Hub",
    desc: "Data dikirim via protokol MQTT ke Azure IoT Hub secara terenkripsi dan andal.",
  },
  {
    number: "03",
    icon: Database,
    title: "Azure Cosmos DB",
    desc: "IoT Hub meneruskan data ke Cosmos DB — database NoSQL latensi rendah milik Microsoft.",
  },
  {
    number: "04",
    icon: Monitor,
    title: "Dashboard Web",
    desc: "Next.js App Router memvisualisasikan data real-time untuk Dosen dan Mahasiswa.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  // Hero preview sensor
  const [heroTemp, setHeroTemp]       = useState(24.3);
  const [heroHumidity, setHeroHumidity] = useState(58);
  const [heroPeople, setHeroPeople]   = useState(28);
  const [pirActive, setPirActive]     = useState(true);
  const [heroRoomName, setHeroRoomName] = useState("TI-1A");
  const [heroStatus, setHeroStatus] = useState<RoomStatus>("Active");

  // Room cards sensor
  const [rooms, setRooms] = useState<RoomData[]>(INITIAL_ROOMS);
  const [loading, setLoading] = useState(true);

  // Normalisasi status dari API ke tipe lokal
  function mapApiRoomToRoomData(r: any): RoomData {
    let status: RoomStatus = "Empty";
    const apiStatus = String(r.status ?? "").toUpperCase();
    if (apiStatus === "ACTIVE") status = "Active";
    else if (apiStatus === "BOOKED") status = "Booked";
    else if (apiStatus === "SCHEDULED") status = "Scheduled";
    else if (apiStatus === "EMPTY" || apiStatus === "UNCERTAINED") status = "Empty";

    return {
      id: r.id,
      name: r.name || r.id,
      status,
      temp: typeof r.temperature === "number" ? r.temperature : 24.0,
      humidity: typeof r.humidity === "number" ? r.humidity : 60,
      people: typeof r.peopleCount === "number" ? r.peopleCount : 0,
    };
  }

  // Fetch API data on mount
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/rooms/combined");
        const json = await res.json();
        
        if (json && json.success && Array.isArray(json.data)) {
          const apiRooms = json.data;
          
          // Hero Room: Find first active room, or fallback to first room
          const activeRoom = apiRooms.find((r: any) => String(r.status ?? "").toUpperCase() === "ACTIVE") || apiRooms[0];
          if (activeRoom) {
            const mappedHero = mapApiRoomToRoomData(activeRoom);
            setHeroTemp(mappedHero.temp);
            setHeroHumidity(mappedHero.humidity);
            setHeroPeople(mappedHero.people);
            setPirActive(activeRoom.motionDetected ?? false);
            setHeroRoomName(mappedHero.name);
            setHeroStatus(mappedHero.status);
          }
          
          // Section Ruangan: max 4 rooms
          const mappedRooms = apiRooms.slice(0, 4).map((r: any) => mapApiRoomToRoomData(r));
          setRooms(mappedRooms);
        } else {
          setRooms(INITIAL_ROOMS);
        }
      } catch (error) {
        console.error("Gagal mengambil data sensor ruangan:", error);
        setRooms(INITIAL_ROOMS);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Scroll-aware navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hero live sensor (fluktuasi minor ±0.1°C)
  useEffect(() => {
    const id = setInterval(() => {
      setHeroTemp(prev     => fluctuate(prev, 0.1, 20, 30));
      setHeroHumidity(prev => fluctuate(prev, 1.5, 40, 80));
      setHeroPeople(prev   => Math.max(0, Math.min(35, prev + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
      setPirActive(prev    => Math.random() > 0.15 ? true : !prev);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Room cards live sensor (fluktuasi minor ±0.1°C)
  useEffect(() => {
    const id = setInterval(() => {
      setRooms(prev =>
        prev.map(r => ({
          ...r,
          temp:     fluctuate(r.temp, 0.1, 20, 30),
          humidity: fluctuate(r.humidity, 1,   40, 80),
        }))
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[var(--background-base)] text-slate-800 font-sans antialiased">

      {/* ══════════════════════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 bg-white border-b border-slate-200 transition-shadow duration-200 ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}
            >
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight" style={{ color: "var(--color-primary)" }}>
              SmartClass
            </span>
            <span className="hidden sm:block text-xs text-slate-400 font-semibold">JTI Polinema</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button onClick={() => scrollTo("fitur")}    className="hover:text-[var(--color-primary)] transition-colors">Fitur</button>
            <button onClick={() => scrollTo("cara-kerja")} className="hover:text-[var(--color-primary)] transition-colors">Cara Kerja</button>
            <button onClick={() => scrollTo("ruangan")}  className="hover:text-[var(--color-primary)] transition-colors">Ruangan</button>
          </nav>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              Masuk ke Dashboard <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-3">
            <button onClick={() => scrollTo("fitur")}     className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-[var(--color-primary)]">Fitur</button>
            <button onClick={() => scrollTo("cara-kerja")} className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-[var(--color-primary)]">Cara Kerja</button>
            <button onClick={() => scrollTo("ruangan")}   className="text-left py-2 text-sm font-semibold text-slate-700 hover:text-[var(--color-primary)]">Ruangan</button>
            <Link
              href="/login"
              className="w-full text-center py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              Masuk ke Dashboard
            </Link>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* subtle gradient bg */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04]"
          style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary), transparent)` }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text */}
          <div className="flex flex-col items-start gap-6">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)", background: "#eef1fc" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Real-time IoT Monitoring
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-[1.1] text-slate-900">
              Sistem Monitoring<br />
              Ruang Kelas Cerdas{" "}
              <span style={{ color: "var(--color-primary)" }}>JTI Polinema</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
              Pantau kondisi setiap ruang kelas secara real-time — jumlah mahasiswa, suhu, kelembaban, dan status ruangan — langsung dari browser Anda.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all"
                style={{ background: "var(--color-primary)" }}
              >
                <Users size={16} /> Login Sebagai Dosen
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold border-2 border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
              >
                Login Sebagai Mahasiswa <ChevronRight size={15} />
              </Link>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-6 pt-2">
              {[
                { num: "4",  label: "Ruangan Dipantau" },
                { num: "3",  label: "Jenis Sensor" },
                { num: "5s", label: "Interval Update" },
                { num: "2",  label: "Role Pengguna" },
              ].map(s => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-2xl font-black" style={{ color: "var(--color-primary)" }}>{s.num}</span>
                  <span className="text-xs text-slate-500 font-semibold">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero sensor preview card */}
          <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">

              {/* Card header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: "var(--color-primary)" }}
              >
                <div className="flex items-center gap-2.5">
                  <Cpu size={18} className="text-white/80" />
                  <span className="text-sm font-bold text-white tracking-wide">
                    ESP32 — Ruang {loading ? "..." : heroRoomName}
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>

              {/* Sensor metrics */}
              {loading ? (
                <div className="px-6 py-5 grid grid-cols-2 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 h-28 flex flex-col justify-between">
                      <div className="h-3 bg-slate-200 rounded w-16"></div>
                      <div className="h-8 bg-slate-200 rounded w-20"></div>
                      <div className="h-3 bg-slate-200 rounded w-10"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-5 grid grid-cols-2 gap-4">
                  {/* Temp */}
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-orange-500 mb-1">
                      <Thermometer size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Suhu</span>
                    </div>
                    <span className="text-3xl font-black text-slate-800 tabular-nums">{heroTemp.toFixed(1)}</span>
                    <span className="text-xs text-slate-400 font-semibold">°C</span>
                  </div>

                  {/* Humidity */}
                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sky-500 mb-1">
                      <Droplets size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Kelembaban</span>
                    </div>
                    <span className="text-3xl font-black text-slate-800 tabular-nums">{heroHumidity.toFixed(0)}</span>
                    <span className="text-xs text-slate-400 font-semibold">%</span>
                  </div>

                  {/* People */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 mb-1" style={{ color: "var(--color-primary)" }}>
                      <Users size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Mahasiswa</span>
                    </div>
                    <span className="text-3xl font-black text-slate-800 tabular-nums">{heroPeople}</span>
                    <span className="text-xs text-slate-400 font-semibold">dari 35 kapasitas</span>
                  </div>

                  {/* PIR */}
                  <div
                    className={`rounded-2xl p-4 flex flex-col gap-1 border transition-colors duration-700 ${
                      pirActive
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 mb-1 transition-colors duration-700 ${
                        pirActive ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      <Activity size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Gerakan</span>
                    </div>
                    <span className={`text-lg font-black transition-colors duration-700 ${pirActive ? "text-emerald-700" : "text-slate-400"}`}>
                      {pirActive ? "Terdeteksi" : "Tidak Ada"}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">Sensor PIR</span>
                  </div>
                </div>
              )}

              {/* Status bar */}
              {loading ? (
                <div className="px-6 pb-5 animate-pulse">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 h-11"></div>
                </div>
              ) : (
                <div className="px-6 pb-5">
                  <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between ${STATUS_STYLES[heroStatus].badge}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">Status Ruangan</span>
                    <span className="flex items-center gap-1.5 text-xs font-black">
                      <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[heroStatus].dot} ${heroStatus === "Active" ? "animate-pulse" : ""}`} />
                      {STATUS_STYLES[heroStatus].label.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FITUR
      ══════════════════════════════════════════════════════════ */}
      <section id="fitur" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>
              Fitur Unggulan
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Semua yang dibutuhkan untuk pantau kelas
            </h2>
            <p className="mt-4 text-slate-500 text-base leading-relaxed">
              Dari sensor fisik hingga antarmuka digital — SmartClass mengintegrasikan seluruh rantai monitoring dalam satu platform.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="group bg-[var(--background-base)] border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 ${f.bg} ${f.color} rounded-xl flex items-center justify-center`}>
                  <f.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CARA KERJA
      ══════════════════════════════════════════════════════════ */}
      <section id="cara-kerja" className="py-20 bg-[var(--background-base)] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>
              Alur Sistem
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Cara Kerja SmartClass
            </h2>
            <p className="mt-4 text-slate-500 text-base leading-relaxed">
              Data mengalir dari sensor fisik di ruangan hingga ke layar Anda dalam hitungan detik.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">

            {/* Connector line desktop */}
            <div
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px opacity-20"
              style={{ background: "var(--color-primary)" }}
            />

            {STEPS.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center gap-4 group">

                {/* Number badge */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: "var(--color-primary)" }}
                >
                  <step.icon size={26} className="text-white" />
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white"
                    style={{ background: "var(--color-accent)" }}
                  >
                    {i + 1}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>

                {/* Arrow between steps (mobile) */}
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    size={18}
                    className="lg:hidden text-slate-300 mt-1"
                    style={{ transform: "rotate(90deg)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATUS RUANGAN
      ══════════════════════════════════════════════════════════ */}
      <section id="ruangan" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-primary)" }}>
              Status Ruangan
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Kondisi Ruang Kelas Live
            </h2>
            <p className="mt-4 text-slate-500 text-base leading-relaxed">
              Berikut preview 4 ruangan JTI dengan data sensor yang terus diperbarui setiap 4 detik.
            </p>
          </div>

          {/* Room cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 animate-pulse justify-between h-[230px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                    <div className="h-5 bg-slate-200 rounded w-20"></div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-slate-200 rounded w-12"></div>
                      <div className="h-4 bg-slate-200 rounded w-14"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-slate-200 rounded w-16"></div>
                      <div className="h-4 bg-slate-200 rounded w-10"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-slate-200 rounded w-14"></div>
                      <div className="h-4 bg-slate-200 rounded w-12"></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 h-4 bg-slate-100 rounded w-28"></div>
                </div>
              ))
            ) : (
              rooms.map(room => {
                const st = STATUS_STYLES[room.status];
                return (
                  <div
                    key={room.id}
                    className="bg-[var(--background-base)] border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-slate-900">{room.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${room.status === "Active" ? "animate-pulse" : ""}`} />
                        {st.label}
                      </span>
                    </div>

                    {/* Sensor readings */}
                    <div className="flex flex-col gap-2.5">
                      {/* Temp */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Thermometer size={14} className="text-orange-400" /> Suhu
                        </span>
                        <span className="font-bold text-slate-800 tabular-nums">{room.temp.toFixed(1)} °C</span>
                      </div>

                      {/* Humidity */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Droplets size={14} className="text-sky-400" /> Kelembaban
                        </span>
                        <span className="font-bold text-slate-800 tabular-nums">{room.humidity.toFixed(0)} %</span>
                      </div>

                      {/* People */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Users size={14} style={{ color: "var(--color-primary)" }} /> Mahasiswa
                        </span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {room.people > 0 ? `${room.people} orang` : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom label per status */}
                    <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                      {room.status === "Active"    && "Kelas sedang berlangsung"}
                      {room.status === "Booked"    && "Ruangan sedang dibooking"}
                      {room.status === "Scheduled" && "Menunggu jadwal berikutnya"}
                      {room.status === "Empty"     && "Tidak ada kegiatan"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-slate-100 bg-[var(--background-base)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">

          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-sm"
            style={{ background: "var(--color-primary)" }}
          >
            <Monitor size={24} className="text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Siap pantau ruang kelas?
          </h2>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl">
            Masuk ke dashboard SmartClass sekarang dan lihat kondisi setiap ruangan JTI Polinema secara real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all"
              style={{ background: "var(--color-primary)" }}
            >
              <Users size={16} /> Login Sebagai Dosen
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold border-2 border-slate-200 bg-white text-slate-700 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
            >
              Login Sebagai Mahasiswa <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}
            >
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>SmartClass</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400 font-medium text-center">
            © 2026 Jurusan Teknologi Informasi · Politeknik Negeri Malang. Hak cipta dilindungi.
          </p>

          {/* Nav footer */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <button onClick={() => scrollTo("fitur")}     className="hover:text-slate-600 transition-colors">Fitur</button>
            <button onClick={() => scrollTo("cara-kerja")} className="hover:text-slate-600 transition-colors">Cara Kerja</button>
            <button onClick={() => scrollTo("ruangan")}   className="hover:text-slate-600 transition-colors">Ruangan</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
