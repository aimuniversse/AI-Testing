import React from 'react';
import { Route, Clock, Fuel, Activity, ShieldAlert, Navigation, Bookmark, Loader2 } from 'lucide-react';
import './RouteSummary.css';

const RouteSummary = ({ routeData, routeQuery, isLoading }) => {
  const distance = routeData?.distances?.[0]?.km || routeData?.distance || "—";
  const trafficLoad = routeData?.transport_details?.[0]?.frequency ? (Math.random() * 100 | 0) : 36;

  const timeMins = distance && distance !== "—" ? Math.round(Number(distance) / 40 * 60) : 0;
  const formattedTime = timeMins > 60 ? `${Math.floor(timeMins / 60)}h ${timeMins % 60}m` : timeMins > 0 ? `${timeMins} min` : "—";

  const fuelCost = distance && distance !== "—" ? Math.round(Number(distance) * 5.5) : "—";
  const riskLevel = trafficLoad > 70 ? 'High' : trafficLoad > 40 ? 'Moderate' : 'Low';
  const riskColor = trafficLoad > 70 ? '#ef4444' : trafficLoad > 40 ? '#f59e0b' : '#10b981';

  const fromCity = routeQuery?.split(/\s+to\s+/i)?.[0]?.trim() || 'Origin';
  const toCity = routeQuery?.split(/\s+to\s+/i)?.[1]?.trim() || 'Destination';

  return (
    <div className="route-summary glass-panel relative" style={{ position: 'relative' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-panel/80 backdrop-blur-sm z-10 rounded-md" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(17, 24, 40, 0.7)', zIndex: 10, backdropFilter: 'blur(4px)', borderRadius: '12px' }}>
          <Loader2 className="animate-spin text-accent" size={32} color="#dc2626" />
        </div>
      )}

      <div className="summary-header">
        <h2 className="summary-title">Route Summary</h2>
        <span className="badge best">{routeData ? 'Live Data' : 'Enter Route'}</span>
      </div>

      {routeQuery && (
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {fromCity} → {toCity}
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon-container blue">
            <Route size={20} />
          </div>
          <div className="card-content">
            <div className="card-label">Distance</div>
            <div className="card-value">{distance === "—" ? distance : `${distance} km`}</div>
          </div>
          <div className="card-trend positive">{distance !== "—" ? "✓ Optimal" : "—"}</div>
        </div>

        <div className="summary-card">
          <div className="card-icon-container purple">
            <Clock size={20} />
          </div>
          <div className="card-content">
            <div className="card-label">ETA</div>
            <div className="card-value">{formattedTime}</div>
          </div>
          <div className="card-trend positive">{timeMins > 0 ? `~${timeMins} min` : "—"}</div>
        </div>

        <div className="summary-card">
          <div className="card-icon-container orange">
            <Fuel size={20} />
          </div>
          <div className="card-content">
            <div className="card-label">Fuel Cost</div>
            <div className="card-value">{fuelCost === "—" ? fuelCost : `₹${fuelCost}`}</div>
          </div>
          <div className="card-trend positive">{fuelCost !== "—" ? `~₹${Math.round(Number(fuelCost) * 0.15)}` : "—"}</div>
        </div>

        <div className="summary-card">
          <div className="card-icon-container green">
            <Activity size={20} />
          </div>
          <div className="card-content">
            <div className="card-label">Traffic Load</div>
            <div className="card-value">{trafficLoad > 60 ? 'Heavy' : trafficLoad > 35 ? 'Moderate' : 'Light'}</div>
          </div>
          <div className="card-trend circular">
            <div className="circle-progress" style={{
              borderColor: `rgba(245, 158, 11, 0.2)`,
              borderTopColor: trafficLoad > 60 ? '#ef4444' : trafficLoad > 35 ? '#f59e0b' : '#10b981',
              color: trafficLoad > 60 ? '#ef4444' : trafficLoad > 35 ? '#f59e0b' : '#10b981'
            }}>
              <span>{trafficLoad}%</span>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon-container red">
            <ShieldAlert size={20} />
          </div>
          <div className="card-content">
            <div className="card-label">Risk Level</div>
            <div className="card-value" style={{ color: riskColor }}>{riskLevel}</div>
          </div>
          <div className="card-trend positive" style={{ color: riskColor }}>{riskLevel === 'High' ? '⚠ Caution' : '✓ Safe'}</div>
        </div>
      </div>

      <div className="summary-actions">
        <button className="start-nav-btn" disabled={!routeData}>
          <Navigation size={18} />
          Start Navigation
        </button>
        <button className="save-route-btn" disabled={!routeData}>
          <Bookmark size={18} />
          Save Route
        </button>
      </div>
    </div>
  );
};

export default RouteSummary;
