import React from 'react';
import { Users, Map, Train, Ticket, MapIcon, Bus, Car } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, ComposedChart, Area } from 'recharts';
import './RouteInsights.css';

const RouteInsights = ({ routeQuery, routeData }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // Delay rendering charts until layout is stable
    const timer = setTimeout(() => setIsMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // --- Data Definitions (Dynamic from Backend) ---
  const {
    popData,
    transportData,
    tourismData,
    areaData,
    suggestedRoutes,
    primaryDistance
  } = React.useMemo(() => {
    // 1. Demographics
    const aiPop = routeData?.population_data;
    const pData = aiPop ? [
      { name: aiPop.source?.name || 'Origin', value: Number(aiPop.source?.population) / 1000000 || 0, fill: '#e11d48' },
      { name: aiPop.destination?.name || 'Destination', value: Number(aiPop.destination?.population) / 1000000 || 0, fill: '#3b82f6' },
      ...(aiPop.via ? [{ name: aiPop.via.name || 'Via', value: Number(aiPop.via.population) / 1000000 || 0, fill: '#10b981' }] : [])
    ] : [];

    // 2. Transport Distribution
    const aiTransport = routeData?.transport_distribution || routeData?.transport_pattern;
    const transportColors = {
      bus: 'var(--accent-blue)',
      train: '#f59e0b',
      car: '#10b981',
      flight: '#8b5cf6',
      taxi: '#06b6d4',
      private: '#10b981'
    };

    const tData = (aiTransport && Object.keys(aiTransport).length > 0) ? Object.entries(aiTransport)
      .filter(([key, value]) => Number(value) > 0)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: Number(value),
        color: transportColors[key.toLowerCase()] || 'var(--accent-blue)'
      })) : [
      { name: 'Bus', value: 45, color: 'var(--accent-blue)' },
      { name: 'Train', value: 25, color: '#f59e0b' },
      { name: 'Car', value: 20, color: '#10b981' },
      { name: 'Taxi', value: 10, color: '#06b6d4' },
    ];

    // 3. Tourism / Visitor Data (Dynamic Pentagon Radar Chart)
    const aiTourism = routeData?.visitor_data;
    const aiArea = routeData?.area_segmentation;
    const allSpots = aiArea?.tourist_places || [];

    const srcName = aiPop?.source?.name || 'Origin';
    const dstName = aiPop?.destination?.name || 'Destination';
    const srcCity = srcName.split(',')[0].trim().toLowerCase();
    const dstCity = dstName.split(',')[0].trim().toLowerCase();
    const formatSpot = (s) => {
      if (s === null || s === undefined) return '';
      if (typeof s === 'string') return s.trim();
      if (typeof s === 'object') return (s.name || s.title || s.place || s.city || s.description || '').toString().trim();
      return String(s).trim();
    };

    const spotsToUse = [];

    // Priority 1: Use all available real tourist spots from backend (up to 5)
    allSpots.forEach(spot => {
      if (spotsToUse.length < 5) {
        const sRaw = formatSpot(spot);
        const sName = sRaw.toLowerCase();
        let val = 65; // Default for route spots
        let cityType = 'ROUTE';

        if (sName.includes(srcCity)) {
          val = Number(aiTourism?.source?.daily_normal) || 78;
          cityType = 'SOURCE';
        } else if (sName.includes(dstCity)) {
          val = Number(aiTourism?.destination?.daily_normal) || 88;
          cityType = 'DESTINATION';
        }

        // Adjust value slightly if we have multiple spots for the same city to make chart look better
        const existingCount = spotsToUse.filter(s => s.cityType === cityType).length;
        if (existingCount > 0) val = val * (1 - (existingCount * 0.1));

        spotsToUse.push({ name: sRaw, cityType, val });
      }
    });

    // Priority 2: Fill with city names if still under 5
    if (spotsToUse.length < 5 && !spotsToUse.find(s => s.cityType === 'SOURCE')) {
      spotsToUse.push({ name: srcName, cityType: 'SOURCE', val: Number(aiTourism?.source?.daily_normal) || 70 });
    }
    if (spotsToUse.length < 5 && !spotsToUse.find(s => s.cityType === 'DESTINATION')) {
      spotsToUse.push({ name: dstName, cityType: 'DESTINATION', val: Number(aiTourism?.destination?.daily_normal) || 80 });
    }

    // Priority 3: Fallback to Important Stops
    const stops = aiArea?.important_stops || [];
    let stopIdx = 0;
    while (spotsToUse.length < 5 && stopIdx < stops.length) {
      const stop = stops[stopIdx++];
      if (!spotsToUse.find(u => u.name === stop)) {
        spotsToUse.push({ name: stop, cityType: 'STOP', val: 60 });
      }
    }

    // Priority 4: Final synthetic fallback to maintain Pentagon shape
    while (spotsToUse.length < 5) {
      const isEven = spotsToUse.length % 2 === 0;
      spotsToUse.push({
        name: isEven ? srcName : dstName,
        cityType: isEven ? 'SOURCE' : 'DESTINATION',
        val: 50 + (Math.random() * 20)
      });
    }

    const tourData = spotsToUse.slice(0, 5).map(s => ({
      subject: `${s.name} (${Math.round(s.val)})`,
      A: Math.round(s.val)
    }));

    // 4. Area Segmentation
    const getName = (entry) => (entry?.name ?? entry ?? '');
    const aData = aiArea ? [
      {
        name: getName(aiArea.job_business_areas?.[0]) || 'Business Hubs',
        potential: 90,
        activity: 85,
        type: 'Industry'
      },
      {
        name: getName(aiArea.student_areas?.[0]) || 'Academic Zones',
        potential: 60,
        activity: 50,
        type: 'Education'
      },
      {
        name: getName(aiArea.tourist_places?.[0]) || 'Leisure Spots',
        potential: 85,
        activity: 80,
        type: 'Tourism'
      },
    ] : [
      { name: 'Business', potential: 90, activity: 85, type: 'Jobs' },
      { name: 'Student', potential: 60, activity: 50, type: 'Education' },
      { name: 'Tourist', potential: 85, activity: 80, type: 'Leisure' },
    ];

    // 5. Suggested Routes
    const distance = routeData?.route_summary?.total_distance_km ||
      routeData?.distance_details?.distance_km || 505;
    const time = routeData?.route_summary?.estimated_time_hours || 8.5;

    const routes = routeData?.suggested_routes || [
      { option: 1, path: routeData?.route_summary?.path?.join(' → ') || 'Primary Highway', distance, time },
      { option: 2, path: 'Alternative Route', distance: Math.round(distance * 1.05), time: Number((time * 1.1).toFixed(1)) },
    ];

    return {
      popData: pData,
      transportData: tData,
      tourismData: tourData,
      areaData: aData,
      suggestedRoutes: routes,
      primaryDistance: distance
    };
  }, [routeData]);

  if (!isMounted) return <div className="route-insights-container glass-panel mt-4" style={{ minHeight: '400px' }} />;

  // --- Render ---

  const CustomAxisTick = ({ payload, x, y, cx, cy, ...rest }) => {
    const { value } = payload;
    const angle = Math.atan2(y - cy, x - cx);
    // Apply larger offset ONLY to the top point to prevent interference
    const isTopPoint = Math.abs(angle + Math.PI / 2) < 0.1;
    const radiusOffset = isTopPoint ? 35 : 10;
    const newX = x + Math.cos(angle) * radiusOffset;
    const newY = y + Math.sin(angle) * radiusOffset;

    // Split the label into words and wrap if needed
    const words = value.split(' ');
    const maxChars = 10;
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length > maxChars) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    if (currentLine) lines.push(currentLine.trim());

    return (
      <g transform={`translate(${newX},${newY})`}>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={i * 11}
            textAnchor={newX > cx ? 'start' : (newX < cx ? 'end' : 'middle')}
            dominantBaseline="central"
            fill="var(--text-secondary)"
            style={{ fontSize: '9px', fontWeight: '600' }}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <div className="route-insights-container glass-panel mt-4">
      <div className="insights-header">
        <h2 className="insights-title">Route Insights: {routeQuery}</h2>
        <span className="badge live-data">Premium Analysis</span>
      </div>

      {/* SVG Defs for Gradients used in Charts */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="colorTrafficRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
          </linearGradient>
        </defs>
      </svg>

      <div className="insights-grid">

        {/* 1. Demographics & Distance (Bar Chart) */}
        {popData.length > 0 && (
          <div className="insight-card hover-lift">
            <div className="insight-card-header">
              <div className="insight-icon red"><Users size={20} /></div>
              <h3>Demographics & Distance</h3>
            </div>
            <div className="insight-card-content" style={{ width: '100%', minWidth: '0px' }}>
              <ResponsiveContainer width="100%" aspect={1.6}>
                <BarChart data={popData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} width={80} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', minWidth: '150px', padding: '8px' }}
                    labelStyle={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}
                    itemStyle={{ fontSize: '13px', padding: '0' }}
                    formatter={(value) => [`${(value * 1000000).toLocaleString()}`, 'Population']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {popData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">{suggestedRoutes[0]?.path || 'Primary Route'}</span>
                <span className="font-bold text-primary">{suggestedRoutes[0]?.distance || primaryDistance} KM</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-muted">{suggestedRoutes[1]?.path || 'Alternative'}</span>
                <span className="font-medium text-secondary">{suggestedRoutes[1]?.distance || Math.round(primaryDistance * 1.05)} KM</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Transport & Logistics (Donut Chart) */}
        {transportData.length > 0 && (
          <div className="insight-card hover-lift">
            <div className="insight-card-header">
              <div className="insight-icon blue"><Bus size={20} /></div>
              <h3>Transport Share</h3>
            </div>
            <div className="insight-card-content flex items-center justify-center" style={{ width: '100%', minWidth: '0px' }}>
              <ResponsiveContainer width="100%" aspect={1.6}>
                <PieChart>
                  <Pie
                    data={transportData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {transportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(value) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="transport-legend-row">
              {transportData.map((d, i) => (
                <div key={i} className="transport-legend-item">
                  <div className="transport-legend-dot" style={{ backgroundColor: d.color }}></div>
                  <span className="transport-legend-text">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Area Segmentation (Scatter/Bubble Chart) */}
        {areaData.length > 0 && (
          <div className="insight-card span-2 hover-lift">
            <div className="insight-card-header">
              <div className="insight-icon orange"><Map size={20} /></div>
              <h3>Area Potential Sectors</h3>
            </div>
            <div className="insight-card-content" style={{ width: '100%', minWidth: '0px' }}>
              <ResponsiveContainer width="100%" aspect={3.5}>
                <ComposedChart data={areaData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }} dy={10} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(value, name, props) => {
                      if (name === 'potential') return [value, 'Economic Potential'];
                      if (name === 'activity') return [value, 'Activity Level'];
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return `${label} (${payload[0].payload.type})`;
                      }
                      return label;
                    }}
                  />
                  <Area type="monotone" dataKey="activity" fill="url(#colorArea)" stroke="#f59e0b" strokeWidth={2} />
                  <Bar dataKey="potential" barSize={30} radius={[6, 6, 0, 0]}>
                    {areaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 1 || index === 4 ? '#e11d48' : '#dc2626'} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-center text-muted"> Bar represents economic/tourist potential along the corridor.</div>
          </div>
        )}

        {/* 4. Tourism & Visitors (Radar Chart) */}
        {tourismData.length > 0 && (
          <div className="insight-card hover-lift">
            <div className="insight-card-header">
              <div className="insight-icon purple"><Ticket size={20} /></div>
              <h3>Tourism Hotspots</h3>
            </div>
            <div className="insight-card-content" style={{ width: '100%', minWidth: '0px' }}>
              <ResponsiveContainer width="100%" aspect={1.6}>
                <RadarChart cx="50%" cy="50%" outerRadius="45%" data={tourismData}>
                  <PolarGrid stroke="rgba(0,0,0,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={<CustomAxisTick />} />
                  <Radar name="Visitors" dataKey="A" stroke="var(--purple-light)" fill="var(--purple-light)" fillOpacity={0.4} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
                    formatter={(value) => [`${value} `, 'Footindex']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 5. Suggested Routes (Graphical Timeline) */}
        {suggestedRoutes.length > 0 && (
          <div className="insight-card hover-lift">
            <div className="insight-card-header">
              <div className="insight-icon green"><MapIcon size={20} /></div>
              <h3>Route Tradeoffs</h3>
            </div>
            <div className="insight-card-content flex flex-col justify-center gap-4" style={{ minHeight: '160px', padding: '10px 0' }}>

              {suggestedRoutes.map((route, idx) => (
                <div key={idx} className="w-full">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">{route.path} {idx === 0 ? '(Optimal)' : ''}</span>
                    <span className="font-semibold text-primary">{Math.floor(route.time)}h {Math.round((route.time % 1) * 60)}m</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: idx === 0 ? '85%' : '95%', background: idx === 0 ? 'var(--gradient-primary)' : '#f59e0b' }}></div>
                  </div>
                  <div className="text-[10px] text-muted mt-1">{route.distance} KM • Detailed Analysis Avail.</div>
                </div>
              ))}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RouteInsights;
