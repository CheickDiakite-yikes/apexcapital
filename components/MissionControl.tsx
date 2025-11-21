
import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search, Zap, BarChart3, PieChart, Lock, Globe, Cpu, TrendingUp, AlertTriangle, Link as LinkIcon, FileText, Layers, Percent, Target, Shield, Briefcase, Calendar, ArrowRight, Radio, Newspaper, Terminal, Send, Network, Microscope, ArrowUpRight, ArrowDownRight, Plus, User, ScatterChart as ScatterIcon, Download, Printer, Sparkles, Save, Radar, BrainCircuit, History, Table, Clock, MoveUpRight, MoveDownRight } from 'lucide-react';
import { analyzeCompany, getBreakingNews, askAlphaAgent, generateInsightImage } from '../services/geminiService';
import { AnalysisStatus, FullAnalysis, AgentLog, Statement, FinancialRatios, InvestmentThesis, NewsItem, ChatMessage, ResearchMemo, Ratio } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Legend } from 'recharts';

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
        // This is a simplified sensitivity proxy for visualization 
        // Real DCF requires recalculating the whole model, but this mimics the sensitivity delta
        const waccDelta = (baseWacc - w) * 100; // e.g., 10% -> 9% = +1
        const growthDelta = (g - baseGrowth) * 100;
        
        // Arbitrary sensitivity factors for the visual
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
                                 // Color scale logic
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
          {/* Suppliers */}
          <div className="space-y-4">
             {supplyChain.suppliers.slice(0, 3).map((s: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                   <div className="bg-slate-900 border border-slate-700 text-[10px] px-2 py-1 rounded text-slate-300 w-32 text-right truncate">{s}</div>
                   <div className="w-8 h-px bg-gradient-to-r from-slate-700 to-cyan-500"></div>
                </div>
             ))}
          </div>
          
          {/* Central Node */}
          <div className="relative">
             <div className="w-16 h-16 rounded-full border-2 border-cyan-500 bg-cyan-900/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
             </div>
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-bold tracking-widest">TARGET</div>
          </div>
          
          {/* Customers */}
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
    "List top institutional shareholders"
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

// --- New Financial Components ---

const FinancialStatementTable = ({ statement }: { statement: Statement }) => {
  const currentYear = new Date().getFullYear();
  const historicalData = statement.rows[0]?.historical || [];
  const projectedData = statement.rows[0]?.projected || [];

  return (
    <div className="overflow-x-auto border border-slate-800 rounded bg-slate-950/50 max-h-[600px] custom-scrollbar">
      <table className="w-full text-xs font-mono text-left border-collapse min-w-max relative">
          <thead className="sticky top-0 z-20">
              <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 uppercase tracking-wider shadow-lg">
                  <th className="p-3 sticky left-0 z-30 bg-slate-900 border-r border-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.5)] min-w-[180px]">
                    Metric
                  </th>
                  {historicalData.map((_, i) => {
                    const year = currentYear - (historicalData.length - i);
                    return (
                      <th key={`h-${i}`} className="p-3 text-right min-w-[110px] text-slate-500 font-medium">
                        {year}A
                      </th>
                    );
                  })}
                  {projectedData.map((_, i) => {
                    const year = currentYear + i + 1;
                    return (
                      <th key={`p-${i}`} className="p-3 text-right min-w-[110px] text-cyan-400 font-bold">
                        {year}E
                      </th>
                    );
                  })}
              </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
              {statement.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-cyan-900/10 transition-colors group">
                      <td className="p-3 text-cyan-100 font-medium sticky left-0 z-10 bg-slate-900 border-r border-slate-800 shadow-[4px_0_8px_rgba(0,0,0,0.5)] group-hover:bg-[#162032] transition-colors whitespace-nowrap">
                          {row.metric}
                      </td>
                      {row.historical.map((val, idx) => (
                          <td key={`hv-${idx}`} className="p-3 text-right text-slate-400 whitespace-nowrap font-light tracking-tight">
                              {val.toLocaleString()}
                          </td>
                      ))}
                      {row.projected.map((val, idx) => (
                          <td key={`pv-${idx}`} className="p-3 text-right text-cyan-300 whitespace-nowrap font-medium tracking-tight">
                              {val.toLocaleString()}
                          </td>
                      ))}
                  </tr>
              ))}
          </tbody>
      </table>
    </div>
  );
};

