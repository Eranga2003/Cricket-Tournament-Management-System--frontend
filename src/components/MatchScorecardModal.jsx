import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './MatchScorecardModal.css';

const MatchScorecardModal = ({ report, players = {}, onClose }) => {
    if (!report) return null;

    const { match_details, innings1, innings2, summary, winner_team_id, best_batsman_id, best_bowler_id } = report;

    const t1Name = match_details?.team1_name || 'Team 1';
    const t2Name = match_details?.team2_name || 'Team 2';
    const t1Logo = match_details?.team1_logo;
    const t2Logo = match_details?.team2_logo;

    const isTeam1Winner = String(winner_team_id) === String(match_details?.team1_id);
    const winnerLogo = isTeam1Winner ? t1Logo : t2Logo;

    // --- DATA POOLING (LiveScoring Style) ---
    const combinedStats = {};
    [innings1?.player_stats, innings2?.player_stats].forEach(ps => {
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

    const combinedWickets = [...(innings1?.wickets_list || []), ...(innings2?.wickets_list || [])].map(String);

    // Identify Champion's Best performers
    let winnerMaxRuns = -1;
    let winnerBestBatterId = null;
    let winnerMaxWkts = -1;
    let winnerBestBowlerId = null;

    const findWinnerBest = (inn) => {
        if (!inn?.player_stats) return;
        Object.keys(inn.player_stats).forEach(pid => {
            const s = combinedStats[pid] || { runs: 0, wickets: 0 };
            if (s.runs > winnerMaxRuns) { winnerMaxRuns = s.runs; winnerBestBatterId = pid; }
            if (s.wickets > winnerMaxWkts) { winnerMaxWkts = s.wickets; winnerBestBowlerId = pid; }
        });
    };

    if (isTeam1Winner) findWinnerBest(innings1);
    else findWinnerBest(innings2);

    // --- CHART DATA PROCESSING (LiveScoring Style) ---
    const prepareChartData = () => {
        const data = [];
        const h1 = innings1?.ball_history || [];
        const h2 = innings2?.ball_history || [];
        const maxBalls = Math.max(h1.length, h2.length);

        for (let i = 0; i < maxBalls; i++) {
            data.push({
                ball: i + 1,
                inn1Score: i < h1.length ? h1[i].total_score : (i >= h1.length ? h1[h1.length - 1]?.total_score : null),
                inn2Score: i < h2.length ? h2[i].total_score : null
            });
        }
        return data;
    };

    const chartData = prepareChartData();

    // --- ROW RENDERERS (LiveScoring Style) ---
    const renderBatterRow = (pid) => {
        const stats = combinedStats[pid] || { runs: 0, balls: 0 };
        if (stats.runs === 0 && stats.balls === 0) return null;

        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
        const isOut = combinedWickets.includes(String(pid));
        const pName = players[pid]?.name || `Player ${pid.slice(-4)}`;

        const isMatchMVP = String(best_batsman_id) === String(pid);
        const isWinnerMVP = String(winnerBestBatterId) === String(pid);

        return (
            <tr key={`bat-${pid}`} className={isMatchMVP ? 'mvp-row' : ''}>
                <td>
                    <div className="player-cell">
                        {pName}
                        <div className="badge-rack">
                            {isMatchMVP && <span className="mvp-badge">⚡ MVP</span>}
                            {isWinnerMVP && <span className="mvp-badge champion">🏆 CHAMPION'S BEST</span>}
                        </div>
                    </div>
                </td>
                <td className="bold">{stats.runs}</td>
                <td>{stats.balls}</td>
                <td>{sr}</td>
                <td><span className={`status-tag ${isOut ? 'out' : 'not-out'}`}>{isOut ? 'Out' : 'Not Out'}</span></td>
            </tr>
        );
    };

    const renderBowlerRow = (pid) => {
        const stats = combinedStats[pid] || { wickets: 0, runs_conceded: 0, balls_bowled: 0 };
        if (stats.balls_bowled === 0) return null;

        const econ = ((stats.runs_conceded / stats.balls_bowled) * 6).toFixed(2);
        const pName = players[pid]?.name || `Bowler ${pid.slice(-4)}`;

        const isMatchMVP = String(best_bowler_id) === String(pid);
        const isWinnerMVP = String(winnerBestBowlerId) === String(pid);

        return (
            <tr key={`bowl-${pid}`} className={isMatchMVP ? 'mvp-row-bowler' : ''}>
                <td>
                    <div className="player-cell">
                        {pName}
                        <div className="badge-rack">
                            {isMatchMVP && <span className="mvp-badge bowl">🎯 MVP</span>}
                            {isWinnerMVP && <span className="mvp-badge champion bowl">🏆 CHAMPION'S BEST</span>}
                        </div>
                    </div>
                </td>
                <td className="bold">{stats.wickets}</td>
                <td>{stats.runs_conceded}</td>
                <td>{econ}</td>
            </tr>
        );
    };

    return (
        <div className="scorecard-modal-overlay" onClick={onClose}>
            <div className="scorecard-modal-content" onClick={e => e.stopPropagation()}>
                <header className="scorecard-modal-header">
                    <div className="header-match-titles">
                        <h2>Match Concluded</h2>
                        <p>{t1Name} vs {t2Name}</p>
                    </div>
                    <div className="score-badge-header">
                        <div className="team-total">
                            <span className="n">{t1Name}</span>
                            <span className="s">{innings1?.total_runs}/{innings1?.total_wickets}</span>
                        </div>
                        <div className="score-divider">VS</div>
                        <div className="team-total">
                            <span className="s">{innings2?.total_runs}/{innings2?.total_wickets}</span>
                            <span className="n">{t2Name}</span>
                        </div>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>&times;</button>
                </header>

                <div className="scorecard-scroll-area">
                    <div className="victory-banner">
                        <div className="winner-logo-nexus">
                            {winnerLogo ? (
                                <img src={winnerLogo} alt="Winner" className="winner-stadium-logo" />
                            ) : (
                                <div className="winner-stadium-logo placeholder">🏆</div>
                            )}
                        </div>
                        <h2>🏆 {summary}</h2>
                    </div>

                    <div className="scorecard-viz">
                        <div className="viz-header-row">
                            <h3>Match Batting Masterclass</h3>
                        </div>
                        <table className="summary-table master">
                            <thead><tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>SR</th><th>Status</th></tr></thead>
                            <tbody>
                                <tr className="team-split-header"><td colSpan="5">{t1Name}</td></tr>
                                {Object.keys(innings1?.player_stats || {}).map(renderBatterRow)}
                                <tr className="team-split-header"><td colSpan="5">{t2Name}</td></tr>
                                {Object.keys(innings2?.player_stats || {}).map(renderBatterRow)}
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
                                {Object.keys(innings1?.player_stats || {}).map(renderBowlerRow)}
                                <tr className="team-split-header"><td colSpan="4">{t2Name}</td></tr>
                                {Object.keys(innings2?.player_stats || {}).map(renderBowlerRow)}
                            </tbody>
                        </table>
                    </div>

                    <div className="analytics-section">
                        <h3>Battle Flow: Run Progression</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="ball" stroke="#64748b" />
                                    <YAxis stroke="#64748b" />
                                    <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid var(--neon-blue)', borderRadius: '12px' }} />
                                    <Legend verticalAlign="top" />
                                    <Line type="monotone" dataKey="inn1Score" name={t1Name} stroke="var(--neon-pink)" strokeWidth={3} dot={false} connectNulls />
                                    <Line type="monotone" dataKey="inn2Score" name={t2Name} stroke="var(--neon-blue)" strokeWidth={3} dot={false} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <footer className="scorecard-footer-buttons">
                    <button className="finish-return-btn" onClick={onClose}>
                        FINISH MATCH & RETURN
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default MatchScorecardModal;
