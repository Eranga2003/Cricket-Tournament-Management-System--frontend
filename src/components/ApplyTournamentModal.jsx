import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApplyTournamentModal.css';

const ApplyTournamentModal = ({ tournament, team, isOpen, onClose, onApplySuccess }) => {
    const [step, setStep] = useState(1);
    const [players, setPlayers] = useState([]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        team_name: team?.team_name || '',
        contact_number: '',
        payment_done: false
    });

    // Reset state only when the modal is opened
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedPlayerIds([]);
            setFormData({
                team_name: team?.team_name || '',
                contact_number: '',
                payment_done: false
            });
            setError(null);
        }
    }, [isOpen]);

    // Fetch players independently
    useEffect(() => {
        const fetchPlayers = async () => {
            if (!team?.id || !isOpen) return;
            try {
                setLoading(true);
                const res = await axios.get(`http://localhost:5000/api/players/team/${team.id}`);
                setPlayers(res.data.players || []);
            } catch (err) {
                console.error("Fetch players error:", err);
                setError("Failed to load your squad roster. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && team?.id) {
            fetchPlayers();
        }
    }, [isOpen, team?.id]);

    const togglePlayer = (id) => {
        setSelectedPlayerIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (selectedPlayerIds.length === 0) {
            setError("Please select at least one player to represent your squad.");
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.payment_done) {
            setError("Please confirm that the registration payment has been initiated.");
            return;
        }
        if (!formData.contact_number) {
          setError("A primary contact number is required for the organizer.");
          return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/registrations/apply', {
                tournament_id: tournament.id,
                selected_players: selectedPlayerIds,
                team_name: formData.team_name,
                contact_number: formData.contact_number,
                payment_done: formData.payment_done
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onApplySuccess(res.data.registration);
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || "Failed to submit application. System timeout.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="glass-card apply-modal-card">
                <div className="modal-header">
                    <h2>Apply for <span className="gradient-text">{tournament.name}</span></h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="step-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Squad Roster</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Final Details</div>
                </div>

                {step === 1 ? (
                    <div className="modal-body">
                        <p className="step-desc">Select the elite athletes who will represent <strong>{team?.team_name}</strong> in this tournament.</p>
                        
                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Syncing Squad Performance Data...</p>
                            </div>
                        ) : error ? (
                            <div className="error-message">{error}</div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="player-select-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Player Name</th>
                                            <th>Role</th>
                                            <th className="sort-header">Runs 🏏</th>
                                            <th className="sort-header">Wickets 🏹</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {players.length === 0 ? (
                                            <tr><td colSpan="5" className="empty-row">No players found in your roster. Please recruit members first.</td></tr>
                                        ) : (
                                            players.map(player => (
                                                <tr 
                                                    key={player.id} 
                                                    className={selectedPlayerIds.includes(player.id) ? 'selected' : ''}
                                                    onClick={() => togglePlayer(player.id)}
                                                >
                                                    <td className="checkbox-cell">
                                                        <div className={`custom-checkbox ${selectedPlayerIds.includes(player.id) ? 'checked' : ''}`}></div>
                                                    </td>
                                                    <td className="player-name-cell">
                                                        {player.image_url && <img src={player.image_url} alt="p" className="mini-avatar" />}
                                                        <span>{player.name}</span>
                                                    </td>
                                                    <td>{player.role}</td>
                                                    <td className="stat-cell">{player.total_runs || 0}</td>
                                                    <td className="stat-cell">{player.total_wickets || 0}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="modal-footer">
                            <span className="selection-count">{selectedPlayerIds.length} Athletes Selected</span>
                            <button className="next-btn" onClick={handleNext} disabled={loading || players.length === 0}>
                                Continue to Logistics →
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="modal-body" onSubmit={handleSubmit}>
                        <p className="step-desc">Verify your team details and confirm entry payment requirements.</p>
                        
                        {error && <div className="error-message">{error}</div>}

                        <div className="form-layout">
                            <div className="input-group">
                                <label>Official Team Name</label>
                                <input 
                                    type="text" 
                                    value={formData.team_name} 
                                    onChange={(e) => setFormData({...formData, team_name: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Primary Contact Number (Organizers will use this)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. +94 77 123 4567"
                                    value={formData.contact_number} 
                                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="tournament-summary-card">
                                <div className="summary-item">
                                    <span>Tournament Fee:</span>
                                    <span className="fee-value">LKR {tournament.registration_fee || '0'}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Selected Squad size:</span>
                                    <span>{selectedPlayerIds.length} Players</span>
                                </div>
                            </div>

                            <label className="payment-tick-container">
                                <input 
                                    type="checkbox" 
                                    checked={formData.payment_done}
                                    onChange={(e) => setFormData({...formData, payment_done: e.target.checked})}
                                />
                                <span className="checkmark"></span>
                                <span className="tick-text">I have completed/initiated the entry fee payment as per organizer guidelines.</span>
                            </label>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="back-btn" onClick={() => setStep(1)}>← Back</button>
                            <button type="submit" className="submit-btn final-apply-btn" disabled={submitting}>
                                {submitting ? <span className="spinner"></span> : 'Submit Official Entry'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ApplyTournamentModal;
