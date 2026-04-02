import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './OrganizerRegistration.css'; // Inheriting baseline auth aesthetic
import bgImage from '../assets/bg.png';

const JoinTeam = () => {
    const { teamId } = useParams();

    const [formData, setFormData] = useState({
        name: '',
        mobile_number: '',
        role: 'Batsman',
        image_url: '',
        birthday: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('http://localhost:5000/api/players/register', {
                ...formData,
                team_id: teamId
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-container">
            <div className="registration-hero" style={{ backgroundImage: `url(${bgImage})` }}>
                <div className="hero-overlay">
                    <h1 className="hero-title">Join The <span className="gradient-text">Squad</span></h1>
                    <p className="hero-subtitle">You have been specifically invited to join a competitive softball roster! Complete your athlete profile below.</p>
                </div>
            </div>

            <div className="registration-form-section">
                <div className="glass-card">
                    <h2>Athlete Registration</h2>
                    <p className="subtitle">Securely populate the Team Database.</p>

                    {success ? (
                        <div className="success-message">
                            <h3>✅ Successfully Drafted!</h3>
                            <p>You have officially joined the team roster. Your captain can now view your competitive profile in the global Team Hub!</p>
                            <button onClick={() => navigate('/login')} className="submit-btn" style={{ marginTop: '2rem' }}>
                                Go to Team Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="form-layout">
                            {error && <div className="error-message">{error}</div>}

                            <div className="input-group">
                                <label>Full Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="M. Perera" />
                            </div>

                            <div className="input-group">
                                <label>Mobile Number *</label>
                                <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} required placeholder="07xxxxxxx" />
                            </div>

                            <div className="input-group" style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Primary Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        padding: '1rem 1.2rem',
                                        borderRadius: '12px',
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="Batsman">Batsman</option>
                                    <option value="Bowler">Bowler</option>
                                    <option value="All-Rounder">All-Rounder</option>
                                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Profile Image URL (Optional)</label>
                                <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://..." />
                            </div>

                            <div className="input-group">
                                <label>Birthday (Optional)</label>
                                <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} style={{ colorScheme: 'dark' }} />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Join Official Roster'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinTeam;
