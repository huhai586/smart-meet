import {Button, Empty, FloatButton} from "~node_modules/antd";import React, {useEffect, useMemo, useRef, useState} from "react";import useTranscripts from "../../hooks/useTranscripts";import CaptionList from "./captionList";import './captions.scss';import useAutoScroll from "../../hooks/useScroll";const Captions = (props) => {    const chatContainer = useRef(null);    const [speakers, setSpeakers] = useState([]);    const [filterSpeaker, setFilterSpeakers] = useState([]);    const [transcripts] = useTranscripts();    useEffect(() => {        const speakers = [...new Set(transcripts.map((item) => item.activeSpeaker))] ;        setSpeakers(speakers);    }, [transcripts]);    const getTranscripts = () => {        if (filterSpeaker.length === 0) {return transcripts;}        return transcripts.filter((v) => {            return filterSpeaker.includes(v.activeSpeaker)        });    }    const toggleSpeaker = (speaker: string) => {        if (filterSpeaker.includes(speaker)) {            setFilterSpeakers(filterSpeaker.filter((v) => v !== speaker));        } else {            setFilterSpeakers([...filterSpeaker, speaker]);        }    }    const data = useMemo(() => {        return getTranscripts();    }, [transcripts, filterSpeaker]);    const isNoData = data.length === 0;    useAutoScroll(chatContainer, data);    return (        <div className={`captions`}>            <div className="filter-speakers">                {speakers.length > 0 && "filter:"}                {speakers.map((speaker) => (                    <Button color="default" variant={filterSpeaker.includes(speaker) ? 'solid' : 'outlined'} size={'small'} onClick={() => {toggleSpeaker(speaker)}} key={speaker}>                        {speaker}                    </Button>                ))}            </div>            <div className={`chat-container ${isNoData ? 'no-data' : ''}`} ref={chatContainer}>                {data.length > 0 ? (                    <CaptionList listData={data}/>                ) : (                    <Empty></Empty>                )}            </div>            <FloatButton.BackTop visibilityHeight={100} target={ () => document.querySelector('.chat-container') as HTMLElement}/>        </div>    )}export default Captions;