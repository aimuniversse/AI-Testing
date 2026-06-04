import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, MapPin, Building2, Landmark, Mountain, Map,
  Bus, Train, Car, Briefcase, Package, Navigation, Clock,
  CheckCircle2, ArrowRight, Plane, Activity, Calendar, Share2,
  TrendingUp, Sun, ChevronRight, Sparkles, MoreHorizontal, Info,
  GraduationCap, Factory, BarChart2, ShieldCheck, Timer, Globe, Headphones,
  Leaf, Compass, Fuel, Mail, Phone, Truck
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import './PremiumReportPage.css';
import AreaPotentialMap from './AreaPotentialMap';
import pinIcon from '../assets/image/pin.png';
import industryIcon from '../assets/image/industry.png';
import touristIcon from '../assets/image/tourist.png';
import pointIcon from '../assets/image/point.png';
import destinationIcon from '../assets/image/destination.png';
import logoImg from '../assets/image/logo.jpeg';

const heroImage = "file:///C:/Users/DELL/.gemini/antigravity/brain/6f074f9e-ba21-4fd9-b5df-56ac4a6fbd6b/corridor_analysis_hero_1778234321074.png";




// ─── StateVisitorsPanel ─────────────────────────────────────────────────────
function StateVisitorsPanel({ demandDistribution = [], lastSyncTime }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('visitors'); // 'visitors' | 'share'
  const [hoveredCity, setHoveredCity] = useState(null);
  const [animated, setAnimated] = useState(false);

  // Re-trigger bar animation whenever the active tab changes
  useEffect(() => {
    setAnimated(false);
    setSearch('');
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [activeIdx]);

  if (!demandDistribution || demandDistribution.length === 0) {
    return (
      <section className="analysis-section-box section-spacing svp-container">
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
          No visitor data available.
        </p>
      </section>
    );
  }

  const palette = [
    { accent: '#3b82f6', soft: '#eff6ff', ring: '#2563eb' },
    { accent: '#10b981', soft: '#ecfdf5', ring: '#059669' },
    { accent: '#8b5cf6', soft: '#f5f3ff', ring: '#7c3aed' },
    { accent: '#f59e0b', soft: '#fffbeb', ring: '#d97706' },
    { accent: '#ec4899', soft: '#fdf2f8', ring: '#db2777' },
  ];

  const activeState = demandDistribution[activeIdx];
  const color = palette[activeIdx % palette.length];
  const rawCities = activeState?.top_cities || activeState?.cities || [];

  // Filter + sort
  const filtered = rawCities
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === 'visitors'
        ? (b.visitor_count || 0) - (a.visitor_count || 0)
        : (b.percentage || 0) - (a.percentage || 0)
    );

  const maxVisitors = Math.max(...rawCities.map(c => c.visitor_count || 0), 1);
  const totalShare = demandDistribution.reduce((s, d) => s + (d.percentage || 0), 0);

  // Radial ring SVG
  const R = 44, CX = 50, CY = 50;
  const circ = 2 * Math.PI * R;
  const pct = (activeState?.percentage || 0) / Math.max(totalShare, 100);
  const dash = pct * circ;

  return (
    <section className="analysis-section-box section-spacing svp-container">

      {/* ── Header ── */}
      <div className="svp-header">
        <div className="svp-title-block">
          <div className="svp-icon-wrap" style={{ background: color.soft, color: color.accent }}>
            <Map size={22} />
          </div>
          <div>
            <h2 className="svp-heading">Top Visitors by State</h2>
            <p className="svp-subheading">Visitor distribution by state with share and visitor count</p>

          </div>
        </div>
        <div className="svp-sync-badge">
          <span className="svp-sync-dot" />
          Live · {lastSyncTime}
        </div>
      </div>

      {/* ── State Tabs ── */}
      <div className="svp-tabs">
        {demandDistribution.map((s, i) => {
          const c = palette[i % palette.length];
          return (
            <button
              key={i}
              className={`svp-tab ${i === activeIdx ? 'svp-tab--active' : ''}`}
              style={i === activeIdx
                ? { borderColor: c.accent, color: c.accent, background: c.soft }
                : {}
              }
              onClick={() => setActiveIdx(i)}
            >
              <span className="svp-tab-dot" style={{ background: c.accent }} />
              {s.state}
              <span
                className="svp-tab-pill"
                style={i === activeIdx ? { background: c.accent, color: '#fff' } : {}}
              >
                {s.percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Panel ── */}
      <div className="svp-panel">

        {/* Left: Ring + state summary */}
        <div className="svp-ring-side">
          <div className="svp-ring-wrap">
            <svg viewBox="0 0 100 100" className="svp-ring-svg">
              {/* Background track */}
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth="10" />
              {/* Filled arc */}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={color.accent}
                strokeWidth="10"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={circ / 4}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
              />
              <text x="50" y="46" textAnchor="middle" className="svp-ring-pct" fill={color.accent}>
                {activeState?.percentage || 0}%
              </text>
              <text x="50" y="60" textAnchor="middle" className="svp-ring-label" fill="#94a3b8">
                Share
              </text>
            </svg>
          </div>
          <div className="svp-state-meta">
            <div className="svp-meta-stat" style={{ borderColor: color.soft }}>
              <Users size={15} style={{ color: color.accent }} />
              <span>
                {rawCities.reduce((s, c) => s + (c.visitor_count || 0), 0).toLocaleString()}
              </span>
              <small>Total Visitors</small>
            </div>
            <div className="svp-meta-stat" style={{ borderColor: color.soft }}>
              <MapPin size={15} style={{ color: color.accent }} />
              <span>{rawCities.length}</span>
              <small>Cities</small>
            </div>
          </div>

          {/* All-states mini legend */}
          <div className="svp-mini-legend">
            {demandDistribution.map((s, i) => {
              const c = palette[i % palette.length];
              const w = (s.percentage / Math.max(totalShare, 1)) * 100;
              return (
                <div key={i} className="svp-legend-row" onClick={() => setActiveIdx(i)} style={{ cursor: 'pointer' }}>
                  <span className="svp-legend-dot" style={{ background: c.accent }} />
                  <span className="svp-legend-name">{s.state}</span>
                  <div className="svp-legend-bar-bg">
                    <div className="svp-legend-bar-fill" style={{ width: `${w}%`, background: c.accent }} />
                  </div>
                  <span className="svp-legend-pct">{s.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: City breakdown */}
        <div className="svp-cities-side">

          {/* Controls */}
          <div className="svp-controls">
            <div className="svp-search-wrap">
              <MapPin size={14} style={{ color: '#94a3b8' }} />
              <input
                className="svp-search"
                placeholder="Search city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="svp-sort-group">
              <button
                className={`svp-sort-btn ${sortBy === 'visitors' ? 'svp-sort-btn--active' : ''}`}
                style={sortBy === 'visitors' ? { background: color.accent, color: '#fff', borderColor: color.accent } : {}}
                onClick={() => setSortBy('visitors')}
              >
                <Users size={12} /> Visitors
              </button>
              <button
                className={`svp-sort-btn ${sortBy === 'share' ? 'svp-sort-btn--active' : ''}`}
                style={sortBy === 'share' ? { background: color.accent, color: '#fff', borderColor: color.accent } : {}}
                onClick={() => setSortBy('share')}
              >
                <TrendingUp size={12} /> Share
              </button>
            </div>
          </div>

          {/* City rows */}
          <div className="svp-city-list">
            {filtered.length === 0 && (
              <p className="svp-no-results">No cities match your search.</p>
            )}
            {filtered.map((city, ci) => {
              const barW = animated
                ? `${((city.visitor_count || 0) / maxVisitors) * 100}%`
                : '0%';
              const isHov = hoveredCity === ci;
              return (
                <div
                  key={ci}
                  className={`svp-city-row ${isHov ? 'svp-city-row--hovered' : ''}`}
                  style={isHov ? { borderColor: color.accent, background: color.soft } : {}}
                  onMouseEnter={() => setHoveredCity(ci)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  <div className="svp-city-rank" style={{ background: color.soft, color: color.accent }}>
                    {ci + 1}
                  </div>
                  <div className="svp-city-info">
                    <div className="svp-city-top-row">
                      <span className="svp-city-name">{city.name}</span>
                      <span className="svp-city-share" style={{ color: color.accent }}>
                        {city.percentage}%
                      </span>
                    </div>
                    <div className="svp-city-bar-bg">
                      <div
                        className="svp-city-bar-fill"
                        style={{
                          width: barW,
                          background: `linear-gradient(90deg, ${color.accent}, ${color.ring})`,
                          transitionDelay: `${ci * 60}ms`
                        }}
                      />
                    </div>
                    <div className="svp-city-bottom-row">
                      <span className="svp-city-count">
                        <Users size={11} /> {(city.visitor_count || 0).toLocaleString()} visitors
                      </span>
                      {isHov && (
                        <span className="svp-city-hover-tip" style={{ color: color.accent }}>
                          {((city.visitor_count / maxVisitors) * 100).toFixed(0)}% of top city
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="svp-footer-note">
            <Info size={13} />
            <span>Share percentages are calculated based on total visitors from each state.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function PremiumReportPage({ routeData, isLoading }) {

  const routeName = Array.isArray(routeData?.route_summary?.path)
    ? routeData.route_summary.path.join(' → ')
    : (routeData?.route_summary?.path || "Coimbatore to Chennai");
  const [formData, setFormData] = useState({ name: '', busTravels: '', contactNo: '', message: '' });
  const [formStatus, setFormStatus] = useState(null); // null | 'success' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
  const [hoveredMatrixCell, setHoveredMatrixCell] = useState(null);
  const [selectedMatrixCell, setSelectedMatrixCell] = useState(null);

  useEffect(() => {
    if (routeData) {
      setLastSyncTime(new Date().toLocaleTimeString());
    }
  }, [routeData]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const key = id === 'contact-name' ? 'name'
      : id === 'contact-email' ? 'busTravels'
        : id === 'contact-subject' ? 'contactNo'
          : 'message';
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contactNo.trim() || !formData.message.trim()) {
      setFormStatus('error');
      setTimeout(() => setFormStatus(null), 4000);
      return;
    }
    setFormStatus('success');
    setFormData({ name: '', busTravels: '', contactNo: '', message: '' });
    setTimeout(() => setFormStatus(null), 5000);
  };

  // Data Mapping
  const dynamicTransportData = useMemo(() => {
    if (!routeData?.transport_distribution) return [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return Object.entries(routeData.transport_distribution).map(([name, value], idx) => {
      const modeName = name.charAt(0).toUpperCase() + name.slice(1);
      let icon = <Bus size={18} />;
      if (modeName.includes('Train')) icon = <Train size={18} />;
      else if (modeName.includes('Car')) icon = <Car size={18} />;
      else if (modeName.includes('Taxi')) icon = <Car size={18} />;
      else if (modeName.includes('Flight')) icon = <Plane size={18} />;

      return {
        name: modeName,
        value,
        color: colors[idx % colors.length],
        icon: icon
      };
    });
  }, [routeData]);

  const transportInsight = useMemo(() => {
    if (!dynamicTransportData?.length) return null;

    const sorted = [...dynamicTransportData].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const second = sorted[1];

    if (!top) return "Data on transport modes is currently unavailable.";

    let text = `${top.name} transport dominates this corridor with ${top.value}% preference`;
    if (second) {
      text += `, followed by ${second.name.toLowerCase()} at ${second.value}% for efficient connectivity.`;
    } else {
      text += ".";
    }

    return text;
  }, [dynamicTransportData]);

  const dynamicSuggestedRoutes = useMemo(() => {
    if (!routeData?.suggested_routes) return [];
    const colors = ['#3b82f6', '#10b981', '#8b5cf6'];
    return routeData.suggested_routes.map((route, idx) => ({
      id: route.option,
      name: `Route Option ${route.option}`,
      time: `${route.time} hours`,
      distance: `${route.distance} km`,
      via: route.path,
      type: idx === 0 ? 'RECOMMENDED' : 'ALTERNATIVE',
      efficiency: idx === 0 ? 'Most Efficient' : 'Alternative',
      efficiencyDesc: idx === 0 ? 'Best balance of time & distance' : 'Alternative route option',
      icon: idx === 0 ? <Navigation size={22} /> : <MapPin size={22} />,
      color: colors[idx % colors.length]
    }));
  }, [routeData]);

  const dynamicBusFrequencies = useMemo(() => {
    if (!routeData?.transport_schedule) return [];

    const schedule = routeData.transport_schedule;
    let details = [];

    if (Array.isArray(schedule)) {
      // New structure: filter by type
      if (schedule.length > 0 && schedule[0].type) {
        details = schedule.filter(s => s.type === 'bus').map(s => ({
          from: s.from,
          to: s.to,
          label: 'Regular Service',
          count: s.trips_per_day,
          icon: <Bus size={18} />
        }));
      } else {
        // Old list structure
        details = schedule.map(item => ({
          from: item.from,
          to: item.to,
          label: 'Regular Service',
          count: item.bus_trips,
          icon: <Bus size={18} />
        }));
      }
    } else if (schedule.route_details) {
      // Intermediate structure
      details = schedule.route_details.map(item => ({
        from: item.from,
        to: item.to,
        label: schedule.bus?.frequency_minutes ? `Every ${schedule.bus.frequency_minutes} mins` : 'Regular Service',
        count: item.bus_trips,
        icon: <Bus size={18} />
      }));
    }

    return details;
  }, [routeData]);

  const dynamicTrainFrequencies = useMemo(() => {
    if (!routeData?.transport_schedule) return [];

    const schedule = routeData.transport_schedule;
    let details = [];

    if (Array.isArray(schedule)) {
      // New structure: filter by type
      if (schedule.length > 0 && schedule[0].type) {
        details = schedule.filter(s => s.type === 'train').map(s => ({
          from: s.from,
          to: s.to,
          label: 'Scheduled Service',
          count: s.trips_per_day,
          icon: <Train size={18} />
        }));
      } else {
        // Old list structure
        details = schedule.map(item => ({
          from: item.from,
          to: item.to,
          label: 'Scheduled Service',
          count: item.train_trips,
          icon: <Train size={18} />
        }));
      }
    } else if (schedule.route_details) {
      // Intermediate structure
      details = schedule.route_details.map(item => ({
        from: item.from,
        to: item.to,
        label: schedule.train?.major_trains?.length ? `${schedule.train.major_trains.length} Major Trains` : 'Scheduled Service',
        count: item.train_trips,
        icon: <Train size={18} />
      }));
    }

    return details;
  }, [routeData]);

  const dynamicTimelineNodes = useMemo(() => {
    if (!routeData?.route_summary?.path) return [];

    const pathData = routeData.route_summary.path;
    const cities = (Array.isArray(pathData) ? pathData : pathData.split(' → ')).map(c => {
      if (typeof c === 'string') return c.trim();
      if (c && typeof c === 'object' && c.name) return String(c.name).trim();
      return String(c || '').trim();
    });
    const segmentation = routeData.area_segmentation || {};
    const areaPotential = routeData.dashboard_data?.area_potential || [];

    return cities.map((city, idx) => {
      let type = 'General';
      let icon = pointIcon;
      let desc = `${city}: A key point along the corridor.`;

      // Check for detailed data in area_potential
      const districtData = areaPotential.find(d => String(d.district || '').toLowerCase().includes(String(city).toLowerCase()));

      // Assign type and icon based on segmentation data
      const isIndustrial = (segmentation.job_business_areas || []).some(s => String(s?.name || s || '').toLowerCase().includes(String(city).toLowerCase()));
      const isTourist = (segmentation.tourist_places || []).some(s => String(s?.name || s || '').toLowerCase().includes(String(city).toLowerCase()));
      const isStudent = (segmentation.student_areas || []).some(s => String(s?.name || s || '').toLowerCase().includes(String(city).toLowerCase()));

      if (idx === 0) {
        type = 'Origin';
        icon = pinIcon;
        desc = `${city}: The starting point of the corridor.`;
      } else if (idx === cities.length - 1) {
        type = 'Destination';
        icon = destinationIcon;
        desc = `${city}: The final destination of the corridor.`;
      } else if (isIndustrial) {
        type = 'Industrial Zone';
        icon = industryIcon;
        desc = districtData ? `${city}: Major industrial hub with ${districtData.business_potential} business potential.` : `${city}: A major hub for manufacturing and industry.`;
      } else if (isTourist) {
        type = 'Tourist Zone';
        icon = touristIcon;
        desc = districtData ? `${city}: Popular tourist destination with a potential score of ${districtData.potential_score}%.` : `${city}: Known for its attractions and scenic beauty.`;
      } else if (isStudent) {
        type = 'Education Hub';
        icon = pointIcon;
        desc = districtData ? `${city}: Education center with a projected growth rate of ${districtData.growth_rate}%.` : `${city}: A center for educational institutions.`;
      }

      return { city, type, icon, desc };
    });
  }, [routeData]);

  const combinedPotential = useMemo(() => {
    const areaSeg = routeData?.area_segmentation || {};
    const corridorPot = routeData?.dashboard_data?.corridor_potential || {};
    const items = [];

    // Helper: Safely get the first name from an array of strings/objects, or from a string
    const getFirstName = (entries) => {
      if (!entries) return '';
      if (Array.isArray(entries)) {
        if (entries.length === 0) return '';
        const entry = entries[0];
        return entry?.name ?? entry ?? '';
      }
      if (typeof entries === 'string') return entries;
      if (typeof entries === 'object') return entries.name || '';
      return '';
    };

    const hasValue = (entries) => {
      if (!entries) return false;
      if (Array.isArray(entries)) return entries.length > 0;
      return typeof entries === 'string' ? entries.length > 0 : true;
    };

    if (hasValue(areaSeg.job_business_areas)) {
      const businessScore = corridorPot.business ? ` (Potential: ${corridorPot.business}%)` : "";
      // get up 2
      const business = Array.isArray(areaSeg.job_business_areas)
        ? areaSeg.job_business_areas.slice(0, 4).map(p => p?.name ?? p ?? '').join(', ')
        : (areaSeg.job_business_areas?.name ?? areaSeg.job_business_areas ?? '');


      items.push({
        title: 'Business',
        content: `${getFirstName(business)}${businessScore}`,
        icon: <Briefcase />,
        color: 'orange'
      });
    }

    if (hasValue(areaSeg.student_areas)) {
      const studentScore = corridorPot.student ? ` (Potential: ${corridorPot.student}%)` : "";
      //get up 2 
      const areas = Array.isArray(areaSeg.student_areas)
        ? areaSeg.student_areas.slice(0, 4).map(p => p?.name ?? p ?? '').join(', ')
        : (areaSeg.student_areas?.name ?? areaSeg.student_areas ?? '');

      
      items.push({
        title: 'Education Hubs',
        content: `${(areas)}${studentScore}`,
        icon: <GraduationCap />,
        color: 'purple'
      });
    }

    if (hasValue(areaSeg.tourist_places)) {
      const touristScore = corridorPot.tourist ? ` (Potential: ${corridorPot.tourist}%)` : "";
      // Get up to 2 names
      const places = Array.isArray(areaSeg.tourist_places)
        ? areaSeg.tourist_places.slice(0, 4).map(p => p?.name ?? p ?? '').join(', ')
        : (areaSeg.tourist_places?.name ?? areaSeg.tourist_places ?? '');

      items.push({
        title: 'Tourist Hotspots',
        content: `${places}${touristScore}`,
        icon: <Mountain />,
        color: 'green'
      });
    }

    // Add a 4th card from a second business area if available
    // if (items.length < 4 && Array.isArray(areaSeg.job_business_areas) && areaSeg.job_business_areas.length > 1) {
    //   const entry = areaSeg.job_business_areas[1];
    //   items.push({
    //     title: 'Industrial Center',
    //     content: entry?.name ?? entry ?? '',
    //     icon: <Factory />,
    //     color: 'blue'
    //   });
    // }

    // Fallbacks if API returned no usable segmentation data
    const fallbacks = [
      { title: 'Job & Business', content: 'Major Industrial Hubs', icon: <Briefcase />, color: 'orange' },
      { title: 'Institutions', content: 'Education & Research Centers', icon: <GraduationCap />, color: 'purple' },
      { title: 'Tourist Hotspots', content: 'Heritage & Nature Sites', icon: <Mountain />, color: 'green' },
      { title: 'Logistics Hubs', content: 'Key Transport Junctions', icon: <Factory />, color: 'blue' }
    ];

    return items.length >= 2 ? items : fallbacks;
  }, [routeData]);

  // Dynamic Distance Matrix Calculation
  const matrixData = useMemo(() => {
    if (!routeData?.route_summary?.path) return { cities: [], matrix: [] };

    const pathData = routeData.route_summary.path;
    const cities = (Array.isArray(pathData) ? pathData : pathData.split(' → ')).map(c => {
      if (typeof c === 'string') return c.trim();
      if (c && typeof c === 'object' && c.name) return String(c.name).trim();
      return String(c || '').trim();
    });
    const segments = Array.isArray(routeData.distance_details) ? routeData.distance_details : [];

    // Create a cumulative distance map
    const cumulativeDistances = [0];
    let currentTotal = 0;

    for (let i = 0; i < cities.length - 1; i++) {
      const from = cities[i];
      const to = cities[i + 1];
      const segment = segments.find(s =>
        (s.segment?.includes(from) && s.segment?.includes(to)) ||
        (s.segment?.includes(to) && s.segment?.includes(from))
      );

      const totalDist = routeData.route_summary.total_distance_km || routeData.route_summary.total_distance;
      const dist = segment ? segment.distance_km : Math.round((totalDist / (cities.length - 1)));
      currentTotal += dist;
      cumulativeDistances.push(currentTotal);
    }

    // Build N x N matrix
    let maxDistance = 0;
    const matrix = cities.map((_, i) => {
      return cities.map((_, j) => {
        const dist = Math.abs(cumulativeDistances[j] - cumulativeDistances[i]);
        if (dist > maxDistance) maxDistance = dist;
        return dist;
      });
    });

    const getAbbr = (name) => {
      const parts = name.split(' ');
      if (parts.length > 1) return parts.map(p => p[0]).join('').toUpperCase();
      return name.slice(0, 3).toUpperCase();
    };

    return { cities, matrix, getAbbr, maxDistance };
  }, [routeData]);

  const dynamicDistanceDetails = useMemo(() => {
    if (!routeData?.distance_details) return [];

    // Handle single object format
    if (!Array.isArray(routeData.distance_details)) {
      const d = routeData.distance_details;
      return [{ from: d.from, to: d.to, distance_km: d.distance_km }];
    }

    // Fallback for old array format
    return routeData.distance_details.map(item => ({
      from: item.from,
      to: item.to,
      distance_km: item.distance_km
    }));
  }, [routeData]);

  const dynamicLogisticsData = useMemo(() => {
    if (!routeData?.logistics_services) return [];

    const logs = routeData.logistics_services;

    // Handle new percentage-based object structure
    if (typeof logs.bus === 'number') {
      return [
        { name: 'Bus Parcel', value: logs.bus, color: 'blue', icon: <Truck size={20} />, tag: 'Fast' },
        { name: 'Train Parcel', value: logs.train, color: 'green', icon: <Train size={20} />, tag: 'Bulk' },
        { name: 'Courier', value: logs.courier, color: 'purple', icon: <Package size={20} />, tag: 'Express' },
        { name: 'Taxi Parcel', value: logs.taxi, color: 'orange', icon: <Navigation size={20} />, tag: 'Instant' }
      ];
    }

    // Fallback for old structure (arrays)
    return [
      { name: 'Bus Parcel', value: 40, color: 'blue', icon: <Truck size={20} />, tag: 'Fast' },
      { name: 'Train Parcel', value: 20, color: 'green', icon: <Train size={20} />, tag: 'Bulk' },
      { name: 'Courier Services', value: 30, color: 'purple', icon: <Package size={20} />, tag: 'Express' },
      { name: 'Luggage / Parcel', value: 10, color: 'orange', icon: <Package size={20} />, tag: 'General' }
    ];
  }, [routeData]);

  if (!routeData) {
    return (
      <div className="report-loading-container">
        <div className="loading-spinner"></div>
        <p>Waiting for Route Analysis Data...</p>
      </div>
    );
  }

  const routeSummary = routeData?.route_summary || { path: "Bangalore to Chennai", total_distance_km: 350, estimated_time_hours: 6 };
  const popData = routeData?.population_data || {};
  const areaSeg = routeData?.area_segmentation || {};
  const visitors = routeData?.visitor_data || {};
  const demandDist = routeData?.demand_distribution || [];

  return (
    <div className="report-page-container">
      {/* Brand logo moved to section header for alignment */}
      <div className="report-content-wrapper">

        {/* Header */}
        <header className="report-header">
          <div className="header-top-meta">
            <div className="header-badge">Corridor Report</div>
            <div className="sync-status">
              <span className="sync-dot"></span>
              Live Sync: {lastSyncTime}
            </div>
          </div>
          <div className="main-title-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '16px' }}>
            <img src={logoImg} alt="Brand Logo" className="brand-logo-main" style={{ height: '48px', width: 'auto' }} />
            <h1>{Array.isArray(routeSummary.path) ? routeSummary.path.join(' → ') : routeSummary.path}</h1>
          </div>
          <p className="subtitle">
            Comprehensive Route Analysis & Travel Intelligence | {routeSummary.total_distance_km || routeSummary.total_distance} km | Approx. {routeSummary.estimated_time_hours || routeSummary.estimated_time} hours
          </p>
        </header>

        {/* Hero Image */}
        {/* <section className="hero-section">
          <div className="image-container">
            <img src={heroImage} alt="Route Analysis Illustration" className="hero-illustration" />
          </div>
        </section> */}

        {/* Concept 1 & 2: Population & Potential */}
        <div className="grid-2-col section-spacing">
          <section className="analysis-section-box population-overview-container">
            <div className="visitor-header-flex">
              <div className="visitor-title-box">
                <div className="icon-wrap bg-blue-soft"><Users className="text-blue-main" /></div>
                <div className="title-text-group">
                  <h2>Population Overview</h2>
                  <p className="subtitle-small">Population range by major cities</p>
                </div>
              </div>
              <div className="population-group-visual">
                <div className="skyline-bg"></div>
                <div className="user-group">
                  <Users className="user-icon user-1" size={32} />
                  <Users className="user-icon user-2" size={44} />
                  <Users className="user-icon user-3" size={32} />

                </div>
              </div>
            </div>

            <div className="population-list">
              {popData.source && (
                <div className="population-item">
                  <div className="city-info-left">
                    <div className="city-icon-badge bg-blue-light">
                      <Landmark size={20} className="text-blue-main" />
                    </div><h5> Origin City</h5>
                    <span className="dot bg-blue-main"></span>
                    <span className="city-name">{popData.source.name}</span>
                  </div> <h5>City Population</h5>
                  <div className="pop-badge bg-blue-light text-blue-main">{((popData.source.count || popData.source.population || 0)).toFixed(0)}</div>
                </div>
              )}

              {popData.via && (
                <div className="population-item">
                  <div className="city-info-left">
                    <div className="city-icon-badge bg-purple-light">
                      <Building2 size={20} className="text-purple-main" />
                    </div><h5> Via Cities </h5>
                    <span className="dot bg-purple-main"></span>
                    <span className="city-name">{popData.via.name}</span>
                  </div> <h5>City Population</h5>
                  <div className="pop-badge bg-purple-light text-purple-main">{((popData.via.count || popData.via.population || 0)).toFixed(0)}</div>
                </div>
              )}

              {popData.destination && (
                <div className="population-item">
                  <div className="city-info-left">
                    <div className="city-icon-badge bg-green-light">
                      <Landmark size={20} className="text-green-main" />
                    </div><h5> Destination City</h5>
                    <span className="dot bg-green-main"></span>
                    <span className="city-name">{popData.destination.name}</span>
                  </div>
                  <h5>City Population</h5>
                  <div className="pop-badge bg-green-light text-green-main">{((popData.destination.count || popData.destination.population || 0)).toFixed(0)}</div>
                </div>
              )}
            </div>

            <div className="total-population-footer">
              <div className="total-left">
                <div className="total-icon-wrap">
                  <Users size={24} />
                </div>
                <span className="total-label">Total Corridor Population</span>
              </div>
              <div className="total-right">
                <div className="vertical-dotted-sep"></div>
                <span className="total-value">
                  {(((popData.source?.count || popData.source?.population || 0) + (popData.via?.count || popData.via?.population || 0) + (popData.destination?.count || popData.destination?.population || 0))).toFixed(0)}
                </span>
              </div>
            </div>
          </section>
          {/* Potential of the Area */}
          <section className="analysis-section-box area-potential-container">
            <div className="visitor-header-flex">
              <div className="visitor-title-box">
                <div className="icon-wrap bg-orange-soft"><Briefcase className="text-orange-main" /></div>
                <div>
                  <h2 className="title-split">Potential <span className="text-pink-main">of the Area</span></h2>
                  <p className="subtitle-small">The {Array.isArray(routeSummary.path) ? routeSummary.path.join(' → ') : routeSummary.path} corridor has a diverse range of attractions and industries, including:</p>
                </div>
              </div>
              <div className="growth-visual-top">
                <div className="growth-chart-mini">
                  <div className="growth-bars">
                    <div className="gbar" style={{ height: '40%' }}></div>
                    <div className="gbar" style={{ height: '60%' }}></div>
                    <div className="gbar" style={{ height: '50%' }}></div>
                    <div className="gbar" style={{ height: '80%' }}></div>
                    <div className="gbar" style={{ height: '70%' }}></div>
                  </div>
                  <svg className="growth-trend" viewBox="0 0 100 40">
                    <path d="M0,35 Q25,30 50,15 T100,5" fill="none" stroke="#ff4d6d" strokeWidth="2" />
                    <ArrowRight className="trend-arrow" size={12} />
                  </svg>
                  <div className="skyline-silhouette"></div>
                </div>
              </div>
            </div>

            <div className="potential-cards-list">
              {combinedPotential.map((item, idx) => {
                return (
                  <div key={idx} className="potential-card-item">
                    <div className="card-icon-side">
                      <div className={`p-icon-badge bg-${item.color}-soft`}>
                        {React.cloneElement(item.icon, { className: `text-${item.color}-main`, size: 28 })}
                      </div>
                      <div className={`v-sep bg-${item.color}-main`}></div>
                    </div>
                    <div className="card-text-side">
                      <h3>{item.title}</h3>
                      <p>{item.content}</p>
                    </div>
                    <div className={`card-number-badge bg-${item.color}-soft text-${item.color}-main`}>0{idx + 1}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Concept 3: Area Segmentation Map */}
        {/* <section className="section-spacing animate-fade-in">
          <AreaPotentialMap routeData={routeData} isLoading={false} />
        </section> */}

        {/* Concept 3: Area Segmentation Timeline */}
        <section className="analysis-section-box section-spacing">
          <div className="box-header">
            <div className="icon-wrap bg-green"><MapPin /></div>
            <h2>Area Segmentation</h2>
          </div>
          <div className="segmentation-model-container">
            <div className="timeline-horizontal-line"></div>
            <div className="timeline-nodes-wrapper">

              {dynamicTimelineNodes.map((node, idx) => (
                <div key={idx} className={`model-timeline-node ${idx % 2 === 0 ? 'is-top' : 'is-bottom'}`}>
                  <div className="node-content-box">
                    <div className="node-image-circle">
                      <img src={node.icon} alt={node.type} />
                    </div>
                    <div className="node-title-main">{node.type}</div>
                  </div>
                  <div className="node-marker-dot"></div>
                  <div className="node-vertical-connector"></div>
                  <div className="node-desc-text">{node.desc}</div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* Concept 4: Total Visitor Count - Redesigned */}
        <section className="analysis-section-box section-spacing visitor-stats-container">
          <div className="visitor-header-flex">
            <div className="visitor-title-box">
              <div className="icon-wrap bg-pink-light"><Calendar className="text-pink" /></div>
              <div>
                <h2>Total Visitor Count</h2>
                <p className="subtitle-small">Overview of yearly and daily visitors</p>
              </div>
            </div>
            <div className="visitor-graph-visual">
              {/* Simplified 3D graph representation using CSS/SVG */}
              <div className="mini-bars">
                <div className="bar" style={{ height: '30%' }}></div>
                <div className="bar" style={{ height: '50%' }}></div>
                <div className="bar" style={{ height: '40%' }}></div>
                <div className="bar" style={{ height: '70%' }}></div>
                <div className="bar" style={{ height: '60%' }}></div>
                <div className="bar" style={{ height: '90%' }}></div>
              </div>
              <svg className="graph-line" viewBox="0 0 100 50">
                <path d="M0,40 L20,30 L40,45 L60,10 L80,25 L100,5" fill="none" stroke="#ff4d6d" strokeWidth="3" />
                <circle cx="100" cy="5" r="4" fill="#ff4d6d" />
              </svg>
              <div className="user-overlay-icon">
                <Users size={16} />
              </div>
            </div>
          </div>

          <div className="stats-grid-modern">
            <div className="stat-card-modern">
              <div className="stat-card-header">
                <div className="mini-icon bg-pink-soft"><TrendingUp size={16} className="text-pink" /></div>
                <span>Both Places Total Annual Visitor Count</span>
              </div>
              <div className="stat-value">
                {(((Number(visitors.source?.yearly_total) || 0) + (Number(visitors.destination?.yearly_total) || 0))).toFixed(0)}
              </div>
              <div className="stat-underline"></div>
            </div>

            <div className="stat-card-modern">
              <div className="stat-card-header">
                <div className="mini-icon bg-pink-soft"><Clock size={16} className="text-pink" /></div>
                <span>Both Places Total Daily Visitor Count</span>
              </div>
              <div className="stat-value">
                {(((Number(visitors.source?.daily_normal) || 0) + (Number(visitors.destination?.daily_normal) || 0))).toFixed(0)}
              </div>
              <div className="stat-underline"></div>
            </div>

            <div className="stat-card-modern highlighted">
              <div className="stat-card-header">
                <div className="mini-icon bg-pink-soft"><TrendingUp size={16} className="text-pink" /></div>
                <span>Both Places Total Daily Peak Visitor Count</span>
              </div>
              <div className="stat-value">
                {(((Number(visitors.source?.daily_peak) || 0) + (Number(visitors.destination?.daily_peak) || 0))).toFixed(0)}
              </div>
              <div className="stat-underline"></div>
            </div>
          </div>

          <div className="attractions-list-container">
            <div className="attractions-header">
              <div className="title-row">
                <MapPin className="text-pink" size={20} />
                <h3>Key Locations (Annual Visitor Count / Daily Visitor Count)</h3>
                <div className="header-line"></div>
                <Sparkles className="text-pink" size={16} />
              </div>
            </div>

            <div className="attraction-items">
              {[
                { name: routeData?.population_data?.source?.name || 'Origin', data: visitors.source },
                { name: routeData?.population_data?.destination?.name || 'Destination', data: visitors.destination }
              ].map((item, idx) => (
                <div key={idx} className="attraction-item-row">
                  <div className="attraction-main">
                    <div className="attraction-img-circle">

                      {idx === 0 ? <Mountain size={24} className="text-pink" /> : <Activity size={24} className="text-pink" />}
                    </div>
                    <span className="attraction-name">{item.name}</span>
                  </div>
                  <div className="attraction-stats-box">
                    <div className="stat-sub">
                      <Users size={14} className="text-pink" />
                      <h5>Annual Visiter Count</h5>
                      <span>{((Number(item.data?.yearly_total) || 0)).toFixed(0)}</span>
                    </div>
                    <div className="stat-sep"></div>
                    <div className="stat-sub">
                      <Sun size={14} className="text-pink" />
                      <h5> Daily Visitor Count</h5>
                      <span>{((Number(item.data?.daily_normal) || 0)).toFixed()}</span>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-light" size={20} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Concept 5: Top Visitors by State - Dynamic Interactive */}
        <StateVisitorsPanel demandDistribution={routeData.demand_distribution} lastSyncTime={lastSyncTime} />

        {/* Concept 6: Distance Matrix - Dynamic API-Driven */}
        <section className="analysis-section-box section-spacing distance-matrix-container">
          <div className="visitor-header-flex">
            <div className="visitor-title-box">
              <div className="icon-wrap bg-orange-light"><Navigation className="text-orange-main" /></div>
              <div>
                <h2>Distance Matrix (km)</h2>
                <p className="subtitle-small">Distance between major cities along the {routeSummary.path} corridor</p>
              </div>
            </div>
            <div className="route-visual-top">
              <div className="dotted-route-container">
                <MapPin className="pin pin-start" size={18} />
                <svg className="curvy-path-svg" viewBox="0 0 100 40">
                  <path
                    d="M 5,30 Q 25,5 50,20 T 95,10"
                    fill="none"
                    stroke="#ff9800"
                    strokeWidth="2.5"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                  />
                </svg>
                <MapPin className="pin pin-end" size={24} />
              </div>
            </div>
          </div>

          <div className="table-responsive-modern">
            <table className="distance-table">
              <thead>
                <tr>
                  <th className="corner-cell">
                    <div className="city-header-item">
                      <Landmark size={18} className="text-orange-main" />
                      <span>City</span>
                    </div>
                  </th>
                  {matrixData.cities.map((city, idx) => {
                    const icons = [Landmark, Activity, Building2];
                    const CityIcon = icons[idx % icons.length];
                    return (
                      <th key={idx}>
                        <div className="city-header-icon">
                          <CityIcon size={20} className="text-orange-main" />
                          <br />{matrixData.getAbbr(city)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrixData.matrix.map((row, i) => {
                  const icons = [Landmark, Activity, Building2];
                  const RowIcon = icons[i % icons.length];
                  return (
                    <tr key={i} className="dist-row">
                      <td className="row-label">
                        <div className="city-label">
                          <RowIcon size={18} className="text-orange-main" />
                          {matrixData.cities[i]}
                        </div>
                      </td>
                      {row.map((dist, j) => {
                        const intensity = matrixData.maxDistance > 0 ? (dist / matrixData.maxDistance) : 0;
                        const bgOpacity = intensity * 0.35;
                        const heatColor = `rgba(249, 115, 22, ${bgOpacity})`;
                        return (
                          <td
                            key={j}
                            className={dist === 0 ? "zero-cell" : "dist-cell"}
                            style={dist !== 0 ? { backgroundColor: heatColor } : undefined}
                          >
                            {dist === 0 ? <strong>0</strong> : dist}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="info-footer-banner orange">
            {/*<Info size={16} className="text-orange-main" />*/}
            <span>All distances are approximate road distances in kilometers.</span>
          </div>
        </section>

        {/* Concept 7: Mode of Transport - Redesigned */}
        <section className="analysis-section-box section-spacing transport-modern-container">
          <div className="visitor-header-flex">
            <div className="visitor-title-box">
              <div className="icon-wrap bg-green-soft"><Bus className="text-green-main" /></div>
              <div>
                <h2>Mode of Transport</h2>
                <p className="subtitle-small">Overall preferred modes of transport used for logistics and travel.</p>
              </div>
            </div>
          </div>

          <div className="transport-content-grid">
            <div className="donut-chart-side">
              <div className="donut-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicTransportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {dynamicTransportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center-text">
                  <span className="percent">100%</span>
                  <span className="label">Total</span>
                </div>
              </div>
            </div>

            <div className="progress-legend-side">
              {dynamicTransportData.map((item, idx) => (
                <div key={idx} className="legend-item-modern">
                  <div className="legend-header">
                    <div className="legend-icon" style={{ backgroundColor: `${item.color}22` }}>
                      {React.cloneElement(item.icon, { style: { color: item.color } })}
                    </div>
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-pct">{item.value}%</span>
                  </div>
                  <div className="legend-progress-bar">
                    <div className="progress-fill" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                  </div>
                  <p className="legend-desc">Preferred mode for {item.name.toLowerCase()} travel and logistics.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-footer-box">
            <div className="insight-icon bg-blue-soft">
              <BarChart2 className="text-blue-main" size={20} />
            </div>
            <div className="insight-text">
              <strong>Insight</strong>
              <p>{transportInsight || "Bus transport dominates logistics movement, followed by rail for efficient long-distance connectivity."}</p>
            </div>
          </div>
        </section>

        {/* Concept 8: Luggage & Parcel Services - Redesigned */}
        <section className="analysis-section-box section-spacing luggage-modern-container">
          <div className="visitor-header-flex">
            <div className="visitor-title-box">
              <div className="icon-wrap bg-orange-soft"><Package className="text-orange-main" /></div>
              <div>
                <h2>Luggage & Parcel Services</h2>
                <p className="subtitle-small">Comprehensive and reliable solutions for all your travel and delivery needs.</p>
              </div>
            </div>
          </div>

          <div className="services-rows-list">
            {dynamicLogisticsData.map((service, idx) => (
              <div key={idx} className="service-split-row">
                <div className="service-main-info">
                  <div className={`service-icon-wrap bg-${service.color}-soft`}>
                    {React.cloneElement(service.icon, { className: `text-${service.color}-main` })}
                  </div>
                  <div className="service-text-wrap">
                    <div className="service-title-line">
                      <h3>{service.name}</h3>
                      <span className={`status-badge bg-${service.color}-soft text-${service.color}-main`}>
                        <CheckCircle2 size={12} /> {service.tag}
                      </span>
                    </div>
                    <p>{service.value}% Track and manage parcel movement efficiently across this route with real-time visibility and seamless delivery coordination.</p>
                  </div>
                </div>
                <div className={`service-detail-box bg-${service.color}-light`}>
                  <div className="detail-icon bg-white" style={{ color: `var(--${service.color}-main)` }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="detail-text">
                    <strong>Reliable Service</strong>
                    <p>Secured and tracked deliveries</p>
                  </div>
                  <ChevronRight className={`detail-arrow text-${service.color}-main`} size={20} />
                </div>
              </div>
            ))}
          </div>

          <div className="logistics-stats-footer">
            <div className="footer-promo">
              <div className="promo-icon-wrap bg-blue-main text-white"><ShieldCheck size={24} /></div>
              <div className="promo-text">
                <strong>Secure. Reliable. Everywhere.</strong>
                <p>Your parcels are in safe hands with our premium logistics network.</p>
              </div>
            </div>
            <div className="footer-metrics-grid">
              <div className="metric-item">
                <ShieldCheck className="text-blue-main" size={18} />
                <span>Secure Handling</span>
              </div>
              <div className="metric-item">
                <Timer className="text-green-main" size={18} />
                <span>On-Time Delivery</span>
              </div>
              <div className="metric-item">
                <Globe className="text-orange-main" size={18} />
                <span>Wide Reach</span>
              </div>
              <div className="metric-item">
                <Headphones className="text-purple-main" size={18} />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Concept 9: Specific Bus & Train Details */}
        <section className="analysis-section-box section-spacing transport-frequencies-container">
          <div className="section-main-header">
            <div className="title-area">
              <div className="header-icon-box">
                <Clock className="header-icon" fill="#ffcc00" size={24} />
              </div>
              <div className="header-text">
                <h2>Specific Bus and Train Frequencies</h2>
                <p>Daily Service Overview</p>
              </div>
            </div>
          </div>

          <div className="frequencies-content-grid">
            {/* Bus Services Card */}
            <div className="service-freq-card bus-theme">
              <div className="freq-card-header">
                <div className="header-left">
                  <div className="service-icon-box"><Bus size={24} /></div>
                  <h3>Bus Services (Daily)</h3>
                </div>
                <div className="header-badge-outline"><Activity size={12} /> High Coverage</div>
              </div>

              <div className="freq-list">
                {dynamicBusFrequencies.length > 0 ? dynamicBusFrequencies.map((item, idx) => (
                  <div key={idx} className="freq-item">
                    <div className="item-left">
                      <div className="item-icon-circle">{item.icon}</div>
                      <div className="item-info">
                        <strong>{item.from} to {item.to}</strong>
                        <span>{item.label}</span>
                      </div>
                    </div>
                    <div className="item-right">
                      <span className="count-text">{item.count}</span>
                      <span className="sub-count">Services / Day</span>
                    </div>
                  </div>
                )) : (
                  <div className="no-freq-data">No bus service data available for this route.</div>
                )}
              </div>

              <div className="freq-card-footer">
                <div className="footer-info-box">
                  <ShieldCheck size={18} />
                  <div className="info-text">
                    <strong>Extensive bus network ensuring seamless connectivity</strong>
                    <p>High frequency • Multiple operators • Reliable service</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Train Services Card */}
            <div className="service-freq-card train-theme">
              <div className="freq-card-header">
                <div className="header-left">
                  <div className="service-icon-box"><Train size={24} /></div>
                  <h3>Train Services (Daily)</h3>
                </div>
                <div className="header-badge-outline"><Sparkles size={12} /> Regional Connect</div>
              </div>

              <div className="freq-list">
                {dynamicTrainFrequencies.length > 0 ? dynamicTrainFrequencies.map((item, idx) => (
                  <div key={idx} className="freq-item">
                    <div className="item-left">
                      <div className="item-icon-circle">{item.icon}</div>
                      <div className="item-info">
                        <strong>{item.from} to {item.to}</strong>
                        <span>{item.label}</span>
                      </div>
                    </div>
                    <div className="item-right">
                      <span className="count-text">{item.count}</span>
                      <span className="sub-count">Services / Day</span>
                    </div>
                  </div>
                )) : (
                  <div className="no-freq-data">No train service data available for this route.</div>
                )}
              </div>

              <div className="freq-card-footer">
                <div className="footer-info-box">
                  <CheckCircle2 size={18} />
                  <div className="info-text">
                    <strong>Comfortable train travel with reliable schedules</strong>
                    <p>Reserved seating • Punctual service • Safe & comfortable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="frequencies-section-footer">
            <p><Sparkles size={14} className="text-gold" /> Note: Frequencies are approximate and may vary based on demand and operational schedules.</p>
          </div>
        </section>

        {/* Concept 10: Suggested Routes */}
        {/* {dynamicSuggestedRoutes.length > 0 && (
          <section className="analysis-section-box section-spacing suggested-routes-container">
            <div className="box-header">
              <div className="icon-wrap bg-blue-soft"><Navigation className="text-blue-main" /></div>
              <h2>Suggested Route Options</h2>
            </div>
            
            <div className="routes-grid-premium">
              {dynamicSuggestedRoutes.map((route) => (
                <div key={route.id} className="route-option-card hover-lift" style={{ borderTop: `4px solid ${route.color}` }}>
                  <div className="route-card-header">
                    <div className="route-type-badge" style={{ backgroundColor: `${route.color}22`, color: route.color }}>
                      {route.type}
                    </div>
                    <div className="route-icon-box" style={{ color: route.color }}>
                      {route.icon}
                    </div>
                  </div>
                  
                  <div className="route-card-main">
                    <h3 className="route-name-title">{route.name}</h3>
                    <div className="route-path-string">
                      <span className="path-via">via</span> {route.via}
                    </div>
                  </div>
  
                  <div className="route-card-metrics">
                    <div className="metric-item">
                      <Clock size={16} className="text-muted" />
                      <span>{route.time}</span>
                    </div>
                    <div className="metric-item">
                      <MapPin size={16} className="text-muted" />
                      <span>{route.distance}</span>
                    </div>
                  </div>
  
                  <div className="route-card-footer">
                    <div className="efficiency-box">
                      <div className="eff-title">{route.efficiency}</div>
                      <div className="eff-desc">{route.efficiencyDesc}</div>
                    </div>
                    <ArrowRight className="route-arrow" size={20} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )} */}
      </div>

      {/* Contact Form Section */}
      <section className="contact-section">
        <div className="contact-inner">
          <div className="contact-heading">
            <h2 className="contact-title">Say Hello, Get in touch</h2>
            <p className="contact-subtitle">For any queries or assistance, communicate directly with Anbu Transport live operators for instant support and real-time updates.</p>
          </div>

          {formStatus === 'success' && (
            <div className="contact-response success-response">
              <div className="response-icon-wrap">
                <CheckCircle2 size={40} className="response-icon" />
              </div>
              <h3>Message Sent Successfully! 🎉</h3>
              <p>Thank you for reaching out. Our team will get back to you within <strong>24 hours</strong>.</p>
              <div className="response-meta">
                <span><Clock size={14} /> Response within 24 hrs</span>
                <span><Headphones size={14} /> 24/7 Support Available</span>
                <span><Mail size={14} /> info@tockmybus.com</span>
              </div>
            </div>
          )}

          {formStatus === 'error' && (
            <div className="contact-response error-response">
              <div className="response-icon-wrap">
                <Info size={36} className="response-icon" />
              </div>
              <h3>Please fill in required fields</h3>
              <p>Name, Contact No, and Message are required to send your enquiry.</p>
            </div>
          )}

          <form className="contact-form" onSubmit={handleFormSubmit}>
            <div className="contact-row-three">
              <div className="contact-field">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">Bus Travels Name</label>
                <input
                  id="contact-email"
                  type="text"
                  placeholder="Bus travels name"
                  value={formData.busTravels}
                  onChange={handleInputChange}
                />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-subject">Contact No</label>
                <input
                  id="contact-subject"
                  type="tel"
                  placeholder="Contact No"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="contact-field contact-message-field">
              <label htmlFor="contact-message">Your message</label>
              <textarea
                id="contact-message"
                rows={6}
                placeholder="Write your message here..."
                value={formData.message}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="contact-submit-wrap">
              <button type="submit" className="contact-submit-btn">
                <Mail size={16} /> Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand-section">
              <img src={logoImg} alt="TickMyBus Logo" className="footer-logo" />
              <p className="brand-desc">TICK MY BUS is the best way to Transport bus tickets online on the website or from your mobile in a few easy steps Go to My Bookings to manage your account..</p>
              <div className="social-links">
                <a href="#"><Globe size={20} /></a>
                <a href="#"><Share2 size={20} /></a>
                <a href="#"><Activity size={20} /></a>
                <a href="#"><Navigation size={20} /></a>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-column">
                <h4>Quick Links</h4>
                <ul>
                  <li><a href="#">FAQ</a></li>
                  <li><a href="#">Terms & Conditions</a></li>
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Feedback</a></li>
                  <li><a href="#">Contact Us</a></li>
                  <li><a href="#">Boarding Places</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Manage Ticket</h4>
                <ul>
                  <li><a href="#">Download Ticket</a></li>
                  <li><a href="#">Track Your Bus</a></li>
                  <li><a href="#">Cancel Ticket</a></li>
                  <li><a href="#">Change Boarding Point</a></li>
                  <li><a href="#">Change Travel Date</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4>Contact Info</h4>
                <div className="contact-info-list">
                  <div className="contact-item">
                    <MapPin size={20} className="contact-icon" />
                    <span>Coimbatore, Tamil Nadu 641006, IN</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={20} className="contact-icon" />
                    <span>9092748488</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={20} className="contact-icon" />
                    <span>info@tickmybus.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} TickMyBus. All Rights Reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Powered By Anbu Transport Services | AIM UNIVERSSE DEVELOPERS</a>
              {/* <a href="#">Sitemap</a> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}