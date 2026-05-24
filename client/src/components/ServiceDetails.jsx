import { useNavigate, useParams } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux';
import { tokenExists } from '../Redux/UserSlice';
import { useEffect, useRef, useState } from 'react';
import { showService } from '../Redux/FreelancerSlice';
import { toast } from 'react-toastify';
import { makeTestimonial, orderInfo, serviceInfo, updateOrderStatus, createPaymentOrder, verifyPayment } from '../Redux/ClientSlice';
import FreelancerMenu from './FreelancerComponents/FreelancerMenu';
import Slider from './Slider';
import noImage from "../../src/assets/Images/no-image.png"
import ClientMenu from './ClientComponents/ClientMenu';
import Loading from './Loading';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "ws://localhost:8900";

export default function ServiceDetails({ type }) {
    const { id, serviceId } = useParams()
    const [loading, setLoading] = useState(true)
    const { token, avatar } = useSelector(state => state.user)
    const { data } = useSelector(type == 1 ? (state => state.freelancer) : (state => state.client))
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const testimonial = useRef()
    const [starNumber, setStarNumber] = useState(0)
    const [hoverStar, setHoverStar] = useState(undefined)
    const socket = useRef()

    // Connect socket and register user
    useEffect(() => {
        socket.current = io(SOCKET_URL)
        const userInfo = JSON.parse(localStorage.getItem('userInfo'))
        if (userInfo?._id) {
            socket.current.emit('addUser', userInfo._id)
        }
        return () => { socket.current.disconnect() }
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        let err = []
        if (parseInt(starNumber) < 1 || parseInt(starNumber) > 5 || isNaN(parseInt(starNumber))) {
            err.push('You should choose a star at least')
        }
        if (testimonial.current.value.length > 120 || !/^.*[a-zA-Z]+.*$/.test(testimonial.current.value)) {
            err.push('The testimonial should contain 120 caracters or less')
        }
        if (err.length != 0) {
            toast.error(
                <div>
                    {err.map((e, i) => <p key={i}>{e}</p>)}
                </div>
            );
        } else {
            setLoading(true)
            dispatch(makeTestimonial({ orderId: serviceId, text: testimonial.current.value.trim(), rating: starNumber })).unwrap().then(data => {
                setTimeout(() => {
                    setLoading(false)
                    if (data.status == 200) {
                        toast.success(data.msg)
                        navigate(`/dashboard/client/${id}/orders`)
                    } else if (data.status === 403) {
                        toast.error(data.msg)
                        navigate('/login')
                    } else if (data.status === 404) {
                        navigate('/404')
                    } else {
                        toast.error(data.msg)
                        fetchData()
                    }
                }, 1000);
            }).catch((rejectedValueOrSerializedError) => {
                setTimeout(() => {
                    setLoading(false)
                    toast.error(rejectedValueOrSerializedError)
                    fetchData()
                }, 1000);
            })
        }
    }

    const fetchData = () => {
        if (type == 1) {
            dispatch(showService(serviceId)).unwrap().then(data => {
                setTimeout(() => {
                    setLoading(false)
                    if (data.status == 404) { navigate('/404') }
                    if (data.status == 505) { toast.error(data.msg) }
                }, 1000);
            }).catch((rejectedValueOrSerializedError) => {
                setTimeout(() => {
                    setLoading(false)
                    toast.error(rejectedValueOrSerializedError)
                }, 1000);
            })
        }
        if (type == 2) {
            dispatch(serviceInfo(serviceId)).unwrap().then(data => {
                setTimeout(() => {
                    setLoading(false)
                    if (data.status == 404) { navigate('/404') }
                    if (data.status == 505) { toast.error(data.msg) }
                }, 1000);
            }).catch((rejectedValueOrSerializedError) => {
                setTimeout(() => {
                    setLoading(false)
                    toast.error(rejectedValueOrSerializedError)
                }, 1000);
            })
        }
        if (type == 3) {
            dispatch(orderInfo(serviceId)).unwrap().then(data => {
                setTimeout(() => {
                    setLoading(false)
                    if (data.status == 404) { navigate('/404') }
                    if (data.status == 505) { toast.error(data.msg) }
                }, 1000);
            }).catch((rejectedValueOrSerializedError) => {
                setTimeout(() => {
                    setLoading(false)
                    toast.error(rejectedValueOrSerializedError)
                }, 1000);
            })
        }
    }

    useEffect(() => {
        tokenExists(token, navigate, dispatch).then(data => {
            if (data === false) { navigate("/login"); return; }
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo || userInfo._id !== id) { navigate("/login"); }
        })
        fetchData()
    }, [])

    const handleOrder = () => {
        setLoading(true)
        dispatch(createPaymentOrder(serviceId)).unwrap().then(payData => {
            setLoading(false)
            if (!payData) { toast.error('Could not connect to server'); return; }
            if (payData.status === 400) { toast.info(payData.msg); return; }
            if (payData.status === 403) { toast.error(payData.msg); navigate('/login'); return; }
            if (payData.status === 404) { toast.error(payData.msg); return; }
            if (payData.status === 505) { toast.error(payData.msg); return; }
            if (payData.status !== 200) { toast.error(payData.msg || 'Payment init failed'); return; }

            // Load Razorpay script dynamically
            const existingScript = document.getElementById('razorpay-script')
            if (existingScript) existingScript.remove()

            const script = document.createElement('script')
            script.id = 'razorpay-script'
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => {
                const options = {
                    key: payData.keyId,
                    amount: payData.amount,
                    currency: payData.currency,
                    name: 'Servezy',
                    description: payData.serviceTitle,
                    order_id: payData.razorpayOrderId,
                    handler: function (response) {
                        setLoading(true)
                        dispatch(verifyPayment({
                            serviceId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        })).unwrap().then(verifyData => {
                            setLoading(false)
                            if (!verifyData) { toast.error('Verification failed'); return; }
                            if (verifyData.status === 200) {
                                toast.success('Payment successful! Order placed.')
                                if (socket.current && window.__serviceOwnerUserId) {
                                    const userInfo = JSON.parse(localStorage.getItem('userInfo'))
                                    socket.current.emit('sendOrderNotification', {
                                        freelancerId: window.__serviceOwnerUserId,
                                        clientName: userInfo?.username || userInfo?.fullName || 'A client',
                                        serviceTitle: window.__serviceTitle || 'your service',
                                    })
                                }
                                navigate(`/dashboard/client/${id}/orders`)
                            } else {
                                toast.error(verifyData.msg || 'Payment verification failed')
                            }
                        }).catch((err) => {
                            setLoading(false)
                            toast.error('Payment verification failed: ' + (err || ''))
                        })
                    },
                    prefill: {
                        name: JSON.parse(localStorage.getItem('userInfo'))?.fullName || '',
                        email: JSON.parse(localStorage.getItem('userInfo'))?.email || '',
                    },
                    theme: { color: '#10B981' },
                    modal: {
                        ondismiss: () => { toast.info('Payment cancelled') }
                    }
                }
                const rzp = new window.Razorpay(options)
                rzp.open()
            }
            script.onerror = () => {
                setLoading(false)
                toast.error('Failed to load payment gateway. Check your internet connection.')
            }
            document.body.appendChild(script)
        }).catch((err) => {
            setLoading(false)
            toast.error('Could not initiate payment: ' + (err || 'Unknown error'))
        })
    }

    const handleUpdate = (e) => {
        setLoading(true)
        const status = e.target.name
        dispatch(updateOrderStatus({ orderId: serviceId, status })).unwrap().then(data => {
            setTimeout(() => {
                setLoading(false)
                if (data.status == 200) {
                    toast.success(data.msg)
                    navigate(`/dashboard/client/${id}/orders`)
                }
                else if (data.status == 400) {
                    toast.error(data.msg)
                    fetchData()
                }
                else if (data.status == 403) {
                    toast.error(data.msg)
                    navigate('/login')
                }
                else if (data.status == 404) {
                    toast.error(data.msg)
                    navigate('/404')
                }
                else {
                    toast.error(data.msg)
                    fetchData()
                }
            }, 1000);
        }).catch((rejectedValueOrSerializedError) => {
            setTimeout(() => {
                setLoading(false)
                toast.error(rejectedValueOrSerializedError)
                fetchData()
            }, 1000);
        })
    }

    // Store service owner info for socket notification
    useEffect(() => {
        if (data?.selectedService?.userId) {
            const ownerId = typeof data.selectedService.userId === 'object'
                ? data.selectedService.userId._id
                : data.selectedService.userId
            window.__serviceOwnerUserId = ownerId
            window.__serviceTitle = data.selectedService.title
        }
    }, [data])

    return (
        <>
            {loading && <Loading />}
            <div className='ServiceDetail'>
                <div className="container">
                    <div className="section">
                        {
                            type == 1 || type == 2 ?
                                <>
                                    {
                                        data?.selectedService &&
                                        <>
                                            <div className="mySwiperContainer">
                                                <Slider images={data.selectedService.images.split('|')} />
                                            </div>
                                            <div className="service-title">
                                                {data.selectedService.title}
                                            </div>
                                            {/* Category & Delivery Time badges */}
                                            <div className="service-meta-badges">
                                                {data.selectedService.category && (
                                                    <span className="badge badge-category">
                                                        {data.selectedService.category}
                                                    </span>
                                                )}
                                                {data.selectedService.deliveryTime && (
                                                    <span className="badge badge-delivery">
                                                        ? {data.selectedService.deliveryTime} day{data.selectedService.deliveryTime > 1 ? 's' : ''} delivery
                                                    </span>
                                                )}
                                            </div>
                                            <div className="service-description">
                                                {data.selectedService.description.split('\n').map((line, i) =>
                                                    <p key={i}>{line}</p>
                                                )}
                                            </div>
                                            {type == 1 ?
                                                <div className="service-price">
                                                    Price: ₹{data.selectedService.price}
                                                </div>
                                                :
                                                <div className="service-price-provider">
                                                    <div className="price">
                                                        Price ₹{data.selectedService.price}
                                                    </div>
                                                    <div className="provider">
                                                        <span>Service Provided By</span>
                                                        <img
                                                            loading="lazy"
                                                            src={data.selectedService.userId.image === 'no-image.png' ? noImage : `${API_URL}/ProfilePic/${data.selectedService.userId.image}`}
                                                            alt="Profile"
                                                        />
                                                    </div>
                                                </div>
                                            }
                                            {type == 1 ?
                                                <HashLink className="go-back-button" to={`/dashboard/freelancer/${id}/services`}><button>Go Back</button></HashLink>
                                                :
                                                type == 2 &&
                                                <>
                                                    <div className="bottom-buttons">
                                                        <HashLink className="go-back-button" to={`/dashboard/client/${id}/services`}><button>Go Back</button></HashLink>
                                                        <button onClick={handleOrder}>Pay & Order 💳</button>
                                                    </div>
                                                </>
                                            }
                                        </>
                                    }
                                </>
                                : data?.clientOrderInfo &&
                                <>
                                    <div className="mySwiperContainer">
                                        <Slider images={data.clientOrderInfo.serviceInfo.images.split('|')} />
                                    </div>
                                    <div className="service-title">
                                        {data.clientOrderInfo.serviceInfo.title}
                                    </div>
                                    {/* Category & Delivery Time badges */}
                                    <div className="service-meta-badges">
                                        {data.clientOrderInfo.serviceInfo.category && (
                                            <span className="badge badge-category">
                                                {data.clientOrderInfo.serviceInfo.category}
                                            </span>
                                        )}
                                        {data.clientOrderInfo.serviceInfo.deliveryTime && (
                                            <span className="badge badge-delivery">
                                                ? {data.clientOrderInfo.serviceInfo.deliveryTime} day{data.clientOrderInfo.serviceInfo.deliveryTime > 1 ? 's' : ''} delivery
                                            </span>
                                        )}
                                    </div>
                                    <div className="service-description">
                                        {data.clientOrderInfo.serviceInfo.description.split('\n').map((line, i) =>
                                            <p key={i}>{line}</p>
                                        )}
                                    </div>
                                    <div className="service-price-provider">
                                        <div className="price">
                                            Price ₹{data.clientOrderInfo.serviceInfo.price}
                                        </div>
                                        <div className="provider">
                                            <span>Service Provided By</span>
                                            <img
                                                loading="lazy"
                                                src={data.clientOrderInfo.serviceUserInfo.image === 'no-image.png' ? noImage : `${API_URL}/ProfilePic/${data.clientOrderInfo.serviceUserInfo.image}`}
                                                alt="Profile"
                                            />
                                        </div>
                                    </div>
                                    {
                                        data.clientOrderInfo.status == 'OnGoing' ?
                                            <div className="bottom-buttons">
                                                <HashLink className="go-back-button" to={`/dashboard/client/${id}/orders`}><button>Go Back</button></HashLink>
                                                <button className='completed' name='Completed' onClick={e => handleUpdate(e)}>Completed</button>
                                                <button className='cancelled' name='Cancelled' onClick={e => handleUpdate(e)}>Cancelled</button>
                                            </div>
                                            :
                                            (data.clientOrderInfo.status == 'Completed' || data.clientOrderInfo.status == 'Cancelled') &&
                                            <>
                                                <div className="testimonialForm">
                                                    <form onSubmit={e => handleSubmit(e)}>
                                                        <img loading="lazy" src={avatar === 'no-image.png' ? noImage : `${API_URL}/ProfilePic/${avatar}`} alt="Profile" />
                                                        <div className="form-input">
                                                            <div className="testimonialHeader">
                                                                Add Testimonial
                                                            </div>
                                                            <div className="stars">
                                                                {Array(5).fill().map((_, index) =>
                                                                    starNumber >= index + 1 || hoverStar >= index + 1 ?
                                                                        <AiFillStar
                                                                            key={index}
                                                                            style={{ color: "var(--color-orange)", width: '30px', height: '30px', cursor: 'pointer' }}
                                                                            onMouseOver={() => !starNumber && setHoverStar(index + 1)}
                                                                            onMouseLeave={() => setHoverStar(undefined)}
                                                                            onClick={() => setStarNumber(index + 1)} />
                                                                        :
                                                                        <AiOutlineStar
                                                                            key={index}
                                                                            style={{ color: "var(--color-orange)", width: '30px', height: '30px', cursor: 'pointer' }}
                                                                            onMouseOver={() => !starNumber && setHoverStar(index + 1)}
                                                                            onMouseLeave={() => setHoverStar(undefined)}
                                                                            onClick={() => setStarNumber(index + 1)} />
                                                                )}
                                                            </div>
                                                            <textarea name="testtimonialText" ref={testimonial} placeholder='Write your opinion about the service' id="testtimonialText" maxLength={130}></textarea>
                                                            <button>Send</button>
                                                        </div>
                                                    </form>
                                                </div>
                                                <div className="bottom-buttons">
                                                    <HashLink className="go-back-button" to={`/dashboard/client/${id}/orders`}><button>Go Back</button></HashLink>
                                                    <div className={data.clientOrderInfo.status == "Completed" ? "statusCompleted" : "statusCancelled"}>{data.clientOrderInfo.status}</div>
                                                </div>
                                            </>
                                    }
                                </>
                        }
                    </div>
                    {type == 1 ?
                        <FreelancerMenu active="services" />
                        :
                        <ClientMenu active="freelancers" />
                    }
                </div>
            </div>
        </>
    )
}
