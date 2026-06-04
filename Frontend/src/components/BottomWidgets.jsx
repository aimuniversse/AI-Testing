import React from 'react';
import { AlertCircle, CloudRain, Clock, ArrowRight } from 'lucide-react';
import './BottomWidgets.css';

const BottomWidgets = ({ routeData }) => {
  const distance = routeData?.route_summary?.total_distance_km || routeData?.route_summary?.total_distance || routeData?.distance?.[0]?.km || "505";
  const pathData = routeData?.route_summary?.path;
  const parsedPath = Array.isArray(pathData) ? pathData : pathData?.split(" → ");
  const startCity = parsedPath?.[0] || routeData?.population_data?.source?.name || routeData?.distance?.[0]?.from || "Chennai, TN";
  const endCity = parsedPath?.[parsedPath.length - 1] || routeData?.population_data?.destination?.name || routeData?.distance?.[0]?.to || "Coimbatore, TN";
  const timeMins = Math.round((routeData?.route_summary?.estimated_time_hours || routeData?.route_summary?.estimated_time || 8) * 60);

  const liveUpdates = Array.isArray(routeData?.dashboard_data?.live_updates)
    ? routeData.dashboard_data.live_updates
    : [{ incident: "Normal traffic flow observed.", severity: "Low", time: "Just now" }];

  const weatherDetails = routeData?.dashboard_data?.weather || { impact: "Low", details: "Clear skies. No significant impact on travel." };

  return (
    <>
      {/*<div className="glass-panel bottom-widget traffic-widget hover-lift">
        <div className="widget-header">
          <h3>Live Traffic Updates</h3>
          <span className="live-indicator">
            <span className="live-dot"></span> Live
          </span>
        </div>
        <div className="updates-list">
          {liveUpdates.map((update, idx) => (
            <div key={idx} className="update-item">
              <div className={`icon-circle ${update.severity === 'High' ? 'red-bg' : 'orange-bg'}`}>
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {update.severity === 'High' ? 'Critical Alert' : 'Standard Update'}
                </div>
                <div className="text-xs text-muted mt-1">{update.incident}</div>
              </div>
              <div className="text-xs font-bold text-muted">{update.time || 'Just now'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel bottom-widget hover-lift">
        <div className="widget-header">
          <h3>Weather Impact</h3>
        </div>
        <div className="update-item">
          <div className="icon-circle blue-bg">
            <CloudRain size={22} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{weatherDetails.impact} Impact</div>
              <div className="text-xl font-extrabold" style={{ color: 'var(--accent-blue)' }}>24°C</div>
            </div>
            <div className="text-xs text-muted mt-1">{weatherDetails.details}</div>
          </div>
        </div>
      </div> */}

      <div className="glass-panel bottom-widget hover-lift">
        <div className="widget-header">
          <h3>Recent Search</h3>
          {/*<button className="text-accent text-xs font-bold hover:underline">View All</button> */}
        </div>
        <div className="update-item">
          <div className="icon-circle dark-bg">
            <Clock size={18} />
          </div>
          <div className="flex-1">
            <div className="search-route">
              <span className="city-pill">{startCity.split(',')[0]}</span>
              <ArrowRight size={14} className="text-muted" />
              <span className="city-pill">{endCity.split(',')[0]}</span>
            </div>
            <div className="text-xs text-muted mt-1 font-medium">Just now</div>
          </div>
          <div className="search-stats">
            <div className="distance-value">{distance} km</div>
            <div className="time-value">{timeMins} min</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomWidgets;
