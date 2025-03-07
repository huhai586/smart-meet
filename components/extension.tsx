import { PlusOutlined } from "@ant-design/icons"
import {Alert, Button, Input, Tag, theme, type InputRef, Modal, message} from "antd"
import { TweenOneGroup } from "rc-tween-one"
import { useEffect, useRef, useState } from "react"
import dayjs from 'dayjs';

import { Actions } from "./captions/caption"
import askAI from "../utils/askAI"
import {getDomain, getDomainTags, getSpecificTags} from "../utils/common";
import BackupAndRestore from "~components/backup-and-restore";

interface ExtensionPropsInterface {
    jumpToCaptions: (date?: dayjs.Dayjs) => void;
}
const Extension = (props: ExtensionPropsInterface) => {
    const [specificTags, setTags] = useState([]);
    const [domain, setDomain] = useState('Advertising and digital marketing');
    const [modalData, setModalData] = useState([]);
    const [domainTags, setDomainTags] = useState([]);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messageApi, contextHolder] = message.useMessage();
    const inputRef = useRef<InputRef>(null);
    const { TextArea } = Input;
    const [highlightWordsByDescriptions, setHighlightWordsByDescriptions] = useState('Please return keywords in json format for digital advertising areas, such as CTR, etc. The return content needs to be in English, and each item is a word, or abbreviation.');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        getSpecificTags().then((res: string[]) => {
            setTags(res);
        });

        getDomainTags().then((res: string[]) => {
            setDomainTags(res);
        });

        getDomain().then((res: string) => {
            setDomain(res);
        });
    }, []);

    useEffect(() => {
        chrome.storage.local.set({ specificHighlightWords: specificTags }, function() {
            console.log('specificTags is set to ' + specificTags);
        });
        chrome.storage.local.set({ highlightWordsByDescriptions: domainTags }, function() {
            console.log('domainTags is set to ' + domainTags);
        });
        chrome.storage.local.set({ domain: domain }, function() {
            console.log('domain is set to ' + domain);
        });

    }, [specificTags, domainTags, domain]);

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus();
        }
    }, [inputVisible]);

    const handleClose = (removedTag: string) => {
        const newTags = specificTags.filter((tag) => tag !== removedTag);
        console.log(newTags);
        setTags(newTags);
    };

    const showInput = () => {
        setInputVisible(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputConfirm = () => {
        if (inputValue && specificTags.indexOf(inputValue) === -1) {
            setTags([...specificTags, inputValue]);
        }
        setInputVisible(false);
        setInputValue('');
    };

    const forMap = (tag: string) => (
        <span key={tag} style={{ display: 'inline-block' }}>
      <Tag
          closable
          onClose={(e) => {
              e.preventDefault();
              handleClose(tag);
          }}
      >
        {tag}
      </Tag>
    </span>
    );

    const removeHighlightWordInDomainTags = (word: string) => {
        const newDomainTags = domainTags.filter((tag) => tag !== word);
        setDomainTags(newDomainTags);
    };
    const forMapDomain = (tag: string) => (
        <span key={tag} style={{ display: 'inline-block' }}>
      <Tag
          closable
          onClose={(e) => {
              e.preventDefault();
              removeHighlightWordInDomainTags(tag);
          }}
      >
        {tag}
      </Tag>
    </span>
    );

    const tagChild = specificTags.map(forMap);
    const domainTagChild = domainTags.map(forMapDomain);


    const preview = () => {
        askAI(Actions.DEFAULT, `请直接返回一份Array数据，这个Array的每一个值都是单词或者单词缩写,我对这份数据的要求是: ${highlightWordsByDescriptions}，这份数据所属的行业是${domain}`).then((res) => {
            console.log('res', res);
            const stringWithOutJsonSymbol = res.replaceAll('```json', '').replaceAll('```', '');
            try {
                const data = JSON.parse(stringWithOutJsonSymbol);
                if (Array.isArray(data)) {
                    setModalData([...new Set(data)]);
                    showModal()
                } else {
                    messageApi.open({
                        type: 'error',
                        content: 'the response is not json array',
                    });
                }
            } catch (e) {
                messageApi.open({
                    type: 'error',
                    content: 'the response is not json valid',
                });
            }


        })
    }

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setDomainTags(modalData);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const removeHighlightWordInModalData = (word: string) => {
        const newModalData = modalData.filter((tag) => tag !== word);
        setModalData(newModalData);
    };
    return (
        <div className={'extension-container'}>
            {contextHolder}
            <div className={'highlight-setting'}>
                <Alert message="Please set the specific highlight words" type="success"/>
                <div className={'set-specific-highlight-words'}>
                    <TweenOneGroup
                        appear={false}
                        enter={{scale: 0.8, opacity: 0, type: 'from', duration: 100}}
                        leave={{opacity: 0, width: 0, scale: 0, duration: 200}}
                        onEnd={(e) => {
                            if (e.type === 'appear' || e.type === 'enter') {
                                (e.target as any).style = 'display: inline-block';
                            }
                        }}
                    >
                        {tagChild}
                    </TweenOneGroup>
                    {inputVisible ? (
                        <Input
                            ref={inputRef}
                            type="text"
                            size="small"
                            style={{width: 78}}
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputConfirm}
                            onPressEnter={handleInputConfirm}
                            className={'add-more'}
                        />
                    ) : (
                        <Tag onClick={showInput} className={'add-more'}>
                            <PlusOutlined/> New Tag
                        </Tag>
                    )}
                </div>
                <Alert message="Please set the highlight words by descriptions" type="success"/>
                <div className="set-highlight-words-by-descriptions">
                    <TweenOneGroup
                        appear={false}
                        enter={{scale: 0.8, opacity: 0, type: 'from', duration: 100}}
                        leave={{opacity: 0, width: 0, scale: 0, duration: 200}}
                        onEnd={(e) => {
                            if (e.type === 'appear' || e.type === 'enter') {
                                (e.target as any).style = 'display: inline-block';
                            }
                        }}
                    >
                        {domainTagChild}
                    </TweenOneGroup>
                    <Input className='domain-inputer' placeholder={'Please specific the domain that you interested'} value={domain} onChange={(v) => {setDomain(v.target.value)}}/>
                    <TextArea
                        rows={4}
                        placeholder="please return the highlight words in advertisement domain by json format"
                        className={'margin10'}
                        onChange={(v) => { setHighlightWordsByDescriptions(v.target.value)}}
                        value={highlightWordsByDescriptions}
                    />
                    <div className="valid-words"><Button onClick={preview}>Preview</Button></div>
                </div>
                <BackupAndRestore jumpToCaptions = {props.jumpToCaptions}/>

                <Modal title="Preview and select highlight keywords" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                    <div>
                        {modalData.map((tag) => (
                            <span key={tag}>
                                <Tag
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        removeHighlightWordInModalData(tag);
                                    }}
                                >
                                    {tag}
                                </Tag>
                            </span>
                        ))}
                    </div>
                </Modal>
            </div>
        </div>
    )
};

export default Extension
