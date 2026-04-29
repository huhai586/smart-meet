import {useEffect, useState, useMemo} from "react";
import {getDomainTags, getSpecificTags} from "../utils/common";
import { onConfigChanged } from "~/utils/appConfig";

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

        // 监听 appConfig 变化
        const unsubscribe = onConfigChanged((changes) => {
            if (changes.specificHighlightWords) {
                setSpecificWords(changes.specificHighlightWords.value);
            }
            if (changes.highlightWordsByDescriptions) {
                setDomainKeyWords((prev) => [...new Set(prev.concat(changes.highlightWordsByDescriptions.value))]);
            }
        });
        
        return unsubscribe;
    }, []);

    // 使用useMemo稳定数组引用
    const memoizedDomainKeyWords = useMemo(() => domainKeyWords, [domainKeyWords]);
    const memoizedSpecificWords = useMemo(() => specificWords, [specificWords]);
    
    return [memoizedDomainKeyWords, memoizedSpecificWords];
}

export default useHighLightWords;