const RatiosGrid = ({ ratios }: { ratios: FinancialRatios }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Object.entries(ratios).map(([category, items]) => (
      <div key={category} className="bg-slate-900/40 border border-slate-800 p-4 rounded">
        <h4 className="text-cyan-400 uppercase tracking-widest text-xs font-bold mb-4 border-b border-slate-800 pb-2">{category}</h4>
        <div className="space-y-3">
          {items.map((ratio, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">{ratio.name}</span>
              <span className="text-white font-mono text-sm font-bold">{ratio.value}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// --- Thesis Components ---

const ScenarioBar = ({ thesis, currentPrice }: { thesis: InvestmentThesis, currentPrice: number }) => {
  const min = Math.min(thesis.targetPriceBear, currentPrice) * 0.9;
  const max = Math.max(thesis.targetPriceBull, currentPrice) * 1.1;
  const range = max - min;
  
  const getPos = (val: number) => ((val - min) / range) * 100;

  return (
    <div className="relative h-20 mt-8 mb-4">
      {/* Track */}
      <div className="absolute top-1/2 left-0 right-0 h-2 bg-slate-800 rounded-full -translate-y-1/2"></div>
      
      {/* Range Bar */}
      <div 
        className="absolute top-1/2 h-2 bg-gradient-to-r from-red-900 via-blue-900 to-green-900 -translate-y-1/2 opacity-50"
        style={{ left: `${getPos(thesis.targetPriceBear)}%`, right: `${100 - getPos(thesis.targetPriceBull)}%` }}
      ></div>

      {/* Markers */}
      {[
        { label: 'Bear', val: thesis.targetPriceBear, color: 'text-red-500', bg: 'bg-red-500' },
        { label: 'Base', val: thesis.targetPriceBase, color: 'text-blue-400', bg: 'bg-blue-400' },
        { label: 'Bull', val: thesis.targetPriceBull, color: 'text-green-500', bg: 'bg-green-500' },
      ].map((m) => (
        <div key={m.label} className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center group" style={{ left: `${getPos(m.val)}%` }}>
          <div className={`w-3 h-3 rounded-full ${m.bg} border-2 border-black shadow-[0_0_10px_currentColor] mb-2 z-10`}></div>
          <div className={`text-xs font-bold ${m.color} -mt-8 opacity-0 group-hover:opacity-100 transition-opacity`}>{m.label}</div>
          <div className={`text-xs font-mono ${m.color} mt-4`}>${m.val}</div>
        </div>
      ))}

      {/* Current Price Marker */}
      <div className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center" style={{ left: `${getPos(currentPrice)}%` }}>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white -translate-y-[12px] mb-1"></div>
        <div className="text-xs font-bold text-white bg-slate-800 px-1 rounded border border-slate-600">NOW</div>
      </div>
    </div>
  );
};

const ScoreBar = ({ score, max = 5, label, icon: Icon }: any) => (
  <div className="mb-4">
    <div className="flex justify-between mb-1">
      <span className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase">
        {Icon && <Icon size={12} />} {label}
      </span>
      <span className="text-xs text-cyan-400 font-mono">{score}/{max}</span>
    </div>
    <div className="flex gap-1">
      {[...Array(max)].map((_, i) => (
        <div 
          key={i} 
          className={`h-2 flex-1 rounded-sm transition-all ${i < score ? 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]' : 'bg-slate-800'}`}
        ></div>
      ))}
    </div>
  </div>
);

const ReportScenarioChart = ({ thesis, current }: { thesis: InvestmentThesis, current: number }) => {
   const max = Math.max(thesis.targetPriceBull, current) * 1.2;
   const getWidth = (val: number) => `${(val / max) * 100}%`;
   
   return (
     <div className="space-y-4 font-sans">
        <div>
           <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
              <span>BEAR</span>
              <span>${thesis.targetPriceBear}</span>
           </div>
           <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: getWidth(thesis.targetPriceBear) }}></div>
           </div>
        </div>
        <div>
           <div className="flex justify-between text-xs font-bold text-blue-600 mb-1">
              <span>BASE</span>
              <span>${thesis.targetPriceBase}</span>
           </div>
           <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: getWidth(thesis.targetPriceBase) }}></div>
           </div>
        </div>
        <div>
           <div className="flex justify-between text-xs font-bold text-green-600 mb-1">
              <span>BULL</span>
              <span>${thesis.targetPriceBull}</span>
           </div>
           <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: getWidth(thesis.targetPriceBull) }}></div>
           </div>
        </div>
     </div>
   )
}

