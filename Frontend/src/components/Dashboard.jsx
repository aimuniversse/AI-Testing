import React, { useState } from 'react';
import Header from './Header';
import MapArea from './MapArea';
import Charts from './Charts';
import BottomWidgets from './BottomWidgets';
import RouteInsights from './RouteInsights';
import './Dashboard.css';

const Dashboard = () => {
  const [routeData, setRouteData] = useState(null);
  const [routeQuery, setRouteQuery] = useState('Chennai to Coimbatore');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  const analyzeRoute = async (routeString) => {
    if (!routeString.trim()) return;

    setIsLoading(true);
    setError(null);
    setRouteData(null); // Clear previous data
    setRouteQuery(routeString);

    try {
      const response = await fetch(`/testing/?route=${encodeURIComponent(routeString)}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setRouteData(result.json_data || result.data);
    } catch (err) {
      console.error("Failed to analyze route:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-content animate-fade-in">
      {/*<Header onAnalyze={analyzeRoute} isLoading={isLoading} /> */}

      {error && (
        <div className="error-banner animate-fade-in-up">
          {error}
        </div>
      )}

      <div className="mobile-tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          Incidents
        </button>
      </div>

      <div className={`dashboard-grid active-tab-${activeTab}`}>
        <div className="dashboard-main-column">
          <div className={`tab-content map-tab ${activeTab === 'map' ? 'show' : ''}`}>
            <MapArea routeData={routeData} routeQuery={routeQuery} isLoading={isLoading} />
          </div>

          <div className={`tab-content charts-tab ${activeTab === 'charts' ? 'show' : ''}`}>
            <div className="dashboard-bottom-row">
              <Charts routeData={routeData} />
            </div>
          </div>

          <div className={`tab-content updates-tab ${activeTab === 'updates' ? 'show' : ''}`}>
            <div className="dashboard-footer-row">
              <BottomWidgets routeData={routeData} />
            </div>
            <div className="insights-container">
              <RouteInsights routeQuery={routeQuery} routeData={routeData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
