import React from 'react';
import './captions.scss';
import type {Transcript} from "../../hooks/useTranscripts";
import Caption from "./caption";

type CaptionListProps = {
    listData: Transcript[];
};
const CaptionList = (props: CaptionListProps) => {

    return (
        <div className="list-container">
            {props.listData.map((data, index) => (
                <Caption
                key={data.session}
                data={data}
                />
            ))}
        </div>
    );
};

export default CaptionList;
