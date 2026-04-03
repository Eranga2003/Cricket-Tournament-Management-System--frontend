import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './WeatherAnimations.css';

const TournamentWeather = ({ location, date }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const fetchWeather = async () => {
            if (!location || !date) {
                setLoading(false);
                return;
            }

            try {
                setStatus('Syncing...');
                
                // Fetch weather from OUR backend (which handles mappings and OpenWeatherMap)
                const res = await axios.get(`http://localhost:5000/api/tournaments/weather`, {
                    params: { location, date }
                });

                if (res.data) {
                    setWeatherData(res.data);
                    setStatus('Success');
                } else {
                    setStatus('No Data');
                }
            } catch (err) {
                console.error("TournamentWeather Backend Sync Error:", err.message);
                setStatus('Failed');
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location, date]);

    const getWeatherIcon = (condition) => {
        if (!condition) return <span className="sunny-icon">🌤️</span>;
        
        const cond = condition.toLowerCase();
        
        // Map OpenWeatherMap conditions to our CSS animations
        if (cond.includes('clear')) return <span className="sunny-icon">☀️</span>;
        if (cond.includes('cloud')) return <span className="cloudy-icon">⛅</span>;
        if (cond.includes('rain') || cond.includes('drizzle')) return (
            <span className="rainy-icon">
                🌧️
                <div className="rain-drops">
                    <span className="drop"></span>
                    <span className="drop"></span>
                    <span className="drop"></span>
                </div>
            </span>
        );
        if (cond.includes('thunder') || cond.includes('storm')) return <span className="stormy-icon">⚡</span>;
        if (cond.includes('snow')) return <span className="cloudy-icon">❄️</span>;
        if (cond.includes('fog') || cond.includes('mist') || cond.includes('haze')) return <span className="cloudy-icon">🌫️</span>;
        
        return <span className="sunny-icon">🌤️</span>; // Fallback
    };

    if (loading) return (
        <div className="weather-badge" style={{ opacity: 0.6 }}>
            <span style={{ fontSize: '0.7rem' }}>Syncing...</span>
        </div>
    );
    
    if (!weatherData) return null;

    return (
        <div className="weather-badge">
            <div className="weather-icon-container" title={`${weatherData.condition}: ${weatherData.description}`}>
                {getWeatherIcon(weatherData.condition)}
            </div>
            <span className="temp-value">{Math.round(weatherData.temp)}°C</span>
        </div>
    );
};

export default TournamentWeather;
