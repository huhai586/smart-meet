import {useEffect, useState} from "react";
import {getDomain, getDomainTags, getSpecificTags} from "../utils/common";

const useDomain = () => {
    const [domain, setDomain] = useState('');

    useEffect(() => {
        getDomain().then((res: string) => {
            setDomain(res);
        });
    }, []);

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.domain) {
            setDomain(changes.domain.newValue);
        }
    });
    return [domain]
};

export default useDomain;
