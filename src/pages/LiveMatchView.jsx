import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import BattleLoader from '../components/BattleLoader';
import './LiveScoring.css'; 

const LiveMatchView = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [liveScore, setLiveScore] = useState(null);
    const [battingSquad, setBattingSquad] = useState([]);
    const [bowlingSquad, setBowlingSquad] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchMatchLive = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
            const matchData = res.data.match;
            setMatch(matchData);
            setLiveScore(matchData.live_score);

            if (matchData.live_score && battingSquad.length === 0) {
                // Initial fetch for teams - only once to avoid flickering
                try {
                    const batRes = await axios.get(`http://localhost:5000/api/players/team/${matchData.live_score.batting_team_id}`);
                    const bowlRes = await axios.get(`http://localhost:5000/api/players/team/${matchData.live_score.bowling_team_id}`);
                    
                    const orderedIds = matchData.live_score.batting_order || [];
                    const players = batRes.data.players || [];
                    const sortedBatting = orderedIds.length > 0 
                        ? orderedIds.map(id => players.find(p => String(p.id) === String(id))).filter(Boolean)
                        : players;

                    setBattingSquad(sortedBatting);
                    setBowlingSquad(bowlRes.data.players || []);
                } catch (e) { console.error("Squad sync fail", e); }
            }
            setLoading(false);
        } catch (err) {
            console.error("Sync failure:", err);
        }
    };

    useEffect(() => {
        fetchMatchLive();
        const interval = setInterval(fetchMatchLive, 5000); // Poll every 5 seconds for "live" feel
        return () => clearInterval(interval);
    }, [matchId]);

    if (loading || !liveScore) return <BattleLoader label="Connecting to Ground Feed..." />;

    const strikerId = liveScore?.striker_id;
    const nonStrikerId = liveScore?.non_striker_id;
    const striker = battingSquad.find(p => p.id && strikerId && String(p.id) === String(strikerId));
    const nonStriker = battingSquad.find(p => p.id && nonStrikerId && String(p.id) === String(nonStrikerId));
    const currentBowler = bowlingSquad.find(p => p.id && liveScore?.bowler_id && String(p.id) === String(liveScore?.bowler_id));
    
    const totalBalls = (liveScore.current_over * liveScore.balls_per_over) + liveScore.balls_in_over;
    const currentRR = totalBalls > 0 ? ((liveScore.total_runs / totalBalls) * liveScore.balls_per_over).toFixed(2) : "0.00";
    
    let requiredRR = null;
    if (liveScore.innings_number === 2 && liveScore.target_runs) {
        const remainingRuns = Math.max(0, liveScore.target_runs - liveScore.total_runs);
        const remainingBalls = (liveScore.total_overs * liveScore.balls_per_over) - totalBalls;
        requiredRR = remainingBalls > 0 ? ((remainingRuns / remainingBalls) * liveScore.balls_per_over).toFixed(2) : "0.00";
    }

    const getChartData = () => {
        if (!liveScore || !match) return [];
        const isInn1 = liveScore.innings_number === 1;
        const h1 = isInn1 ? liveScore.ball_history : (liveScore.innings1_history || []);
        const h2 = isInn1 ? [] : (liveScore.ball_history || []);

        const t1Id = String(match.team1_id);
        const t1Name = match.team1_name || 'Team 1';
        const t2Name = match.team2_name || 'Team 2';

        const inn1TeamId = isInn1 ? liveScore.batting_team_id : liveScore.innings1_team_id;
        const inn1Name = String(inn1TeamId) === t1Id ? t1Name : t2Name;
        const inn2Name = inn1Name === t1Name ? t2Name : t1Name;

        const maxBalls = Math.max(h1.length, h2.length);
        let data = [];
        let cum1 = 0;
        let cum2 = 0;

        for (let i = 0; i < maxBalls; i++) {
            if (h1[i]) cum1 += (h1[i].runs || 0) + (h1[i].extra ? 1 : 0);
            if (h2[i]) cum2 += (h2[i].runs || 0) + (h2[i].extra ? 1 : 0);

            data.push({
                ball: i + 1,
                inn1Score: i < h1.length ? cum1 : null,
                inn2Score: i < h2.length ? cum2 : null,
                inn1Team: inn1Name,
                inn2Team: inn2Name
            });
        }
        return data;
    };

    // Determine current inn names for Line Chart names
    const inn1TeamIdForLine = liveScore.innings_number === 1 ? liveScore.batting_team_id : liveScore.innings1_team_id;
    const inn1LineName = String(inn1TeamIdForLine) === String(match?.team1_id) ? match?.team1_name : match?.team2_name;
    const inn2LineName = inn1LineName === match?.team1_name ? match?.team2_name : match?.team1_name;

    return (
        <div className="live-scoring-page viewer-mode">
            <button className="back-home-btn" onClick={() => navigate(-1)}>← Exit Stadium</button>
            <header className="hero-scoreboard">
                <div className="match-identity">
                    <div className="team-pill">
                        {match?.team1_logo && <img src={match.team1_logo} alt="" className="pill-logo" />}
                        {match?.team1_name}
                    </div>
                    <div className="vs-badge">VS</div>
                    <div className="team-pill" style={{textAlign: 'right'}}>
                        {match?.team2_name}
                        {match?.team2_logo && <img src={match.team2_logo} alt="" className="pill-logo" />}
                    </div>
                </div>

                <div className="main-score-display">
                    <span className="score-runs">{liveScore.total_runs}</span>
                    <span className="score-wickets">/ {liveScore.total_wickets}</span>
                </div>

                <div className="mid-meta-row">
                    <div className="status-pill">{liveScore.innings_number === 1 ? 'INN 1' : 'INN 2'} - {liveScore.current_over}.{liveScore.balls_in_over} OVERS</div>
                    {liveScore.innings_number === 2 && <div className="target-pill">Target: {liveScore.target_runs}</div>}
                    <div className="status-pill" style={{borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8'}}>CRR: {currentRR}</div>
                    {requiredRR && <div className="target-pill" style={{borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)'}}>RRR: {requiredRR}</div>}
                </div>
            </header>

            <div className="battle-arena">
                <div className="battle-card glass-card">
                    <label className="card-label">Striker End</label>
                    {striker ? (
                        <>
                            <div className="player-name"><span className="striker-star">★</span>{striker.name}</div>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[striker.id]?.runs || 0}</span>
                                    <span className="stat-tag">Runs</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[striker.id]?.balls || 0}</span>
                                    <span className="stat-tag">Balls</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Awaiting Batter...</div>}
                </div>

                <div className="battle-card glass-card" style={{opacity: 0.8}}>
                    <label className="card-label">Partner End</label>
                    {nonStriker ? (
                        <>
                            <div className="player-name">{nonStriker.name}</div>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[nonStriker.id]?.runs || 0}</span>
                                    <span className="stat-tag">Runs</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[nonStriker.id]?.balls || 0}</span>
                                    <span className="stat-tag">Balls</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Awaiting Partner...</div>}
                </div>

                <div className="battle-card glass-card border-neon">
                    <label className="card-label">Current Bowler</label>
                    {currentBowler ? (
                        <>
                            <div className="player-name">{currentBowler.name}</div>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-val" style={{color: 'var(--neon-blue)'}}>{liveScore.player_stats?.[currentBowler.id]?.wickets || 0}</span>
                                    <span className="stat-tag">Wickets</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[currentBowler.id]?.runs_conceded || 0}</span>
                                    <span className="stat-tag">Runs Gives</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Next Bowler Readying...</div>}
                </div>
            </div>

            <div className="analytics-card glass-card" style={{maxWidth: '800px', margin: '0 auto'}}>
                <label className="card-label">Live Timeline (Recent Balls)</label>
                <div className="ball-timeline-grouped" style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'}}>
                    {liveScore.ball_history?.slice(-12).map((b, bi) => (
                        <div key={bi} className={`ball-pip r-${b.runs} ${b.is_wicket ? 'out' : ''}`} style={{margin: '0.5rem'}}>
                            {b.is_wicket ? 'W' : 
                                b.extra === 'wide' ? 'WD' : 
                                b.extra === 'no-ball' ? 'NB' : 
                                b.runs}
                        </div>
                    ))}
                </div>
            </div>
            
            {liveScore.innings_complete && (
                <div className="modal-overlay blur full-summary viewer-summary-overlay">
                    <div className="summary-card glass-card animate-pop viewer-summary-card">
                        <div className="summary-header">
                            <div>
                                <h1 className="gradient-text">{liveScore.innings_number === 1 ? 'First Innings Complete' : 'Match Concluded'}</h1>
                                <p>{match?.team1_name} vs {match?.team2_name}</p>
                            </div>
                            <div className="total-display">
                                <span className="runs" style={{ fontSize: '3rem' }}>{liveScore.total_runs}/{liveScore.total_wickets}</span>
                            </div>
                        </div>

                        {liveScore.innings_number === 2 && match?.winner_team_id && (
                            <div className="victory-banner glass-card" style={{ marginBottom: '2rem' }}>
                                <h2 style={{ color: 'var(--neon-green)', textAlign: 'center' }}>
                                    🏆 {match.match_summary?.replace(/Team A/gi, match.team1_name).replace(/Team B/gi, match.team2_name)}
                                </h2>
                            </div>
                        )}

                        <div className="summary-scroll-content">
                            {(() => {
                                const isInn1 = liveScore.innings_number === 1;
                                const t1Squad = isInn1 ? battingSquad : bowlingSquad;
                                const t2Squad = isInn1 ? bowlingSquad : battingSquad;
                                const t1Name = match?.team1_name || 'Team 1';
                                const t2Name = match?.team2_name || 'Team 2';

                                const combinedStats = {};
                                [liveScore.innings1_player_stats, liveScore.player_stats].forEach(ps => {
                                    if (!ps) return;
                                    Object.entries(ps).forEach(([pid, stats]) => {
                                        if (!combinedStats[pid]) combinedStats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 };
                                        combinedStats[pid].runs += (stats.runs || 0);
                                        combinedStats[pid].balls += (stats.balls || 0);
                                        combinedStats[pid].wickets += (stats.wickets || 0);
                                        combinedStats[pid].runs_conceded += (stats.runs_conceded || 0);
                                        combinedStats[pid].balls_bowled += (stats.balls_bowled || 0);
                                    });
                                });

                                const combinedWickets = [...(liveScore.innings1_wickets_list || []), ...(liveScore.wickets_list || [])].map(String);

                                const renderBatterRow = (p) => {
                                    const stats = combinedStats[p.id] || { runs: 0, balls: 0 };
                                    const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                                    const out = combinedWickets.includes(String(p.id));
                                    const isMatchMVP = String(match?.best_batsman_id) === String(p.id);

                                    return (
                                        <tr key={p.id} className={isMatchMVP ? 'mvp-row animate-glow' : ''}>
                                            <td>
                                                <div className="player-cell">
                                                    {p.name}
                                                    {isMatchMVP && <div className="badge-rack"><span className="mvp-badge">⚡ MVP</span></div>}
                                                </div>
                                            </td>
                                            <td className="bold">{stats.runs}</td>
                                            <td>{stats.balls}</td>
                                            <td className="dim-text">{sr}</td>
                                            <td><span className={`status-tag ${out ? 'out' : 'not-out'}`}>{out ? 'Out' : 'Not Out'}</span></td>
                                        </tr>
                                    );
                                };

                                const renderBowlerRow = (p) => {
                                    const stats = combinedStats[p.id] || { wickets: 0, runs_conceded: 0, balls_bowled: 0 };
                                    const econ = stats.balls_bowled > 0 ? ((stats.runs_conceded / stats.balls_bowled) * 6).toFixed(2) : "0.00";
                                    const isMatchMVP = String(match?.best_bowler_id) === String(p.id);

                                    return (
                                        <tr key={p.id} className={isMatchMVP ? 'mvp-row-bowler animate-glow-bowl' : ''}>
                                            <td>
                                                <div className="player-cell">
                                                    {p.name}
                                                    {isMatchMVP && <div className="badge-rack"><span className="mvp-badge bowl">🎯 MVP</span></div>}
                                                </div>
                                            </td>
                                            <td className="bold">{stats.wickets}</td>
                                            <td>{stats.runs_conceded}</td>
                                            <td className="dim-text">{econ}</td>
                                        </tr>
                                    );
                                };

                                return (
                                    <>
                                        <div className="scorecard-viz">
                                            <div className="viz-header-row">
                                                <h3>Match Batting Masterclass</h3>
                                            </div>
                                            <table className="summary-table master">
                                                <thead><tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>SR</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    <tr className="team-split-header"><td colSpan="5">{t1Name}</td></tr>
                                                    {t1Squad.map(renderBatterRow)}
                                                    <tr className="team-split-header"><td colSpan="5">{t2Name}</td></tr>
                                                    {t2Squad.map(renderBatterRow)}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="scorecard-viz">
                                            <div className="viz-header-row">
                                                <h3>Match Bowling Force</h3>
                                            </div>
                                            <table className="summary-table master">
                                                <thead><tr><th>Bowler</th><th>Wkts</th><th>Runs</th><th>Econ</th></tr></thead>
                                                <tbody>
                                                    <tr className="team-split-header"><td colSpan="4">{t1Name}</td></tr>
                                                    {t1Squad.map(renderBowlerRow)}
                                                    <tr className="team-split-header"><td colSpan="4">{t2Name}</td></tr>
                                                    {t2Squad.map(renderBowlerRow)}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="match-analytics-suite animate-slide-up">
                                <div className="chart-container glass-card">
                                    <h3 style={{ color: 'var(--neon-blue)', marginBottom: '1.5rem' }}>Battle Flow: Run Progression</h3>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={getChartData()}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="ball" stroke="#64748b" />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip
                                                    contentStyle={{ background: '#0d1117', border: '1px solid var(--neon-blue)', borderRadius: '12px' }}
                                                />
                                                <Legend verticalAlign="top" />
                                                <Line type="monotone" dataKey="inn1Score" name={inn1LineName} stroke="var(--neon-pink)" strokeWidth={3} dot={false} connectNulls />
                                                <Line type="monotone" dataKey="inn2Score" name={inn2LineName} stroke="var(--neon-blue)" strokeWidth={3} dot={false} connectNulls />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                            <button className="prime-action-btn" onClick={() => navigate('/live-matches')}>
                                Exit to Lobby
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveMatchView;
