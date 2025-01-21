import isScrolledToBottom, {ScrollDirection} from "../utils/is-scroll-to-bottom";import {useEffect, useState} from "react";import debounce from "~utils/debounce";const useScroll = (container: HTMLDivElement) => {    const [scrollInfo, setScrollInfo] = useState({direction: ScrollDirection.DOWN, reachBottom: false, timeStamp: Date.now()});    let lastScrollTop = container?.scrollTop || 0;    useEffect(() => {        if (!container) {            return;        }        const handleScroll = debounce(() => {            const currentScrollTop = container.scrollTop;            const reachBottom = isScrolledToBottom(container);            if (currentScrollTop < lastScrollTop) {                setScrollInfo({direction: ScrollDirection.UP, reachBottom, timeStamp: Date.now()});            } else if (currentScrollTop > lastScrollTop) {                setScrollInfo({direction: ScrollDirection.DOWN, reachBottom, timeStamp: Date.now()});            } else {                console.log("没有滚动");            }            lastScrollTop = currentScrollTop;        },300)        container.addEventListener('scroll', handleScroll);        return () => {            container.removeEventListener('scroll', handleScroll);        }    }, [container]);    return [scrollInfo]};export default useScroll