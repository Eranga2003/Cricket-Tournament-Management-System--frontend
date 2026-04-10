import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './StartMatch.css';

const StartMatch = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [availableTeams, setAvailableTeams] = useState([]);
    const [slot1, setSlot1] = useState(null);
    const [slot2, setSlot2] = useState(null);
    const [dragOverZone, setDragOverZone] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArrivedTeams = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/registrations/organizer', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Filter teams that have status 'arrived'
                const arrived = res.data.registrations?.filter(app => app.status === 'arrived') || [];
                setAvailableTeams(arrived);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching teams:", err);
                setLoading(false);
            }
        };

        if (token) fetchArrivedTeams();
    }, [token]);

    const handleDragStart = (e, team) => {
        e.dataTransfer.setData("teamId", team.id.toString());
    };

    const handleDragOver = (e, zone) => {
        e.preventDefault();
        setDragOverZone(zone);
    };

    const handleDragLeave = () => {
        setDragOverZone(null);
    };

    const handleDrop = (e, zone) => {
        e.preventDefault();
        setDragOverZone(null);
        const teamId = e.dataTransfer.getData("teamId");
        const team = availableTeams.find(t => t.id.toString() === teamId);

        if (!team) return;

        if (zone === 1) {
            if (slot1) setAvailableTeams(prev => [...prev, slot1]);
            setSlot1(team);
        } else {
            if (slot2) setAvailableTeams(prev => [...prev, slot2]);
            setSlot2(team);
        }

        setAvailableTeams(prev => prev.filter(t => t.id.toString() !== teamId));
    };

    const clearSlot = (zone) => {
        if (zone === 1 && slot1) {
            setAvailableTeams(prev => [...prev, slot1]);
            setSlot1(null);
        } else if (zone === 2 && slot2) {
            setAvailableTeams(prev => [...prev, slot2]);
            setSlot2(null);
        }
    };

    const handleStartMatch = async () => {
        // In a real app, we would POST to /api/matches/slot-teams or similar
        // For now, let's simulate the excitement!
        alert(`🚀 MATCH ENGAGED! \n\n${slot1.team_name} vs ${slot2.team_name}\n\nRedirecting to Live Scoring System...`);
        // navigate('/live-scoring'); // Future implementation
    };

    if (loading) return <div className="start-match-page">Syncing Arena Data...</div>;

    return (
        <div className="start-match-page">
            <nav className="match-nav">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Exit Arena
                </button>
                <div className="nav-logo gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                    MATCH ENGINE
                </div>
                <div style={{ width: '100px' }}></div> {/* Spacer */}
            </nav>

            <div className="match-layout">
                <aside className="teams-sidebar">
                    <div className="sidebar-header">
                        <h3>Available Squads</h3>
                    </div>
                    {availableTeams.length === 0 ? (
                        <div className="empty-state-sidebar">
                            No checked-in teams available.
                        </div>
                    ) : (
                        availableTeams.map(team => (
                            <div 
                                key={team.id}
                                className="team-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, team)}
                            >
                                <div className="card-avatar">
                                    {team.team_logo ? (
                                        <img src={team.team_logo} alt="L" style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover' }} />
                                    ) : (
                                        team.team_name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="card-info">
                                    <h4>{team.team_name}</h4>
                                    <p>{team.tournament_name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </aside>

                <main className="match-arena">
                    <div className="arena-overlay-glow"></div>
                    
                    <div className="arena-title">
                        <h2>Prepare for Battle</h2>
                        <p>Drag teams from the sidebar into the combat slots below</p>
                    </div>

                    <div className="battle-ground">
                        <div className="slot-container">
                            <span className="slot-label home">Home Side</span>
                            <div 
                                className={`drop-box ${dragOverZone === 1 ? 'hovered' : ''} ${slot1 ? 'occupied' : ''}`}
                                onDragOver={(e) => handleDragOver(e, 1)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 1)}
                            >
                                {slot1 ? (
                                    <div className="occupied-slot-ui">
                                        <button className="remove-team" onClick={() => clearSlot(1)}>&times;</button>
                                        <div className="occupied-avatar" style={{ background: 'linear-gradient(135deg, #00E1FF 0%, #0097A7 100%)' }}>
                                            {slot1.team_logo ? (
                                                <img src={slot1.team_logo} alt="L" style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }} />
                                            ) : (
                                                slot1.team_name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <h3>{slot1.team_name}</h3>
                                        <p>{slot1.tournament_name}</p>
                                    </div>
                                ) : (
                                    <div className="empty-slot-ui">
                                        <i>📥</i>
                                        <p>Drop Team 1</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="vs-divider">VS</div>

                        <div className="slot-container">
                            <span className="slot-label away">Away Side</span>
                            <div 
                                className={`drop-box ${dragOverZone === 2 ? 'hovered' : ''} ${slot2 ? 'occupied' : ''}`}
                                onDragOver={(e) => handleDragOver(e, 2)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 2)}
                            >
                                {slot2 ? (
                                    <div className="occupied-slot-ui">
                                        <button className="remove-team" onClick={() => clearSlot(2)}>&times;</button>
                                        <div className="occupied-avatar" style={{ background: 'linear-gradient(135deg, #FF2E93 0%, #7000FF 100%)' }}>
                                            {slot2.team_logo ? (
                                                <img src={slot2.team_logo} alt="L" style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }} />
                                            ) : (
                                                slot2.team_name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <h3>{slot2.team_name}</h3>
                                        <p>{slot2.tournament_name}</p>
                                    </div>
                                ) : (
                                    <div className="empty-slot-ui">
                                        <i>📥</i>
                                        <p>Drop Team 2</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="action-footer">
                        {slot1 && slot2 && (
                            <button className="start-btn" onClick={handleStartMatch}>
                                Start Official Match
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StartMatch;
