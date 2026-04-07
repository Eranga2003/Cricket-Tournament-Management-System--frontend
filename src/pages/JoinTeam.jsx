import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './OrganizerRegistration.css'; // Inheriting baseline auth aesthetic
import bgImage from '../assets/bg.png';

const JoinTeam = () => {
    const { teamId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        mobile_number: '',
        role: 'Batsman',
        birthday: ''
    });

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
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
            data.append('name', formData.name);
            data.append('username', formData.username);
            data.append('password', formData.password);
            data.append('mobile_number', formData.mobile_number);
            data.append('role', formData.role);
            data.append('birthday', formData.birthday);
            data.append('team_id', teamId);
            if (image) {
                data.append('image', image);
            }

            await axios.post('http://localhost:5000/api/players/register', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
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
                            <p>You have officially joined the team roster. You can now login with your username and password to view the tournament feeds!</p>
                            <button onClick={() => navigate('/login')} className="submit-btn" style={{ marginTop: '2rem' }}>
                                Go to Team Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="form-layout">
                            {error && <div className="error-message">{error}</div>}

                            {/* Premium Photo Upload UI */}
                            <div className="image-upload-container">
                                <label style={{ marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>Athlete Profile Photo</label>
                                <label className="image-upload-wrapper">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                        style={{ display: 'none' }}
                                    />
                                    <div className="image-view-placeholder" style={{ borderRadius: '24px' }}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Player Preview" className="image-preview" />
                                        ) : (
                                            <div className="upload-icon-box">
                                                <span className="upload-icon" style={{ fontSize: '2.5rem' }}>🏏</span>
                                                <span className="upload-text">Upload Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="upload-overlay" style={{ borderRadius: '24px' }}>
                                        <span>📸</span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-row">
                                <div className="input-group">
                                    <label>Full Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="M. Perera" />
                                </div>
                                <div className="input-group">
                                    <label>Mobile Number *</label>
                                    <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} required placeholder="07xxxxxxx" />
                                </div>
                            </div>

                            <div className="auth-credentials-section glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                                <div className="input-group">
                                    <label>Login Username *</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="cricketer_07" />
                                </div>

                                <div className="input-group">
                                    <label>Login Password *</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                                </div>
                            </div>

                            <div className="form-row">
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
                                    <label>Birthday (Optional)</label>
                                    <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} style={{ colorScheme: 'dark' }} />
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }} disabled={loading}>
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
