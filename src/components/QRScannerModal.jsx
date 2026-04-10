import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScannerModal.css';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    useEffect(() => {
        if (!isOpen) return;

        function onScanSuccessInternal(decodedText, decodedResult) {
            // Handle the scanned data
            console.log(`Code matched = ${decodedText}`, decodedResult);
            onScanSuccess(decodedText);
            // Stop scanning after success
            scanner.clear().catch(error => {
                console.error("Failed to clear scanner", error);
            });
        }

        function onScanFailure(error) {
            // This callback is called for every frame where no QR code is found.
            // console.warn(`Code scan error = ${error}`);
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        scanner.render(onScanSuccessInternal, onScanFailure);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear scanner on unmount", error);
            });
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="qr-modal-overlay">
            <div className="qr-modal-content glass-card">
                <div className="qr-modal-header">
                    <h2>Gate Check-In Scanner</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="qr-scanner-container">
                    <div id="reader"></div>
                </div>
                <div className="qr-modal-footer">
                    <p>Align the team's QR code within the frame to verify arrival.</p>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
