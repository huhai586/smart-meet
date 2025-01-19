import {Card, message, Spin} from "~node_modules/antd";
import {LoadingOutlined} from "~node_modules/@ant-design/icons";
import React, {useEffect, useState} from "react";
import getAiSummary from "../utils/get-ai-summary";
import Search from "~node_modules/antd/es/input/Search";
import getMeetingCaptions from '../utils/getCaptions';
import {Empty} from 'antd';
import '../styles/summary.scss';

const Summary = (props) => {
    const [requesting, setRequesting] = useState(false);
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
        if (props.show) {
            window.scrollTo(0, document.body.scrollHeight);
        }
    },[props.show])
    return <div className={`summaryContainer ${!cardData.length &&  'no-data'}`}>
        {contextHolder}
        {cardData.map((item, index) => {
            return (
              <Spin spinning={requesting && !item.fetchComplete} indicator={<LoadingOutlined spin/>} size="large" fullscreen={false} tip={'loading'}>
                <Card title={item.question} key={index} className={'card-container'}>
                    <div className="summary-container" dangerouslySetInnerHTML={{__html: item.answer}}>
                    </div>
                </Card>
            </Spin>
            )
        })}
        {
            !cardData.length && <Empty description={'How about summary the meeting ?'} className={'summary-no-meeting-data'}></Empty>
        }

        <div className="footer">
            <Search
                className={'xxx'}
                placeholder="please summary the meeting"
                enterButton="Search"
                size="large"
                onSearch={(v) => {
                    handleQuestion(v === '' ? 'please summary the meeting' : v);
                }}
            />
        </div>
    </div>
}

export default Summary
