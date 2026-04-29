import {useEffect, useState, useMemo} from "react";
import {getDomain} from "../utils/common";
import { onConfigChanged } from "~/utils/appConfig";

const useDomain = () => {
    const [domain, setDomain] = useState('');

    useEffect(() => {
        // 初始加载数据
        getDomain().then((res: string) => {
            setDomain(res);
        });

        // 监听 appConfig 变化
        const unsubscribe = onConfigChanged((changes) => {
            if (changes.domain) {
                setDomain(changes.domain.value);
            }
        });
        
        return unsubscribe;
    }, []);

    // 使用useMemo稳定字符串引用 (虽然基本类型不需要，但保持一致性)
    const memoizedDomain = useMemo(() => domain, [domain]);
    
    return [memoizedDomain];
};

export default useDomain;
