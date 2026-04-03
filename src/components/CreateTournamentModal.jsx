import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CreateTournamentModal.css';
import '../pages/OrganizerRegistration.css'; // Importing shared premium styles

const CreateTournamentModal = ({ onClose, onCreated }) => {
    const { token } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: '',
        date_time: '',
        location: '',
        registration_fee: 0,
        overs: 0,
        balls_per_over: 6,
        prize_1st: 0,
        prize_2nd: 0,
        prize_3rd: 0,
        contact_numbers: [],
        near_city: ''
    });

    const [imageFiles, setImageFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    // For array inputs to keep them as strings while typing
    const [arrayInputs, setArrayInputs] = useState({
        contact_numbers: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleArrayInputChange = (e) => {
        const { name, value } = e.target;
        setArrayInputs({ ...arrayInputs, [name]: value });
        const array = value.split(',').map(s => s.trim()).filter(s => s);
        setFormData({ ...formData, [name]: array });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + imageFiles.length > 5) {
            alert("Maximum 5 ground images allowed.");
            return;
        }

        const newFiles = [...imageFiles, ...files];
        setImageFiles(newFiles);

        // Generate previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews([...previews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const updatedFiles = [...imageFiles];
        updatedFiles.splice(index, 1);
        setImageFiles(updatedFiles);

        const updatedPreviews = [...previews];
        updatedPreviews.splice(index, 1);
        setPreviews(updatedPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            // Append standard fields
            Object.keys(formData).forEach(key => {
                if (Array.isArray(formData[key])) {
                    formData[key].forEach(val => data.append(`${key}[]`, val));
                } else {
                    data.append(key, formData[key]);
                }
            });

            // Append images
            imageFiles.forEach(file => {
                data.append('ground_images', file);
            });

            await axios.post('http://localhost:5000/api/tournaments/create', data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content glass-card tournament-modal">
                <h2>Organize New Tournament</h2>
                <p className="subtitle">Launch your event to the global community.</p>

                <form onSubmit={handleSubmit} className="form-layout modal-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-row">
                        <div className="input-group">
                            <label>Tournament Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Summer Cup 2026" />
                        </div>
                        <div className="input-group">
                            <label>Date & Time *</label>
                            <input type="datetime-local" name="date_time" value={formData.date_time} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Venue Location *</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="Stadium Name, Address" />
                        </div>
                        <div className="input-group">
                            <label>Nearest City (for Weather) *</label>
                            <input type="text" name="near_city" value={formData.near_city} onChange={handleChange} required placeholder="e.g. Colombo, Galle" />
                        </div>
                    </div>

                    <div className="form-row secondary-stats">
                        <div className="input-group">
                            <label>Fee</label>
                            <input type="number" name="registration_fee" value={formData.registration_fee} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Overs/Match</label>
                            <input type="number" name="overs" value={formData.overs} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Balls/Over</label>
                            <input type="number" name="balls_per_over" value={formData.balls_per_over} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row prize-row">
                        <div className="input-group">
                            <label>1st Prize</label>
                            <input type="number" name="prize_1st" value={formData.prize_1st} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>2nd Prize</label>
                            <input type="number" name="prize_2nd" value={formData.prize_2nd} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>3rd Prize</label>
                            <input type="number" name="prize_3rd" value={formData.prize_3rd} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Contact Numbers (comma separated)</label>
                        <input type="text" name="contact_numbers" value={arrayInputs.contact_numbers} onChange={handleArrayInputChange} placeholder="077xxxxxxx, 071xxxxxxx" />
                    </div>

                    {/* Premium Multi-Image Gallery Upload */}
                    <div className="input-group tournament-gallery-upload">
                        <label>Ground Images / Posters (Max 5)</label>
                        <div className="gallery-upload-grid">
                            {previews.map((preview, index) => (
                                <div key={index} className="gallery-item">
                                    <img src={preview} alt={`preview-${index}`} className="gallery-preview" />
                                    <button type="button" className="remove-img-btn" onClick={() => removeImage(index)}>×</button>
                                </div>
                            ))}
                            {previews.length < 5 && (
                                <label className="add-img-card">
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                    <span style={{ fontSize: '1.5rem' }}>+</span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Create Tournament'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTournamentModal;
