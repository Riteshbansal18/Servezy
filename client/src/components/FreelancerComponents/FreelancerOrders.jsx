import FreelancerMenu from './FreelancerMenu';
import noImage from '../../assets/Images/no-image.png';
import Slider from '../Slider';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { tokenExists } from '../../Redux/UserSlice';
import { getFreelancerOrders } from '../../Redux/FreelancerSlice';
import { toast } from 'react-toastify';
import Loading from '../Loading';
import { HiOutlineXCircle } from 'react-icons/hi';
import { AiOutlineCheckCircle, AiOutlinePlayCircle } from 'react-icons/ai';
import { MdOutlineFilterAltOff } from 'react-icons/md';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function FreelancerOrders() {
    const { id } = useParams();
    const { token } = useSelector(state => state.user);
    const { data } = useSelector(state => state.freelancer);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [displayOrders, setDisplayOrders] = useState([]);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        tokenExists(token, navigate, dispatch).then(d => (d == false || JSON.parse(localStorage.getItem('userInfo')).role !== 'freelancer' || JSON.parse(localStorage.getItem('userInfo'))._id !== id) && navigate('/login'));
    }, []);

    useEffect(() => {
        dispatch(getFreelancerOrders()).unwrap().then(res => {
            setTimeout(() => {
                setLoading(false);
                if (res.status === 200) {
                    setDisplayOrders(res.freelancerOrders);
                } else {
                    toast.error(res.msg);
                }
            }, 800);
        }).catch(() => {
            setLoading(false);
            toast.error('Could not load orders');
        });
    }, []);

    useEffect(() => {
        if (data?.freelancerOrders) {
            if (filter === 'All') {
                setDisplayOrders(data.freelancerOrders);
            } else {
                setDisplayOrders(data.freelancerOrders.filter(o => o.status === filter));
            }
        }
    }, [filter, data]);

    return (
        <>
            {loading && <Loading />}
            <div className="ClientOrders">
                <div className="container">
                    <div className="section">
                        <div className="orders-header">My Orders</div>
                        <div className="filterOrders">
                            <div className={filter === 'All' ? 'filter all active' : 'filter all'} onClick={() => setFilter('All')}>
                                <MdOutlineFilterAltOff /> All
                            </div>
                            <div className={filter === 'OnGoing' ? 'filter ongoing active' : 'filter ongoing'} onClick={() => setFilter('OnGoing')}>
                                <AiOutlinePlayCircle /> Ongoing
                            </div>
                            <div className={filter === 'Completed' ? 'filter completed active' : 'filter completed'} onClick={() => setFilter('Completed')}>
                                <AiOutlineCheckCircle /> Completed
                            </div>
                            <div className={filter === 'Cancelled' ? 'filter cancelled active' : 'filter cancelled'} onClick={() => setFilter('Cancelled')}>
                                <HiOutlineXCircle /> Cancelled
                            </div>
                        </div>
                        <div className="services">
                            {displayOrders && displayOrders.length !== 0 ? displayOrders.map(order => (
                                <div key={order._id} className="service">
                                    <div className="slider">
                                        <Slider images={order.serviceInfo.images.split('|')} />
                                    </div>
                                    <div className="serviceHeader">
                                        <img
                                            src={order.clientInfo.image === 'no-image.png' ? noImage : `${API_URL}/ProfilePic/${order.clientInfo.image}`}
                                            alt={order.clientInfo.username}
                                        />
                                        <span>{order.clientInfo.username}</span>
                                    </div>
                                    <div className="serviceBody">
                                        <p className="serviceTitle">
                                            {order.serviceInfo.title.length > 22 ? `${order.serviceInfo.title.slice(0, 22)}...` : order.serviceInfo.title}
                                        </p>
                                        <p className="serviceDescription">
                                            {order.serviceInfo.description.length > 100 ? `${order.serviceInfo.description.slice(0, 100)}...` : order.serviceInfo.description}
                                        </p>
                                        <div className="rating-more">
                                            <div className="rating">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                                                    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                                                </svg>
                                                <span>{order.serviceRating !== 0 ? order.serviceRating : 'Not Rated'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <hr />
                                    <div className="servicePrice">Price: {order.serviceInfo.price} $</div>
                                    <hr />
                                    <div className="serviceState">
                                        Status: {order.status === 'OnGoing'
                                            ? <span className="ongoing">OnGoing</span>
                                            : order.status === 'Cancelled'
                                                ? <span className="cancelled">Cancelled</span>
                                                : <span className="completed">Completed</span>}
                                    </div>
                                </div>
                            )) : (
                                <div className="noServices">No orders yet</div>
                            )}
                        </div>
                    </div>
                    <FreelancerMenu active="orders" />
                </div>
            </div>
        </>
    );
}
