import React from 'react';
import { MapPin, Users, Briefcase, TrendingUp, Sparkles, Target, ArrowRight } from 'lucide-react';
import './AreaPotentialMap.css';

const AreaPotentialMap = ({ routeData, isLoading }) => {
  // Extract data from backend or use comprehensive fallbacks
  const districts = routeData?.dashboard_data?.area_potential || [
    { district: 'Chennai', population: 8000000, potential_score: 98, business_potential: 'High', growth_rate: 12.5 },
    { district: 'Kallakurichi', population: 450000, potential_score: 72, business_potential: 'Medium', growth_rate: 8.2 },
    { district: 'Attur', population: 380000, potential_score: 68, business_potential: 'Medium', growth_rate: 7.5 },
    { district: 'Salem', population: 950000, potential_score: 85, business_potential: 'High', growth_rate: 10.1 },
    { district: 'Erode', population: 520000, potential_score: 82, business_potential: 'High', growth_rate: 9.8 },
    { district: 'Tirupur', population: 870000, potential_score: 92, business_potential: 'High', growth_rate: 11.2 },
    { district: 'Coimbatore', population: 1600000, potential_score: 95, business_potential: 'High', growth_rate: 10.8 },
  ];

  if (isLoading) {
    return (
      <div className="area-potential-map-container glass-panel loading">
        <div className="pulse-loader"></div>
        <p>Analyzing Corridor Potential...</p>
      </div>
    );
  }

  return (
    <div className="area-potential-map-container glass-panel animate-fade-in-up">
      <div className="map-header-section">
        <div className="map-title-group">
          <div className="map-icon-badge">
            <Target size={24} />
          </div>
          <div>
            <h3>Interactive Corridor Potential Map</h3>
            <p>District-wise Population & Business Growth Intelligence</p>
          </div>
        </div>
        <div className="map-stats-summary">
          <div className="summary-stat">
            <span className="label">High Growth Hubs</span>
            <span className="value">{districts.filter(d => d.potential_score > 90).length}</span>
          </div>
          <div className="v-divider"></div>
          <div className="summary-stat">
            <span className="label">Avg. Potential</span>
            <span className="value">{(districts.reduce((acc, d) => acc + d.potential_score, 0) / districts.length).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="corridor-visual-wrapper">
        <div className="corridor-track-base">
          <div className="track-line"></div>
          <div className="track-glow"></div>
        </div>
        
        <div className="districts-timeline">
          {districts.map((item, index) => (
            <div 
              key={index} 
              className="district-node-container" 
              style={{ left: `${(index / (districts.length - 1)) * 100}%` }}
            >
              <div className={`district-node-point ${item.potential_score > 90 ? 'prime' : ''}`}>
                <div className="node-outer-ring"></div>
                <div className="node-core"></div>
                
                <div className="node-name-label">{item.district}</div>
                
                {/* Floating Detailed Tooltip */}
                <div className="node-detail-floating-card">
                  <div className="detail-card-inner">
                    <div className="card-top">
                      <div className="district-title">
                        <h4>{item.district}</h4>
                        <span className="region-type">Industrial Zone</span>
                      </div>
                      <div className={`potential-tag ${String(item.business_potential || '').toLowerCase()}`}>
                        {item.business_potential}
                      </div>
                    </div>
                    
                    <div className="detail-grid">
                      <div className="detail-item">
                        <Users size={14} className="icon" />
                        <div className="item-data">
                          <span className="item-label">Population</span>
                          <span className="item-val">{(item.population / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <Briefcase size={14} className="icon" />
                        <div className="item-data">
                          <span className="item-label">Potential</span>
                          <span className="item-val">{item.potential_score}%</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <TrendingUp size={14} className="icon" />
                        <div className="item-data">
                          <span className="item-label">Growth</span>
                          <span className="item-val">+{item.growth_rate}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="detail-progress">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${item.potential_score}%` }}></div>
                      </div>
                      <div className="progress-labels">
                        <span>Market Reach</span>
                        <span>{item.potential_score}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="corridor-endpoints">
          <div className="endpoint start">
            <ArrowRight size={16} />
            <span>{districts[0].district}</span>
          </div>
          <div className="endpoint end">
            <span>{districts[districts.length - 1].district}</span>
            <Target size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaPotentialMap;
