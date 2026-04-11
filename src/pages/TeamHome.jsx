import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CaptainHome.css';
import BattleLoader from '../components/BattleLoader';
import TournamentWeather from '../components/TournamentWeather';

const TeamHome = () => {
    const { user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                // Fetch the live global Tournaments Feed
                const tourRes = await axios.get('http://localhost:5000/api/tournaments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedTournaments = tourRes.data.tournaments || [];
                setTournaments(fetchedTournaments.filter(t => t.status !== 'completed'));
            } catch (err) {
                console.error("Error generating Team Dashboard feed:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user && token) {
            fetchTeamData();
        }
    }, [user, token]);

    const handleShareLink = (tournamentId) => {
        const link = `${window.location.origin}/tournament/${tournamentId}`;
        navigator.clipboard.writeText(link);
        setCopiedId(tournamentId);
        setTimeout(() => setCopiedId(null), 2500);
    };

    if (loading) return <BattleLoader label="Syncing Member Feed..." />;

    return (
        <div className="captain-dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand gradient-text">Squad Profile & Tournaments</div>
                <div className="nav-actions" style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
                    <div className="nav-link gradient-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800' }} onClick={() => navigate('/live-matches')}>📺 Live Arena</div>
                    <div className="nav-link gradient-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '800' }} onClick={() => navigate('/match-history')}>📜 Match History</div>
                    <button className="logout-btn" onClick={logout}>Logout Exit</button>
                </div>
            </nav>

            <header className="squad-header glass-card" style={{ cursor: 'pointer', border: '1px solid rgba(0, 225, 255, 0.3)' }} onClick={() => navigate('/team-profile')}>
                <div className="squad-main">
                    <div className="profile-info" style={{ textAlign: 'center', width: '100%' }}>
                        <h1 style={{ marginBottom: '1rem' }}>Welcome to {user.team_name}</h1>
                        <p style={{ color: '#00E1FF' }}>View Full Global Team Profile & Stats ➔</p>
                    </div>
                </div>
            </header>

            <section className="tournaments-feed">
                <h2 className="feed-title">Upcoming Tournaments Feed</h2>
                <p style={{ color: '#a0a0b0', marginBottom: '2rem' }}>Only Captains can register teams. Share these tournaments with your organizers!</p>

                {tournaments.length === 0 ? (
                    <div className="empty-state">No upcoming tournaments available at the moment.</div>
                ) : (
                    <div className="tournament-grid">
                        {tournaments.map(t => (
                            <div key={t.id} className="tournament-card glass-card">
                                
                                {/* 1. Image Header Section */}
                                <div className="card-image-header">
                                    {t.ground_images && t.ground_images.length > 0 ? (
                                        <img src={t.ground_images[0]} alt={t.name} />
                                    ) : (
                                        <div className="image-placeholder-gradient" style={{ height: '100%', background: 'linear-gradient(45deg, #182040, #25305a)' }}></div>
                                    )}
                                    <div className="image-overlay"></div>
                                    
                                    {/* 2. Weather Integration in Corner */}
                                    <TournamentWeather location={t.location} nearCity={t.near_city} date={t.date_time} />
                                </div>

                                <div className="card-content">
                                    <div className="card-status-bar">
                                        <span className={`status-badge ${t.status}`}>{t.status}</span>
                                        <span className="card-fee">${t.registration_fee} Entry</span>
                                    </div>

                                    <h3>{t.name}</h3>
                                    <p className="card-location">📍 {t.location}</p>

                                    <div className="card-stats">
                                        <div className="stat-pill"><strong>{t.overs}</strong> Overs</div>
                                        <div className="stat-pill"><strong>{t.balls_per_over}</strong> Balls/Over</div>
                                    </div>

                                    <div className="prize-pool">
                                        <p>🏆 1st Prize: <span className="highlight-text">${t.prize_1st}</span></p>
                                        <p>🥈 2nd Prize: <span className="highlight-text">${t.prize_2nd}</span></p>
                                        {t.prize_3rd > 0 && <p>🥉 3rd Prize: <span className="highlight-text">${t.prize_3rd}</span></p>}
                                    </div>

                                    <div className="card-actions">
                                        <p className="card-date">{new Date(t.date_time).toLocaleDateString()}</p>
                                        <button
                                            className="apply-btn"
                                            style={{ background: 'linear-gradient(90deg, #182040, #25305a)' }}
                                            onClick={() => handleShareLink(t.id)}
                                        >
                                            {copiedId === t.id ? 'Copied Link!' : 'Share Tourney'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeamHome;
