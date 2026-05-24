import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import myAxios from '../Redux/myAxios';
import Loading from './Loading';
import SpecialFooter from './SpecialFooter';

export default function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: email, 2: otp+newpass
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRef = useRef();
    const newPassRef = useRef();
    const confirmPassRef = useRef();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
            toast.error('Please enter a valid email');
            return;
        }
        setLoading(true);
        try {
            const res = await myAxios.post('/user/forgot-password', { email: email.trim() });
            setLoading(false);
            if (res.data.status === 200) {
                toast.success('OTP sent to your email');
                setStep(2);
                setResendTimer(60);
                const interval = setInterval(() => {
                    setResendTimer(prev => {
                        if (prev <= 1) { clearInterval(interval); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(res.data.msg);
            }
        } catch {
            setLoading(false);
            toast.error('Something went wrong');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const otp = otpRef.current.value.trim();
        const newPassword = newPassRef.current.value;
        const confirmPassword = confirmPassRef.current.value;

        if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

        setLoading(true);
        try {
            const res = await myAxios.post('/user/reset-password', { email, otp, newPassword });
            setLoading(false);
            if (res.data.status === 200) {
                toast.success('Password reset successfully! Please login.');
                navigate('/login');
            } else {
                toast.error(res.data.msg);
            }
        } catch {
            setLoading(false);
            toast.error('Something went wrong');
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const res = await myAxios.post('/user/forgot-password', { email });
            setLoading(false);
            if (res.data.status === 200) {
                toast.success('OTP resent');
                setResendTimer(60);
                const interval = setInterval(() => {
                    setResendTimer(prev => {
                        if (prev <= 1) { clearInterval(interval); return 0; }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(res.data.msg);
            }
        } catch {
            setLoading(false);
            toast.error('Something went wrong');
        }
    };

    return (
        <>
            {loading && <Loading />}
            <div className="Signup">
                <div className="container">
                    <section style={{ justifyContent: 'center' }}>
                        <div className="signupForm">
                            <div className="signupHeader">
                                {step === 1 ? 'Forgot Password' : 'Reset Password'}
                            </div>

                            {step === 1 ? (
                                <form onSubmit={handleSendOtp}>
                                    <div className="inputs">
                                        <div className="form-section">
                                            <label htmlFor="email">Email Address</label>
                                            <input
                                                type="text"
                                                id="email"
                                                placeholder="Enter your registered email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit">Send OTP</button>
                                    <div className="signupSection" style={{ marginTop: '12px' }}>
                                        <span>Remember your password?</span>
                                        <a href="/login"><button type="button">Sign In</button></a>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPassword}>
                                    <p style={{ color: '#555', marginBottom: '16px', textAlign: 'center' }}>
                                        OTP sent to <strong>{email}</strong>
                                    </p>
                                    <div className="inputs">
                                        <div className="form-section">
                                            <label htmlFor="otp">OTP Code</label>
                                            <input
                                                ref={otpRef}
                                                type="text"
                                                id="otp"
                                                placeholder="Enter 6-digit OTP"
                                                maxLength={6}
                                                style={{ letterSpacing: '6px', fontSize: '22px', textAlign: 'center' }}
                                            />
                                        </div>
                                        <div className="form-section">
                                            <label htmlFor="newPass">New Password</label>
                                            <input
                                                ref={newPassRef}
                                                type="password"
                                                id="newPass"
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                        <div className="form-section">
                                            <label htmlFor="confirmPass">Confirm Password</label>
                                            <input
                                                ref={confirmPassRef}
                                                type="password"
                                                id="confirmPass"
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>
                                    <button type="submit">Reset Password</button>
                                    <div className="signupSection" style={{ marginTop: '12px' }}>
                                        <span>Didn't receive OTP?</span>
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={resendTimer > 0}
                                            style={{ opacity: resendTimer > 0 ? 0.5 : 1, cursor: resendTimer > 0 ? 'not-allowed' : 'pointer' }}
                                        >
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </section>
                </div>
                <SpecialFooter />
            </div>
        </>
    );
}
