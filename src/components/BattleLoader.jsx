import React from 'react';

const BattleLoader = ({ label = "Synchronizing Match Data..." }) => {
    return (
        <div className="loading-container-full">
            <div className="battle-loader">
                <div className="loader-ring"></div>
                <div className="loader-ball"></div>
            </div>
            <div className="loading-text-glitch">
                {label}
            </div>
        </div>
    );
};

export default BattleLoader;
