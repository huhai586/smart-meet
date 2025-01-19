import { Actions } from "../components/captions/caption"
import askAI from "./askAI"
import getMeetingCaptions from './getCaptions';

const getAiSummary = async (question: string) => {
    const recordedContents = await getMeetingCaptions();
    return askAI(Actions.ASK, JSON.stringify(recordedContents), question);
};

export default getAiSummary;
