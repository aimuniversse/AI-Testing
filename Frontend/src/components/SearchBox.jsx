import React, { useState, useEffect } from "react";
import SearchingOverlay from "./SearchingOverlay";
import "../styles/searchbox.css";

const SearchBox = ({ onResults }) => {
    const [fromCity, setFromCity] = useState("");
    const [viaCity, setViaCity] = useState("");
    const [toCity, setToCity] = useState("");
    const [showSuggestions, setShowSuggestions] = useState({ from: false, via: false, to: false });
    const [isSearching, setIsSearching] = useState(false);

    const [cities, setCities] = useState([]);
    const [cityShortcuts, setCityShortcuts] = useState({});
    const [popularSearches, setPopularSearches] = useState([]);

    useEffect(() => {
        const fetchSearchData = async () => {
            try {
                const response = await fetch("/api/search-data/");
                const data = await response.json();
                if (data.status === "success") {
                    setCities(data.cities);
                    setCityShortcuts(data.shortcuts);
                    setPopularSearches(data.popular_searches);
                }
            } catch (error) {
                console.error("Error fetching search data:", error);
            }
        };
        fetchSearchData();
    }, []);

    const filteredCities = (input) => {
        if (!input) return [];
        const lowerInput = input.toLowerCase();

        const matches = cities.filter(city => city.toLowerCase().includes(lowerInput));

        // Add shortcut match if not already in matches
        const shortcutMatch = cityShortcuts[lowerInput];
        if (shortcutMatch && !matches.includes(shortcutMatch)) {
            matches.unshift(shortcutMatch);
        }

        return matches;
    };

    const resolveCity = (name) => {
        if (!name) return "";
        const lower = name.trim().toLowerCase();
        return cityShortcuts[lower] || name;
    };

    const handleSearch = () => {
        const from = resolveCity(fromCity);
        const to = resolveCity(toCity);
        const via = resolveCity(viaCity);

        if (from && to) {
            if (onResults) onResults(null, `${from} to ${to}`, via);
        } else {
            alert("Please enter both source and destination cities.");
        }
    };

    return (
        <div className="search-wrapper">
            <div className="search-card tilt-3d">
                <div className="search-inputs">
                    <div className="input-field">
                        <label>FROM</label>
                        <div className="input-with-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <input
                                type="text"
                                placeholder="Enter source city"
                                value={fromCity}
                                onChange={(e) => {
                                    setFromCity(e.target.value);
                                    setShowSuggestions({ ...showSuggestions, from: true });
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions({ ...showSuggestions, from: false }), 200)}
                            />
                            {showSuggestions.from && filteredCities(fromCity).length > 0 && (
                                <ul className="suggestions">
                                    {filteredCities(fromCity).map(city => (
                                        <li key={city} onClick={() => setFromCity(city)}>{city}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <button className="swap-btn" onClick={() => {
                        const temp = fromCity;
                        setFromCity(toCity);
                        setToCity(temp);
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="21" x2="21" y2="3"></line><polyline points="8 21 3 21 3 16"></polyline></svg>
                    </button>

                    <div className="input-field">
                        <label>VIA (OPTIONAL)</label>
                        <div className="input-with-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <input
                                type="text"
                                placeholder="Intermediate city"
                                value={viaCity}
                                onChange={(e) => {
                                    setViaCity(e.target.value);
                                    setShowSuggestions({ ...showSuggestions, via: true });
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions({ ...showSuggestions, via: false }), 200)}
                            />
                            {showSuggestions.via && filteredCities(viaCity).length > 0 && (
                                <ul className="suggestions">
                                    {filteredCities(viaCity).map(city => (
                                        <li key={city} onClick={() => setViaCity(city)}>{city}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="input-field">
                        <label>TO</label>
                        <div className="input-with-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <input
                                type="text"
                                placeholder="Enter destination city"
                                value={toCity}
                                onChange={(e) => {
                                    setToCity(e.target.value);
                                    setShowSuggestions({ ...showSuggestions, to: true });
                                }}
                                onBlur={() => setTimeout(() => setShowSuggestions({ ...showSuggestions, to: false }), 200)}
                            />
                            {showSuggestions.to && filteredCities(toCity).length > 0 && (
                                <ul className="suggestions">
                                    {filteredCities(toCity).map(city => (
                                        <li key={city} onClick={() => setToCity(city)}>{city}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <button className="search-btn" onClick={handleSearch}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        Search Routes
                    </button>
                </div>

                <div className="popular-searches">
                    <span className="label">Popular Searches </span>
                    <div className="tags-container">
                        <div className="tags">
                            {popularSearches.map((search, index) => (
                                <span
                                    key={index}
                                    className="tag"
                                    onClick={() => {
                                        const [from, to] = search.split(" → ");
                                        setFromCity(from);
                                        setToCity(to);
                                    }}
                                >
                                    {search}
                                </span>
                            ))}
                        </div>
                        <button className="next-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchBox;