import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeamProfile.css';

const TeamProfile = () => {
    const { user, role, token, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [appliedTournaments, setAppliedTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        const fetchTeamDetails = async () => {
            try {
                // Fetch the absolute freshest team profile data from the server
                const tRes = await axios.get('http://localhost:5000/api/teams/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const currentTeam = tRes.data.team;
                
                if (currentTeam) {
                    setTeam(currentTeam);
                    
                    // Sync the local session if it's currently stale (if user role matches)
                    if (role === 'team' || (role === 'captain' && user.id === currentTeam.captain_id)) {
                        // We don't want to overwrite the captain's user object with team data, 
                        // but if role is 'team', we should sync.
                        if (role === 'team') updateUser(currentTeam);
                    }

                    const pRes = await axios.get(`http://localhost:5000/api/players/team/${currentTeam.id}`);
                    setPlayers(pRes.data.players || []);
                    
                    // Fetch applied tournaments
                    const regRes = await axios.get('http://localhost:5000/api/registrations/my', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setAppliedTournaments(regRes.data.registrations || []);
                }
            } catch (err) {
                console.error("Error fetching Team details:", err);
                if (err.response?.status === 404) {
                    navigate(role === 'team' ? '/team-home' : '/captain-home');
                }
            } finally {
                setLoading(false);
            }
        };

        if (user && token) {
            fetchTeamDetails();
        }
    }, [user, role, token, navigate]);

    const handleCopy = () => {
        if (!team) return;
        const link = `${window.location.origin}/join-team/${team.id}`;
        navigator.clipboard.writeText(link);
        setCopySuccess('Link Copied successfully!');
        setTimeout(() => setCopySuccess(''), 2500);
    };

    if (loading) return <div className="loading-screen" style={{ color: 'white', padding: '5rem', textAlign: 'center' }}>Syncing Roster Data...</div>;

    return (
        <div className="team-profile-container">
            <nav className="dashboard-nav">
                <div className="nav-brand gradient-text" onClick={() => navigate('/captain-home')} style={{ cursor: 'pointer' }}>
                    ← Back to Dashboard
                </div>
            </nav>

            {team && (
                <div className="team-profile-content">
                    <div className="team-hero-card glass-card">
                        {team.logo_url ? (
                            <img src={team.logo_url} alt="Team Logo" className="large-team-logo" />
                        ) : (
                            <div className="large-logo-placeholder">
                                {team.team_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h1 className="team-name">{team.team_name}</h1>
                        <p className="team-location">Base: {team.location || 'Global Team'}</p>
                    </div>

                    <div className="team-stats-grid">
                        <div className="stat-card glass-card">
                            <h3>Total Wins</h3>
                            <p className="stat-value highlight-text">0</p>
                        </div>
                        <div className="stat-card glass-card">
                            <h3>Total Losses</h3>
                            <p className="stat-value text-red">0</p>
                        </div>
                        <div className="stat-card glass-card">
                            <h3>Trophies</h3>
                            <p className="stat-value text-gold">0</p>
                        </div>
                        <div className="stat-card glass-card">
                            <h3>Rank</h3>
                            <p className="stat-value text-blue">Unranked</p>
                        </div>
                    </div>

                    <div className="recruitment-block glass-card">
                        <h2>Build Your Roster</h2>
                        <p>Share this secure invite link with your athletes on WhatsApp or SMS so they can instantly join your team roster natively!</p>
                        <div className="link-generator">
                            <input
                                type="text"
                                readOnly
                                value={`${window.location.origin}/join-team/${team.id}`}
                                className="share-link-input"
                            />
                            <button className="copy-btn" onClick={handleCopy}>
                                {copySuccess || 'Copy Invite Link'}
                            </button>
                        </div>
                    </div>

                    <div className="registrations-section glass-card">
                        <h2>Applied Tournaments</h2>
                        <div className="table-responsive">
                            {appliedTournaments.length === 0 ? (
                                <p className="empty-state">No tournament applications submitted yet.</p>
                            ) : (
                                <table className="roster-table">
                                    <thead>
                                        <tr>
                                            <th>Tournament Name</th>
                                            <th>Status</th>
                                            <th>Match QR</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appliedTournaments.map(reg => (
                                            <tr key={reg.id}>
                                                <td>
                                                    <div className="tournament-info-cell">
                                                        <strong>{reg.tournament_name}</strong>
                                                        <br />
                                                        <small>{new Date(reg.tournament_date).toLocaleDateString()}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${reg.status}`}>
                                                        {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td>
                                                    {reg.status === 'approved' && reg.qr_code ? (
                                                        <div className="qr-container">
                                                            <img src={reg.qr_code} alt="Entry QR" className="entry-qr-mini" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">Not Available</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {reg.status === 'approved' && reg.qr_code && (
                                                        <a 
                                                            href={reg.qr_code} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="download-qr-btn"
                                                            download={`QR_${reg.id}.png`}
                                                        >
                                                            Download QR
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="roster-section glass-card">
                        <h2>Official Team Roster</h2>
                        <div className="table-responsive">
                            {players.length === 0 ? (
                                <p className="empty-state">No players have joined this team yet.</p>
                            ) : (
                                <table className="roster-table">
                                    <thead>
                                        <tr>
                                            <th>Player Name</th>
                                            <th>Role</th>
                                            <th>Mobile Number</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players.map(p => (
                                            <tr key={p.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {p.image_url ? (
                                                            <img src={p.image_url} alt="profile" className="table-avatar" />
                                                        ) : (
                                                            <div className="table-avatar placeholder">{p.name.charAt(0)}</div>
                                                        )}
                                                        {p.name} {p.is_captain && <span className="captain-badge">Captain</span>}
                                                    </div>
                                                </td>
                                                <td>{p.role}</td>
                                                <td>{p.mobile_number}</td>
                                                <td><span className="status-badge active">Active</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamProfile;
