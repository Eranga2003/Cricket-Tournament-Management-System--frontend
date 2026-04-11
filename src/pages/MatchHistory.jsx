import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MatchHistory.css';
import BattleLoader from '../components/BattleLoader';

const MatchHistory = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/scoring/reports');
                const fetchedReports = res.data.reports || [];
                setReports(fetchedReports);
                
                // Collect all MVP IDs to fetch player details
                const mvpIds = new Set();
                fetchedReports.forEach(r => {
                    if (r.mvps?.best_batsman_id) mvpIds.add(r.mvps.best_batsman_id);
                    if (r.mvps?.best_bowler_id) mvpIds.add(r.mvps.best_bowler_id);
                });

                // Fetch details for all MVPs
                const playerDetails = {};
                await Promise.all(Array.from(mvpIds).map(async (pid) => {
                    try {
                        const pRes = await axios.get(`http://localhost:5000/api/players/${pid}`);
                        playerDetails[pid] = pRes.data;
                    } catch (e) { console.error(`Failed to fetch player ${pid}`, e); }
                }));
                setPlayers(playerDetails);

                setLoading(false);
            } catch (err) {
                console.error("History fetch fail:", err);
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <BattleLoader label="Retrieving Historical Records..." />;

    return (
        <div className="match-history-page">
            <button className="back-home-btn" onClick={() => navigate(-1)}>← Back</button>
            <header className="history-header">
                <h1 className="gradient-text">Tournament History</h1>
                <p>Champions, MVPs, and Epic Battles</p>
            </header>

            <div className="history-feed">
                {reports.length === 0 ? (
                    <div className="empty-state glass-card" style={{padding: '3rem', textAlign: 'center'}}>
                        <h2 style={{color: '#64748b'}}>No matches archived yet.</h2>
                        <p>The field is ready for the first legends to be born.</p>
                    </div>
                ) : (
                    reports.map(report => {
                        const { match_details, mvps, summary, winner_team_id } = report;
                        const isTeam1Winner = String(winner_team_id) === String(match_details.team1_id);
                        const winnerName = isTeam1Winner ? match_details.team1_name : match_details.team2_name;
                        const winnerLogo = isTeam1Winner ? match_details.team1_logo : match_details.team2_logo;

                        const batter = players[mvps?.best_batsman_id];
                        const bowler = players[mvps?.best_bowler_id];

                        // Extract stats for MVPs from the report
                        const batterStats = (report.innings1?.player_stats?.[mvps.best_batsman_id] || report.innings2?.player_stats?.[mvps.best_batsman_id]) || { runs: 0, balls: 0 };
                        const bowlerStats = (report.innings1?.player_stats?.[mvps.best_bowler_id] || report.innings2?.player_stats?.[mvps.best_bowler_id]) || { wickets: 0, runs_conceded: 0, balls_bowled: 0 };
                        const econ = bowlerStats.balls_bowled > 0 ? ((bowlerStats.runs_conceded / bowlerStats.balls_bowled) * 6).toFixed(2) : "0.00";

                        return (
                            <div key={report.id} className="history-card glass-card animate-slide-up">
                                <div className="card-winner-header">
                                    <div className="winner-team-info">
                                        {winnerLogo ? (
                                            <img src={winnerLogo} alt={winnerName} className="winner-logo" />
                                        ) : (
                                            <div className="winner-logo placeholder">🏆</div>
                                        )}
                                        <div className="winner-name">{winnerName}</div>
                                        <div className="win-status" style={{fontSize: '0.8rem', letterSpacing: '3px', color: '#94a3b8', marginTop: '0.5rem'}}>OFFICIAL CHAMPIONS</div>
                                    </div>
                                </div>

                                <div className="card-match-summary">
                                    <p className="summary-text">"{summary}"</p>
                                </div>

                                <div className="mvp-section">
                                    <div className="mvp-card batter">
                                        <img src={batter?.image_url || 'https://via.placeholder.com/150'} alt={batter?.name} className="mvp-image" />
                                        <div className="mvp-info">
                                            <h4>Best Batsman</h4>
                                            <div className="mvp-name">{batter?.name || 'Top Scorer'}</div>
                                            <div className="mvp-stats">{batterStats.runs} Runs <span style={{color: '#64748b', fontSize: '0.8rem'}}>({batterStats.balls} balls)</span></div>
                                        </div>
                                    </div>

                                    <div className="mvp-card bowler">
                                        <img src={bowler?.image_url || 'https://via.placeholder.com/150'} alt={bowler?.name} className="mvp-image" />
                                        <div className="mvp-info">
                                            <h4>Best Bowler</h4>
                                            <div className="mvp-name">{bowler?.name || 'Top Wicket Taker'}</div>
                                            <div className="mvp-stats pink">{bowlerStats.wickets} Wkts <span style={{color: '#64748b', fontSize: '0.8rem'}}>for {bowlerStats.runs_conceded} (Econ: {econ})</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MatchHistory;
