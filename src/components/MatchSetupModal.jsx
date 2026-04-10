import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './MatchSetupModal.css';

const MatchSetupModal = ({ isOpen, onClose, arrivedTeams }) => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();
    const [availableTeams, setAvailableTeams] = useState([]);
    const [slot1, setSlot1] = useState(null);
    const [slot2, setSlot2] = useState(null);
    const [dragOverZone, setDragOverZone] = useState(null);
    const [matchNumber, setMatchNumber] = useState(1);
    const [matchesStarted, setMatchesStarted] = useState([]);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Filter only arrived teams and those not currently playing
            setAvailableTeams(arrivedTeams.filter(t => t.status === 'arrived'));
            setSlot1(null);
            setSlot2(null);
        }
    }, [isOpen, arrivedTeams]);

    const getMatchOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const handleDragStart = (e, team) => {
        e.dataTransfer.setData("teamId", team.id);
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
        const team = availableTeams.find(t => t.id === parseInt(teamId));

        if (!team) return;

        if (zone === 1) {
            // If slot was occupied, move team back to available
            if (slot1) setAvailableTeams(prev => [...prev, slot1]);
            setSlot1(team);
        } else {
            if (slot2) setAvailableTeams(prev => [...prev, slot2]);
            setSlot2(team);
        }

        // Remove from available
        setAvailableTeams(prev => prev.filter(t => t.id !== team.id));
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
        if (isStarting) return;
        setIsStarting(true);
        
        try {
            // First, establish the match record in the database
            const res = await axios.post('http://localhost:5000/api/matches', {
                tournament_id: slot1.tournament_id,
                team1_id: slot1.id,
                team2_id: slot2.id,
                team1_name: slot1.team_name,
                team2_name: slot2.team_name,
                match_number: matchNumber
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const newMatchId = res.data.match.id;

            // Prepare local history state (optional but good for UX)
            const matchData = {
                id: newMatchId,
                matchNumber,
                team1: slot1,
                team2: slot2,
                startTime: new Date().toLocaleTimeString()
            };
            setMatchesStarted(prev => [...prev, matchData]);

            // Navigate to configuration to finalize rules and start scoring
            navigate(`/match-config/${newMatchId}`);
            onClose();
            
            // Cleanup
            setMatchNumber(prev => prev + 1);
            setSlot1(null);
            setSlot2(null);
        } catch (err) {
            console.error("Match startup fail:", err);
            alert(err.response?.data?.error || "Failed to establish the official match record.");
        } finally {
            setIsStarting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="match-setup-overlay">
            <div className="match-setup-content glass-card">
                <div className="match-setup-header">
                    <h2 className="gradient-text">Tournament Match Engine</h2>
                    <button className="close-setup-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="match-setup-body">
                    {/* Sidebar: Available Teams */}
                    <aside className="arrived-teams-sidebar">
                        <span className="sidebar-title">Checked-In Squads</span>
                        {availableTeams.length === 0 ? (
                            <div className="empty-sidebar">No more squads available for this bracket.</div>
                        ) : (
                            availableTeams.map(team => (
                                <div 
                                    key={team.id}
                                    className="draggable-team-card"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, team)}
                                >
                                    <div className="team-avatar-mini">
                                        {team.team_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="team-info-mini">
                                        <h4>{team.team_name}</h4>
                                        <p>{team.tournament_name}</p>
                                    </div>
                                </div>
                            ))
                        )}

                        {matchesStarted.length > 0 && (
                            <div className="session-history">
                                <span className="sidebar-title" style={{ marginTop: '2rem' }}>Live Bracket History</span>
                                {matchesStarted.map(m => (
                                    <div key={m.id} className="history-item" style={{ fontSize: '0.8rem', padding: '0.5rem', opacity: 0.6 }}>
                                        M{m.matchNumber}: {m.team1.team_name} v {m.team2.team_name} (@ {m.startTime})
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>

                    {/* Arena: Drag & Drop Zones */}
                    <main className="setup-arena">
                        <div className="match-round-title">
                            {getMatchOrdinal(matchNumber)} <span className="gradient-text">Match</span>
                        </div>

                        <div className="battle-container">
                            {/* Slot 1 */}
                            <div 
                                className={`drop-zone ${dragOverZone === 1 ? 'active' : ''} ${slot1 ? 'occupied' : ''}`}
                                onDragOver={(e) => handleDragOver(e, 1)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 1)}
                            >
                                {slot1 ? (
                                    <div className="selected-team-display">
                                        <button className="clear-selection" onClick={() => clearSlot(1)}>&times;</button>
                                        <div className="team-avatar-mini" style={{ width: '80px', height: '80px', fontSize: '2.5rem', margin: '0 auto' }}>
                                            {slot1.team_name.charAt(0).toUpperCase()}
                                        </div>
                                        <h3>{slot1.team_name}</h3>
                                        <p style={{ color: '#00E1FF', fontWeight: 'bold' }}>Home Side</p>
                                    </div>
                                ) : (
                                    <div className="zone-placeholder">
                                        <i>📥</i>
                                        <p>Drag Team 1 Here</p>
                                    </div>
                                )}
                            </div>

                            <div className="vs-text">VS</div>

                            {/* Slot 2 */}
                            <div 
                                className={`drop-zone ${dragOverZone === 2 ? 'active' : ''} ${slot2 ? 'occupied' : ''}`}
                                onDragOver={(e) => handleDragOver(e, 2)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, 2)}
                            >
                                {slot2 ? (
                                    <div className="selected-team-display">
                                        <button className="clear-selection" onClick={() => clearSlot(2)}>&times;</button>
                                        <div className="team-avatar-mini" style={{ width: '80px', height: '80px', fontSize: '2.5rem', margin: '0 auto' }}>
                                            {slot2.team_name.charAt(0).toUpperCase()}
                                        </div>
                                        <h3>{slot2.team_name}</h3>
                                        <p style={{ color: '#FF2E93', fontWeight: 'bold' }}>Away Side</p>
                                    </div>
                                ) : (
                                    <div className="zone-placeholder">
                                        <i>📥</i>
                                        <p>Drag Team 2 Here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {slot1 && slot2 && (
                            <button 
                                className={`start-battle-btn ${isStarting ? 'loading' : ''}`} 
                                onClick={handleStartMatch}
                                disabled={isStarting}
                            >
                                {isStarting ? 'Establishing Battle...' : 'Start Official Match ⚡'}
                            </button>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MatchSetupModal;
