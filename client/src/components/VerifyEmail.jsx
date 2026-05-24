import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { verifyOtp, resendOtp } from '../Redux/UserSlice';
import Loading from './Loading';
import SpecialFooter from './SpecialFooter';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const otpRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Countdown timer for resend button
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleVerify = (e) => {
        e.preventDefault();
        const otp = otpRef.current.value.trim();
        if (!otp || otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }
        setLoading(true);
        dispatch(verifyOtp({ email, otp })).unwrap().then(data => {
            setLoading(false);
            if (data.status === 200) {
                toast.success('Email verified! You can now log in.');
                navigate('/login');
            } else {
                toast.error(data.msg);
            }
        }).catch(() => {
            setLoading(false);
            toast.error('Something went wrong. Try again.');
        });
    };

    const handleResend = () => {
        if (resendTimer > 0) return;
        setLoading(true);
        dispatch(resendOtp({ email })).unwrap().then(data => {
            setLoading(false);
            if (data.status === 200) {
                toast.success('OTP resent to your email');
                setResendTimer(60);
            } else {
                toast.error(data.msg);
            }
        }).catch(() => {
            setLoading(false);
            toast.error('Something went wrong. Try again.');
        });
    };

    return (
        <>
            {loading && <Loading />}
            <div className="Signup">
                <div className="container">
                    <section style={{ justifyContent: 'center' }}>
                        <div className="signupForm">
                            <div className="signupHeader">Verify Your Email</div>
                            <p style={{ color: '#555', marginBottom: '16px', textAlign: 'center' }}>
                                We sent a 6-digit OTP to <strong>{email}</strong>.<br />
                                Enter it below to activate your account.
                            </p>
                            <form onSubmit={handleVerify}>
                                <div className="inputs">
                                    <div className="form-section">
                                        <label htmlFor="otp">OTP Code</label>
                                        <input
                                            ref={otpRef}
                                            type="text"
                                            id="otp"
                                            name="otp"
                                            placeholder="Enter 6-digit OTP"
                                            maxLength={6}
                                            style={{ letterSpacing: '6px', fontSize: '22px', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>
                                <button type="submit">Verify Email</button>
                            </form>
                            <div className="signupSection" style={{ marginTop: '12px' }}>
                                <span>Didn't receive the OTP?</span>
                                <button
                                    onClick={handleResend}
                                    disabled={resendTimer > 0}
                                    style={{
                                        marginLeft: '8px',
                                        opacity: resendTimer > 0 ? 0.5 : 1,
                                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
                <SpecialFooter />
            </div>
        </>
    );
}
