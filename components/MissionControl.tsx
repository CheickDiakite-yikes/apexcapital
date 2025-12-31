
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, Zap, BarChart3, PieChart, Lock, Globe, Cpu, TrendingUp, AlertTriangle, Link as LinkIcon, FileText, Layers, Percent, Target, Shield, Briefcase, Calendar, ArrowRight, Radio, Newspaper, Terminal, Send, Network, Microscope, ArrowUpRight, ArrowDownRight, Plus, User, ScatterChart as ScatterIcon, Download, Printer, Sparkles, Save, Radar, BrainCircuit, History, Table, Clock, MoveUpRight, MoveDownRight, Smartphone, Eye, Users, Gauge, BarChart4, ShieldAlert } from 'lucide-react';
import { analyzeCompany, getBreakingNews, askAlphaAgent, generateInsightImage } from '../services/geminiService';
import { AnalysisStatus, FullAnalysis, AgentLog, Statement, FinancialRatios, InvestmentThesis, NewsItem, ChatMessage, ResearchMemo, Ratio, StationQuota, ValuationComp } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend, ComposedChart, ReferenceLine } from 'recharts';

// --- QUOTA CONSTANTS ---
const SEARCH_LIMIT = 10;
const QUOTA_STORAGE_KEY = 'apex_station_metadata';

// --- MOCK DATA FOR DASHBOARD ---

const PORTFOLIO_DATA_INIT = [
  { ticker: "NVDA", shares: 150, avgCost: 420.50, price: 892.10, change: 2.4, pnl: 70740 },
  { ticker: "MSFT", shares: 200, avgCost: 310.20, price: 415.30, change: 0.8, pnl: 21020 },
  { ticker: "PLTR", shares: 1000, avgCost: 14.50, price: 24.80, change: -1.2, pnl: 10300 },
  { ticker: "AMD", shares: 300, avgCost: 95.00, price: 178.40, change: 3.1, pnl: 25020 },
  { ticker: "COIN", shares: 50, avgCost: 85.00, price: 245.60, change: 5.4, pnl: 8030 },
  { ticker: "TSLA", shares: 100, avgCost: 210.00, price: 175.20, change: -2.5, pnl: -3480 },
  { ticker: "GOOGL", shares: 120, avgCost: 115.00, price: 168.90, change: 0.4, pnl: 6468 },
  { ticker: "AMZN", shares: 150, avgCost: 130.00, price: 182.50, change: 1.1, pnl: 7875 },
  { ticker: "META", shares: 80, avgCost: 280.00, price: 495.20, change: -0.5, pnl: 17216 },
  { ticker: "SOFI", shares: 2000, avgCost: 8.50, price: 7.20, change: -1.8, pnl: -2600 },
];

const SUGGESTED_OPPORTUNITIES = [
  { ticker: "ARM", name: "Arm Holdings", sector: "Semiconductors", reason: "AI edge computing adoption driving royalty revenue supercycle.", volatility: "HIGH" },
  { ticker: "CRWD", name: "CrowdStrike", sector: "Cybersecurity", reason: "Platform consolidation trend benefiting market leaders.", volatility: "MED" },
  { ticker: "LLY", name: "Eli Lilly", sector: "Healthcare", reason: "GLP-1 market dominance and pipeline expansion.", volatility: "MED" },
  { ticker: "SMCI", name: "Super Micro", sector: "Hardware", reason: "Liquid cooling demand for next-gen data centers.", volatility: "EXTREME" },
  { ticker: "PATH", name: "UiPath", sector: "Software", reason: "Agentic AI integration into enterprise workflows.", volatility: "HIGH" },
  { ticker: "CELH", name: "Celsius", sector: "Consumer", reason: "International expansion and distribution velocity.", volatility: "HIGH" },
  { ticker: "VRT", name: "Vertiv", sector: "Industrials", reason: "Critical thermal management infrastructure for AI.", volatility: "MED" },
  { ticker: "IONQ", name: "IonQ", sector: "Quantum", reason: "Technological breakthrough in error correction anticipated.", volatility: "EXTREME" },
];

// --- UTILITIES ---

const downloadCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => 
      JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)
    ).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getStationQuota = (): StationQuota => {
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (saved) {
        const parsed: StationQuota = JSON.parse(saved);
        if (parsed.lastResetMonth !== currentMonth) {
            return {
                ...parsed,
                searchCount: 0,
                lastResetMonth: currentMonth
            };
        }
        return parsed;
    }

    // New User Fingerprint
    const stationId = `APX-${Math.floor(Math.random() * 999)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    return {
        searchCount: 0,
        lastResetMonth: currentMonth,
        stationId
    };
}

const saveStationQuota = (quota: StationQuota) => {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quota));
}

// --- CUSTOM HOOKS ---

const useMarketSimulation = (initialData: typeof PORTFOLIO_DATA_INIT) => {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(currentData => currentData.map(item => {
        // Simulate random price movement
        const volatility = 0.0015; // 0.15% volatility per tick
        const move = 1 + (Math.random() * volatility * 2 - volatility);
        const newPrice = item.price * move;
        
        // Update Change % (simulating daily volatility)
        const changeJitter = (Math.random() * 0.04 - 0.02);
        const newChange = item.change + changeJitter;
        
        // Recalculate Unrealized P&L
        const newPnl = (newPrice - item.avgCost) * item.shares;
        
        return {
          ...item,
          price: newPrice,
          change: newChange,
          pnl: newPnl
        };
      }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return data;
};

// --- UI Components for Sci-Fi Look ---

const Panel = ({ children, className = "", title, icon: Icon, onDownload }: any) => (
  <div className={`relative bg-slate-900/80 border border-cyan-900/50 backdrop-blur-sm p-4 overflow-hidden group ${className}`}>
    {/* Decorative Corners */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
    
    {/* Header */}
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-4 border-b border-cyan-900/30 pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-cyan-400" />}
          <h3 className="text-sm font-bold text-cyan-100 tracking-widest uppercase font-mono">{title}</h3>
        </div>
        {onDownload && (
           <button onClick={onDownload} className="text-slate-500 hover:text-cyan-400 transition-colors" title="Download CSV">
              <Download size={14} />
           </button>
        )}
      </div>
    )}
    {children}
  </div>
);

const LivePriceDisplay = ({ price }: { price: number }) => {
  const [currentPrice, setCurrentPrice] = useState(price);
  const [direction, setDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const volatility = price * 0.0005; // 0.05% volatility
      const change = (Math.random() - 0.5) * volatility;
      const newPrice = currentPrice + change;
      
      setDirection(newPrice > currentPrice ? 'up' : 'down');
      setCurrentPrice(newPrice);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPrice, price]);

  return (
    <div className="flex items-baseline gap-2">
       <span className={`text-3xl font-mono font-bold ${direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-white'}`}>
          ${currentPrice.toFixed(2)}
       </span>
       <span className={`text-xs font-bold px-1 rounded ${direction === 'up' ? 'bg-green-900/50 text-green-400' : direction === 'down' ? 'bg-red-900/50 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
          LIVE
       </span>
    </div>
  );
};

const MetricCard = ({ label, value, subValue, trend, isLivePrice }: any) => (
  <div className="bg-black/40 border-l-2 border-cyan-500 p-3 hover:bg-cyan-950/10 transition-colors">
    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
    {isLivePrice && typeof value === 'number' ? (
        <LivePriceDisplay price={value} />
    ) : (
        <div className="text-xl font-bold text-white font-mono">{value}</div>
    )}
    {subValue && <div className={`text-xs mt-1 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>{subValue}</div>}
  </div>
);

const TickerTape = () => {
  const [tickers] = useState([
    { s: "S&P 500", p: 5245.12, c: "+0.45%" },
    { s: "NASDAQ", p: 16420.88, c: "+0.92%" },
    { s: "DJIA", p: 39102.50, c: "-0.12%" },
    { s: "VIX", p: 13.45, c: "-2.10%" },
    { s: "US10Y", p: 4.21, c: "+0.02" },
    { s: "BTC/USD", p: 68450.00, c: "+1.50%" },
    { s: "ETH/USD", p: 3890.00, c: "+2.10%" },
    { s: "CL=F", p: 78.50, c: "+0.80%" },
    { s: "GC=F", p: 2180.40, c: "+0.30%" },
  ]);

  return (
    <div className="w-full bg-black border-b border-cyan-900/50 overflow-hidden py-1">
      <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap gap-8">
        {[...tickers, ...tickers].map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-xs">
            <span className="text-cyan-500 font-bold">{t.s}</span>
            <span className="text-white">{t.p}</span>
            <span className={t.c.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{t.c}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const NewsWire = ({ news }: { news: NewsItem[] }) => {
    if (!news || news.length === 0) return (
        <div className="text-center text-xs text-slate-500 py-4 italic">No recent wire updates.</div>
    );

    return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {news.map((item, idx) => (
                <div key={idx} className="border-l-2 border-slate-800 pl-3 py-1 hover:border-cyan-500 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            item.type === 'M&A' ? 'border-purple-900 text-purple-400 bg-purple-900/20' :
                            item.type === 'EARNINGS' ? 'border-green-900 text-green-400 bg-green-900/20' :
                            item.type === 'RUMOR' ? 'border-yellow-900 text-yellow-400 bg-yellow-900/20' :
                            'border-slate-800 text-slate-400'
                        }`}>
                            {item.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug group-hover:text-cyan-100 transition-colors mb-1">
                        {item.headline}
                    </p>
                    <div className="flex justify-between items-center">
                         <span className="text-[10px] text-slate-600 uppercase">{item.source}</span>
                         {item.sentiment !== 'NEUTRAL' && (
                             <span className={`w-2 h-2 rounded-full ${item.sentiment === 'POSITIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                         )}
                    </div>
                </div>
            ))}
        </div>
    )
}


const AgentLoader = ({ logs }: { logs: AgentLog[] }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-cyan-900/50 rounded-full animate-[spin_3s_linear_infinite]"></div>
        <div className="absolute inset-2 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1s_linear_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
          <Cpu size={32} />
        </div>
      </div>
      <div className="w-full max-w-lg bg-black/80 border border-cyan-900/50 p-4 font-mono text-xs h-48 overflow-y-auto font-mono">
        {logs.map((log) => (
          <div key={log.id} className="mb-2 border-b border-dashed border-slate-800 pb-1 last:border-0">
            <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
            <span className={`ml-2 font-bold ${
              log.agent === 'SCOUT' ? 'text-yellow-400' : 
              log.agent === 'ANALYST' ? 'text-cyan-400' : 
              log.agent === 'ASSOCIATE' ? 'text-purple-400' : 
              log.agent === 'VP' ? 'text-green-400' : 'text-rose-500'
            }`}>{log.agent}</span>: <span className="text-slate-300 typing-effect">{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

// --- Data Visualization Components ---

const FinancialChart = ({ data, title }: { data: any[], title: string }) => {
    if (!data || data.length === 0) return null;
    
    // Transform for Recharts
    const years = data[0].historical.length + data[0].projected.length;
    const startYear = new Date().getFullYear() - data[0].historical.length;
    
    const chartData = Array.from({ length: years }).map((_, i) => {
       const yearLabel = startYear + i;
       const obj: any = { year: yearLabel };
       data.forEach(row => {
           const allValues = [...row.historical, ...row.projected];
           obj[row.metric] = allValues[i];
       });
       return obj;
    });

    // Dynamic colors based on row index
    const colors = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

    return (
        <div className="w-full h-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        {colors.map((color, i) => (
                             <linearGradient key={i} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={color} stopOpacity={0}/>
                            </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{fontSize: 10}} />
                    <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                    />
                    {data.map((row, idx) => (
                        <Area 
                            key={row.metric}
                            type="monotone" 
                            dataKey={row.metric} 
                            stroke={colors[idx % colors.length]} 
                            fillOpacity={1} 
                            fill={`url(#color${idx % colors.length})`} 
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

const ValuationFootballField = ({ dcf, comps }: { dcf: any, comps: any[] }) => {
    const dcfMin = dcf.sharePriceTarget * 0.85;
    const dcfMax = dcf.sharePriceTarget * 1.15;
    const compMin = dcf.sharePriceTarget * 0.8;
    const compMax = dcf.sharePriceTarget * 1.1;

    const data = [
        { name: '52w Low-High', min: dcf.sharePriceTarget * 0.7, max: dcf.sharePriceTarget * 0.9 }, 
        { name: 'Comps', min: compMin, max: compMax },
        { name: 'DCF (Perpetuity)', min: dcfMin, max: dcfMax },
    ];

    return (
        <div className="h-full w-full font-mono">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={data} margin={{ left: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                     <XAxis type="number" domain={['auto', 'auto']} stroke="#64748b" tick={{fontSize: 10}} />
                     <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{fontSize: 10}} />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490' }} />
                     <Bar dataKey="min" stackId="a" fill="transparent" />
                     <Bar dataKey="max" stackId="a" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 2 ? '#10b981' : '#3b82f6'} />
                        ))}
                     </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

const SensitivityMatrix = ({ baseWacc, baseGrowth, basePrice }: { baseWacc: number, baseGrowth: number, basePrice: number }) => {
    // Generate range around base case
    const waccSteps = [-0.01, -0.005, 0, 0.005, 0.01];
    const growthSteps = [-0.005, -0.0025, 0, 0.0025, 0.005];

    // Simple sensitivity logic: Price roughly inverse to WACC, proportional to Growth
    const calculatePrice = (w: number, g: number) => {
        const waccDelta = (baseWacc - w) * 100;
        const growthDelta = (g - baseGrowth) * 100;
        const percentChange = (waccDelta * 15) + (growthDelta * 10); 
        return basePrice * (1 + percentChange / 100);
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-center text-xs font-mono border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-slate-500 bg-slate-900/50 border border-slate-800">WACC \ g</th>
                        {growthSteps.map((g, i) => (
                            <th key={i} className="p-2 text-cyan-400 bg-slate-900/50 border border-slate-800">{(g + baseGrowth * 1).toFixed(2)}%</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {waccSteps.map((w, rowIdx) => (
                        <tr key={rowIdx}>
                             <td className="p-2 text-purple-400 font-bold bg-slate-900/50 border border-slate-800">{(w + baseWacc * 1).toFixed(2)}%</td>
                             {growthSteps.map((g, colIdx) => {
                                 const price = calculatePrice(w + baseWacc, g + baseGrowth);
                                 const isBase = w === 0 && g === 0;
                                 const diff = (price - basePrice) / basePrice;
                                 const colorClass = isBase ? 'bg-cyan-900 text-white border-2 border-cyan-400' : 
                                                    diff > 0.1 ? 'bg-green-900/30 text-green-400' :
                                                    diff > 0 ? 'bg-green-900/10 text-green-200' :
                                                    diff < -0.1 ? 'bg-red-900/30 text-red-400' : 'bg-red-900/10 text-red-200';
                                 
                                 return (
                                     <td key={colIdx} className={`p-2 border border-slate-800 ${colorClass}`}>
                                         ${price.toFixed(2)}
                                     </td>
                                 )
                             })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CompsScatterPlot = ({ comps }: { comps: any[] }) => {
    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="revenueGrowth" name="Rev Growth" unit="%" stroke="#64748b" tick={{fontSize: 10}} label={{ value: 'Revenue Growth %', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="number" dataKey="evEbitda" name="EV/EBITDA" unit="x" stroke="#64748b" tick={{fontSize: 10}} label={{ value: 'EV / EBITDA', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490', color: '#fff' }} />
                    <Scatter name="Peers" data={comps} fill="#8884d8">
                        {comps.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.ticker === 'TARGET' ? '#06b6d4' : '#8b5cf6'} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

const RuleOf40Chart = ({ comps }: { comps: ValuationComp[] }) => {
    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" dataKey="revenueGrowth" name="Rev Growth" unit="%" stroke="#64748b" tick={{fontSize: 10}} label={{ value: 'Revenue Growth %', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis type="number" dataKey="ebitdaMargin" name="EBITDA Margin" unit="%" stroke="#64748b" tick={{fontSize: 10}} label={{ value: 'EBITDA Margin %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }} 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490', color: '#fff' }}
                        formatter={(value: any, name: any, props: any) => {
                             if (name === 'Rev Growth') return [`${value}%`, name];
                             if (name === 'EBITDA Margin') return [`${value}%`, name];
                             return [value, name];
                        }}
                    />
                    <Scatter name="Peers" data={comps}>
                        {comps.map((entry, index) => {
                            const score = entry.revenueGrowth + entry.ebitdaMargin;
                            return <Cell key={`cell-${index}`} fill={score >= 40 ? '#10b981' : '#ef4444'} />;
                        })}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}

const AIRadarChart = ({ risk }: { risk: any }) => {
  const data = [
    { subject: 'Replacement', A: risk.replacementProbability, fullMark: 100 },
    { subject: 'Vibecode Risk', A: risk.vibecodeSensitivity, fullMark: 100 },
    { subject: 'Legacy Debt', A: risk.innovationLag === 'LAGGARD' ? 90 : risk.innovationLag === 'PARITY' ? 50 : 20, fullMark: 100 },
    { subject: 'Overall Risk', A: risk.riskScore, fullMark: 100 },
  ];

  return (
    <div className="w-full h-full">
       <ResponsiveContainer width="100%" height="100%">
         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
           <PolarGrid stroke="#1e293b" />
           <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
           <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{fontSize: 10}} />
           <Radar name="Risk" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
           <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#ef4444', color: '#fff' }} />
         </RadarChart>
       </ResponsiveContainer>
    </div>
  );
};

const InsiderTrades = ({ transactions }: { transactions: any[] }) => {
    if (!transactions || transactions.length === 0) return <div className="text-slate-500 text-xs italic">No recent insider activity reported.</div>;
    
    return (
        <div className="space-y-2">
            {transactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b border-slate-800 last:border-0 hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                         <div className={`w-1 h-8 ${t.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <div>
                             <div className="text-xs text-white font-bold">{t.name}</div>
                             <div className="text-[10px] text-slate-500 uppercase">{t.role}</div>
                         </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-xs font-mono font-bold ${t.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {t.type} {t.amount}
                        </div>
                        <div className="text-[10px] text-slate-600">{t.date}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ScoreBar = ({ score, label, icon: Icon }: { score: number, label: string, icon: any }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold">
        <Icon size={12} /> {label}
      </div>
      <div className="text-xs font-mono font-bold text-white">{score}/5</div>
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <div 
          key={s} 
          className={`h-1.5 flex-1 rounded-sm ${s <= score ? 'bg-cyan-500' : 'bg-slate-800'}`}
        />
      ))}
    </div>
  </div>
);

const ScenarioBar = ({ thesis, currentPrice }: { thesis: InvestmentThesis, currentPrice: number }) => {
  const min = Math.min(thesis.targetPriceBear, currentPrice) * 0.9;
  const max = Math.max(thesis.targetPriceBull, currentPrice) * 1.1;
  const range = max - min;
  
  const getPos = (val: number) => {
      const pos = ((val - min) / range) * 100;
      return Math.max(0, Math.min(100, pos));
  }

  return (
    <div className="relative h-12 w-full mt-6 mb-2">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 rounded"></div>
      
      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${getPos(thesis.targetPriceBear)}%` }}>
         <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-black z-10"></div>
         <div className="mt-2 text-[10px] text-red-500 font-bold">${thesis.targetPriceBear}</div>
         <div className="text-[9px] text-slate-500 uppercase">Bear</div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${getPos(thesis.targetPriceBase)}%` }}>
         <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-black z-10"></div>
         <div className="mt-2 text-[10px] text-blue-500 font-bold">${thesis.targetPriceBase}</div>
         <div className="text-[9px] text-slate-500 uppercase">Base</div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${getPos(thesis.targetPriceBull)}%` }}>
         <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-black z-10"></div>
         <div className="mt-2 text-[10px] text-green-500 font-bold">${thesis.targetPriceBull}</div>
         <div className="text-[9px] text-slate-500 uppercase">Bull</div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-20" style={{ left: `${getPos(currentPrice)}%` }}>
         <div className="w-4 h-4 bg-white rotate-45 border-2 border-cyan-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
         <div className="mb-4 text-xs text-white font-bold bg-slate-900 px-1 rounded border border-slate-700">${currentPrice}</div>
      </div>
    </div>
  );
};

const FinancialStatementTable = ({ statement }: { statement: Statement }) => {
    if (!statement || !statement.rows || statement.rows.length === 0) return null;
    
    const currentYear = new Date().getFullYear();
    const histLen = statement.rows[0].historical.length;
    const historicalYears = statement.rows[0].historical.map((_, i) => currentYear - (histLen - i));
    const projectedYears = statement.rows[0].projected.map((_, i) => currentYear + 1 + i);

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                        <th className="p-2 bg-slate-900/80 sticky left-0 z-10 border-r border-slate-800">METRIC ({statement.rows[0].unit})</th>
                        {historicalYears.map(y => <th key={y} className="p-2 text-right">{y}A</th>)}
                        {projectedYears.map(y => <th key={y} className="p-2 text-right text-cyan-400 bg-cyan-900/10">{y}E</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {statement.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-2 bg-slate-900/80 sticky left-0 z-10 border-r border-slate-800 font-bold text-slate-300 truncate max-w-[150px]">{row.metric}</td>
                            {row.historical.map((val, idx) => (
                                <td key={`h-${idx}`} className="p-2 text-right text-slate-400">{val.toLocaleString()}</td>
                            ))}
                            {row.projected.map((val, idx) => (
                                <td key={`p-${idx}`} className="p-2 text-right text-cyan-300 bg-cyan-900/5">{val.toLocaleString()}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const RatiosGrid = ({ ratios }: { ratios: FinancialRatios }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[
      { title: 'Profitability', data: ratios.profitability, color: 'text-green-400', border: 'border-green-900/30' },
      { title: 'Liquidity', data: ratios.liquidity, color: 'text-blue-400', border: 'border-blue-900/30' },
      { title: 'Solvency', data: ratios.solvency, color: 'text-red-400', border: 'border-red-900/30' },
      { title: 'Efficiency', data: ratios.efficiency, color: 'text-yellow-400', border: 'border-yellow-900/30' }
    ].map((cat) => (
      <div key={cat.title} className={`bg-slate-900/50 border ${cat.border} p-4 rounded`}>
        <h4 className={`text-xs uppercase font-bold mb-4 ${cat.color}`}>{cat.title}</h4>
        <div className="space-y-3">
          {cat.data.map((r, i) => (
            <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0">
              <span className="text-xs text-slate-400">{r.name}</span>
              <span className="text-sm font-mono font-bold text-white">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ResearchReport = ({ data }: { data: FullAnalysis }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);

  useEffect(() => {
     if (data.researchMemo.imagePrompt && !imageUrl && !generatingImg) {
         setGeneratingImg(true);
         generateInsightImage(data.researchMemo.imagePrompt)
            .then(url => {
                if (url) setImageUrl(url);
            })
            .finally(() => setGeneratingImg(false));
     }
  }, [data.researchMemo.imagePrompt]);

  return (
    <div className="max-w-4xl mx-auto bg-white text-black font-serif p-8 md:p-12 shadow-2xl relative overflow-hidden min-h-screen">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <div className="text-6xl md:text-9xl font-bold uppercase -rotate-45">Confidential</div>
        </div>

        <div className="border-b-4 border-black pb-4 mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h1 className="text-4xl font-bold uppercase tracking-tight">{data.profile.name}</h1>
                <div className="text-sm font-sans uppercase tracking-widest mt-2 text-slate-600">Equity Research | {data.profile.ticker} | {data.profile.sector}</div>
            </div>
            <div className="text-left md:text-right">
                <div className={`text-2xl font-bold uppercase ${data.thesis.rating === 'BUY' ? 'text-green-700' : data.thesis.rating === 'SELL' ? 'text-red-700' : 'text-yellow-700'}`}>{data.thesis.rating}</div>
                <div className="text-sm font-sans">Target: ${data.thesis.targetPriceBase}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
                <h2 className="text-2xl font-bold mb-4 leading-tight">{data.researchMemo.headline}</h2>
                <p className="text-lg leading-relaxed mb-6 font-light">{data.researchMemo.executiveSummary}</p>
                
                <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1">Investment Thesis</h3>
                <p className="text-sm leading-relaxed mb-6 text-justify">{data.researchMemo.valuationThesis}</p>

                <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1">Key Drivers</h3>
                <ul className="list-disc pl-5 space-y-1 mb-6 text-sm">
                    {data.researchMemo.keyDrivers.map((d, i) => <li key={i}>{d}</li>)}
                </ul>

                <h3 className="text-sm font-bold uppercase border-b border-black mb-3 pb-1">Macro Outlook</h3>
                <p className="text-sm leading-relaxed mb-6 text-justify">{data.researchMemo.macroOutlook}</p>
            </div>
            <div className="col-span-1 space-y-6">
                <div className="bg-slate-100 p-4 border border-slate-300">
                    <div className="text-xs font-sans font-bold uppercase text-slate-500 mb-2">Visual Insight</div>
                    <div className="aspect-square bg-slate-200 flex items-center justify-center overflow-hidden relative">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Generated Insight" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-4 flex flex-col items-center">
                                {generatingImg && <div className="w-4 h-4 border-2 border-slate-400 border-t-black rounded-full animate-spin mb-2"></div>}
                                <div className="text-xs text-slate-400 mb-2">{generatingImg ? 'Generating...' : 'Waiting for Model...'}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold uppercase border-b border-gray-300 mb-2 pb-1">Market Data</h3>
                    <div className="space-y-2 text-xs font-sans">
                        <div className="flex justify-between border-b border-slate-200 pb-1"><span>Price</span> <span>${data.profile.price}</span></div>
                        <div className="flex justify-between border-b border-slate-200 pb-1"><span>Market Cap</span> <span>{data.profile.marketCap}</span></div>
                        <div className="flex justify-between border-b border-slate-200 pb-1"><span>Ent. Value</span> <span>${data.dcf.enterpriseValue.toLocaleString()}M</span></div>
                        <div className="flex justify-between border-b border-slate-200 pb-1"><span>52w High/Low</span> <span>Data Unavailable</span></div>
                    </div>
                </div>

                <div>
                     <h3 className="text-xs font-bold uppercase border-b border-gray-300 mb-2 pb-1">Risk Factors</h3>
                     <ul className="text-[10px] space-y-1 leading-tight text-slate-600">
                         {data.profile.risks.slice(0, 5).map((r, i) => <li key={i}>• {r}</li>)}
                     </ul>
                </div>
            </div>
        </div>

        <div className="border-t border-black pt-4 mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 font-sans gap-2">
            <div>Generated by Apex Capital AI | Automated Analyst Agent V3</div>
            <div>{new Date().toLocaleDateString()}</div>
        </div>
    </div>
  );
}

// --- Alpha Components ---

const SentimentLieDetector = ({ sentiments }: { sentiments: any[] }) => {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={sentiments}>
                     <defs>
                        <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="quarter" stroke="#64748b" tick={{fontSize: 10}} />
                    <YAxis yAxisId="left" stroke="#10b981" tick={{fontSize: 10}} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{fontSize: 10}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490', color: '#fff' }}
                        itemStyle={{ fontSize: 10 }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="sentimentScore" name="Confidence Score" stroke="#10b981" fill="url(#sentimentGrad)" />
                    <Bar yAxisId="right" dataKey="hesitationWords" name="Hesitation Count" fill="#ef4444" barSize={20} radius={[4, 4, 0, 0]} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

const AlternativeDataCards = ({ data }: { data: any }) => {
    return (
        <div className="grid grid-cols-3 gap-4">
             <div className="bg-slate-900/50 p-4 border border-slate-800 flex flex-col items-center text-center">
                 <div className="text-[10px] text-slate-500 uppercase mb-2">Web Traffic (YoY)</div>
                 <div className={`text-2xl font-mono font-bold ${data.webTrafficTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {data.webTrafficTrend > 0 ? '+' : ''}{data.webTrafficTrend}%
                 </div>
                 <Globe size={16} className="mt-2 text-slate-600" />
             </div>
             <div className="bg-slate-900/50 p-4 border border-slate-800 flex flex-col items-center text-center">
                 <div className="text-[10px] text-slate-500 uppercase mb-2">App Downloads</div>
                 <div className={`text-2xl font-mono font-bold ${data.appDownloadTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {data.appDownloadTrend > 0 ? '+' : ''}{data.appDownloadTrend}%
                 </div>
                 <Smartphone size={16} className="mt-2 text-slate-600" />
             </div>
             <div className="bg-slate-900/50 p-4 border border-slate-800 flex flex-col items-center text-center">
                 <div className="text-[10px] text-slate-500 uppercase mb-2">Search Volume</div>
                 <div className={`text-2xl font-mono font-bold ${data.searchVolumeTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                     {data.searchVolumeTrend > 0 ? '+' : ''}{data.searchVolumeTrend}%
                 </div>
                 <Eye size={16} className="mt-2 text-slate-600" />
             </div>
             <div className="col-span-3 bg-slate-900/30 border border-slate-800 p-2 flex items-center justify-between">
                 <div className="text-xs text-slate-400 font-bold px-2">ALT SIGNAL:</div>
                 <div className={`text-xs font-bold px-2 py-1 rounded ${data.verdict === 'BULLISH' ? 'bg-green-900/20 text-green-400' : data.verdict === 'BEARISH' ? 'bg-red-900/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    {data.verdict}
                 </div>
             </div>
             <div className="col-span-3 text-[10px] text-slate-500 italic px-2">
                 "{data.insight}"
             </div>
        </div>
    )
}

const WhaleWatchTable = ({ ownership }: { ownership: any }) => {
    return (
        <div className="space-y-4">
             <div className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded">
                 <div className="relative w-16 h-16 flex items-center justify-center">
                     <Gauge size={32} className={ownership.crowdednessScore > 75 ? 'text-red-500' : 'text-green-500'} />
                 </div>
                 <div>
                     <div className="text-xs text-slate-500 uppercase">Crowdedness Score</div>
                     <div className="text-xl font-bold text-white">{ownership.crowdednessScore}/100</div>
                     <div className="text-[10px] text-slate-400">{ownership.crowdednessScore > 75 ? 'Very Crowded (Low Liquidity Risk)' : 'Under-owned (Accumulation Phase)'}</div>
                 </div>
             </div>
             
             <div className="overflow-hidden border border-slate-800 rounded">
                 <table className="w-full text-left text-xs font-mono">
                     <thead className="bg-slate-900 text-slate-500">
                         <tr>
                             <th className="p-2">Holder</th>
                             <th className="p-2 text-right">Position</th>
                             <th className="p-2 text-right">Change</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                         {ownership.topHolders.map((holder: any, i: number) => (
                             <tr key={i} className="hover:bg-slate-800/50">
                                 <td className="p-2 font-bold text-slate-300">{holder.name}</td>
                                 <td className="p-2 text-right text-slate-400">{holder.shares}</td>
                                 <td className={`p-2 text-right font-bold ${holder.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                     {holder.change > 0 ? '+' : ''}{holder.change}%
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
             
             <div className="flex justify-between items-center px-2">
                 <div className="text-xs text-slate-500">Smart Money Flow</div>
                 <div className={`text-xs font-bold px-2 py-1 rounded border ${
                     ownership.smartMoneyFlow === 'INFLOW' ? 'border-green-900 text-green-400 bg-green-900/10' : 
                     ownership.smartMoneyFlow === 'OUTFLOW' ? 'border-red-900 text-red-400 bg-red-900/10' : 
                     'border-slate-800 text-slate-400'
                 }`}>
                     {ownership.smartMoneyFlow}
                 </div>
             </div>
        </div>
    )
}

const OpportunityGrid = ({ onSelect }: { onSelect: (ticker: string) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {SUGGESTED_OPPORTUNITIES.map((opp) => (
      <div 
        key={opp.ticker}
        onClick={() => onSelect(opp.ticker)}
        className="group bg-slate-900/40 border border-slate-800 p-4 hover:bg-cyan-950/30 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100">
           <ArrowRight size={16} className="text-cyan-500 -translate-x-2 group-hover:translate-x-0 transition-transform" />
        </div>
        <div className="flex justify-between items-end mb-2">
           <div>
              <div className="text-xl font-bold text-white font-mono">{opp.ticker}</div>
              <div className="text-xs text-slate-400">{opp.name}</div>
           </div>
           <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              opp.volatility === 'EXTREME' ? 'bg-red-900/50 text-red-400' : 
              opp.volatility === 'HIGH' ? 'bg-orange-900/50 text-orange-400' : 'bg-blue-900/50 text-blue-400'
           }`}>
              {opp.volatility} VOL
           </div>
        </div>
        <div className="h-px bg-slate-800 my-2 group-hover:bg-cyan-900/50"></div>
        <p className="text-xs text-slate-500 leading-tight group-hover:text-slate-300 transition-colors">
           {opp.reason}
        </p>
      </div>
    ))}
  </div>
);

const PortfolioOverview = ({ data }: { data: typeof PORTFOLIO_DATA_INIT }) => (
  <Panel title="Active Positions // Live P&L" icon={Briefcase}>
     <div className="overflow-x-auto max-h-[350px] custom-scrollbar pr-2">
       <table className="w-full text-left text-xs font-mono">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 shadow-lg border-b border-cyan-900/30">
             <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2 pl-2">TICKER</th>
                <th className="pb-2 text-right">SHARES</th>
                <th className="pb-2 text-right">AVG COST</th>
                <th className="pb-2 text-right">MARKET</th>
                <th className="pb-2 text-right">DAY %</th>
                <th className="pb-2 text-right pr-2">UNREALIZED P&L</th>
             </tr>
          </thead>
          <tbody>
             {data.map((pos) => (
                <tr key={pos.ticker} className="border-b border-slate-900/50 hover:bg-white/5 transition-colors">
                   <td className="py-3 pl-2 font-bold text-white">{pos.ticker}</td>
                   <td className="py-3 text-right text-slate-400">{pos.shares.toLocaleString()}</td>
                   <td className="py-3 text-right text-slate-400">${pos.avgCost.toFixed(2)}</td>
                   <td className="py-3 text-right text-cyan-300">${pos.price.toFixed(2)}</td>
                   <td className={`py-3 text-right ${pos.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.change >= 0 ? '+' : ''}{pos.change.toFixed(2)}%
                   </td>
                   <td className={`py-3 text-right pr-2 font-bold ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${pos.pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                   </td>
                </tr>
             ))}
          </tbody>
       </table>
     </div>
  </Panel>
);

const NetworkGraph = ({ supplyChain }: { supplyChain: any }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-950/30 border border-slate-800/50 rounded p-4 relative overflow-hidden">
       <div className="absolute inset-0 grid grid-cols-12 gap-4 opacity-10 pointer-events-none">
          {Array.from({length: 12}).map((_, i) => <div key={i} className="border-r border-cyan-500 h-full"></div>)}
       </div>
       
       <div className="flex justify-between items-center w-full max-w-2xl z-10">
          <div className="space-y-4">
             {supplyChain.suppliers.slice(0, 3).map((s: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                   <div className="bg-slate-900 border border-slate-700 text-[10px] px-2 py-1 rounded text-slate-300 w-32 text-right truncate">{s}</div>
                   <div className="w-8 h-px bg-gradient-to-r from-slate-700 to-cyan-500"></div>
                </div>
             ))}
          </div>
          
          <div className="relative">
             <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-cyan-900/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
             </div>
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-bold tracking-widest">TARGET</div>
          </div>
          
          <div className="space-y-4">
             {supplyChain.customers.slice(0, 3).map((c: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                   <div className="w-8 h-px bg-gradient-to-l from-slate-700 to-purple-500"></div>
                   <div className="bg-slate-900 border border-slate-700 text-[10px] px-2 py-1 rounded text-slate-300 w-32 truncate">{c}</div>
                </div>
             ))}
          </div>
       </div>
    </div>
  )
}

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-950 border border-cyan-500/50 w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
           <h3 className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Terminal size={16} /> {title}
           </h3>
           <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <Plus size={24} className="rotate-45" />
           </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
           {children}
        </div>
      </div>
    </div>
  );
};

const FloatingAgent = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-900/50 transition-all hover:scale-110 group"
  >
    <Terminal size={24} className="text-white" />
    <span className="absolute -top-10 right-0 bg-black text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700">
       Ask Alpha Agent
    </span>
  </button>
);

const AlphaTerminal = ({ analysis }: { analysis: FullAnalysis }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'AI', content: `Alpha System Online. I have full context on ${analysis.profile.name}. Query me regarding valuation, risks, or strategy.`, timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const QUICK_ACTIONS = [
    "Show ESG score & risk factors",
    "Summarize recent M&A activity",
    "Analyze management compensation",
    "Identify key insider trading patterns",
    "Break down revenue by region",
    "List top institutional holders"
  ];

  useEffect(() => {
     scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setShowQuickActions(false);
    setMessages(prev => [...prev, { role: 'USER', content: userMsg, timestamp: Date.now() }]);
    setLoading(true);
    
    try {
       const response = await askAlphaAgent(userMsg, analysis);
       setMessages(prev => [...prev, { role: 'AI', content: response, timestamp: Date.now() }]);
    } catch (err) {
       setMessages(prev => [...prev, { role: 'AI', content: "Connection disrupted.", timestamp: Date.now() }]);
    } finally {
       setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
      setInput(action);
      setShowQuickActions(false);
  };

  return (
    <div className="flex flex-col h-full bg-black border-t border-cyan-500/50 font-mono text-sm relative">
       <div className="bg-cyan-950/30 px-4 py-2 text-xs text-cyan-400 border-b border-cyan-900/30 flex justify-between items-center">
          <span>ALPHA_AGENT_V3 // CONNECTED TO {analysis.profile.ticker}</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> LIVE</span>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/90">
          {messages.map((msg, i) => (
             <div key={i} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded border ${
                   msg.role === 'USER' 
                   ? 'bg-slate-900 border-slate-700 text-slate-200 rounded-tr-none' 
                   : 'bg-cyan-950/20 border-cyan-900/50 text-cyan-100 rounded-tl-none'
                }`}>
                   <div className="text-[10px] mb-1 opacity-50">{msg.role === 'USER' ? 'OPERATOR' : 'ALPHA'}</div>
                   {msg.content}
                </div>
             </div>
          ))}
          {loading && (
             <div className="flex justify-start">
                <div className="bg-cyan-950/20 border border-cyan-900/50 text-cyan-400 p-3 rounded rounded-tl-none text-xs animate-pulse">
                   PROCESSING...
                </div>
             </div>
          )}
          <div ref={scrollRef} />
       </div>
       
       <form onSubmit={handleSend} className="p-2 bg-slate-900 flex gap-2 border-t border-slate-800 relative">
          {showQuickActions && (
            <div className="absolute bottom-full left-0 mb-1 ml-2 w-64 bg-slate-900 border border-cyan-900 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-50 flex flex-col animate-fade-in">
                <div className="p-2 text-[10px] text-slate-500 uppercase font-bold border-b border-slate-800 bg-slate-950">Quick Actions</div>
                {QUICK_ACTIONS.map((action, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickAction(action)}
                        className="text-left px-3 py-2 text-slate-300 hover:bg-cyan-900/30 hover:text-cyan-400 transition-colors truncate border-b border-slate-800/50 last:border-0 text-xs"
                    >
                        {action}
                    </button>
                ))}
            </div>
          )}

          <button 
            type="button" 
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`px-3 transition-colors rounded flex items-center justify-center ${showQuickActions ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-cyan-400 hover:bg-slate-800'}`}
            title="Quick Actions"
          >
            <Zap size={14} />
          </button>

          <input 
             type="text" 
             value={input}
             onChange={e => setInput(e.target.value)}
             placeholder="Enter command..." 
             className="flex-1 bg-black border border-slate-700 text-white px-3 py-2 focus:border-cyan-500 focus:outline-none text-xs"
          />
          <button type="submit" disabled={loading} className="bg-cyan-900 hover:bg-cyan-800 text-cyan-400 px-4 py-2 border border-cyan-700 disabled:opacity-50">
             <Send size={14} />
          </button>
       </form>
    </div>
  );
};

// --- Main Component ---

export default function MissionControl() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [data, setData] = useState<FullAnalysis | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'THESIS' | 'FINANCIALS' | 'VALUATION' | 'AI_RISK' | 'COMPS' | 'ALPHA' | 'DEEP_DIVE' | 'REPORT'>('OVERVIEW');
  const [financialView, setFinancialView] = useState<'INCOME' | 'BALANCE' | 'CASH' | 'RATIOS'>('INCOME');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [quota, setQuota] = useState<StationQuota>(getStationQuota());
  
  const portfolioData = useMarketSimulation(PORTFOLIO_DATA_INIT);

  const addLog = (agent: AgentLog['agent'], message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36), agent, message, timestamp: Date.now() }]);
  };

  const executeAnalysis = async (ticker: string) => {
    // Quota Enforcement
    if (quota.searchCount >= SEARCH_LIMIT) {
        setErrorMsg(`STATION QUOTA EXCEEDED. Research Cycles Reset: ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}`);
        setStatus(AnalysisStatus.ERROR);
        return;
    }

    setStatus(AnalysisStatus.SEARCHING);
    setLogs([]);
    setData(null);
    setErrorMsg('');
    setActiveTab('OVERVIEW');
    setShowTerminal(false);
    setInput(ticker);

    addLog('SCOUT', `Initializing deep-scan protocol for target: ${ticker.toUpperCase()}...`);
    
    setTimeout(() => addLog('SCOUT', 'Accessing global market databases & EDGAR filings...'), 800);
    setTimeout(() => addLog('SCOUT', 'Aggregating competitor benchmarks...'), 1600);
    
    try {
      const result = await analyzeCompany(ticker);
      
      // Update Quota on Success
      const updatedQuota = { ...quota, searchCount: quota.searchCount + 1 };
      setQuota(updatedQuota);
      saveStationQuota(updatedQuota);

      addLog('ANALYST', 'Raw financial data ingested. Normalizing accounting policies...');
      setTimeout(() => addLog('ASSOCIATE', 'Reconciling Balance Sheet and Cash Flow statements...'), 500);
      setTimeout(() => addLog('PM', 'Formulating Bull/Bear scenarios and investment thesis...'), 1200);
      setTimeout(() => addLog('VP', 'Stress-testing LBO models and moat durability...'), 2000);
      setTimeout(() => addLog('VP', 'Synthesizing final investment memo...'), 2800);

      setTimeout(() => {
        setData(result);
        setStatus(AnalysisStatus.COMPLETE);
      }, 3500); 

    } catch (err: any) {
      addLog('SCOUT', 'CRITICAL FAILURE: Target acquisition failed.');
      setStatus(AnalysisStatus.ERROR);
      setErrorMsg(err.message || "Unknown error occurred");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeAnalysis(input);
  };

  const downloadAllFinancials = () => {
    if (!data) return;

    let csvContent = `Financial Data Export - ${data.profile.ticker}\nGenerated by Apex Capital AI\n\n`;
    const processStatement = (statement: Statement) => {
       csvContent += `${statement.title.toUpperCase()}\n`;
       const currentYear = new Date().getFullYear();
       const histLen = statement.rows[0]?.historical.length || 0;
       const projLen = statement.rows[0]?.projected.length || 0;
       let headerRow = "Metric,Unit";
       for(let i=0; i<histLen; i++) headerRow += `,${currentYear - (histLen - i)}A`;
       for(let i=0; i<projLen; i++) headerRow += `,${currentYear + 1 + i}E`;
       csvContent += headerRow + "\n";
       statement.rows.forEach(row => {
           let line = `"${row.metric}","${row.unit}"`;
           row.historical.forEach(val => line += `,${val}`);
           row.projected.forEach(val => line += `,${val}`);
           csvContent += line + "\n";
       });
       csvContent += "\n";
    };

    processStatement(data.incomeStatement);
    processStatement(data.balanceSheet);
    processStatement(data.cashFlowStatement);
    csvContent += "FINANCIAL RATIOS\nCategory,Metric,Value\n";
    Object.entries(data.financialRatios).forEach(([category, ratios]) => {
        (ratios as Ratio[]).forEach(r => csvContent += `"${category.toUpperCase()}","${r.name}","${r.value}"\n`);
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.profile.ticker}_Financials_Full.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen cyber-grid bg-slate-950 text-slate-200 p-4 md:p-8 pt-12 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 relative pb-32">
      
      <div className="fixed top-0 left-0 right-0 z-50">
         <TickerTape />
      </div>

      <header className="flex justify-between items-center mb-8 border-b border-cyan-900/50 pb-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-400 flex items-center justify-center">
            <Activity className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Apex Capital <span className="text-cyan-400">AI</span></h1>
            <p className="text-xs text-cyan-600 font-mono tracking-wider">STATION: {quota.stationId} // v3.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
            SYSTEM ONLINE
          </div>
          <div className="hidden md:block">LATENCY: 12ms</div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
          <div className="relative flex items-center bg-black border border-cyan-800 rounded overflow-hidden">
            <span className="pl-4 text-cyan-500 font-mono">{'>'}</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={quota.searchCount >= SEARCH_LIMIT}
              placeholder={quota.searchCount >= SEARCH_LIMIT ? "SYSTEM QUOTA EXCEEDED - CONTACT SALES" : "ENTER TICKER (e.g. AAPL) OR URL TO INITIATE DEEP RESEARCH..."} 
              className="w-full bg-transparent border-none text-white p-4 focus:ring-0 font-mono placeholder:text-slate-600 disabled:cursor-not-allowed"
            />
            <button 
              type="submit" 
              disabled={status === AnalysisStatus.SEARCHING || quota.searchCount >= SEARCH_LIMIT}
              className={`px-8 py-4 border-l border-cyan-800 transition-colors uppercase tracking-wider font-bold flex items-center gap-2 disabled:opacity-50 ${
                  quota.searchCount >= SEARCH_LIMIT ? 'bg-red-900/20 text-red-500 border-red-900' : 'bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400'
              }`}
            >
               {status === AnalysisStatus.SEARCHING ? 'Processing' : quota.searchCount >= SEARCH_LIMIT ? 'Quota Hit' : 'Initiate'} <Zap size={16} />
            </button>
          </div>
        </form>
        
        {/* QUOTA RESOURCE BAR */}
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">Monthly Credits</div>
                <div className="flex gap-1 flex-1 md:w-64">
                    {Array.from({ length: SEARCH_LIMIT }).map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 flex-1 rounded-sm transition-all duration-500 ${
                                i < quota.searchCount 
                                ? 'bg-slate-800' 
                                : quota.searchCount >= 7 ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                            }`}
                        />
                    ))}
                </div>
                <div className={`text-[10px] font-mono font-bold ${quota.searchCount >= 8 ? 'text-amber-500' : 'text-cyan-500'}`}>
                    {SEARCH_LIMIT - quota.searchCount} / {SEARCH_LIMIT} REMAINING
                </div>
             </div>
             
             {quota.searchCount >= SEARCH_LIMIT && (
                 <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 animate-pulse uppercase tracking-widest">
                     <ShieldAlert size={12} /> Resource Depleted // Upgrade Required
                 </div>
             )}
        </div>
      </div>

      {status === AnalysisStatus.IDLE && (
         <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="w-full">
               <Panel title="AI Scout // Market Opportunities" icon={Target}>
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      High-Alpha Setup Detected by Scout Agent
                  </div>
                  <OpportunityGrid onSelect={executeAnalysis} />
               </Panel>
            </div>
            <div className="w-full">
               <PortfolioOverview data={portfolioData} />
            </div>
         </div>
      )}

      {status === AnalysisStatus.SEARCHING && (
        <div className="max-w-4xl mx-auto h-[60vh]">
           <Panel title="Agent Activity Log" className="h-full border-cyan-500/30">
             <AgentLoader logs={logs} />
           </Panel>
        </div>
      )}

      {status === AnalysisStatus.COMPLETE && data && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Live Price" value={data.profile.price} subValue={`${data.profile.marketCap} Mkt Cap`} trend="neutral" isLivePrice={true} />
            <MetricCard label="Implied Upside" value={`${data.dcf.upsideDownside > 0 ? '+' : ''}${data.dcf.upsideDownside.toFixed(1)}%`} subValue={`Target: $${data.dcf.sharePriceTarget.toFixed(2)}`} trend={data.dcf.upsideDownside > 0 ? 'up' : 'down'} />
            <MetricCard label="LBO IRR (5yr)" value={`${data.lbo.irr.toFixed(1)}%`} subValue={`${data.lbo.moc.toFixed(2)}x MoC`} trend="up" />
            <MetricCard label="Thesis" value={data.thesis.rating} subValue={`${data.thesis.conviction}% Conviction`} trend={data.thesis.rating === 'BUY' ? 'up' : data.thesis.rating === 'SELL' ? 'down' : 'neutral'} />
          </div>

          <div className="flex gap-2 border-b border-cyan-900/50 overflow-x-auto">
             {['OVERVIEW', 'THESIS', 'AI_RISK', 'FINANCIALS', 'VALUATION', 'COMPS', 'ALPHA', 'DEEP_DIVE', 'REPORT'].map((tab) => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 text-sm font-bold tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'bg-cyan-500 text-black clip-path-polygon' 
                  : 'text-slate-400 hover:text-cyan-400 bg-slate-900/50'
                }`}
                style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'}}
               >
                 {tab.replace('_', ' ')}
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {activeTab === 'REPORT' ? (
                <div className="col-span-3">
                    <ResearchReport data={data} />
                </div>
            ) : (
            <>
            <div className="lg:col-span-2 space-y-6">
              {activeTab === 'OVERVIEW' && (
                <>
                   <Panel title="Executive Summary" icon={Globe}>
                      <p className="text-slate-300 leading-relaxed text-sm mb-4 min-h-[100px]">{data.profile.summary}</p>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-xs text-green-500 uppercase mb-2 font-bold">Key Strengths</h4>
                            <ul className="text-xs space-y-1 text-slate-400 list-disc pl-4">
                              {data.profile.strengths.slice(0,4).map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-xs text-red-500 uppercase mb-2 font-bold">Key Risks</h4>
                            <ul className="text-xs space-y-1 text-slate-400 list-disc pl-4">
                              {data.profile.risks.slice(0,4).map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                      </div>
                   </Panel>
                   <Panel title="Performance Forecast" icon={TrendingUp}>
                      <div className="h-96">
                        <FinancialChart data={data.incomeStatement.rows.filter(r => r.metric.includes('Revenue') || r.metric.includes('EBITDA'))} title="Rev vs EBITDA" />
                      </div>
                   </Panel>
                   {data.sources && data.sources.length > 0 && (
                        <Panel title="Intelligence Sources" icon={LinkIcon}>
                            <div className="flex flex-wrap gap-2">
                                {data.sources.map((source, idx) => (
                                    <a 
                                        key={idx} 
                                        href={source} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] bg-cyan-950/30 border border-cyan-900 text-cyan-400 px-2 py-1 hover:bg-cyan-900/50 transition-colors"
                                    >
                                        <Globe size={10} />
                                        {new URL(source).hostname.replace('www.', '')}
                                    </a>
                                ))}
                            </div>
                        </Panel>
                   )}
                   <Panel title="The Wire (Latest Intel)" icon={Newspaper}>
                      <NewsWire news={data.news} />
                   </Panel>
                </>
              )}

              {activeTab === 'THESIS' && (
                <>
                  <Panel title="The Bet" icon={Target} className="border-l-4 border-l-cyan-400">
                     <div className="text-cyan-100 font-mono text-sm leading-relaxed border-l border-cyan-900/50 pl-4 italic py-4">
                        "{data.thesis.theBet}"
                     </div>
                     <ScenarioBar thesis={data.thesis} currentPrice={data.profile.price} />
                     <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                        <span>Risk:Reward Profile</span>
                        <span>Upside: {((data.thesis.targetPriceBull / data.profile.price - 1) * 100).toFixed(1)}% / Downside: {((data.thesis.targetPriceBear / data.profile.price - 1) * 100).toFixed(1)}%</span>
                     </div>
                  </Panel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Panel title="Bull Case" icon={ArrowUpRight} className="border-t-4 border-t-green-500">
                          <ul className="space-y-3 mt-2">
                              {data.thesis.bullCase?.map((arg, i) => (
                                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0"></div>
                                      {arg}
                                  </li>
                              ))}
                          </ul>
                      </Panel>
                      <Panel title="Bear Case" icon={ArrowDownRight} className="border-t-4 border-t-red-500">
                          <ul className="space-y-3 mt-2">
                              {data.thesis.bearCase?.map((arg, i) => (
                                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></div>
                                      {arg}
                                  </li>
                              ))}
                          </ul>
                      </Panel>
                  </div>
                  <Panel title="Catalyst Radar" icon={Calendar}>
                    <div className="space-y-6 py-2">
                       {data.thesis.catalysts.map((cat, i) => (
                         <div key={i} className="flex gap-4 items-start group border-b border-slate-900/50 pb-4 last:border-0">
                            <div className={`mt-1 w-2 h-2 rounded-full ${cat.impact === 'HIGH' ? 'bg-red-500 animate-pulse' : cat.impact === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{cat.event}</span>
                                  <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-0.5 rounded">{cat.timing}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </Panel>
                </>
              )}

              {activeTab === 'ALPHA' && (
                  <div className="space-y-6">
                      <Panel title="Earnings Call 'Lie Detector'" icon={BarChart4}>
                          <p className="text-xs text-slate-400 mb-4 italic border-l-2 border-cyan-500 pl-2">
                              Linguistic analysis of the last 4 quarters detecting confidence vs. hesitation.
                          </p>
                          <SentimentLieDetector sentiments={data.hedgeFundAlpha.earningsSentiment} />
                      </Panel>
                      <Panel title="Alternative Data Signals (Digital Footprint)" icon={Activity}>
                          <AlternativeDataCards data={data.hedgeFundAlpha.alternativeData} />
                      </Panel>
                      <Panel title="Whale Watching (Institutional Flow)" icon={Users}>
                          <WhaleWatchTable ownership={data.hedgeFundAlpha.institutionalOwnership} />
                      </Panel>
                  </div>
              )}

              {activeTab === 'AI_RISK' && (
                  <div className="space-y-6">
                     <Panel title="AI Displacement Risk Matrix" icon={BrainCircuit} className="border-l-4 border-l-purple-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-64"><AIRadarChart risk={data.aiRisk} /></div>
                            <div className="space-y-4">
                                <div className="bg-slate-900/50 p-4 border border-purple-900/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs uppercase text-slate-500 font-bold">Vibecode Sensitivity</span>
                                        <span className={`text-xl font-black font-mono ${data.aiRisk.vibecodeSensitivity > 70 ? 'text-red-500' : data.aiRisk.vibecodeSensitivity > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                                            {data.aiRisk.vibecodeSensitivity}/100
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${data.aiRisk.vibecodeSensitivity > 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${data.aiRisk.vibecodeSensitivity}%` }}></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 border-b border-slate-800">
                                   <span className="text-xs text-slate-400">Innovation Lag</span>
                                   <span className={`text-sm font-bold ${data.aiRisk.innovationLag === 'LEADER' ? 'text-green-400' : data.aiRisk.innovationLag === 'LAGGARD' ? 'text-red-400' : 'text-yellow-400'}`}>
                                      {data.aiRisk.innovationLag}
                                   </span>
                                </div>
                            </div>
                        </div>
                     </Panel>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Panel title="Threat Vectors" icon={AlertTriangle}>
                            <ul className="space-y-2">
                                {data.aiRisk.threats.map((threat, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-red-200 bg-red-950/30 p-2 rounded border border-red-900/20">
                                        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-red-500" />{threat}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                        <Panel title="Defensive Moats (AI)" icon={Shield}>
                            <ul className="space-y-2">
                                {data.aiRisk.mitigants.map((mitigant, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-green-200 bg-green-950/30 p-2 rounded border border-green-900/20">
                                        <Shield size={12} className="shrink-0 mt-0.5 text-green-500" />{mitigant}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                     </div>
                  </div>
              )}

              {activeTab === 'FINANCIALS' && (
                 <Panel title="3-Statement Analysis & Ratios" icon={BarChart3}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg border border-slate-800 inline-flex">
                        {[
                            { id: 'INCOME', label: 'Income', icon: FileText },
                            { id: 'BALANCE', label: 'Balance Sheet', icon: Layers },
                            { id: 'CASH', label: 'Cash Flow', icon: Activity },
                            { id: 'RATIOS', label: 'Ratios', icon: Percent }
                        ].map((view) => (
                            <button
                                key={view.id}
                                onClick={() => setFinancialView(view.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all ${
                                    financialView === view.id ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-700/50' : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <view.icon size={12} /> {view.label}
                            </button>
                        ))}
                        </div>
                        <button onClick={downloadAllFinancials} className="flex items-center gap-2 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 rounded text-xs font-bold uppercase transition-all shadow-lg shadow-cyan-900/20 group">
                            <Download size={14} className="group-hover:scale-110 transition-transform" /> Export All Data
                        </button>
                    </div>
                    <div className="animate-fade-in">
                        {financialView === 'INCOME' && (
                            <div className="space-y-8">
                                <div className="h-96 w-full mb-8"><FinancialChart data={data.incomeStatement.rows.slice(0, 2)} title="Income Trend" /></div>
                                <FinancialStatementTable statement={data.incomeStatement} />
                            </div>
                        )}
                        {financialView === 'BALANCE' && (
                            <div className="space-y-8">
                                <div className="h-96 w-full mb-8"><FinancialChart data={data.balanceSheet.rows.filter(r => r.metric.includes('Assets') || r.metric.includes('Equity'))} title="BS Trend" /></div>
                                <FinancialStatementTable statement={data.balanceSheet} />
                            </div>
                        )}
                        {financialView === 'CASH' && (
                            <div className="space-y-8">
                                <div className="h-96 w-full mb-8"><FinancialChart data={data.cashFlowStatement.rows.filter(r => r.metric.includes('Free') || r.metric.includes('CFO'))} title="CF Trend" /></div>
                                <FinancialStatementTable statement={data.cashFlowStatement} />
                            </div>
                        )}
                        {financialView === 'RATIOS' && <RatiosGrid ratios={data.financialRatios} />}
                    </div>
                 </Panel>
              )}

              {activeTab === 'VALUATION' && (
                 <div className="space-y-6">
                    <Panel title="DCF Methodology" icon={Lock}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4 text-xs font-mono">
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span>Terminal Growth Rate</span><span className="text-cyan-400 font-bold">{(data.dcf.terminalGrowthRate * 100).toFixed(1)}%</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span>WACC</span><span className="text-cyan-400 font-bold">{(data.dcf.wacc * 100).toFixed(1)}%</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span>Enterprise Value</span><span className="text-cyan-400 font-bold">{data.dcf.enterpriseValue.toLocaleString()} M</span></div>
                            </div>
                            <div className="h-96"><ValuationFootballField dcf={data.dcf} comps={data.valuationComps} /></div>
                        </div>
                    </Panel>
                    <Panel title="Sensitivity Matrix" icon={Target}><SensitivityMatrix baseWacc={data.dcf.wacc} baseGrowth={data.dcf.terminalGrowthRate} basePrice={data.dcf.sharePriceTarget} /></Panel>
                 </div>
              )}

              {activeTab === 'COMPS' && (
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                          <Panel title="EV/EBITDA vs Growth" icon={ScatterIcon}>
                             <CompsScatterPlot comps={data.valuationComps} />
                          </Panel>
                          <Panel title="Rule of 40 Analysis" icon={TrendingUp}>
                             <RuleOf40Chart comps={data.valuationComps} />
                          </Panel>
                      </div>
                      <Panel title="Institutional Comparable Analysis" icon={Table} onDownload={() => downloadCSV(data.valuationComps, 'public_comps')}>
                          <div className="overflow-x-auto">
                              <table className="w-full text-xs font-mono text-left">
                                  <thead>
                                      <tr className="border-b border-slate-800 text-slate-500">
                                          <th className="p-2">Ticker</th>
                                          <th className="p-2 text-right">EV/Sales</th>
                                          <th className="p-2 text-right">EV/EBITDA</th>
                                          <th className="p-2 text-right">P/E</th>
                                          <th className="p-2 text-right">Net Debt/EBITDA</th>
                                          <th className="p-2 text-right">Rule of 40</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {data.valuationComps.map((comp, i) => (
                                          <tr key={i} className="border-b border-slate-900/50 hover:bg-cyan-900/10 transition-colors">
                                              <td className="p-2 font-bold text-cyan-400">{comp.ticker}</td>
                                              <td className="p-2 text-right text-white">{comp.evSales ? comp.evSales.toFixed(1) : '-'}x</td>
                                              <td className="p-2 text-right text-white">{comp.evEbitda ? comp.evEbitda.toFixed(1) : '-'}x</td>
                                              <td className="p-2 text-right text-white">{comp.pe ? comp.pe.toFixed(1) : '-'}x</td>
                                              <td className={`p-2 text-right ${comp.netDebtEbitda > 4 ? 'text-red-400' : 'text-slate-300'}`}>{comp.netDebtEbitda ? comp.netDebtEbitda.toFixed(1) : '-'}x</td>
                                              <td className={`p-2 text-right font-bold ${comp.ruleOf40 >= 40 ? 'text-green-400' : 'text-red-400'}`}>{comp.ruleOf40 ? comp.ruleOf40.toFixed(1) : '-'}%</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </Panel>
                  </div>
              )}

              {activeTab === 'DEEP_DIVE' && (
                  <div className="space-y-6">
                     <Panel title="Supply Chain & Network" icon={Network} className="cursor-pointer hover:border-cyan-500 transition-colors min-h-[300px] flex flex-col justify-center">
                         <div onClick={() => setActiveModal('SUPPLY_CHAIN')} className="h-full flex flex-col">
                            <NetworkGraph supplyChain={data.supplyChain} />
                            <div className="text-center text-[10px] text-cyan-500 mt-4 uppercase tracking-widest animate-pulse">Click to Expand Network</div>
                         </div>
                     </Panel>
                     <Panel title="Forensics & Earnings Quality" icon={Microscope} className="cursor-pointer hover:border-cyan-500 transition-colors min-h-[300px] flex flex-col justify-center">
                         <div onClick={() => setActiveModal('FORENSICS')} className="h-full flex flex-col justify-center">
                            <div className="flex items-center gap-12 justify-center">
                                <div className="text-center">
                                    <div className={`text-5xl font-black font-mono mb-2 ${data.earningsQuality.score > 80 ? 'text-green-400' : 'text-red-400'}`}>{data.earningsQuality.score}/100</div>
                                    <div className="text-xs uppercase text-slate-500 tracking-widest">Quality Score</div>
                                </div>
                            </div>
                            <div className="text-center text-[10px] text-cyan-500 mt-8 uppercase tracking-widest animate-pulse">Click to View Forensic Report</div>
                         </div>
                     </Panel>
                     <Panel title="Insider Activity" icon={User}><InsiderTrades transactions={data.insiderActivity} /></Panel>
                  </div>
              )}
            </div>

            <div className="space-y-6">
               <Panel title="Analyst Verdict" className="border-t-4 border-t-cyan-500">
                   <div className="flex items-center justify-between mb-4">
                       <div>
                          <div className={`text-4xl font-black tracking-tighter ${data.thesis.rating === 'BUY' ? 'text-green-500' : data.thesis.rating === 'SELL' ? 'text-red-500' : 'text-yellow-500'}`}>{data.thesis.rating}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-2xl font-bold text-white font-mono">{data.thesis.conviction}%</div>
                       </div>
                   </div>
                   <ScoreBar score={data.thesis.moatScore} label="Moat Strength" icon={Shield} />
                   <ScoreBar score={data.thesis.managementScore} label="Management" icon={Briefcase} />
               </Panel>
               {activeTab !== 'OVERVIEW' && <Panel title="The Wire" icon={Newspaper}><NewsWire news={data.news} /></Panel>}
               <Panel title="LBO Feasibility" icon={PieChart}>
                 <div className="flex flex-col items-center justify-center py-4">
                    <div className={`text-4xl font-bold font-mono mb-2 ${data.lbo.irr > 20 ? 'text-green-400' : 'text-red-400'}`}>{data.lbo.irr.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Projected 5-Yr IRR</div>
                 </div>
               </Panel>
               <div className="p-4 border border-yellow-900/30 bg-yellow-900/10 rounded-sm flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                  <p className="text-[10px] text-yellow-500 leading-tight">AI GENERATED MODELS. FOR INFORMATIONAL PURPOSES ONLY. LIMIT: {SEARCH_LIMIT} RESEARCH CYCLES PER STATION PER MONTH.</p>
               </div>
            </div>
            </>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={activeModal === 'SUPPLY_CHAIN'} onClose={() => setActiveModal(null)} title="Deep Supply Chain Analysis">
         {data && (
            <div className="space-y-6">
               <p className="text-sm text-slate-300 leading-relaxed">{data.supplyChain.risks}</p>
               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 p-4 border border-slate-800">
                     <h4 className="text-xs font-bold text-cyan-400 uppercase mb-4">Upstream Suppliers</h4>
                     <ul className="space-y-2 text-sm">{data.supplyChain.suppliers.map((s, i) => <li key={i} className="flex justify-between border-b border-slate-800 pb-2"><span className="text-white">{s}</span></li>)}</ul>
                  </div>
               </div>
            </div>
         )}
      </Modal>

      <Modal isOpen={activeModal === 'FORENSICS'} onClose={() => setActiveModal(null)} title="Forensic Accounting Report">
         {data && (
            <div className="space-y-6">
               <div className="flex items-start gap-4 bg-slate-900/50 p-4 border border-red-900/30">
                  <AlertTriangle size={24} className="text-red-500 shrink-0" />
                  <div><h4 className="text-sm font-bold text-red-400 uppercase mb-1">Accounting Anomalies Detected</h4><ul className="list-disc pl-4 space-y-1">{data.earningsQuality.redFlags.map((flag, i) => <li key={i} className="text-xs text-slate-300">{flag}</li>)}</ul></div>
               </div>
            </div>
         )}
      </Modal>
      
      {status === AnalysisStatus.COMPLETE && data && (
         <>
             <FloatingAgent onClick={() => setShowTerminal(!showTerminal)} />
             <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${showTerminal ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                 <div className="max-w-3xl mx-auto h-[350px] shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
                     <div className="flex justify-end mb-1"><button onClick={() => setShowTerminal(false)} className="bg-slate-900 text-slate-500 px-2 py-1 text-[10px] uppercase hover:text-white">Close Terminal</button></div>
                     <AlphaTerminal analysis={data} />
                 </div>
             </div>
         </>
      )}

      {status === AnalysisStatus.ERROR && (
         <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-950/20 border border-red-900 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl text-red-400 font-bold mb-2">ACCESS RESTRICTED</h2>
            <p className="text-slate-400 mb-4">{errorMsg || "Target acquisition failed."}</p>
            <button onClick={() => setStatus(AnalysisStatus.IDLE)} className="px-6 py-2 border border-red-800 text-red-400 hover:bg-red-900/30 uppercase font-bold tracking-widest text-xs">Reset System</button>
         </div>
      )}
    </div>
  );
}
