import React, {useEffect, useState, useMemo} from "react";
import type {Transcript} from "../../hooks/useTranscripts";
import askAI from "../../utils/askAI";
import {Button, message} from "antd";
import {InfoOutlined} from '~node_modules/@ant-design/icons';
import highlight from '../../utils/highlight';
import useHighLightWords from "../../hooks/useHighLightWords";
import useDomain from "../../hooks/useDomain";
import translateSingleWords from "~utils/translate-signal-words";

type CaptionProps = {
    data: Transcript;
};

export enum Actions {
    TRANSLATE = 'Translate',
    EXPLAIN = 'Explain',
    POLISH = 'Polish',
    ANALYSIS = 'Analysis',
    ASK = 'Ask',
    DEFAULT = 'Default',
    SUMMARY = 'Summary',
}
const caption = (props: CaptionProps) => {
    const {data} = props;
    const [aiData, setAiData] = useState([]);
    const [captions, setCaptions] = useState(data.talkContent);
    const [messageApi, contextHolder] = message.useMessage();
    const [domainKeyWords, specificWords] = useHighLightWords();
    const [domain] = useDomain();

    // 使用 useMemo 缓存高亮处理的结果
    const highlightedText = useMemo(() => {
        const texts = data.talkContent;
        let spans = texts.replace(/\b(\w+)\b/g, '<span>\$1</span>');
        return highlight(spans,[...domainKeyWords, ...specificWords]);
    }, [data.talkContent, domainKeyWords, specificWords]);

    useEffect(() => {
        setCaptions(highlightedText);
    }, [highlightedText]);

    const handleAskAI = (action: Actions) => {
        askAI(action, data.talkContent).then((res) => {
            const newAiData = [...aiData];
            const matchData = newAiData.find((item) => item.type === action);
            if (matchData) {
                matchData.data = res;
            } else {
                newAiData.push({type: action, data: res});
            }
           setAiData(newAiData);
        }).catch((err) => {
            console.log('err', err);
            alert(err)
        });
    };
    const success = (res: string) => {
        messageApi.destroy()
        messageApi.open({
            type: 'success',
            content: res,
            icon: <InfoOutlined />,
            duration: 5,
        });
    };

    const hasAiData= aiData.length > 0;

    const handleTextClick = (ev) => {
        const text = ev.target.textContent;
        if (domainKeyWords.includes(text) && domain) {
            askAI(Actions.EXPLAIN, text, domain).then((res) => {
                success(res);
            });
            return;
        }
        translateSingleWords(text).then((res) => {
            success(res);
        });
    }
    return (
        <div className={'caption-container'}>
            {contextHolder}
            <section>
                <div className={'caption-text-container'}>
                    <div className="caption-header">
                        <div className={'caption-speaker'}>{data.activeSpeaker}</div>
                        <div className="caption-tools">
                            <Button size={'small'} type={'text'} color="cyan" onClick={() => {
                                handleAskAI(Actions.TRANSLATE)
                            }}>
                                Translate
                            </Button>

                            <Button size={'small'} type={'text'} color="cyan" onClick={() => {
                                handleAskAI(Actions.POLISH)
                            }}>
                                Polish
                            </Button>

                            <Button size={'small'} type={'text'} color="cyan" onClick={() => {
                                handleAskAI(Actions.ANALYSIS)
                            }}>
                                Grammar Analysis
                            </Button>
                        </div>
                    </div>
                    <div className={'caption-text'} dangerouslySetInnerHTML={{__html: captions}} onClick={handleTextClick}></div>
                    <div className="timestamp">{new Date(data.timestamp).toLocaleString()}</div>
                </div>


            </section>

            <section>
                {hasAiData && <div className={'ai-answer-container'}>
                    {aiData.map((item, index) => (
                        <div key={item.type} className={'ai-answer-item'}>
                            <div className={'ai-answer-type'}>{item.type}</div>
                            <div className={'ai-answer-data'} dangerouslySetInnerHTML={{__html: item.data}}></div>
                        </div>
                    ))}
                </div>}
            </section>
        </div>
    )
}

export default caption;
