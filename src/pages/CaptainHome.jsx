import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CaptainHome.css';
import TournamentWeather from '../components/TournamentWeather';

const CaptainHome = () => {
    const { user, token, role, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [myTeam, setMyTeam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Team Context Binding
                if (role === 'captain') {
                    const teamRes = await axios.get('http://localhost:5000/api/teams', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const teams = teamRes.data.teams || [];
                    const foundTeam = teams.find(t => t.captain_id === user.id);

                    if (!foundTeam) {
                        navigate('/create-team'); // Intercept! Breakout to team creation
                        return;
                    }
                    setMyTeam(foundTeam);
                } else if (role === 'team') {
                    setMyTeam(user); // If logged in via the Team Auth native route directly
                }

                // 2. Fetch The Upcoming Tournaments Grid
                const tourRes = await axios.get('http://localhost:5000/api/tournaments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const fetchedTournaments = tourRes.data.tournaments || [];
                // Only retain upcoming ones
                setTournaments(fetchedTournaments.filter(t => t.status !== 'completed'));

            } catch (err) {
                console.error("Error generating Captain Dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user && token) {
            initData();
        }
    }, [user, role, token, navigate]);

    if (loading) return <div className="loading-screen" style={{ color: 'white', padding: '5rem', textAlign: 'center' }}>Syncing CSCL Data...</div>;

    return (
        <div className="captain-dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand gradient-text">Squad Profile</div>
                <button className="logout-btn" onClick={logout}>Logout Exit</button>
            </nav>

            <header className="squad-header glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/team-profile')}>
                <div className="squad-main">
                    {myTeam?.logo_url ? (
                        <img src={myTeam.logo_url} alt="Team Logo" className="profile-logo" />
                    ) : (
                        <div className="profile-logo-placeholder">
                            {myTeam?.team_name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                    )}
                    <div className="profile-info">
                        <h1>{myTeam?.team_name}</h1>
                        <p>Location: <span className="highlight-text">{myTeam?.location || 'Global'}</span></p>
                        {role === 'captain' && <p>Commander: {user.name}</p>}
                    </div>
                </div>
            </header>

            <section className="tournaments-feed">
                <h2 className="feed-title">Upcoming Tournaments Feed</h2>
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
                                        <button className="apply-btn">Apply Now</button>
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

export default CaptainHome;
