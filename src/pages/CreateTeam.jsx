import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './OrganizerRegistration.css'; // Reusing established Auth Layouts
import bgImage from '../assets/bg.png';

const CreateTeam = () => {
    const { user, role } = useContext(AuthContext); // Captain
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        team_name: '',
        team_email: '',
        password: '',
        location: '',
        logo_url: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('http://localhost:5000/api/teams/register', {
                ...formData,
                captain_id: user.id // Inject authentic captain ID automatically
            });
            // Automatically push them to the Captain Home now that their team exists
            navigate('/captain-home');
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Failsafe in case a non-captain navigates here directly
    if (role !== 'captain') {
        return <div style={{ padding: '5rem', color: 'white', textAlign: 'center' }}>Only an authenticated Captain can create a squad.</div>;
    }

    return (
        <div className="registration-container">
            <div className="registration-hero" style={{ backgroundImage: `url(${bgImage})` }}>
                <div className="hero-overlay">
                    <h1 className="hero-title">Forge Your <span className="gradient-text">Squad</span></h1>
                    <p className="hero-subtitle">You are registered as a Captain! Now you must establish your official Team Profile to enter tournaments.</p>
                </div>
            </div>

            <div className="registration-form-section">
                <div className="glass-card">
                    <h2>Create Team Profile</h2>
                    <p className="subtitle">This team account will represent you globally.</p>

                    <form onSubmit={handleSubmit} className="form-layout">
                        {error && <div className="error-message">{error}</div>}

                        <div className="input-group">
                            <label>Official Team Name *</label>
                            <input type="text" name="team_name" value={formData.team_name} onChange={handleChange} required placeholder="Gladiators BC" />
                        </div>

                        <div className="input-group">
                            <label>Team Email (Used for separate team login) *</label>
                            <input type="email" name="team_email" value={formData.team_email} onChange={handleChange} required placeholder="gladiators@example.com" />
                        </div>

                        <div className="input-group">
                            <label>Team Profile Password *</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Create secure password for team login" />
                        </div>

                        <div className="input-group">
                            <label>Base Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, Region" />
                        </div>

                        <div className="input-group">
                            <label>Team Logo URL</label>
                            <input type="text" name="logo_url" value={formData.logo_url} onChange={handleChange} placeholder="https://..." />
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Establish Team'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTeam;
