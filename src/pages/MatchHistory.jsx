import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MatchHistory.css';
import BattleLoader from '../components/BattleLoader';
import MatchScorecardModal from '../components/MatchScorecardModal';

const MatchHistory = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState({});
    const [teams, setTeams] = useState({});
    const [selectedReport, setSelectedReport] = useState(null);
    const navigate = useNavigate();

    const formatDate = (dateValue) => {
        if (!dateValue) return "Date Unknown";
        // Handle Firestore Timestamp object {_seconds: ..., _nanoseconds: ...}
        if (dateValue._seconds) {
            return new Date(dateValue._seconds * 1000).toLocaleDateString();
        }
        // Handle ISO strings or Date objects
        const d = new Date(dateValue);
        return isNaN(d) ? "Date Unknown" : d.toLocaleDateString();
    };

    const handleImageError = (e) => {
        e.target.onerror = null; 
        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
    };

    useEffect(() => {
        const fetchHistoryArr = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/scoring/reports');
                const fetchedReports = res.data.reports || [];
                setReports(fetchedReports);
                
                // Collect all necessary IDs for full enrichment (MVPs + Scorecard)
                const playerIds = new Set();
                const teamIds = new Set();
                fetchedReports.forEach(r => {
                    // Collect MVPs
                    if (r.mvps?.best_batsman_id) playerIds.add(r.mvps.best_batsman_id);
                    if (r.mvps?.best_bowler_id) playerIds.add(r.mvps.best_bowler_id);
                    
                    // Collect Team IDs
                    if (r.match_details?.team1_id) teamIds.add(r.match_details.team1_id);
                    if (r.match_details?.team2_id) teamIds.add(r.match_details.team2_id);

                    // Collect all players from Innings 1 stats
                    if (r.innings1?.player_stats) {
                        Object.keys(r.innings1.player_stats).forEach(pid => playerIds.add(pid));
                    }
                    // Collect all players from Innings 2 stats
                    if (r.innings2?.player_stats) {
                        Object.keys(r.innings2.player_stats).forEach(pid => playerIds.add(pid));
                    }
                });

                // Parallel fetch for Players
                const playerDetails = {};
                await Promise.all(Array.from(playerIds).map(async (pid) => {
                    if (!pid || pid === 'undefined') return;
                    try {
                        const pRes = await axios.get(`http://localhost:5000/api/players/${pid}`);
                        playerDetails[pid] = pRes.data;
                    } catch (e) { 
                        console.warn(`Player ${pid} not found`); 
                    }
                }));

                // Parallel fetch for Teams (Fallback for old reports)
                const teamDetails = {};
                await Promise.all(Array.from(teamIds).map(async (tid) => {
                    if (!tid || tid === 'undefined') return;
                    try {
                        const tRes = await axios.get(`http://localhost:5000/api/teams/${tid}`);
                        teamDetails[tid] = tRes.data.team;
                    } catch (e) { 
                        console.warn(`Team ${tid} not found`); 
                    }
                }));

                setPlayers(playerDetails);
                setTeams(teamDetails);
                setLoading(false);
            } catch (err) {
                console.error("History fetch fail:", err);
                setLoading(false);
            }
        };
        fetchHistoryArr();
    }, []);

    if (loading) return <BattleLoader label="Retrieving Historical Records..." />;

    return (
        <div className="match-history-page">
            <section className="history-hero">
                <button className="back-home-btn" onClick={() => navigate(-1)}>
                    <span>←</span> BACK
                </button>
                <h1 className="hero-title-main">Match Archive</h1>
                <p className="hero-subtitle">Legends & Epic Battles</p>
            </section>

            <div className="history-feed">
                {reports.length === 0 ? (
                    <div className="empty-state glass-card" style={{padding: '5rem', textAlign: 'center', borderRadius: '48px'}}>
                        <div style={{fontSize: '5rem', marginBottom: '2rem'}}>🏟️</div>
                        <h2 style={{color: '#94a3b8', fontSize: '2rem', fontWeight: '800'}}>The field is quiet...</h2>
                        <p style={{color: '#475569', letterSpacing: '2px'}}>No historical records found for this tournament yet.</p>
                    </div>
                ) : (
                    reports.map((report, index) => {
                        const { match_details, mvps, summary, winner_team_id } = report;
                        const isTeam1Winner = String(winner_team_id) === String(match_details.team1_id);
                        
                        const liveTeam1 = teams[match_details.team1_id];
                        const liveTeam2 = teams[match_details.team2_id];

                        const t1Name = match_details.team1_name || liveTeam1?.team_name || 'Team 1';
                        const t2Name = match_details.team2_name || liveTeam2?.team_name || 'Team 2';
                        const t1Logo = match_details.team1_logo || liveTeam1?.logo_url;
                        const t2Logo = match_details.team2_logo || liveTeam2?.logo_url;

                        const winnerName = isTeam1Winner ? t1Name : t2Name;
                        const winnerLogo = isTeam1Winner ? t1Logo : t2Logo;

                        const batter = players[mvps?.best_batsman_id];
                        const bowler = players[mvps?.best_bowler_id];

                        const batterStats = (report.innings1?.player_stats?.[mvps.best_batsman_id] || report.innings2?.player_stats?.[mvps.best_batsman_id]) || { runs: 0, balls: 0 };
                        const bowlerStats = (report.innings1?.player_stats?.[mvps.best_bowler_id] || report.innings2?.player_stats?.[mvps.best_bowler_id]) || { wickets: 0, runs_conceded: 0 };

                        return (
                            <div 
                                key={report.id || report.match_id} 
                                className="history-card glass-card animate-slide-up"
                                style={{animationDelay: `${index * 0.15}s`}}
                            >
                                <div className="card-winner-header">
                                    <div className="winner-nexus">
                                        {winnerLogo ? (
                                            <img src={winnerLogo} alt={winnerName} className="winner-logo-arc" onError={handleImageError} />
                                        ) : (
                                            <div className="winner-logo-placeholder">🏆</div>
                                        )}
                                    </div>
                                    <h2 className="winner-name-display">{winnerName}</h2>
                                    <div className="win-status">TOURNAMENT CHAMPIONS</div>
                                </div>

                                <div className="card-match-summary">
                                    <p className="summary-text-history">"{summary}"</p>
                                </div>

                                <div className="mvp-section-history">
                                    <div className="mvp-card-history batter">
                                        <div className="mvp-ring">
                                            <img src={batter?.image_url || 'https://via.placeholder.com/150'} alt={batter?.name} onError={handleImageError} />
                                        </div>
                                        <div className="mvp-details">
                                            <label>PLAYER OF THE MATCH / BATTER</label>
                                            <div className="name">{batter?.name || 'Top Scorer'}</div>
                                            <div className="stats">{batterStats.runs} Runs <small>({batterStats.balls}b)</small></div>
                                        </div>
                                    </div>

                                    <div className="mvp-card-history bowler">
                                        <div className="mvp-ring">
                                            <img src={bowler?.image_url || 'https://via.placeholder.com/150'} alt={bowler?.name} onError={handleImageError} />
                                        </div>
                                        <div className="mvp-details">
                                            <label>BEST BOWLING PERFORMANCE</label>
                                            <div className="name">{bowler?.name || 'Top Wicket Taker'}</div>
                                            <div className="stats pink">{bowlerStats.wickets} Wickets <small>for {bowlerStats.runs_conceded}</small></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer-history">
                                    <button className="view-summary-btn" onClick={() => setSelectedReport(report)}>
                                        📊 VIEW FULL SCORECARD
                                    </button>
                                    <span className="match-date-stamp">{formatDate(report.archived_at)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedReport && (
                <MatchScorecardModal 
                    report={selectedReport} 
                    players={players}
                    onClose={() => setSelectedReport(null)} 
                />
            )}
        </div>
    );
};

export default MatchHistory;
