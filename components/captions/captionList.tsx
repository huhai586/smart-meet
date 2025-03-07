import React from 'react';
import './captions.scss';
import type {Transcript} from "../../hooks/useTranscripts";
import Caption from "./caption";

type CaptionListProps = {
    listData: Transcript[];
};

const CaptionList = (props: CaptionListProps) => {
    return (
        <React.Fragment>
              {props.listData.map((item: Transcript) => (
                <Caption key={item.session} data={item} />
            ))}
        </React.Fragment>  
    );
};

export default CaptionList;
