import {useEffect} from "react";import {toast, Toaster} from "~node_modules/react-hot-toast";import type {PlasmoCSConfig} from "plasmo";import translateSingleWords from "~utils/translate-signal-words";import {getCaptionsContainer} from "~node_modules/google-meeting-captions-resolver";export const getRootContainer = () =>{    const tempDiv = document.createElement('div')    tempDiv.id = 'huhai';    document.body.appendChild(tempDiv)    console.log('getRootContainer')    return tempDiv}const PlasmoInline = () => {    const getWordAtCoordinate = (coordinates, targetX, targetY) => {        if (!coordinates || coordinates.length === 0) {            return null; // 如果坐标数组为空或不存在，则返回 null        }        for (const coord of coordinates) {            const wordX = coord.x;            const wordY = coord.y;            const wordWidth = coord.width;            const wordHeight = coord.height;            // 检查目标坐标是否在单词的边界框内            if (targetX >= wordX &&                targetX <= wordX + wordWidth &&                targetY >= wordY &&                targetY <= wordY + wordHeight) {                return coord.word; // 如果坐标在单词范围内，返回该单词            }        }        return null; // 如果遍历完所有单词都没有找到匹配的坐标，返回 null    }    const getCoordinates = (clickedDialog: Element) => {        const text = clickedDialog.textContent;        const words = text.split(/\s+/); // 使用正则表达式按空格分割文本成单词数组        const coordinates = [];        const range = document.createRange();        let currentIndex = 0; // 用于追踪在原始文本中的索引位置        for (const word of words) {            if (!word) continue; // 跳过空单词 (例如，多个空格分隔符可能产生空单词)            const wordStartIndex = text.indexOf(word, currentIndex); // 查找单词在原始文本中的起始索引            const wordEndIndex = wordStartIndex + word.length;            range.setStart(clickedDialog.firstChild, wordStartIndex);            range.setEnd(clickedDialog.firstChild, wordEndIndex);            const rect = range.getBoundingClientRect();            coordinates.push({                word: word,                x: rect.left + window.scrollX,                y: rect.top + window.scrollY,                width: rect.width,                height: rect.height            });            currentIndex = wordEndIndex; // 更新索引位置，为下一个单词查找做准备        }        range.detach();        return coordinates;    }    useEffect(() => {        document.addEventListener('click', (ev) => {            const captionsContainer = getCaptionsContainer();            const x = ev.clientX;            const y = ev.clientY;            const elements = Array.from(document.elementsFromPoint(x, y));            const clickedDialog = elements.find((ele) => {                const clickedInCaptionsArea = captionsContainer?.contains(ele as HTMLElement);                if (clickedInCaptionsArea) {                    return typeof ele.childNodes[0]?.data === 'string'; // 保留你之前的条件，如果需要的话                }                return false;            });            if (!clickedDialog) {                return;            }            const coordinates = getCoordinates(clickedDialog);            const clickedWord = getWordAtCoordinate(coordinates, x, y);            if (clickedWord) {                translateSingleWords(clickedWord).then((res) => {                    toast.success(`${clickedWord}\n${res}`);                });            }        });    }, []);    return (        <div>            <Toaster                position="top-right"                reverseOrder={false}            />        </div>    )}export default PlasmoInlineexport const config: PlasmoCSConfig = {    matches: ["https://meet.google.com/*"]}