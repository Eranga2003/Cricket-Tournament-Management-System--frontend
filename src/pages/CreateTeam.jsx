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
        username: '',
        team_email: '',
        password: '',
        location: ''
    });

    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('team_name', formData.team_name);
            data.append('username', formData.username);
            data.append('team_email', formData.team_email);
            data.append('password', formData.password);
            data.append('location', formData.location);
            data.append('captain_id', user.id);
            if (logo) {
                data.append('logo', logo);
            }

            await axios.post('http://localhost:5000/api/teams/register', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            navigate('/captain-home');
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

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

                        {/* Premium Logo Upload UI */}
                        <div className="image-upload-container">
                            <label style={{ marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>Official Team Logo</label>
                            <label className="image-upload-wrapper">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoChange} 
                                    style={{ display: 'none' }}
                                />
                                <div className="image-view-placeholder">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="image-preview" />
                                    ) : (
                                        <div className="upload-icon-box">
                                            <span className="upload-icon">🛡️</span>
                                            <span className="upload-text">Upload Logo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="upload-overlay">
                                    <span>📸</span>
                                </div>
                            </label>
                        </div>

                        <div className="input-group">
                            <label>Official Team Name *</label>
                            <input type="text" name="team_name" value={formData.team_name} onChange={handleChange} required placeholder="Gladiators BC" />
                        </div>

                        <div className="input-group">
                            <label>Team Unique Handle (Username) *</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="gladiators_official" />
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
