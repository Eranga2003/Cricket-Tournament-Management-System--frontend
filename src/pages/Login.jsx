import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './OrganizerRegistration.css'; // Shared form styling
import './Login.css';
import bgImage from '../assets/bg.png';

const Login = () => {
    const [role, setRole] = useState('organizer'); // 'organizer', 'captain', 'team'
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
            let url = '';
            let payload = { password: formData.password };

            if (role === 'organizer') {
                url = 'http://localhost:5000/api/organizers/login';
                payload.email = formData.email;
            } else if (role === 'captain') {
                url = 'http://localhost:5000/api/captains/login';
                payload.email = formData.email;
            } else if (role === 'team') {
                url = 'http://localhost:5000/api/teams/login';
                payload.username = formData.email; // We reuse the email state for the username input
            } else if (role === 'player') {
                url = 'http://localhost:5000/api/players/login';
                payload.username = formData.email; 
            }

            const res = await axios.post(url, payload);

            if (role === 'organizer') {
                login(res.data.organizer, res.data.token, 'organizer');
                navigate('/dashboard');
            } else if (role === 'captain') {
                login(res.data.captain, res.data.token, 'captain');
                navigate('/captain-home'); // This route will perform team check checks
            } else if (role === 'team') {
                login(res.data.team, res.data.token, 'team');
                navigate('/captain-home'); // Team entity explicitly routes here for Tournament App
            } else if (role === 'player') {
                login(res.data.player, res.data.token, 'player');
                navigate('/team-home'); // Players jump to the dedicated feed lacking Apply capabilities
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
                    <h1 className="hero-title">Ceylon Softball <span className="gradient-text">Champions League</span></h1>
                    <p className="hero-subtitle">Unified authentication for Tournament Organizers, Captains, and Teams.</p>
                </div>
            </div>

            <div className="login-form-section">
                <div className="glass-card login-card universal-login-card">

                    <div className="role-tabs">
                        <button type="button" className={role === 'organizer' ? 'active tab-btn' : 'tab-btn'} onClick={() => setRole('organizer')}>Organizer</button>
                        <button type="button" className={role === 'captain' ? 'active tab-btn' : 'tab-btn'} onClick={() => setRole('captain')}>Captain</button>
                        <button type="button" className={role === 'team' ? 'active tab-btn' : 'tab-btn'} onClick={() => setRole('team')}>Team</button>
                        <button type="button" className={role === 'player' ? 'active tab-btn' : 'tab-btn'} onClick={() => setRole('player')}>Team Member</button>
                    </div>

                    <div className="login-header">
                        <h2>{role === 'player' ? 'Team Member' : role.charAt(0).toUpperCase() + role.slice(1)} Login</h2>
                        <p className="subtitle">Securely connect to your module.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="form-layout">
                        {error && <div className="error-message">{error}</div>}

                        <div className="input-group">
                            <label>
                                {(role === 'team' || role === 'player') ? 'Username' : 'Email Address'}
                            </label>
                            <input
                                type={(role === 'team' || role === 'player') ? "text" : "email"}
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder={
                                    (role === 'team' || role === 'player') ? 'Enter your unique handle' : 'e.g. contact@example.com'
                                }
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
                            {loading ? <span className="spinner"></span> : `Enter as ${role === 'player' ? 'Team Member' : role.charAt(0).toUpperCase() + role.slice(1)}`}
                        </button>

                        <p className="redirect-text">
                            New here? <br />
                            {role === 'organizer' && <Link to="/organizer-registration">Register an Organizer</Link>}
                            {role === 'captain' && <Link to="/captain-registration">Register as Captain</Link>}
                            {role === 'team' && "Teams are created dynamically by Captains inside their dashboard."}
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
