import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bus, ArrowRight, Zap } from "lucide-react";
import Scene from "./Scene";
import "../styles/searchingoverlay.css";

const TOTAL_DURATION = 0; // 5 minutes in seconds

const SearchingOverlay = ({ from, via, to, onCancel, onDataReady }) => {
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const [insightIndex, setInsightIndex] = useState(0);
    const [apiData, setApiData] = useState(null);
    const [error, setError] = useState(null);
    const [timerDone, setTimerDone] = useState(false);
    const [insights, setInsights] = useState([
        { label: "AI Tip", text: "Analyzing optimal route..." }
    ]);

    // Refs so intervals always read the latest values
    const startTimeRef = useRef(Date.now());
    const timerDoneRef = useRef(false);

    const isReady = apiData !== null && timerDone;

    const viaCities = via ? [via] : [];

    const statuses = [
        "Initializing Neural Route Engine...",
        `Scanning traffic patterns in ${from}...`,
        ...viaCities.map(city => `Analyzing real-time congestion in ${city}...`),
        "Analyzing 1,400+ historical route data...",
        "Connecting to satellite GPS feed...",
        "Calculating optimal fuel-efficiency paths...",
        `Verifying seat availability in ${to}...`,
        "Optimizing multi-operator schedules...",
        "Applying AI-driven price protection...",
        "Finalizing smart route selection..."
    ];

    // Growth stage label (0–4) based on progress
    const growthStage = Math.min(Math.floor(progress / 20), 4);
    const growthLabels = [
        "Initializing Neural Seed...",
        "Sprouting Digital Life...",
        "Nurturing Data Sapling...",
        "Expanding AI Network...",
        "Tickmybus Fully Bloomed"
    ];

    useEffect(() => {
        // Lock scroll
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";

        // Fetch insights first
        fetch("/api/search-data/")
            .then(res => res.json())
            .then(data => {
                if (data.status === "success" && data.insights) {
                    setInsights(data.insights);
                }
            })
            .catch(err => console.error("Error fetching insights:", err));

        // ── Fixed 5-minute progress clock ──────────────────
        const progressInterval = setInterval(() => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const newProgress = Math.min((elapsed / TOTAL_DURATION) * 100, 100);

            setProgress(newProgress);

            if (elapsed >= TOTAL_DURATION && !timerDoneRef.current) {
                timerDoneRef.current = true;
                setTimerDone(true);
                clearInterval(progressInterval);
            }
        }, 1000);

        // ── Rotate status messages every 30s (10 statuses * 30s = 300s) ─────────────────
        const statusInterval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 30000);

        // ── Rotate insight cards every 60s (5 insights * 60s = 300s) ───────────────────
        const insightInterval = setInterval(() => {
            setInsightIndex((prev) => (prev + 1));
        }, 60000);

        // ── Fetch backend data (runs in background) ───────────────────────────
        const fetchData = async () => {
            if (!from || !to) {
                setError("Origin and destination are required for route analysis.");
                return;
            }

            try {
                const response = await fetch("/api/route-analysis/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ source: from, destination: to, via: via || "" }),
                });

                if (!response.ok) {
                    let errorMsg = "Failed to fetch route analysis";
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch (e) { /* not JSON */ }
                    throw new Error(errorMsg);
                }

                const result = await response.json();
                if (result.status === "success") {
                    setApiData(result.data);
                } else {
                    throw new Error(result.message || "Error analyzing route");
                }
            } catch (err) {
                setError(err.message);
            }
        };

        fetchData();

        return () => {
            clearInterval(progressInterval);
            clearInterval(statusInterval);
            clearInterval(insightInterval);
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Determine status text
    const statusText = () => {
        if (error) return <span style={{ color: "var(--primary)" }}>Error: {error}</span>;
        if (apiData && timerDone) return <span className="success-status">✓ Neural Analysis Complete! Tap Get Data.</span>;

        return statuses[statusIndex];
    };

    const overlayContent = (
        <div className="searching-overlay">
            {/* Ambient Background Glows */}
            <div className="ambient-glow ambient-glow-1"></div>
            <div className="ambient-glow ambient-glow-2"></div>

            <div className="searching-card">
                <div className="searching-card-header">
                    <div className="branding-header">
                        TickMyBus <span>AI</span>
                    </div>

                    <div className="ai-badge">
                        <span className="pulse-dot"></span> NEURAL AI PROCESSING ENGINE
                    </div>
                </div>

                <div className="content-layout">
                    {/* LEFT PANEL: The 3D growth visualization & HUD */}
                    <div className="growth-animation">
                        <div className="tree-container">
                            <div className="hud-ring hud-ring-outer"></div>
                            <div className="hud-ring hud-ring-inner"></div>
                            <div className="hud-scan-line"></div>
                            <Scene progress={progress} />
                            <div className="growth-indicator">{growthLabels[growthStage]}</div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Route info, progress, analytics, and action buttons */}
                    <div className="searching-info">
                        <div className="info-header">
                            <h2>Finding Best Routes</h2>
                            <div className="route-text">
                                <span className="city">{from}</span>
                                {viaCities.map(city => (
                                    <React.Fragment key={city}>
                                        <span className="arrow"><ArrowRight size={16} strokeWidth={3} /></span>
                                        <span className="city">{city}</span>
                                    </React.Fragment>
                                ))}
                                <span className="arrow"><ArrowRight size={16} strokeWidth={3} /></span>
                                <span className="city">{to}</span>
                            </div>
                        </div>

                        <div className="progress-section">
                            <div className="progress-header-row">
                                <div className="loading-label">Analysis in progress…</div>
                            </div>

                            {/* Bus animation track */}
                            <div className="bus-track">
                                <div className="moving-bus" style={{ left: `${Math.min(progress, 97)}%` }}>
                                    <Bus size={18} />
                                    <div className="bus-exhaust"></div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <p className="status-text">{statusText()}</p>

                        <div className="insight-box">
                            <div className="insight-label">
                                <Zap size={12} fill="currentColor" /> {insights[insightIndex % insights.length].label}
                            </div>
                            <div className="insight-text">{insights[insightIndex % insights.length].text}</div>
                        </div>

                        {/* Actions integrated inside the info side */}
                        <div className="actions-container">
                            {!isReady ? (
                                <div className="scanning-indicator">
                                    <span className="dot"></span> Scanning Network...
                                </div>
                            ) : (
                                <button
                                    className="get-data-btn blinking"
                                    onClick={() => onDataReady(apiData)}
                                >
                                    <Zap size={18} fill="currentColor" /> Get Data
                                </button>
                            )}

                            <button className="cancel-btn" onClick={onCancel}>
                                Cancel Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Advertisement */}
            <div className="side-ad-container" onClick={() => window.open('https://tickmybus.com', '_blank')} style={{ cursor: 'pointer' }}>
                <div className="ad-label">Special Offer</div>
                <div className="ad-content">
                    <div className="ad-brand">TickMyBus</div>
                    <div className="ad-highlight">0%<span> COMMISSION</span></div>
                    <p className="ad-text">Enjoy zero hidden charges and the lowest prices guaranteed.</p>
                    <div className="ad-status">
                        <span className="dot"></span>
                        LIVE BOOKING
                    </div>
                    <div className="ad-click-hint">
                        Click here to book tickets
                    </div>
                </div>
                <div className="ad-visual">
                    <Bus size={32} />
                </div>
            </div>
        </div>
    );

    return createPortal(overlayContent, document.body);
};

export default SearchingOverlay;
