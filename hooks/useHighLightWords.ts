import {useEffect, useState, useMemo} from "react";
import {getDomainTags, getSpecificTags} from "../utils/common";

const useHighLightWords = () => {
    const [domainKeyWords, setDomainKeyWords] = useState([]);
    const [specificWords, setSpecificWords] = useState([]);

    useEffect(() => {
        // 初始加载数据
        getSpecificTags().then((res: string[]) => {
            setSpecificWords(res);
        });
        
        getDomainTags().then((res: string[]) => {
            setDomainKeyWords((prev) => [...new Set(prev.concat(res))]);
        });

        // 监听storage变化
        const handleStorageChanges = (changes) => {
            if (changes.specificHighlightWords) {
                setSpecificWords(changes.specificHighlightWords.newValue);
            }
            if (changes.highlightWordsByDescriptions) {
                setDomainKeyWords((prev) => [...new Set(prev.concat(changes.highlightWordsByDescriptions.newValue))]);
            }
        };

        // 添加监听器
        chrome.storage.onChanged.addListener(handleStorageChanges);
        
        // 清理函数移除监听器
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChanges);
        };
    }, []);

    // 使用useMemo稳定数组引用
    const memoizedDomainKeyWords = useMemo(() => domainKeyWords, [domainKeyWords]);
    const memoizedSpecificWords = useMemo(() => specificWords, [specificWords]);
    
    return [memoizedDomainKeyWords, memoizedSpecificWords];
}

export default useHighLightWords;
