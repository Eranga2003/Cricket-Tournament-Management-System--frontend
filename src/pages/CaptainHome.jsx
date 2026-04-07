import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CaptainHome.css';
import TournamentWeather from '../components/TournamentWeather';
import ApplyTournamentModal from '../components/ApplyTournamentModal';

const CaptainHome = () => {
    const { user, token, role, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [myTeam, setMyTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [appliedIds, setAppliedIds] = useState([]); // Track tournament IDs already applied to
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

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
            setTournaments(fetchedTournaments.filter(t => t.status !== 'completed'));

            // 3. Fetch My Registrations to show "Applied" status
            const regRes = await axios.get('http://localhost:5000/api/registrations/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const myRegs = regRes.data.registrations || [];
            setAppliedIds(myRegs.map(reg => reg.tournament_id));

        } catch (err) {
            console.error("Error generating Captain Dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && token) {
            initData();
        }
    }, [user, role, token, navigate]);

    const handleApplyClick = (tournament) => {
        setSelectedTournament(tournament);
        setIsApplyModalOpen(true);
    };

    const handleApplySuccess = (newReg) => {
        setAppliedIds(prev => [...prev, newReg.tournament_id]);
    };

    if (loading) return <div className="loading-screen" style={{ color: 'white', padding: '5rem', textAlign: 'center' }}>Syncing CSCL Data...</div>;

    return (
        <div className="captain-dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand-group">
                    <div className="nav-brand gradient-text" style={{ cursor: 'pointer' }} onClick={() => navigate('/team-profile')}>Squad Profile</div>
                    <div className="nav-brand gradient-text" style={{ cursor: 'pointer' }} onClick={() => navigate('/captain-profile')}>My Profile</div>
                </div>
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
                                
                                <div className="card-image-header">
                                    {t.ground_images && t.ground_images.length > 0 ? (
                                        <img src={t.ground_images[0]} alt={t.name} />
                                    ) : (
                                        <div className="image-placeholder-gradient" style={{ height: '100%', background: 'linear-gradient(45deg, #182040, #25305a)' }}></div>
                                    )}
                                    <div className="image-overlay"></div>
                                    <TournamentWeather location={t.location} nearCity={t.near_city} date={t.date_time} />
                                </div>

                                <div className="card-content">
                                    <div className="card-status-bar">
                                        {appliedIds.includes(t.id) ? (
                                            <span className="status-badge live">Applied ✅</span>
                                        ) : (
                                            <span className={`status-badge ${t.status}`}>{t.status}</span>
                                        )}
                                        <span className="card-fee">LKR {t.registration_fee}</span>
                                    </div>

                                    <h3>{t.name}</h3>
                                    <p className="card-location">📍 {t.location}</p>

                                    <div className="card-stats">
                                        <div className="stat-pill"><strong>{t.overs}</strong> Overs</div>
                                        <div className="stat-pill"><strong>{t.balls_per_over}</strong> Balls/Over</div>
                                    </div>

                                    <div className="prize-pool">
                                        <p>🏆 1st: <span className="highlight-text">LKR {t.prize_1st}</span></p>
                                        <p>🥈 2nd: <span className="highlight-text">LKR {t.prize_2nd}</span></p>
                                    </div>

                                    <div className="card-actions">
                                        <p className="card-date">{new Date(t.date_time).toLocaleDateString()}</p>
                                        {appliedIds.includes(t.id) ? (
                                            <button className="apply-btn disabled" disabled>Entry Submitted</button>
                                        ) : (
                                            <button className="apply-btn" onClick={() => handleApplyClick(t)}>Apply Now</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Application Modal */}
            {selectedTournament && (
                <ApplyTournamentModal 
                    isOpen={isApplyModalOpen}
                    onClose={() => setIsApplyModalOpen(false)}
                    tournament={selectedTournament}
                    team={myTeam}
                    onApplySuccess={handleApplySuccess}
                />
            )}
        </div>
    );
};

export default CaptainHome;
