import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './OrganizerRegistration.css';
import bgImage from '../assets/bg.png';

const OrganizerRegistration = () => {
    const [formData, setFormData] = useState({
        org_name: '',
        email: '',
        phone: '',
        password: '',
        logo: '',
        sponsors: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSponsorsChange = (e) => {
        // split comma separated values into an array
        const val = e.target.value;
        const array = val.split(',').map(s => s.trim()).filter(s => s);
        setFormData({ ...formData, sponsors: array });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://localhost:5000/api/organizers/register', formData);
            if (res.data) setSuccess(true);
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
                    <h1 className="hero-title">Host Your Next Softball Tournament</h1>
                    <p className="hero-subtitle">The ultimate platform for modern softball tournaments. Manage teams, live scores, and player stats in one place.</p>
                </div>
            </div>

            <div className="registration-form-section">
                <div className="glass-card">
                    <h2>Create Organizer Account</h2>
                    <p className="subtitle">Join the premium cricket community.</p>

                    {success ? (
                        <div className="success-message">
                            <h3>🎉 Registration Successful!</h3>
                            <p>You can now login and start hosting tournaments.</p>
                            <Link to="/login" className="submit-btn" style={{ marginTop: '2rem', display: 'flex', width: 'fit-content', textDecoration: 'none', margin: '2rem auto 0' }}>Go to Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="form-layout">
                            {error && <div className="error-message">{error}</div>}

                            <div className="input-group">
                                <label>Organization Name *</label>
                                <input
                                    type="text"
                                    name="org_name"
                                    value={formData.org_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Premier League"
                                />
                            </div>

                            <div className="input-group">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="contact@example.com"
                                />
                            </div>

                            <div className="input-group">
                                <label>Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div className="input-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Create a strong password"
                                />
                            </div>

                            <div className="input-group">
                                <label>Logo URL (Optional)</label>
                                <input
                                    type="text"
                                    name="logo"
                                    value={formData.logo}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="input-group">
                                <label>Sponsors (Optional, comma separated)</label>
                                <input
                                    type="text"
                                    name="sponsors"
                                    onChange={handleSponsorsChange}
                                    placeholder="Nike, RedBull, MRF"
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Register Now'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerRegistration;
