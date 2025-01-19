import {googleMeetCaptionsClassName} from '../constant';
import debounce from './debounce';

console.log('content script loaded');
const getCaptionsContainer = () => document.querySelector(googleMeetCaptionsClassName);

const getWhoIsSpeaking = () => getCaptionsContainer().childNodes?.[0]?.childNodes[0]?.textContent;
const getCaptionsTextContainer = () => getCaptionsContainer().childNodes?.[0]?.childNodes[1];
const getSpeakContent = () => getCaptionsContainer().childNodes?.[0]?.childNodes[1]?.textContent;
// 创建内容观察器

let whoIsSpeaking = '';
const recordedContents: any[] = [];
const sessionIdSpanHash: {[key: string]: string[]} = {};
const sessionInfo = {
    sessionId: '',
    sessionIndex: 0
}

const addSpanTag = (sessionId) => {
    const textContainer = getCaptionsTextContainer() as HTMLDivElement;
    textContainer.querySelectorAll('span').forEach(span => {
        if (!span.hasAttribute('data-session-id')) {
            span.setAttribute('data-session-id', sessionId);
            span.setAttribute('data-session-index', String(sessionInfo.sessionIndex++))
        }
    });
}

const recordSpan = () => {
    const textContainer = getCaptionsTextContainer() as HTMLDivElement;
    textContainer.querySelectorAll('span').forEach(span => {
        const sessionId = span.getAttribute('data-session-id');
        const sessionIndex = span.getAttribute('data-session-index');
        if (sessionIdSpanHash[sessionId]) {
            sessionIdSpanHash[sessionId][sessionIndex] = span.textContent;
        } else {
            sessionIdSpanHash[sessionId] = [];
            sessionIdSpanHash[sessionId][sessionIndex] = span.textContent;
        }
    });
}
const getSessionSpeakContent = (sessionId) => {
    const texts = sessionIdSpanHash[sessionId].join(" ");
    console.log('texts', texts);
    return texts;
};

const mutationCallback = () => {
    console.warn('mutation observed');
    const speakContent = getSpeakContent();
    const newOneIsSpeaking = getWhoIsSpeaking() !== whoIsSpeaking;
    whoIsSpeaking = getWhoIsSpeaking();

    if (!speakContent) {
        return
    }

    if (newOneIsSpeaking) {
        sessionInfo.sessionId = String(new Date().getTime());
        sessionIdSpanHash[sessionInfo.sessionId] = [];
        addSpanTag(sessionInfo.sessionId)
        recordSpan();
        // 记录新内容
        recordedContents.push({
            whoIsSpeaking: whoIsSpeaking,
            speakContent: getSessionSpeakContent(sessionInfo.sessionId),
            sessionId: sessionInfo.sessionId,
            timestamp: new Date().toISOString()
        });
    } else {
        // 更新最新内容
        addSpanTag(sessionInfo.sessionId)
        recordSpan();
        const updateIndex = recordedContents.length - 1;
        recordedContents[updateIndex].speakContent = getSessionSpeakContent(sessionInfo.sessionId);
    }

    console.warn('recordedContents', recordedContents);
    // 保存到Chrome存储
    chrome.storage.local.set({
        'recordedContents': recordedContents
    });

    // 发送消息到popup
    chrome.runtime.sendMessage({
        type: 'contentUpdated',
        content: speakContent
    });
};

export default debounce(mutationCallback, 100);
