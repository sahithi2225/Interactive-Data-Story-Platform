import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts'

export const PALETTES = {
  Ocean:  ['#1a73e8', '#22c1c3', '#6a5acd', '#0b4f8a', '#60a5fa', '#3b82f6'],
  Sunset: ['#ff6b35', '#f7931e', '#e84393', '#6c5ce7', '#fbbf24', '#ef4444'],
  Forest: ['#16a34a', '#22c55e', '#84cc16', '#0ea5e9', '#14b8a6', '#a3e635'],
  Mono:   ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
  Neon:   ['#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#fb7185'],
}

export default function ChartRenderer({ chart, palette = 'Ocean', type }) {
  const colors = PALETTES[palette] || PALETTES.Ocean
  const data = chart.data || []
  const t = type || chart.type

  if (t === 'bar') return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="name" /><YAxis /><Tooltip /><Legend />
        <Bar dataKey="value" fill={colors[0]} radius={[8,8,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
  if (t === 'line') return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
        <XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/>
        <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={3} dot={{r:3}}/>
      </LineChart>
    </ResponsiveContainer>
  )
  if (t === 'area') return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}><defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity={0.7}/>
          <stop offset="100%" stopColor={colors[0]} stopOpacity={0.05}/>
        </linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
        <XAxis dataKey="name"/><YAxis/><Tooltip/>
        <Area type="monotone" dataKey="value" stroke={colors[0]} fill="url(#g)" strokeWidth={2}/>
      </AreaChart>
    </ResponsiveContainer>
  )
  if (t === 'pie') return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie><Tooltip/><Legend/>
      </PieChart>
    </ResponsiveContainer>
  )
  if (t === 'scatter') return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart><CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
        <XAxis dataKey="x" type="number"/><YAxis dataKey="y" type="number"/>
        <Tooltip cursor={{strokeDasharray:'3 3'}}/>
        <Scatter data={data} fill={colors[1]} />
      </ScatterChart>
    </ResponsiveContainer>
  )
  if (t === 'histogram') return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/>
        <XAxis dataKey="name"/><YAxis/><Tooltip/>
        <Bar dataKey="value" fill={colors[2]} radius={[6,6,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
  return null
}
