import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './OrganizerRegistration.css'; // Reusing established Auth Layouts
import bgImage from '../assets/bg.png';

const CaptainRegistration = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        profile_image_url: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await axios.post('http://localhost:5000/api/captains/register', formData);
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
                    <h1 className="hero-title">Lead Your Squad to Victory!</h1>
                    <p className="hero-subtitle">Create a Captain account, build your team, and compete in premium softball tournaments across the globe.</p>
                </div>
            </div>

            <div className="registration-form-section">
                <div className="glass-card">
                    <h2>Captain Registration</h2>
                    <p className="subtitle">Sign up to manage your team.</p>

                    {success ? (
                        <div className="success-message">
                            <h3>🎉 Registration Successful!</h3>
                            <p>You can now log in and build your official team.</p>
                            <Link to="/login" className="submit-btn" style={{ marginTop: '2rem', display: 'flex', width: 'fit-content', textDecoration: 'none', margin: '2rem auto 0' }}>Go to Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="form-layout">
                            {error && <div className="error-message">{error}</div>}

                            <div className="input-group">
                                <label>Full Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                            </div>

                            <div className="input-group">
                                <label>Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="captain@example.com" />
                            </div>

                            <div className="input-group">
                                <label>Phone/Mobile</label>
                                <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="+1 234 567 8900" />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Create a secure password" />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Register as Captain'}
                            </button>

                            <p className="redirect-text">
                                Already have an account? <Link to="/login">Login here</Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaptainRegistration;
