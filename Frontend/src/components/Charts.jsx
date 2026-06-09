import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import './Charts.css';

const defaultTrafficData = [
  { time: '12 AM', value: 10 },
  { time: '4 AM', value: 25 },
  { time: '8 AM', value: 65, peak: true },
  { time: '12 PM', value: 40 },
  { time: '4 PM', value: 85 },
  { time: '8 PM', value: 50 },
  { time: '12 AM', value: 15 },
];

const defaultTravelTimeData = [
  { time: '12 AM', timeVal: 450 },
  { time: '6 AM', timeVal: 480 },
  { time: '10 AM', timeVal: 560, active: true },
  { time: '12 PM', timeVal: 520 },
  { time: '2 PM', timeVal: 500 },
  { time: '4 PM', timeVal: 550 },
  { time: '6 PM', timeVal: 580 },
  { time: '8 PM', timeVal: 510 },
  { time: '12 AM', timeVal: 450 },
];

const Charts = ({ routeData }) => {
  // Derive potential values from backend data
  const potentialValues = React.useMemo(() => {
    if (!routeData) return { business: 0, student: 0, tourist: 0 };

    const seg = routeData.area_segmentation || {};
    const demand = routeData.demand_distribution || [];
    const avgDemand = demand.length > 0
      ? demand.reduce((acc, s) => acc + s.percentage, 0) / demand.length
      : 50;

    return {
      business: seg.job_business_areas?.length
        ? Math.min(100, 40 + seg.job_business_areas.length * 12)
        : Math.round(avgDemand * 1.1),
      student: seg.student_areas?.length
        ? Math.min(100, 30 + seg.student_areas.length * 15)
        : Math.round(avgDemand * 0.9),
      tourist: seg.tourist_places?.length
        ? Math.min(100, 35 + seg.tourist_places.length * 13)
        : Math.round(avgDemand * 0.95)
    };
  }, [routeData]);

  // Use real data from backend if available
  const trafficTrends = routeData?.dashboard_data?.traffic_trends?.length > 0
    ? routeData.dashboard_data.traffic_trends
    : defaultTrafficData;

  const travelTimeData = routeData?.dashboard_data?.travel_time_by_hour?.length > 0
    ? routeData.dashboard_data.travel_time_by_hour.map(h => ({
      time: h.hour,
      timeVal: h.minutes,
      active: h.active
    }))
    : defaultTravelTimeData;

  const recommendedTime = routeData?.dashboard_data?.recommended_time || { time: "10:00 AM", reason: "Optimal time to reach faster & avoid traffic." };

  const transportDist = routeData?.transport_distribution || routeData?.transport_pattern;
  const transportData = transportDist
    ? [
      { mode: 'Bus', share: transportDist.bus || 0, active: (transportDist.bus || 0) > 40 },
      { mode: 'Train', share: transportDist.train || 0, active: (transportDist.train || 0) > 40 },
      { mode: 'Car/Private', share: transportDist.car || transportDist.private || 0, active: (transportDist.car || transportDist.private || 0) > 40 }
    ]
    : null;

  const formatTimeVal = (val) => {
    if (transportData) return `${val}%`;
    if (val >= 60) {
      const h = Math.floor(val / 60);
      const m = val % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${val} min`;
  };

  const formatTickVal = (val) => {
    if (transportData) return `${val}%`;
    return val >= 60 ? `${Math.round(val / 60)}h` : `${val}m`;
  };

  return (
    <>
      {/* Dynamic Bar Chart: Travel Time OR Transport Mode Share */}
      <div className="glass-panel chart-widget hover-lift">
        <div className="widget-header">
          <h3>{transportData ? 'Transport Mode Share' : 'Travel Time by Hour'}</h3>
        </div>
        <div className="chart-container" style={{ width: '100%', height: '100%', minHeight: 0, minWidth: 0 }}>
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={transportData || travelTimeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey={transportData ? "mode" : "time"} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} dy={10} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} tickFormatter={formatTickVal} />
              <Tooltip
                cursor={{ fill: 'rgba(225, 29, 72, 0.05)' }}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}
                itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                formatter={(value, name) => [formatTimeVal(value), transportData ? 'Share' : 'Travel Time']}
              />
              <Bar dataKey={transportData ? "share" : "timeVal"} radius={[6, 6, 0, 0]}>
                {(transportData || travelTimeData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.active ? 'url(#colorTrafficRed)' : 'var(--border-light)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Potential Map - Redesigned to match requested style */}
      <div className="glass-panel chart-widget hover-lift redesigned-potential-map">
        <div className="widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="map-icon-box" style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3>Area Potential Map</h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', padding: '0 0 16px 0', flexWrap: 'wrap', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Business</label>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{potentialValues.business}%</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Student</label>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{potentialValues.student}%</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>Tourist</label>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{potentialValues.tourist}%</div>
          </div>
        </div>

        <div className="chart-container" style={{ width: '100%', height: '180px', minHeight: 0, minWidth: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            {/* Using a custom combination of Area and Bar for the requested "curved" look */}
            <AreaChart
              data={[
                { value: potentialValues.business, barVal: potentialValues.business },
                { value: potentialValues.student, barVal: potentialValues.student },
                { value: potentialValues.tourist, barVal: potentialValues.tourist }
              ]}
              margin={{ top: 10, right: 30, left: 30, bottom: 30 }}
            >
              <defs>
                <linearGradient id="colorPotentialOrange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 600 }} dy={8} angle={0} />
              <YAxis hide />
              <Tooltip
                cursor={false}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: '1px solid #eee' }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPotentialOrange)"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Overlay Bars Layer */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', padding: '10px 30px 0 30px', alignItems: 'flex-end' }}>
            {[
              { label: 'Business', value: potentialValues.business, color: '#e11d48' },
              { label: 'Student', value: potentialValues.student, color: '#3b82f6' },
              { label: 'Tourist', value: potentialValues.tourist, color: '#10b981' }
            ].map((item, idx) => (
              <div key={idx} style={{
                width: '18px',
                height: `${item.value}%`,
                backgroundColor: item.color,
                borderRadius: '4px 4px 0 0',
                boxShadow: `0 4px 12px ${item.color}66`,
                transition: 'all 0.3s ease'
              }}></div>
            ))}
          </div>
        </div>

        <p className="potential-caption" style={{
          fontSize: '0.75rem',
          color: '#64748b',
          marginTop: '20px',
          textAlign: 'left',
          fontWeight: '500'
        }}>
          Bar represents economic/tourist potential along the corridor.
        </p>
      </div>
    </>
  );
};

export default Charts;
