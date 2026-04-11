import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LiveMatches.css';
import BattleLoader from '../components/BattleLoader';

const LiveMatches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLive = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/scoring/live');
                setMatches(res.data.matches || []);
                setLoading(false);
            } catch (err) {
                console.error("Live fetch fail:", err);
                setLoading(false);
            }
        };
        fetchLive();
    }, []);

    if (loading) return <BattleLoader label="Scanning Stadiums for Live Battles..." />;

    return (
        <div className="live-matches-page">
            <button className="back-home-btn" onClick={() => navigate(-1)}>← Back</button>
            <header className="live-header">
                <h1 className="gradient-text">Live Arena</h1>
                <p>Streaming Stadium-Grade Action in Real-Time</p>
            </header>

            <div className="live-grid">
                {matches.length === 0 ? (
                    <div className="empty-state glass-card" style={{gridColumn: '1/-1', padding: '4rem', textAlign: 'center'}}>
                        <h2 style={{color: '#64748b'}}>No Live Battles Right Now</h2>
                        <p>Stay tuned for the next coin toss!</p>
                    </div>
                ) : (
                    matches.map(match => (
                        <div key={match.id} className="live-match-card glass-card animate-slide-up" onClick={() => navigate(`/live-match/${match.id}`)}>
                            <div className="live-badge-pulsing">LIVE</div>
                            
                            <div className="match-vs-display">
                                <div className="vs-team">
                                    {match.team1_logo && <img src={match.team1_logo} alt="" className="vs-logo" />}
                                    <div className="vs-team-name">{match.team1_name}</div>
                                </div>
                                <div className="vs-text">VS</div>
                                <div className="vs-team">
                                    {match.team2_logo && <img src={match.team2_logo} alt="" className="vs-logo" />}
                                    <div className="vs-team-name">{match.team2_name}</div>
                                </div>
                            </div>

                            <div className="match-meta-info">
                                📍 {match.tournament_name || 'Tournament Ground'} • {match.total_overs} Overs
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LiveMatches;
