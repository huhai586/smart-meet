import {useEffect, useState, useMemo} from "react";
import {getDomain} from "../utils/common";

const useDomain = () => {
    const [domain, setDomain] = useState('');

    useEffect(() => {
        // 初始加载数据
        getDomain().then((res: string) => {
            setDomain(res);
        });

        // 监听storage变化
        const handleStorageChanges = (changes) => {
            if (changes.domain) {
                setDomain(changes.domain.newValue);
            }
        };

        // 添加监听器
        chrome.storage.onChanged.addListener(handleStorageChanges);
        
        // 清理函数移除监听器
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChanges);
        };
    }, []);

    // 使用useMemo稳定字符串引用 (虽然基本类型不需要，但保持一致性)
    const memoizedDomain = useMemo(() => domain, [domain]);
    
    return [memoizedDomain];
};

export default useDomain;
