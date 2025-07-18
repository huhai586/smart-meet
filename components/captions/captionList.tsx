import React, { memo } from 'react';
import './captions.scss';
import type {Transcript} from "../../hooks/useTranscripts";
import Caption from "./caption";

type CaptionListProps = {
    listData: Transcript[];
    disableAutoScroll: () => void;
};

const CaptionList = (props: CaptionListProps) => {
  // 只在开发环境打印日志
  if (process.env.NODE_ENV === 'development') {
    console.log('CaptionList renders', props.listData.length);
  }
  
  return (
      <React.Fragment>
            {props.listData.map((item: Transcript) => (
              <Caption key={item.session} data={item} disableAutoScroll={props.disableAutoScroll} />
          ))}
      </React.Fragment>
  );
};

export default CaptionList;
