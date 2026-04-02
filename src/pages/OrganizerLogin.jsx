import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './OrganizerRegistration.css'; // Shared form styling
import './OrganizerLogin.css';
import bgImage from '../assets/bg.png';

const OrganizerLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://localhost:5000/api/organizers/login', formData);
            if (res.data && res.data.token && res.data.organizer) {
                login(res.data.organizer, res.data.token);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-hero" style={{ backgroundImage: `url(${bgImage})` }}>
                <div className="hero-overlay">
                    <h1 className="hero-title">Welcome Back to the <span className="gradient-text">Arena</span></h1>
                    <p className="hero-subtitle">Login to manage your tournaments, track scores, and coordinate teams securely.</p>
                </div>
            </div>

            <div className="login-form-section">
                <div className="glass-card login-card">
                    <h2>Organizer Login</h2>
                    <p className="subtitle">Enter your credentials to access the dashboard.</p>

                    <form onSubmit={handleSubmit} className="form-layout">
                        {error && <div className="error-message">{error}</div>}

                        <div className="input-group">
                            <label>Email Address</label>
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
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Log In'}
                        </button>

                        <p className="redirect-text">
                            Don't have an account? <Link to="/register">Register here</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrganizerLogin;
