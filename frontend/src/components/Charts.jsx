import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

export const RiskTrendChart = ({ data = [] }) => {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    riskScore: Number(item.riskScore)
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '4px', color: '#fff' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Line 
            type="monotone" 
            dataKey="riskScore" 
            stroke="#0066cc" 
            strokeWidth={2.5} 
            dot={{ r: 4 }}
            activeDot={{ r: 6 }} 
            name="Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FrameworkDistributionChart = ({ data = [] }) => {
  const COLORS = ['#0066cc', '#10b981', '#f59e0b'];

  return (
    <div className="w-full h-[250px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '4px', color: '#fff' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskDistributionChart = ({ data = [] }) => {
  const getBarColor = (name) => {
    if (name.toLowerCase() === 'high') return '#ef4444';
    if (name.toLowerCase() === 'medium') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '4px', color: '#fff' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const AssessmentHistoryChart = ({ data = [] }) => {
  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    riskScore: Number(item.riskScore)
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066cc" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0066cc" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '4px', color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="riskScore" 
            stroke="#0066cc" 
            fillOpacity={1} 
            fill="url(#colorRisk)" 
            strokeWidth={2}
            name="Risk Score"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
