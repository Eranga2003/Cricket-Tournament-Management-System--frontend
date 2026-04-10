import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TeamDetailsModal.css';

const TeamDetailsModal = ({ registration, onClose }) => {
    const [team, setTeam] = useState(null);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!registration) return;
            try {
                setLoading(true);
                // 1. Fetch team basic details
                const teamRes = await axios.get(`http://localhost:5000/api/teams/${registration.team_id}`);
                setTeam(teamRes.data.team);

                // 2. Fetch all players for that team and filter by selected ones
                const playersRes = await axios.get(`http://localhost:5000/api/players/team/${registration.team_id}`);
                const allPlayers = playersRes.data.players || [];
                
                // Filter players who were actually selected for this tournament
                const filtered = allPlayers.filter(p => 
                    registration.selected_players.includes(p.id)
                );
                setSelectedPlayers(filtered);
            } catch (err) {
                console.error("Error fetching team/player details:", err);
                setError("Failed to load full squad data. The record may be archived.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [registration]);

    if (!registration) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card team-details-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2 className="gradient-text">Squad Profile: {registration.team_name}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Fetching Tactical Squad Data...</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <>
                            <div className="team-header-info">
                                {team?.logo_url ? (
                                    <img src={team.logo_url} alt="Logo" className="details-team-logo" />
                                ) : (
                                    <div className="details-logo-placeholder">{registration.team_name.charAt(0)}</div>
                                )}
                                <div className="info-text">
                                    <h3>{registration.team_name}</h3>
                                    <p className="location-tag">Based in: {team?.location || 'Unspecified'}</p>
                                    <p className="contact-info">Primary Contact: <strong>{registration.contact_number}</strong></p>
                                </div>
                            </div>

                            <div className="squad-section">
                                <h3>Selected Tournament Squad ({selectedPlayers.length} Members)</h3>
                                <div className="table-responsive">
                                    <table className="roster-table mini-table">
                                        <thead>
                                            <tr>
                                                <th>Athlete</th>
                                                <th>Primary Role</th>
                                                <th>Career Runs</th>
                                                <th>Career Wickets</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPlayers.map(player => (
                                                <tr key={player.id}>
                                                    <td>
                                                        <div className="player-cell">
                                                            {player.image_url && <img src={player.image_url} alt="p" className="mini-avatar" />}
                                                            <span>{player.name}</span>
                                                        </div>
                                                    </td>
                                                    <td><span className="role-badge">{player.role}</span></td>
                                                    <td>{player.total_runs || 0}</td>
                                                    <td>{player.total_wickets || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <footer className="modal-footer">
                    <button className="done-btn" onClick={onClose}>Close Profile</button>
                </footer>
            </div>
        </div>
    );
};

export default TeamDetailsModal;
