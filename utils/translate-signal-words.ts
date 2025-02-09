import { Actions } from "~components/captions/caption"
import askAI from "~utils/askAI"
import {setTranslatedWords} from "~utils/translate";





const translateSingleWords = async (text) => {
    setTranslatedWords(text);
    return await askAI(Actions.TRANSLATE, text)
}

export default translateSingleWords;
