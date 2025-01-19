import {useEffect, useState} from "react";
import {getDomainTags, getSpecificTags} from "../utils/common";

const useHighLightWords = () => {
    const [domainKeyWords, setDomainKeyWords] = useState([]);
    const [specificWords, setSpecificWords] = useState([]);

    useEffect(() => {
        getSpecificTags().then((res: string[]) => {
            setSpecificWords(res);
        });
        getDomainTags().then((res: string[]) => {
            setDomainKeyWords((prev) => [...new Set(prev.concat(res))]);
        });
    }, []);

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.specificHighlightWords) {
            setSpecificWords(changes.specificHighlightWords.newValue);
        }
        if (changes.highlightWordsByDescriptions) {
            setDomainKeyWords((prev) => [...new Set(prev.concat(changes.highlightWordsByDescriptions.newValue))]);
        }
    });
    return [domainKeyWords, specificWords]
}

export default useHighLightWords;
