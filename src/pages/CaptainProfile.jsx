import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CaptainProfile.css';

const CaptainProfile = () => {
    const { user, role, logout, token, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('personal'); // 'personal' or 'team'
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (token && role === 'captain') {
                    const res = await axios.get('http://localhost:5000/api/captains/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data) {
                        updateUser(res.data);
                    }
                }
            } catch (err) {
                console.error("Profile sync fail:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [token, role]);

    if (loading) return <div className="loading-screen" style={{ color: 'white' }}>Establishing Secure Connection...</div>;
    if (!user || role !== 'captain') {
        return <div className="loading-screen">Unauthorized access. Please login as a Captain.</div>;
    }

    const handleSwitch = () => {
        // Aesthetic delay for the "switch" feel
        setTimeout(() => {
            navigate('/team-profile');
        }, 300);
    };

    return (
        <div className="profile-page-container">
            <nav className="dashboard-nav">
                <div className="nav-brand gradient-text" onClick={() => navigate('/captain-home')} style={{ cursor: 'pointer' }}>
                    ← Dashboard
                </div>
                <div className="nav-actions">
                    <button className="logout-btn-minimal" onClick={logout}>Sign Out</button>
                </div>
            </nav>

            <div className="profile-content">
                <div className="profile-header-section">
                    <div className="profile-avatar-wrapper">
                        {user.profile_image_url ? (
                            <img src={user.profile_image_url} alt="Captain" className="profile-avatar-large" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="role-tag">Official Captain</div>
                    </div>
                    <h1 className="profile-name">{user.name}</h1>
                    <p className="profile-email">{user.email}</p>
                </div>

                <div className="profile-grid">
                    <div className="glass-card info-card">
                        <h3>Contact Information</h3>
                        <div className="info-item">
                            <span className="label">Mobile</span>
                            <span className="value">{user.mobile || 'Not Provided'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Status</span>
                            <span className="value text-green">Verified Account</span>
                        </div>
                    </div>

                    <div className="glass-card switch-card">
                        <h3>Profile Context</h3>
                        <p className="switch-desc">You are currently viewing your <strong>Personal Athlete Profile</strong>. Use the toggle below to manage your established Squad.</p>
                        
                        <div className="toggle-container" onClick={handleSwitch}>
                            <span className={`toggle-label ${viewMode === 'personal' ? 'active' : ''}`}>Me</span>
                            <div className="toggle-switch">
                                <div className="toggle-node"></div>
                            </div>
                            <span className="toggle-label">My Team</span>
                        </div>
                    </div>
                </div>

                <div className="career-summary glass-card">
                    <h3>Captaincy Overview</h3>
                    <div className="stats-mini-grid">
                        <div className="mini-stat">
                            <span className="stat-num">0</span>
                            <span className="stat-label">Tournaments Won</span>
                        </div>
                        <div className="mini-stat">
                            <span className="stat-num">0</span>
                            <span className="stat-label">Teams Managed</span>
                        </div>
                        <div className="mini-stat">
                            <span className="stat-num">100%</span>
                            <span className="stat-label">Reliability</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaptainProfile;
