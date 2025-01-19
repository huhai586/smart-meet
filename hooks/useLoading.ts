import {useEffect, useState} from "react";

const useLoading = () => {
    const [loading, setLoading] = useState(false);

    const handleLoading = (e) => {
        setLoading(e.detail.loading);
    }
    // 接收方
    useEffect(() => {
        window.addEventListener('global-loading-event', handleLoading);
        return () => {
            window.removeEventListener('global-loading-event', handleLoading);
        }
    }, []);
    return [loading]
};

export default useLoading;
