import { Navigation, Pagination, A11y } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function Slider({ images }) {
    return (
        <Swiper
            className='swiper-container'
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={100}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
        >
            {images.map((imageSrc, i) => <SwiperSlide key={i}>
                <img src={`${API_URL}/ServicePic/${imageSrc}`} alt="Service" />
            </SwiperSlide>)}
        </Swiper>
    )
}
