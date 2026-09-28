import { useState } from "react";
import {
  LayoutDashboard,
  Truck,
  Map,
  Navigation,
  Clock,
  PieChart,
  Camera,
  Settings,
  Moon,
  Globe,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Plane,
  Ship,
  ArrowRight,
  Package,
  Users,
  MessageSquare,
} from "lucide-react";

const CHART_DATA = [
  {day:"Sun",air:45,road:60,sea:35},{day:"Mon",air:55,road:75,sea:50},
  {day:"Tue",air:65,road:55,sea:70},{day:"Wed",air:80,road:85,sea:65},
  {day:"Thu",air:70,road:90,sea:75},{day:"Fri",air:85,road:70,sea:80},
  {day:"Sat",air:60,road:65,sea:55},
];
const TIME_PERIODS = ["Today","This Week","This Month","This Year"] as const;

export function Dashboard() {
  const [activeNav, setActiveNav] = useState<"dashboard"|"shipments"|"users"|"messages">("dashboard");
  const [revenueTab, setRevenueTab] = useState<"All"|"Air"|"Road"|"Sea">("All");
  const [periodIdx, setPeriodIdx] = useState(2);
  const [selectedShipment, setSelectedShipment] = useState<number|null>(null);

  const showAir  = revenueTab === "All" || revenueTab === "Air";
  const showRoad = revenueTab === "All" || revenueTab === "Road";
  const showSea  = revenueTab === "All" || revenueTab === "Sea";

  return (
    <div className="min-h-screen w-screen bg-[#111318] text-slate-200 font-sans flex overflow-hidden text-sm">
      {/* ── Sidebar ── */}
      <aside className="w-[62px] shrink-0 border-r border-white/[0.06] flex flex-col items-center py-5 gap-1 bg-[#111318]">
        {/* Logo */}
        <div className="mb-4 flex items-center justify-center w-10 h-10">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <rect width="32" height="32" rx="8" fill="#1e2130"/>
            <path d="M8 10 Q16 8 24 10" stroke="#7c8cf8" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M8 16 Q16 14 24 16" stroke="#7c8cf8" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M8 22 Q16 20 24 22" stroke="#7c8cf8" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        <SideIcon icon={LayoutDashboard} active={activeNav==="dashboard"} onClick={()=>setActiveNav("dashboard")} label="Dashboard"/>
        <SideIcon icon={Package} active={activeNav==="shipments"} onClick={()=>setActiveNav("shipments")} label="Shipments"/>
        <SideIcon icon={Users} active={activeNav==="users"} onClick={()=>setActiveNav("users")} label="Users"/>
        <SideIcon icon={MessageSquare} active={activeNav==="messages"} onClick={()=>setActiveNav("messages")} label="Messages"/>
        <SideIcon icon={Map} onClick={()=>setActiveNav("dashboard")} label="Fleet Map"/>
        <SideIcon icon={Navigation} label="Routes"/>
        <SideIcon icon={PieChart} label="Analytics"/>
        <SideIcon icon={Settings} label="Settings"/>

        <div className="mt-auto flex flex-col gap-1 items-center">
          <SideIcon icon={Settings} label="Settings"/>
          <SideIcon icon={Moon} label="Theme"/>
          <SideIcon icon={Globe} label="Help"/>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <header className="h-[58px] shrink-0 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#111318]">
          <h1 className="text-lg font-semibold text-white tracking-tight">Welcome Daniel</h1>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search"
                className="bg-[#1a1d27] border border-white/[0.08] rounded-lg pl-8 pr-4 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none w-44"
              />
            </div>

            {/* Date nav */}
            <div className="flex items-center gap-1 bg-[#1a1d27] border border-white/[0.08] rounded-lg px-3 py-1.5">
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-300" />
              <span className="text-xs text-slate-300 mx-2 whitespace-nowrap">Today, 15 Sep, 2025</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-slate-300" />
            </div>

            {/* Bell */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1d27] border border-white/[0.08]">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden ring-2 ring-white/10 flex items-center justify-center">
              <span className="text-xs font-bold text-white">D</span>
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── LEFT COLUMN ── */}
          <div className="w-[390px] shrink-0 flex flex-col border-r border-white/[0.06] overflow-y-auto">

            {/* Dashboard header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="font-semibold text-white text-base">Dashboard</span>
              <button
                onClick={() => setPeriodIdx(i => (i + 1) % TIME_PERIODS.length)}
                className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#1a1d27] border border-white/[0.08] rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
              >
                {TIME_PERIODS[periodIdx]} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 gap-2.5 px-5 pb-4">
              {/* 275 */}
              <div className="relative rounded-2xl overflow-hidden p-4 flex flex-col justify-between min-h-[130px]" style={{background: "linear-gradient(135deg, #2a1a0e 0%, #1c1208 60%, #0d0a06 100%)"}}>
                <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 80% 20%, rgba(255,120,40,0.25) 0%, transparent 65%)"}}/>
                <div className="relative flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Truck className="w-4.5 h-4.5 text-orange-300" style={{width:"18px",height:"18px"}}/>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/15 px-1.5 py-0.5 rounded-full">+6.3%</span>
                </div>
                <div className="relative mt-3">
                  <p className="text-2xl font-bold text-white leading-none">275</p>
                  <p className="text-[10px] text-slate-400 mt-1">Total Active Shipments</p>
                </div>
              </div>

              {/* 1.3k */}
              <div className="relative rounded-2xl overflow-hidden p-4 flex flex-col justify-between min-h-[130px]" style={{background: "linear-gradient(135deg, #0d1a2e 0%, #091424 60%, #060d18 100%)"}}>
                <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.25) 0%, transparent 65%)"}}/>
                <div className="relative flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Clock className="w-4.5 h-4.5 text-blue-300" style={{width:"18px",height:"18px"}}/>
                  </div>
                  <span className="text-[10px] font-semibold text-red-400 bg-red-400/15 px-1.5 py-0.5 rounded-full">-3.9%</span>
                </div>
                <div className="relative mt-3">
                  <p className="text-2xl font-bold text-white leading-none">1.3k</p>
                  <p className="text-[10px] text-slate-400 mt-1">Total Pending Shipments</p>
                </div>
              </div>

              {/* 5.7k */}
              <div className="relative rounded-2xl overflow-hidden p-4 flex flex-col justify-between min-h-[130px]" style={{background: "linear-gradient(135deg, #0a1e18 0%, #071510 60%, #040d09 100%)"}}>
                <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 80% 80%, rgba(20,184,166,0.2) 0%, transparent 65%)"}}/>
                <div className="relative flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Ship className="w-4.5 h-4.5 text-teal-300" style={{width:"18px",height:"18px"}}/>
                  </div>
                  <span className="text-[10px] font-semibold text-red-400 bg-red-400/15 px-1.5 py-0.5 rounded-full">-6.2%</span>
                </div>
                <div className="relative mt-3">
                  <p className="text-2xl font-bold text-white leading-none">5.7k</p>
                  <p className="text-[10px] text-slate-400 mt-1">Total Delivered Shipments</p>
                </div>
              </div>

              {/* $5.3m */}
              <div className="relative rounded-2xl overflow-hidden p-4 flex flex-col justify-between min-h-[130px]" style={{background: "linear-gradient(135deg, #140e24 0%, #0e0918 60%, #080610 100%)"}}>
                <div className="absolute inset-0" style={{background: "radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.25) 0%, transparent 65%)"}}/>
                <div className="relative flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <PieChart className="w-4.5 h-4.5 text-purple-300" style={{width:"18px",height:"18px"}}/>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/15 px-1.5 py-0.5 rounded-full">+5.6%</span>
                </div>
                <div className="relative mt-3">
                  <p className="text-2xl font-bold text-white leading-none">$5.3m</p>
                  <p className="text-[10px] text-slate-400 mt-1">Total Revenue</p>
                </div>
              </div>
            </div>

            {/* Shipment List */}
            <div className="flex-1 px-5 pb-5">
              <div className="bg-[#161920] rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">Shipment List</span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-500 cursor-pointer" />
                </div>

                <div className="divide-y divide-white/[0.04]">
                  <ShipCard
                    id="#SH-2024-001" idx={0}
                    status="In-transit" statusColor="text-emerald-400" statusBg="bg-emerald-500/15"
                    from="New York, NY" to="Los Angeles, CA" date="Sep 27, 2025" eta="Sep 30, 2025"
                    mode="Road" company="Acme Corporation" modeIcon="truck"
                    selected={selectedShipment===0} onSelect={() => setSelectedShipment(s => s===0?null:0)}
                  />
                  <ShipCard
                    id="#SH-2024-002" idx={1}
                    status="Pending" statusColor="text-orange-400" statusBg="bg-orange-500/15"
                    from="Chicago, IL" to="Houston, TX" date="Sep 17, 2025" eta="Sep 28, 2025"
                    mode="Air" company="Globex Industries" modeIcon="plane"
                    selected={selectedShipment===1} onSelect={() => setSelectedShipment(s => s===1?null:1)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            {/* Live Fleet Location */}
            <div className="border-b border-white/[0.06] flex flex-col" style={{height:"54%"}}>
              <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
                <span className="font-semibold text-white text-base">Live Fleet Location</span>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#1e2130] border border-white/[0.08] rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
                    <Plus className="w-3 h-3" /> New Vehicle
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#1e2130] border border-white/[0.08] rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
                    <Plus className="w-3 h-3" /> New Shipment
                  </button>
                </div>
              </div>

              <div className="flex-1 flex gap-0 px-5 pb-4 min-h-0">
                {/* Map area */}
                <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#0d1020] border border-white/[0.06]">
                  {/* World map SVG silhouette */}
                  <svg viewBox="0 0 800 420" className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
                    <path fill="#3b4a6b" d="M120,80 Q150,60 200,70 Q230,75 260,65 Q290,55 310,70 Q330,80 350,75 Q380,65 400,75 Q420,85 440,80 Q470,70 500,75 Q530,80 550,70 Q570,60 590,65 Q620,75 640,80 Q660,85 680,75 L680,160 Q660,170 640,165 Q620,155 600,160 Q580,170 560,165 Q540,155 520,160 Q500,170 480,165 Q460,155 440,165 Q420,175 400,170 Q380,160 360,170 Q340,180 320,175 Q300,165 280,170 Q260,180 240,175 Q220,165 200,170 Q180,175 160,165 Q140,155 120,160 Z"/>
                    <path fill="#3b4a6b" d="M60,120 Q80,110 100,115 Q120,125 140,120 L140,200 Q120,210 100,205 Q80,195 60,200 Z"/>
                    <path fill="#2d3a55" d="M200,180 Q240,170 280,180 Q320,190 360,185 Q400,175 440,185 Q480,195 520,190 Q560,180 600,190 L600,280 Q560,290 520,285 Q480,275 440,280 Q400,290 360,285 Q320,275 280,280 Q240,290 200,285 Z"/>
                    <path fill="#3b4a6b" d="M300,290 Q340,280 380,290 Q420,300 460,295 Q500,285 530,295 L530,350 Q500,360 460,355 Q420,345 380,350 Q340,360 300,355 Z"/>
                    <path fill="#2d3a55" d="M450,80 Q490,70 530,80 Q570,90 610,85 L610,140 Q570,150 530,145 Q490,135 450,140 Z"/>
                    <path fill="#3b4a6b" d="M140,220 Q160,210 180,220 Q200,230 220,225 L220,300 Q200,310 180,305 Q160,295 140,300 Z"/>
                    {/* Dotted route */}
                    <path d="M160,280 Q300,220 440,200 Q550,190 640,160" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5 6" opacity="0.3"/>
                    <path d="M440,200 Q500,260 560,300" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="5 6" opacity="0.3"/>
                  </svg>

                  {/* Vehicle pins */}
                  <MapPin top="60%" left="20%" color="bg-[#b45309]" icon="truck" label="In Transit(5h)" showLabel />
                  <MapPin top="48%" left="38%" color="bg-[#1e40af]" icon="plane" />
                  <MapPin top="35%" left="55%" color="bg-[#5b4a2e]" icon="truck" />
                  <MapPin top="28%" left="72%" color="bg-[#065f46]" icon="ship" />
                  <MapPin top="18%" left="83%" color="bg-[#1d4a3a]" icon="ship" />
                  <MapPin top="42%" left="12%" color="bg-[#3b1f6e]" icon="truck" />

                  {/* Legend */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Plane className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] text-slate-400">Air</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-slate-400">Road</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ship className="w-3 h-3 text-teal-400" />
                      <span className="text-[10px] text-slate-400">Sea</span>
                    </div>
                  </div>
                </div>

                {/* Tracking card */}
                <div className="w-[200px] shrink-0 ml-3 bg-[#161920] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col">
                  {/* Plane image placeholder */}
                  <div className="h-[100px] shrink-0 relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
                    <div className="absolute inset-0" style={{background:"linear-gradient(135deg,#0e4a6e 0%,#0a2a4a 50%,#051520 100%)"}} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-60">
                      <Plane className="w-12 h-12 text-sky-300" style={{transform:"rotate(-10deg)"}}/>
                    </div>
                  </div>

                  <div className="flex-1 p-3">
                    <p className="text-[10px] text-slate-400 font-mono mb-3">#SH-2024-001</p>
                    <div className="flex flex-col gap-2.5">
                      <TrackStep label="Packaging" time="09:15" done />
                      <TrackStep label="In Transit" time="12:00" active />
                      <TrackStep label="Out for Delivery" time="19:30" />
                      <TrackStep label="Delivered" time="18:00" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex flex-1 min-h-0 divide-x divide-white/[0.06]">

              {/* Revenue Trends */}
              <div className="flex-1 flex flex-col p-5 min-w-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <span className="font-semibold text-white text-sm">Revenue Trends</span>
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 shrink-0">
                  {(["All","Air","Road","Sea"] as const).map((t) => (
                    <button key={t} onClick={() => setRevenueTab(t)} className={`text-[10px] px-3 py-1 rounded-full transition-colors ${revenueTab===t ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}>{t}</button>
                  ))}
                </div>

                {/* Chart */}
                <div className="flex-1 flex min-h-0">
                  {/* Y-axis */}
                  <div className="flex flex-col justify-between items-end pr-2 pb-5 text-[9px] text-slate-600 shrink-0">
                    {["$640k","$320k","$160k","$80k","$40k","$10k"].map(l => <span key={l}>{l}</span>)}
                  </div>

                  {/* Bars */}
                  <div className="flex-1 flex items-end gap-1.5 pb-5 relative min-w-0">
                    {/* Grid lines */}
                    {[0,20,40,60,80,100].map(p => (
                      <div key={p} className="absolute left-0 right-0 h-px bg-white/[0.04]" style={{bottom:`${p}%`}} />
                    ))}

                    {CHART_DATA.map(({day, air, road, sea}) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-0 min-w-0">
                        <div className="w-full flex items-end gap-[2px] h-[100px]">
                          {showAir  && <div className="flex-1 rounded-t-sm bg-[#2563eb] transition-all duration-300" style={{height:`${air}%`}} />}
                          {showRoad && <div className="flex-1 rounded-t-sm bg-[#ea580c] transition-all duration-300" style={{height:`${road}%`}} />}
                          {showSea  && <div className="flex-1 rounded-t-sm bg-[#0d9488] transition-all duration-300" style={{height:`${sea}%`}} />}
                        </div>
                        <span className="text-[9px] text-slate-600 mt-1.5">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 shrink-0 mt-1">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2563eb] inline-block"/><span className="text-[10px] text-slate-400">Air</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#ea580c] inline-block"/><span className="text-[10px] text-slate-400">Road</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#0d9488] inline-block"/><span className="text-[10px] text-slate-400">Sea</span></div>
                </div>
              </div>

              {/* Fleet Status */}
              <div className="w-[240px] shrink-0 flex flex-col p-5">
                <div className="flex items-center justify-between mb-5 shrink-0">
                  <span className="font-semibold text-white text-sm">Fleet Status</span>
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </div>

                <div className="flex flex-col gap-5 flex-1 justify-center">
                  <FleetMetric
                    pct="68%"
                    label="Fleet Efficiency"
                    desc="Overall fleet performance based on uptime, fuel efficiency, and maintenance compliance"
                    barColor="bg-slate-400"
                    fill={68}
                  />
                  <FleetMetric
                    pct="91%"
                    label="Fuel Efficiency"
                    desc="Average fuel-efficiency across all vehicles compared to industry standards."
                    barColor="bg-slate-400"
                    fill={91}
                  />
                  <FleetMetric
                    pct="83%"
                    label="Maintenance Compliance"
                    desc="Percentage of vehicles with up-to-date maintenance schedules"
                    barColor="bg-slate-400"
                    fill={83}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function SideIcon({ icon: Icon, active, onClick, label }: { icon: React.ElementType; active?: boolean; onClick?: () => void; label?: string }) {
  return (
    <button title={label} onClick={onClick} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-400 hover:bg-white/5"}`}>
      <Icon className="w-4.5 h-4.5" style={{width:"18px",height:"18px"}} />
    </button>
  );
}

function MapPin({ top, left, color, icon, label, showLabel }: {
  top: string; left: string; color: string; icon: string; label?: string; showLabel?: boolean;
}) {
  const Icon = icon === "truck" ? Truck : icon === "plane" ? Plane : Ship;
  return (
    <div className="absolute" style={{ top, left, transform: "translate(-50%,-50%)" }}>
      {showLabel && label && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white/90 text-slate-900 text-[9px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
          {label}
        </div>
      )}
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shadow-lg border-2 border-white/20`}>
        <Icon className="w-4 h-4 text-white" style={{width:"15px",height:"15px"}} />
      </div>
    </div>
  );
}

function ShipCard({ id, idx, status, statusColor, statusBg, from, to, date, eta, mode, company, modeIcon, selected, onSelect }: {
  id: string; idx?: number; status: string; statusColor: string; statusBg: string;
  from: string; to: string; date: string; eta: string; mode: string; company: string; modeIcon: string;
  selected?: boolean; onSelect?: () => void;
}) {
  const Icon = modeIcon === "truck" ? Truck : Plane;
  return (
    <div onClick={onSelect} className={`p-4 transition-colors cursor-pointer border-l-2 ${selected ? "bg-white/[0.06] border-blue-500" : "hover:bg-white/[0.04] border-transparent"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-500 font-mono">{id}</span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor} ${statusBg}`}>{status}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-white text-sm">{from}</span>
        <div className="flex items-center gap-0.5 text-slate-500">
          <span className="text-[10px]">—</span>
          <ArrowRight className="w-3 h-3" />
          <span className="text-[10px]">—</span>
        </div>
        <span className="font-semibold text-white text-sm">{to}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{date}</span>
        <span>ETA: {eta}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Icon className="w-3 h-3" style={{width:"12px",height:"12px"}} />
          <span>{mode}</span>
        </div>
        <span className="text-[10px] text-slate-500">{company}</span>
      </div>
    </div>
  );
}

function TrackStep({ label, time, done, active }: { label: string; time: string; done?: boolean; active?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col items-center mt-0.5">
        <div className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" : done ? "bg-slate-500" : "border border-slate-600"}`} />
        <div className="w-px flex-1 bg-white/[0.06] mt-0.5" style={{minHeight:"12px"}} />
      </div>
      <div className="flex items-center justify-between flex-1 -mt-0.5">
        <span className={`text-[10px] ${active ? "text-white font-semibold" : done ? "text-slate-400" : "text-slate-600"}`}>{label}</span>
        <span className={`text-[10px] ${active ? "text-blue-400" : "text-slate-600"}`}>{time}</span>
      </div>
    </div>
  );
}

function FleetMetric({ pct, label, desc, fill }: { pct: string; label: string; desc: string; barColor?: string; fill: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-2xl font-bold text-white">{pct}</span>
        <span className="text-[10px] text-slate-400 text-right max-w-[120px]">{label}</span>
      </div>
      <p className="text-[9px] text-slate-600 mb-2 leading-relaxed">{desc}</p>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full bg-slate-400 rounded-full" style={{width:`${fill}%`}} />
      </div>
    </div>
  );
}