const ResearchReport = ({ data }: { data: FullAnalysis }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!data.researchMemo.imagePrompt || imageUrl) return;
      setLoadingImage(true);
      const img = await generateInsightImage(data.researchMemo.imagePrompt);
      setImageUrl(img);
      setLoadingImage(false);
    };
    fetchImage();
  }, [data.researchMemo.imagePrompt]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    try {
      const existingReports = JSON.parse(localStorage.getItem('apex_saved_reports') || '[]');
      const reportToSave = {
        id: `${data.profile.ticker}-${Date.now()}`,
        timestamp: Date.now(),
        ticker: data.profile.ticker,
        data: data
      };
      
      existingReports.push(reportToSave);
      localStorage.setItem('apex_saved_reports', JSON.stringify(existingReports));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save report", error);
    }
  };

  return (
    <div className="bg-white text-black p-8 rounded shadow-2xl font-sans max-w-5xl mx-auto my-8 print:my-0 print:shadow-none print:max-w-none animate-fade-in">
        <style>
            {`
            @media print {
                body * { visibility: hidden; }
                .print-content, .print-content * { visibility: visible; }
                .print-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: white; color: black; }
                .no-print { display: none; }
                .page-break { break-before: always; display: block; height: 0; }
                .print-container { width: 100%; }
            }
            `}
        </style>
        
        <div className="print-content print-container">
            {/* --- PAGE 1 --- */}
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{data.profile.ticker}</h1>
                    <h2 className="text-xl text-gray-600 font-serif italic">{data.profile.name}</h2>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end text-cyan-700 font-bold uppercase tracking-widest text-sm mb-2">
                        <Zap size={16} /> Apex Capital AI Research
                    </div>
                    <div className="text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="flex gap-8 mb-8 bg-gray-100 p-4 rounded">
                 <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase font-bold">Rating</div>
                    <div className={`text-2xl font-black ${data.thesis.rating === 'BUY' ? 'text-green-700' : 'text-red-700'}`}>{data.thesis.rating}</div>
                 </div>
                 <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase font-bold">Target Price</div>
                    <div className="text-2xl font-black text-blue-700">${data.dcf.sharePriceTarget}</div>
                 </div>
                 <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase font-bold">Current Price</div>
                    <div className="text-2xl font-mono font-bold">${data.profile.price}</div>
                 </div>
                 <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase font-bold">Upside</div>
                    <div className="text-2xl font-bold">{data.dcf.upsideDownside.toFixed(1)}%</div>
                 </div>
            </div>

            {/* Main Layout Page 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Text */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h3 className="text-2xl font-serif font-bold mb-2 leading-tight">{data.researchMemo.headline}</h3>
                        <p className="text-gray-700 leading-relaxed font-serif text-lg border-l-4 border-blue-500 pl-4">
                            {data.researchMemo.executiveSummary}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">Investment Thesis & Drivers</h4>
                        <ul className="space-y-3">
                            {data.researchMemo.keyDrivers.map((driver, i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">{i+1}</div>
                                    <p className="text-gray-800 text-sm leading-relaxed">{driver}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-gray-300 pb-1 mb-3">Valuation Perspective</h4>
                        <p className="text-gray-800 text-sm leading-relaxed columns-2 gap-8">
                            {data.researchMemo.valuationThesis}
                        </p>
                    </div>
                </div>

                {/* Right Column: Visuals & Data */}
                <div className="space-y-6">
                    {/* AI Image */}
                    <div className="w-full aspect-video bg-gray-900 rounded overflow-hidden relative shadow-lg">
                        {loadingImage ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-400 gap-2">
                                <Sparkles size={24} className="animate-spin" />
                                <span className="text-xs uppercase tracking-widest animate-pulse">Generating Visual...</span>
                            </div>
                        ) : imageUrl ? (
                            <>
                                <img src={imageUrl} alt="AI Generated Visualization" className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                    <div className="text-[10px] text-white/70 uppercase tracking-widest">AI Visualization: {data.profile.ticker} Future State</div>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">Image Unavailable</div>
                        )}
                    </div>

                    {/* Mini Financials */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <h5 className="text-xs font-bold uppercase text-gray-500 mb-4">Financial Forecast</h5>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span>Revenue (Next Yr)</span>
                                <span className="font-bold">{data.incomeStatement.rows[0].projected[0].toLocaleString()} M</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span>EBITDA Margin</span>
                                <span className="font-bold">{data.financialRatios.profitability.find(r => r.name.includes('EBITDA'))?.value}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                <span>ROIC</span>
                                <span className="font-bold">{data.financialRatios.efficiency.find(r => r.name === 'ROIC')?.value}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span>Implied EV/EBITDA</span>
                                <span className="font-bold text-blue-700">{data.lbo.entryMultiple}x</span>
                            </div>
                        </div>
                    </div>

                    {/* Macro Note */}
                    <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                        <h5 className="text-xs font-bold uppercase text-blue-800 mb-2">Macro Sensitivity</h5>
                        <p className="text-xs text-blue-900 leading-relaxed italic">
                            "{data.researchMemo.macroOutlook}"
                        </p>
                    </div>
                </div>
            </div>

            {/* --- PAGE BREAK --- */}
            <div className="page-break mt-12 pt-8 border-t-2 border-gray-100"></div>
            
            {/* --- PAGE 2 --- */}
            <div className="mt-8">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
                    <h3 className="text-xl font-bold uppercase tracking-widest text-gray-800">Deep Dive & Scenarios</h3>
                    <span className="text-gray-400 text-sm font-mono">{data.profile.ticker} // PG 2</span>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Scenario Analysis */}
                     <div className="bg-gray-50 p-6 rounded border border-gray-200">
                        <h4 className="text-sm font-bold uppercase text-gray-600 mb-4">Scenario Price Targets (12mo)</h4>
                        <ReportScenarioChart thesis={data.thesis} current={data.profile.price} />
                     </div>

                     {/* Moat & Management */}
                     <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                            <h5 className="text-xs font-bold text-blue-800 uppercase mb-1">Strategic Moat ({data.thesis.moatScore}/5)</h5>
                            <p className="text-sm text-blue-900">{data.thesis.moatSource}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-500">
                            <h5 className="text-xs font-bold text-gray-800 uppercase mb-1">Management Execution ({data.thesis.managementScore}/5)</h5>
                            <p className="text-sm text-gray-700">{data.thesis.managementNotes}</p>
                        </div>
                     </div>
                 </div>

                 {/* Catalyst & Risks Row */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                     <div>
                        <h4 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 mb-3">Catalyst Watchlist</h4>
                        <ul className="space-y-3">
                           {data.thesis.catalysts.map((cat, i) => (
                              <li key={i} className="flex justify-between items-start">
                                 <div>
                                    <div className="font-bold text-sm text-gray-800">{cat.event}</div>
                                    <div className="text-xs text-gray-500">{cat.description}</div>
                                 </div>
                                 <span className="text-[10px] font-mono bg-gray-200 px-1 rounded">{cat.timing}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 mb-3">Key Risks</h4>
                        <ul className="list-disc pl-4 space-y-2 text-sm text-red-900/80">
                           {data.profile.risks.slice(0, 4).map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                     </div>
                 </div>
                 
                 {/* Financial Summary Table */}
                 <div className="mt-8">
                     <h4 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 mb-3">Financial Performance Summary</h4>
                     <table className="w-full text-sm text-left border-collapse">
                        <thead>
                           <tr className="border-b-2 border-gray-800">
                              <th className="py-2">Metric</th>
                              {data.incomeStatement.rows[0].historical.slice(-2).map((_, i) => {
                                 const year = new Date().getFullYear() - 2 + i;
                                 return <th key={i} className="py-2 text-right">{year}A</th>
                              })}
                              {data.incomeStatement.rows[0].projected.slice(0, 2).map((_, i) => {
                                 const year = new Date().getFullYear() + 1 + i;
                                 return <th key={i} className="py-2 text-right text-blue-700">{year}E</th>
                              })}
                           </tr>
                        </thead>
                        <tbody>
                           {data.incomeStatement.rows.slice(0, 3).map((row, i) => (
                              <tr key={i} className="border-b border-gray-200">
                                 <td className="py-2 font-bold text-gray-700">{row.metric}</td>
                                 {row.historical.slice(-2).map((val, idx) => (
                                    <td key={idx} className="py-2 text-right">{val.toLocaleString()}</td>
                                 ))}
                                 {row.projected.slice(0, 2).map((val, idx) => (
                                    <td key={idx} className="py-2 text-right font-bold text-blue-900">{val.toLocaleString()}</td>
                                 ))}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                 </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-[10px] text-gray-400 text-center">
                <p>CONFIDENTIAL - PROPRIETARY AI RESEARCH GENERATED BY APEX CAPITAL AI.</p>
                <p>This report is for educational purposes only and does not constitute financial advice.</p>
            </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-4 no-print">
            <button onClick={handleSave} disabled={saved} className={`flex items-center gap-2 px-6 py-3 rounded transition-colors font-bold uppercase tracking-widest ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                <Save size={18} /> {saved ? 'Saved' : 'Save Report'}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors font-bold uppercase tracking-widest">
                <Printer size={18} /> Print / Save PDF
            </button>
        </div>
    </div>
  );
}

// --- Main Component ---

export default function MissionControl() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [data, setData] = useState<FullAnalysis | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'THESIS' | 'FINANCIALS' | 'VALUATION' | 'AI_RISK' | 'COMPS' | 'DEEP_DIVE' | 'REPORT'>('OVERVIEW');
  const [financialView, setFinancialView] = useState<'INCOME' | 'BALANCE' | 'CASH' | 'RATIOS'>('INCOME');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Use the market simulation hook
  const portfolioData = useMarketSimulation(PORTFOLIO_DATA_INIT);

  const addLog = (agent: AgentLog['agent'], message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36), agent, message, timestamp: Date.now() }]);
  };

  const executeAnalysis = async (ticker: string) => {
    setStatus(AnalysisStatus.SEARCHING);
    setLogs([]);
    setData(null);
    setErrorMsg('');
    setActiveTab('OVERVIEW');
    setShowTerminal(false);
    setInput(ticker);

    // Simulation of agents working before/during the API call
    addLog('SCOUT', `Initializing deep-scan protocol for target: ${ticker.toUpperCase()}...`);
    
    setTimeout(() => addLog('SCOUT', 'Accessing global market databases & EDGAR filings...'), 800);
    setTimeout(() => addLog('SCOUT', 'Aggregating competitor benchmarks...'), 1600);
    
    try {
      const result = await analyzeCompany(ticker);
      
      addLog('ANALYST', 'Raw financial data ingested. Normalizing accounting policies...');
      setTimeout(() => addLog('ASSOCIATE', 'Reconciling Balance Sheet and Cash Flow statements...'), 500);
      setTimeout(() => addLog('PM', 'Formulating Bull/Bear scenarios and investment thesis...'), 1200);
      setTimeout(() => addLog('VP', 'Stress-testing LBO models and moat durability...'), 2000);
      setTimeout(() => addLog('VP', 'Synthesizing final investment memo...'), 2800);

      setTimeout(() => {
        setData(result);
        setStatus(AnalysisStatus.COMPLETE);
        // Terminal stays closed by default now until requested via floating agent
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
       for(let i=0; i<histLen; i++) {
           headerRow += `,${currentYear - (histLen - i)}A`;
       }
       for(let i=0; i<projLen; i++) {
           headerRow += `,${currentYear + 1 + i}E`;
       }
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

    csvContent += "FINANCIAL RATIOS\n";
    csvContent += "Category,Metric,Value\n";
    Object.entries(data.financialRatios).forEach(([category, ratios]) => {
        (ratios as Ratio[]).forEach(r => {
            csvContent += `"${category.toUpperCase()}","${r.name}","${r.value}"\n`;
        });
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
      
      {/* Global Ticker Tape */}
      <div className="fixed top-0 left-0 right-0 z-50">
         <TickerTape />
      </div>

      {/* Top Bar */}
      <header className="flex justify-between items-center mb-8 border-b border-cyan-900/50 pb-4 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-400 flex items-center justify-center">
            <Activity className="text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Apex Capital <span className="text-cyan-400">AI</span></h1>
            <p className="text-xs text-cyan-600 font-mono tracking-wider">AUTONOMOUS BANKING UNIT v3.0</p>
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

      {/* Input Area */}
      <div className="max-w-4xl mx-auto mb-8">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded opacity-20 blur transition duration-500 group-hover:opacity-40"></div>
          <div className="relative flex items-center bg-black border border-cyan-800 rounded overflow-hidden">
            <span className="pl-4 text-cyan-500 font-mono">{'>'}</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ENTER TICKER (e.g. AAPL) OR URL TO INITIATE DEEP RESEARCH..." 
              className="w-full bg-transparent border-none text-white p-4 focus:ring-0 font-mono placeholder:text-slate-600"
            />
            <button 
              type="submit" 
              disabled={status === AnalysisStatus.SEARCHING}
              className="bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 px-8 py-4 border-l border-cyan-800 transition-colors uppercase tracking-wider font-bold flex items-center gap-2 disabled:opacity-50"
            >
               {status === AnalysisStatus.SEARCHING ? 'Processing' : 'Initiate'} <Zap size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* IDLE STATE DASHBOARD */}
      {status === AnalysisStatus.IDLE && (
         <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            
            {/* Top: Opportunities */}
            <div className="w-full">
               <Panel title="AI Scout // Market Opportunities" icon={Target}>
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      High-Alpha Setup Detected by Scout Agent
                  </div>
                  <OpportunityGrid onSelect={executeAnalysis} />
               </Panel>
            </div>

            {/* Bottom: Portfolio */}
            <div className="w-full">
               <PortfolioOverview data={portfolioData} />
            </div>
         </div>
      )}

      {/* Main Content Area */}
      {status === AnalysisStatus.SEARCHING && (
        <div className="max-w-4xl mx-auto h-[60vh]">
           <Panel title="Agent Activity Log" className="h-full border-cyan-500/30">
             <AgentLoader logs={logs} />
           </Panel>
        </div>
      )}

      {status === AnalysisStatus.COMPLETE && data && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
          
          {/* HUD Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Live Price" value={data.profile.price} subValue={`${data.profile.marketCap} Mkt Cap`} trend="neutral" isLivePrice={true} />
            <MetricCard label="Implied Upside" value={`${data.dcf.upsideDownside > 0 ? '+' : ''}${data.dcf.upsideDownside.toFixed(1)}%`} subValue={`Target: $${data.dcf.sharePriceTarget.toFixed(2)}`} trend={data.dcf.upsideDownside > 0 ? 'up' : 'down'} />
            <MetricCard label="LBO IRR (5yr)" value={`${data.lbo.irr.toFixed(1)}%`} subValue={`${data.lbo.moc.toFixed(2)}x MoC`} trend="up" />
            <MetricCard label="Thesis" value={data.thesis.rating} subValue={`${data.thesis.conviction}% Conviction`} trend={data.thesis.rating === 'BUY' ? 'up' : data.thesis.rating === 'SELL' ? 'down' : 'neutral'} />
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-cyan-900/50 overflow-x-auto">
             {['OVERVIEW', 'THESIS', 'AI_RISK', 'FINANCIALS', 'VALUATION', 'COMPS', 'DEEP_DIVE', 'REPORT'].map((tab) => (
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

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* REPORT TAB TAKES FULL WIDTH */}
            {activeTab === 'REPORT' ? (
                <div className="col-span-3">
                    <ResearchReport data={data} />
                </div>
            ) : (
            <>
            {/* LEFT COLUMN (2/3) */}
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

                    {/* Intelligence Sources moved here for Overview to balance layout */}
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

                   {/* News Wire moved to Main Column for Overview Only to balance height */}
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

                  {/* NEW: BULL VS BEAR BATTLE CARD */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Panel title="Bull Case" icon={ArrowUpRight} className="border-t-4 border-t-green-500">
                          <ul className="space-y-3 mt-2">
                              {data.thesis.bullCase?.map((arg, i) => (
                                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0"></div>
                                      {arg}
                                  </li>
                              )) || <li className="text-xs text-slate-500 italic">Generating arguments...</li>}
                          </ul>
                      </Panel>
                      <Panel title="Bear Case" icon={ArrowDownRight} className="border-t-4 border-t-red-500">
                          <ul className="space-y-3 mt-2">
                              {data.thesis.bearCase?.map((arg, i) => (
                                  <li key={i} className="flex gap-2 text-xs text-slate-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0"></div>
                                      {arg}
                                  </li>
                              )) || <li className="text-xs text-slate-500 italic">Generating arguments...</li>}
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

              {activeTab === 'AI_RISK' && (
                  <div className="space-y-6">
                     <Panel title="AI Displacement Risk Matrix" icon={BrainCircuit} className="border-l-4 border-l-purple-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-64">
                               <AIRadarChart risk={data.aiRisk} />
                            </div>
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
                                    <p className="text-[10px] text-slate-400 mt-2 italic">
                                        Probability of business model irrelevance due to sudden AI behavior shifts (e.g. "The StackOverflow Effect").
                                    </p>
                                </div>
                                
                                <div className="flex justify-between items-center p-3 border-b border-slate-800">
                                   <span className="text-xs text-slate-400">Innovation Lag</span>
                                   <span className={`text-sm font-bold ${data.aiRisk.innovationLag === 'LEADER' ? 'text-green-400' : data.aiRisk.innovationLag === 'LAGGARD' ? 'text-red-400' : 'text-yellow-400'}`}>
                                      {data.aiRisk.innovationLag}
                                   </span>
                                </div>
                                <div className="flex justify-between items-center p-3">
                                   <span className="text-xs text-slate-400">Replacement Prob.</span>
                                   <span className="text-sm font-bold text-purple-400">{data.aiRisk.replacementProbability}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-purple-900/10 border border-purple-900/30 rounded">
                            <h4 className="text-xs font-bold text-purple-400 uppercase mb-2">Assessment Summary</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">{data.aiRisk.summary}</p>
                        </div>
                     </Panel>
                     
                     {/* NEW: TIME TO IMPACT TIMELINE */}
                     <Panel title="Time-to-Impact Forecast" icon={Clock}>
                         <div className="relative pt-8 pb-4 px-4">
                             <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
                             <div className="flex justify-between relative z-10">
                                 {['Immediate (<12m)', 'Near Term (1-3y)', 'Long Term (5y+)'].map((period, i) => (
                                     <div key={i} className="flex flex-col items-center">
                                         <div className={`w-4 h-4 rounded-full border-2 bg-slate-950 ${i === 1 ? 'border-purple-500 scale-125' : 'border-slate-600'}`}></div>
                                         <div className={`text-[10px] mt-2 uppercase font-bold ${i === 1 ? 'text-purple-400' : 'text-slate-500'}`}>{period}</div>
                                         {i === 1 && <div className="text-[10px] text-slate-400 mt-1 bg-slate-900 px-2 py-1 rounded border border-slate-800">Peak Disruption</div>}
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </Panel>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Panel title="Threat Vectors" icon={AlertTriangle}>
                            <ul className="space-y-2">
                                {data.aiRisk.threats.map((threat, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-red-200 bg-red-950/30 p-2 rounded border border-red-900/20">
                                        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-red-500" />
                                        {threat}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                        <Panel title="Defensive Moats (AI)" icon={Shield}>
                            <ul className="space-y-2">
                                {data.aiRisk.mitigants.map((mitigant, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-green-200 bg-green-950/30 p-2 rounded border border-green-900/20">
                                        <Shield size={12} className="shrink-0 mt-0.5 text-green-500" />
                                        {mitigant}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                     </div>
                  </div>
              )}

              {activeTab === 'FINANCIALS' && (
                 <Panel title="3-Statement Analysis & Ratios" icon={BarChart3}>
                    {/* Financials Sub-Navigation */}
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
                                    financialView === view.id 
                                    ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-700/50' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                <view.icon size={12} />
                                {view.label}
                            </button>
                        ))}
                        </div>

                        <button 
                            onClick={downloadAllFinancials}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-400 border border-cyan-800 hover:border-cyan-600 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20 group"
                        >
                            <Download size={14} className="group-hover:scale-110 transition-transform" /> 
                            <span>Export All Data</span>
                        </button>
                    </div>

                    <div className="animate-fade-in">
                        {financialView === 'INCOME' && (
                            <div className="space-y-8">
                                <div className="h-96 w-full mb-8">
                                    <FinancialChart data={data.incomeStatement.rows.slice(0, 2)} title="Income Trend" />
                                </div>
                                <FinancialStatementTable statement={data.incomeStatement} />
                                
                                {/* NEW: MARGIN ANALYSIS FILLER */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800 mt-4">
                                     <div>
                                        <h4 className="text-xs text-slate-400 uppercase font-bold mb-4">Margin Mastery</h4>
                                        <div className="h-40 w-full">
                                            <ResponsiveContainer>
                                                <AreaChart data={[
                                                    { name: 'Y1', gm: 40, ebitda: 20, net: 10 },
                                                    { name: 'Y2', gm: 42, ebitda: 22, net: 12 },
                                                    { name: 'Y3', gm: 45, ebitda: 25, net: 15 },
                                                ]}>
                                                    <Area type="monotone" dataKey="gm" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
                                                    <Area type="monotone" dataKey="ebitda" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                                                    <Area type="monotone" dataKey="net" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                                            <span className="text-cyan-400">● Gross</span>
                                            <span className="text-purple-400">● EBITDA</span>
                                            <span className="text-green-400">● Net</span>
                                        </div>
                                     </div>
                                     <div className="flex flex-col justify-center space-y-4">
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                                            <div className="text-xs text-slate-500 uppercase">Revenue CAGR (3yr)</div>
                                            <div className="text-xl font-bold text-white font-mono">18.5%</div>
                                        </div>
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                                            <div className="text-xs text-slate-500 uppercase">EBITDA CAGR (3yr)</div>
                                            <div className="text-xl font-bold text-purple-400 font-mono">22.1%</div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        )}
                        {financialView === 'BALANCE' && (
                            <div className="space-y-8">
                                <div className="h-96 w-full mb-8">
                                    <FinancialChart data={data.balanceSheet.rows.filter(r => r.metric.includes('Assets') || r.metric.includes('Equity'))} title="BS Trend" />
                                </div>
                                <FinancialStatementTable statement={data.balanceSheet} />
                                
                                {/* NEW: CAPITAL STRUCTURE FILLER */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800 mt-4">
                                    <div className="h-48">
                                        <h4 className="text-xs text-slate-400 uppercase font-bold mb-2">Capital Structure</h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490' }} itemStyle={{color: '#fff'}} />
                                                <ZAxis dataKey="value" />
                                                <CartesianGrid stroke="none" />
                                                <Area dataKey="value" />
                                                {/* Mock Pie Data using LBO Debt vs Market Cap */}
                                                {(() => {
                                                    const debt = data.lbo.debtAmount;
                                                    const equity = parseFloat(data.profile.marketCap.replace(/[^0-9.]/g, '')) * 1000; // Rough estimate if B, else M
                                                    const pieData = [
                                                        { name: 'Debt', value: debt, fill: '#ef4444' },
                                                        { name: 'Equity', value: equity, fill: '#3b82f6' }
                                                    ];
                                                    return (
                                                        // @ts-ignore - piechart types are tricky in this simplified snippet
                                                        <Bar dataKey="value" data={pieData} /> 
                                                    );
                                                })()}
                                                {/* Recharts Pie component would go here, simplified placeholder below */}
                                            </PieChart>
                                        </ResponsiveContainer>
                                        {/* Manual Pie Placeholder for robustness since data needs cleaning */}
                                        <div className="flex items-center justify-center h-full gap-8">
                                            <div className="relative w-32 h-32 rounded-full border-8 border-blue-600 border-t-red-500 animate-spin-slow">
                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                    D/E
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-600"></div> Equity</div>
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500"></div> Debt</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {financialView === 'CASH' && (
                            <div className="space-y-8">
                                <div className="h-96 w-full mb-8">
                                     <FinancialChart data={data.cashFlowStatement.rows.filter(r => r.metric.includes('Free') || r.metric.includes('CFO'))} title="CF Trend" />
                                </div>
                                <FinancialStatementTable statement={data.cashFlowStatement} />
                            </div>
                        )}
                        {financialView === 'RATIOS' && (
                            <RatiosGrid ratios={data.financialRatios} />
                        )}
                    </div>
                 </Panel>
              )}

              {activeTab === 'VALUATION' && (
                 <div className="space-y-6">
                    <Panel title="DCF Methodology" icon={Lock}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex flex-col justify-center">
                                <div className="text-sm text-slate-400 mb-6">Discounted Cash Flow Analysis</div>
                                <div className="space-y-4 text-xs font-mono">
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Terminal Growth Rate</span>
                                        <span className="text-cyan-400 font-bold">{(data.dcf.terminalGrowthRate * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>WACC</span>
                                        <span className="text-cyan-400 font-bold">{(data.dcf.wacc * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Enterprise Value</span>
                                        <span className="text-cyan-400 font-bold">{data.dcf.enterpriseValue.toLocaleString()} M</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Equity Value</span>
                                        <span className="text-cyan-400 font-bold">{data.dcf.equityValue.toLocaleString()} M</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-96">
                            <ValuationFootballField dcf={data.dcf} comps={data.valuationComps} />
                            </div>
                        </div>
                    </Panel>
                    
                    {/* NEW: SENSITIVITY MATRIX */}
                    <Panel title="Sensitivity Matrix (WACC vs. Growth)" icon={Target}>
                        <div className="mb-2 text-xs text-slate-400">Impact on Share Price</div>
                        <SensitivityMatrix baseWacc={data.dcf.wacc} baseGrowth={data.dcf.terminalGrowthRate} basePrice={data.dcf.sharePriceTarget} />
                    </Panel>

                     {/* NEW: RV SCATTER PLOT */}
                     <Panel title="Relative Valuation (Growth vs. Multiple)" icon={ScatterIcon}>
                        <div className="h-80">
                            <CompsScatterPlot comps={data.valuationComps} />
                        </div>
                        <div className="text-center text-xs text-slate-500 mt-2">Revenue Growth (X) vs EV/EBITDA (Y)</div>
                     </Panel>
                 </div>
              )}

              {activeTab === 'COMPS' && (
                  <div className="space-y-6">
                      <Panel title="Public Comparable Analysis" icon={Table} onDownload={() => downloadCSV(data.valuationComps, 'public_comps')}>
                          <div className="overflow-x-auto">
                              <table className="w-full text-xs font-mono text-left">
                                  <thead>
                                      <tr className="border-b border-slate-800 text-slate-500">
                                          <th className="p-2">Ticker</th>
                                          <th className="p-2 text-right">EV/EBITDA</th>
                                          <th className="p-2 text-right">P/E</th>
                                          <th className="p-2 text-right">Rev Growth</th>
                                          <th className="p-2 text-right">EBITDA Margin</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {data.valuationComps.map((comp, i) => (
                                          <tr key={i} className="border-b border-slate-900/50 hover:bg-cyan-900/10 transition-colors">
                                              <td className="p-2 font-bold text-cyan-400">{comp.ticker}</td>
                                              <td className="p-2 text-right text-white">{comp.evEbitda.toFixed(1)}x</td>
                                              <td className="p-2 text-right text-white">{comp.pe.toFixed(1)}x</td>
                                              <td className="p-2 text-right text-white">{comp.revenueGrowth.toFixed(1)}%</td>
                                              <td className="p-2 text-right text-white">{comp.ebitdaMargin.toFixed(1)}%</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </Panel>

                      {/* NEW: RELATIVE VALUATION CHART FILLER */}
                      <Panel title="Relative Valuation Benchmarking" icon={BarChart3}>
                           <div className="h-64 w-full">
                               {(() => {
                                   // Calculate Averages
                                   const avgEbitda = data.valuationComps.reduce((acc, c) => acc + c.evEbitda, 0) / data.valuationComps.length;
                                   const avgPe = data.valuationComps.reduce((acc, c) => acc + c.pe, 0) / data.valuationComps.length;
                                   const targetComp = data.valuationComps.find(c => c.ticker === data.profile.ticker) || data.valuationComps[0]; // Fallback
                                   
                                   const benchmarkData = [
                                       { name: 'EV/EBITDA', Target: targetComp.evEbitda, PeerAvg: avgEbitda },
                                       { name: 'P/E', Target: targetComp.pe, PeerAvg: avgPe },
                                   ];
                                   
                                   const premium = ((targetComp.evEbitda / avgEbitda) - 1) * 100;

                                   return (
                                       <div className="grid grid-cols-3 gap-4 h-full">
                                           <div className="col-span-2 h-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={benchmarkData} layout="vertical" margin={{left: 20}}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                                        <XAxis type="number" stroke="#64748b" tick={{fontSize: 10}} />
                                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{fontSize: 10}} width={60} />
                                                        <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#0e7490' }} />
                                                        <Legend wrapperStyle={{fontSize: '10px'}} />
                                                        <Bar dataKey="Target" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} />
                                                        <Bar dataKey="PeerAvg" fill="#64748b" radius={[0, 4, 4, 0]} barSize={20} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                           </div>
                                           <div className="flex flex-col justify-center items-center bg-slate-900/50 border border-slate-800 rounded p-4">
                                               <div className="text-xs text-slate-500 uppercase mb-1">Valuation vs Peers</div>
                                               <div className={`text-2xl font-black font-mono ${premium > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                   {premium > 0 ? '+' : ''}{premium.toFixed(1)}%
                                               </div>
                                               <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded mt-2 ${premium > 0 ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                                                   {premium > 0 ? 'PREMIUM' : 'DISCOUNT'}
                                               </div>
                                           </div>
                                       </div>
                                   );
                               })()}
                           </div>
                      </Panel>

                      <Panel title="Precedent Transactions" icon={History} onDownload={() => downloadCSV(data.precedentTransactions, 'precedent_transactions')}>
                           <div className="overflow-x-auto">
                              <table className="w-full text-xs font-mono text-left">
                                  <thead>
                                      <tr className="border-b border-slate-800 text-slate-500">
                                          <th className="p-2">Date</th>
                                          <th className="p-2">Target</th>
                                          <th className="p-2">Acquirer</th>
                                          <th className="p-2 text-right">Deal Size (M)</th>
                                          <th className="p-2 text-right">EV/EBITDA</th>
                                          <th className="p-2 text-right">Premium</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {data.precedentTransactions.map((tx, i) => (
                                          <tr key={i} className="border-b border-slate-900/50 hover:bg-purple-900/10 transition-colors">
                                              <td className="p-2 text-slate-400">{tx.date}</td>
                                              <td className="p-2 font-bold text-white">{tx.target}</td>
                                              <td className="p-2 text-slate-300">{tx.acquirer}</td>
                                              <td className="p-2 text-right text-white">${tx.dealSize.toLocaleString()}</td>
                                              <td className="p-2 text-right text-white">{tx.evEbitda.toFixed(1)}x</td>
                                              <td className="p-2 text-right text-green-400">{tx.premium.toFixed(1)}%</td>
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
                     <Panel 
                        title="Supply Chain & Network (Interactive)" 
                        icon={Network} 
                        className="cursor-pointer hover:border-cyan-500 transition-colors min-h-[300px] flex flex-col justify-center"
                     >
                         <div onClick={() => setActiveModal('SUPPLY_CHAIN')} className="h-full flex flex-col">
                            <div className="mb-4 text-xs text-slate-400 italic border-l-2 border-cyan-900 pl-2">
                                {data.supplyChain.risks}
                            </div>
                            <div className="flex-1">
                                <NetworkGraph supplyChain={data.supplyChain} />
                            </div>
                            <div className="text-center text-[10px] text-cyan-500 mt-4 uppercase tracking-widest animate-pulse">Click to Expand Network</div>
                         </div>
                     </Panel>
                     
                     <Panel 
                        title="Forensics & Earnings Quality (Interactive)" 
                        icon={Microscope}
                        className="cursor-pointer hover:border-cyan-500 transition-colors min-h-[300px] flex flex-col justify-center"
                     >
                         <div onClick={() => setActiveModal('FORENSICS')} className="h-full flex flex-col justify-center">
                            <div className="flex items-center gap-12 justify-center">
                                <div className="text-center">
                                    <div className={`text-5xl font-black font-mono mb-2 ${data.earningsQuality.score > 80 ? 'text-green-400' : data.earningsQuality.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {data.earningsQuality.score}/100
                                    </div>
                                    <div className="text-xs uppercase text-slate-500 tracking-widest">Quality Score</div>
                                </div>
                                <div className="flex-1 max-w-md border-l border-slate-800 pl-8">
                                    <h4 className="text-xs font-bold text-white mb-4 uppercase">Red Flags Detected</h4>
                                    <ul className="space-y-2">
                                        {data.earningsQuality.redFlags.map((flag, i) => (
                                            <li key={i} className="text-xs text-red-300 flex items-start gap-2">
                                                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-500" />
                                                {flag}
                                            </li>
                                        ))}
                                        {data.earningsQuality.redFlags.length === 0 && <li className="text-xs text-green-400">No major red flags detected.</li>}
                                    </ul>
                                </div>
                            </div>
                            <div className="text-center text-[10px] text-cyan-500 mt-8 uppercase tracking-widest animate-pulse">Click to View Forensic Report</div>
                         </div>
                     </Panel>

                     {/* NEW: INSIDER ACTIVITY */}
                     <Panel title="Insider Activity (Recent)" icon={User}>
                        <InsiderTrades transactions={data.insiderActivity} />
                     </Panel>
                  </div>
              )}

            </div>

            {/* RIGHT COLUMN (1/3) - SIDEBAR */}
            <div className="space-y-6">
               {/* VERDICT MODULE */}
               <Panel title="Analyst Verdict" className="border-t-4 border-t-cyan-500">
                   <div className="flex items-center justify-between mb-4">
                       <div>
                          <div className={`text-4xl font-black tracking-tighter ${
                              data.thesis.rating === 'BUY' ? 'text-green-500' : data.thesis.rating === 'SELL' ? 'text-red-500' : 'text-yellow-500'
                          }`}>
                             {data.thesis.rating}
                          </div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Recommendation</div>
                       </div>
                       <div className="text-right">
                          <div className="text-2xl font-bold text-white font-mono">{data.thesis.conviction}%</div>
                          <div className="text-xs text-slate-500 uppercase tracking-widest">Conviction</div>
                       </div>
                   </div>
                   
                   <ScoreBar score={data.thesis.moatScore} label="Moat Strength" icon={Shield} />
                   <div className="text-[10px] text-slate-500 -mt-3 mb-3 text-right italic">{data.thesis.moatSource}</div>
                   
                   <ScoreBar score={data.thesis.managementScore} label="Management" icon={Briefcase} />
               </Panel>

               {/* THE WIRE - Only show in Sidebar if NOT Overview tab */}
               {activeTab !== 'OVERVIEW' && (
                   <Panel title="The Wire" icon={Newspaper}>
                      <NewsWire news={data.news} />
                   </Panel>
               )}

               <Panel title="LBO Feasibility" icon={PieChart}>
                 <div className="flex flex-col items-center justify-center py-4">
                    <div className={`text-4xl font-bold font-mono mb-2 ${data.lbo.irr > 20 ? 'text-green-400' : data.lbo.irr > 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                       {data.lbo.irr.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-4">Projected 5-Yr IRR</div>
                    
                    <div className="w-full space-y-3 text-xs font-mono">
                       <div className="flex justify-between">
                          <span className="text-slate-400">Entry Multiple</span>
                          <span className="text-white">{data.lbo.entryMultiple}x</span>
                       </div>
                       <div className="w-full bg-slate-800 h-1">
                          <div className="bg-cyan-600 h-1" style={{width: '70%'}}></div>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-slate-400">Exit Multiple</span>
                          <span className="text-white">{data.lbo.exitMultiple}x</span>
                       </div>
                       <div className="flex justify-between pt-2 border-t border-slate-800">
                          <span className="text-slate-400">Est. Debt Cap</span>
                          <span className="text-red-400">${data.lbo.debtAmount.toLocaleString()} M</span>
                       </div>
                    </div>
                 </div>
               </Panel>

               <Panel title="Market Comps" icon={Search}>
                  <div className="space-y-3">
                     {data.valuationComps.map((comp, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-slate-950/50 border border-slate-800">
                           <span className="font-bold text-cyan-500">{comp.ticker}</span>
                           <div className="text-right">
                              <div className="text-xs text-slate-400">EV/EBITDA</div>
                              <div className="font-mono text-white">{comp.evEbitda.toFixed(1)}x</div>
                           </div>
                           <div className="text-right">
                              <div className="text-xs text-slate-400">P/E</div>
                              <div className="font-mono text-white">{comp.pe.toFixed(1)}x</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </Panel>
               
               <div className="p-4 border border-yellow-900/30 bg-yellow-900/10 rounded-sm flex items-start gap-3">
                  <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                  <p className="text-[10px] text-yellow-500 leading-tight">
                     AI GENERATED MODELS. FOR INFORMATIONAL PURPOSES ONLY. NOT FINANCIAL ADVICE. VERIFY ALL ASSUMPTIONS.
                  </p>
               </div>

            </div>
            </>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <Modal isOpen={activeModal === 'SUPPLY_CHAIN'} onClose={() => setActiveModal(null)} title="Deep Supply Chain Analysis">
         {data && (
            <div className="space-y-6">
               <p className="text-sm text-slate-300 leading-relaxed">{data.supplyChain.risks}</p>
               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 p-4 border border-slate-800">
                     <h4 className="text-xs font-bold text-cyan-400 uppercase mb-4">Upstream Suppliers (Risk Assessment)</h4>
                     <ul className="space-y-2 text-sm">
                        {data.supplyChain.suppliers.map((s, i) => (
                           <li key={i} className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-white">{s}</span>
                              <span className="text-yellow-500 text-xs">Medium Dependency</span>
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-slate-900/50 p-4 border border-slate-800">
                     <h4 className="text-xs font-bold text-purple-400 uppercase mb-4">Downstream Clients (Revenue Exposure)</h4>
                     <ul className="space-y-2 text-sm">
                        {data.supplyChain.customers.map((c, i) => (
                           <li key={i} className="flex justify-between border-b border-slate-800 pb-2">
                              <span className="text-white">{c}</span>
                              <span className="text-green-500 text-xs">High Growth</span>
                           </li>
                        ))}
                     </ul>
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
                  <div>
                     <h4 className="text-sm font-bold text-red-400 uppercase mb-1">Accounting Anomalies Detected</h4>
                     <ul className="list-disc pl-4 space-y-1">
                        {data.earningsQuality.redFlags.map((flag, i) => (
                           <li key={i} className="text-xs text-slate-300">{flag}</li>
                        ))}
                     </ul>
                  </div>
               </div>
               <div className="p-4 bg-slate-900/50 border border-slate-800">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase mb-2">Auditor Notes</h4>
                  <p className="text-sm text-slate-400 font-mono whitespace-pre-line">{data.earningsQuality.accountingNotes}</p>
               </div>
            </div>
         )}
      </Modal>
      
      {/* Fixed Bottom Command Terminal */}
      {status === AnalysisStatus.COMPLETE && data && (
         <>
             <FloatingAgent onClick={() => setShowTerminal(!showTerminal)} />
             
             <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${showTerminal ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                 <div className="max-w-3xl mx-auto h-[350px] shadow-[0_-20px_50px_rgba(0,0,0,0.9)]">
                     <div className="flex justify-end mb-1">
                        <button onClick={() => setShowTerminal(false)} className="bg-slate-900 text-slate-500 px-2 py-1 text-[10px] uppercase hover:text-white">Close Terminal</button>
                     </div>
                     <AlphaTerminal analysis={data} />
                 </div>
             </div>
         </>
      )}

      {status === AnalysisStatus.ERROR && (
         <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-950/20 border border-red-900 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-xl text-red-400 font-bold mb-2">ANALYSIS FAILED</h2>
            <p className="text-slate-400 mb-4">Unable to retrieve data for the requested target.</p>
            {errorMsg && (
                <div className="bg-red-950/50 p-3 rounded text-xs font-mono text-red-300 mb-6 overflow-auto max-h-32 text-left whitespace-pre-wrap">
                    {errorMsg}
                </div>
            )}
            <button 
               onClick={() => setStatus(AnalysisStatus.IDLE)}
               className="px-6 py-2 border border-red-800 text-red-400 hover:bg-red-900/30"
            >
               RESET SYSTEM
            </button>
         </div>
      )}
    </div>
  );
}
