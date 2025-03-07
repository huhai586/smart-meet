import {Card, message, Spin} from "~node_modules/antd";
import {LoadingOutlined} from "~node_modules/@ant-design/icons";
import React, {useEffect, useRef, useState} from "react";
import getAiSummary from "../utils/get-ai-summary";
import Search from "~node_modules/antd/es/input/Search";
import getMeetingCaptions from '../utils/getCaptions';
import {Empty} from 'antd';
import '../styles/summary.scss';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const Summary = (props) => {
    const [requesting, setRequesting] = useState(false);
    const container = useRef(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [cardData, setCardData] = useState([]);
    const handleQuestion = async (question = 'please summary the meeting') => {
        const recordedContents = await getMeetingCaptions();
        if (recordedContents.length === 0) {
            messageApi.open({
                type: 'error',
                content: 'no meeting data',
            });
            return
        }
        setCardData([...cardData, {question, answer: '', fetchComplete: false}]);
    }

    useEffect(() => {
        console.log('cardData', cardData);
        cardData.forEach((item, index) => {
            if (item.fetchComplete) {
                return;
            }
            setRequesting(true);
            getAiSummary(item.question).then((res) => {
                const newCardData = [...cardData];
                newCardData[index].answer = res;
                newCardData[index].fetchComplete = true;
                setCardData(newCardData);
            }).catch((err) => {
                messageApi.open({
                    type: 'error',
                    content: err,
                });
            }).finally(() => {
                setRequesting(false);
            })
        });
    }, [cardData, props.show]);

    useEffect(() =>  {
        if (container.current) {
            const lastItem = container.current.querySelector('.ant-spin-nested-loading:last-child');
            lastItem && lastItem.scrollIntoView({behavior: 'smooth'});
        }
    },[cardData])

    return <>
        <div className={`summaryContainer ${!cardData.length &&  'no-data'}`} ref={container}>
            {contextHolder}
            {cardData.map((item, index) => {
                return (
                    <Spin
                        spinning={requesting && !item.fetchComplete} indicator={<LoadingOutlined spin/>} size="large" fullscreen={false} tip={'loading'} key={index}>
                        <Card title={item.question} key={index} className={'card-container'}>
                            <div className="summary-container">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                    {item.answer}
                                </ReactMarkdown>
                            </div>
                        </Card>
                    </Spin>
                )
            })}
            {
                !cardData.length && <Empty description={'How about summary the meeting ?'} className={'summary-no-meeting-data'}></Empty>
            }
        </div>

        <div className="footer">
            <Search
                disabled={requesting}
                placeholder="please summary the meeting"
                enterButton="Search"
                size="large"
                onSearch={(v) => {
                    handleQuestion(v === '' ? 'please summary the meeting' : v);
                }}
            />
        </div>
    </>
}

export default Summary;
