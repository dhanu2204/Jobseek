import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Payment.css'

const Payment = () => {
    const nav = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!user || !user.id) {
            alert("Please log in first!");
            nav('/login');
            return;
        }

        setLoading(true);
        try {
            // 1. Create a Razorpay Order on the Backend (Rs. 9.99 = 999 Paise)
            const orderRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 999 })
            });

            if (!orderRes.ok) {
                throw new Error("Failed to create order on server.");
            }

            const order = await orderRes.json(); // Gets { id, amount, currency }

            // 2. Configure the Razorpay Checkout Modal options
            const options = {
                key: "rzp_test_TAdwi8FwJuoxZZ", // Your test key ID
                amount: order.amount,
                currency: order.currency,
                name: "JobSeek Premium",
                description: "Upgrade to Unlock Unlimited Resume Builder, ATS Analyzer, and Voice Interviews",
                order_id: order.id,
                
                // Handler executes automatically once the payment succeeds
                handler: async function (response) {
                    try {
                        // 3. Send payment details to backend for verification
                        const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.id.toString()
                            })
                        });

                        if (verifyRes.ok) {
                            const updatedUser = await verifyRes.json();
                            // Save user with 'premium: true' to local storage
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                            alert("Payment Successful! Premium Access Enabled. ✨");
                            nav('/home');
                        } else {
                            alert("Payment verification failed. Please contact support.");
                        }
                    } catch (err) {
                        console.error("Verification error:", err);
                        alert("An error occurred during verification.");
                    }
                },
                prefill: {
                    name: user.name || "",
                    email: user.email || "",
                    contact: user.mobile || ""
                },
                theme: {
                    color: "#6366f1" // Matches your brand colors
                }
            };

            // 3. Open the checkout modal
            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Transaction initiation failed:", error);
            alert("Could not start payment. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-container">
            <nav className="navbar">
                <div className="nav-logo" onClick={() => nav('/home')} style={{ cursor: 'pointer' }}>
                    JobSeek<span className="brand-dot"></span>
                </div>
                <button onClick={() => nav('/home')} className="back-button">Back to Dashboard</button>
            </nav>
            <div className="payment-workspace">
                <div className="payment-card">
                    <div className="premium-badge">✨ PREMIUM PLAN</div>
                    <h2>Upgrade to JobSeek Premium</h2>
                    <p className="subtitle">Secure UPI, Cards, and Net Banking Checkout</p>
                    
                    <div className="price-tag">
                        <span className="amount">₹9.99</span>
                        <span className="period">/ one-time upgrade</span>
                    </div>

                    <div className="premium-perks-list">
                        <div className="perk-item">✓ Unlimited Resumes (Normally 100 limit)</div>
                        <div className="perk-item">✓ Unlimited ATS Analyzer scans (Normally 100 limit)</div>
                        <div className="perk-item">✓ Unlimited Voice Mock Interviews (Normally 100 limit)</div>
                        <div className="perk-item">✓ Priority AI processing response times</div>
                    </div>

                    <button 
                        type="button" 
                        onClick={handlePayment} 
                        className="pay-now-btn" 
                        disabled={loading}
                    >
                        {loading ? 'Initiating Secure Gateway...' : 'Upgrade Now 🚀'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
