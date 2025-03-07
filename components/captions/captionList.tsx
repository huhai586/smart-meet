import React from 'react';
import './captions.scss';
import type {Transcript} from "../../hooks/useTranscripts";
import Caption from "./caption";
import VirtualList from 'rc-virtual-list';

type CaptionListProps = {
    listData: Transcript[];
};

const CaptionList = (props: CaptionListProps) => {
    return (
        <div className="list-container">
            <VirtualList
                data={props.listData}
                height={window.innerHeight - 200}
                itemHeight={47} // 预估的每个项目高度
                itemKey={(item) => item.session}
            >
                {(item: Transcript) => <Caption data={item} />}
            </VirtualList>
        </div>
    );
};

export default CaptionList;
