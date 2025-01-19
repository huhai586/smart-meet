const findAllIndexes = (arr, val) => {
    var indexes = [], i = -1;
    while ((i = arr.indexOf(val, i+1)) !== -1) {
        indexes.push(i);
    }
    return indexes;
}

const getAdditionalWords = (previousContentWords: string[], currentContentWords: string[], lastWordIndexs: number[]) => {
    const previousContent = previousContentWords.join(' ');
    const rightIndex = lastWordIndexs.find(index => {
        const sentence = currentContentWords.slice(0, index + 1).join(" ");
        return previousContent.indexOf(sentence) !== -1;
    });
    return currentContentWords.slice(rightIndex + 1).join(' ');
}

const updateRecordedContents = (previousContent: string, currentContent:string) => {
    const previousContentWords = previousContent.split(' ');
    const currentContentWords = currentContent.split(' ');
    // no cut off
    if (currentContent.indexOf(previousContent) === 0) {
        return currentContent;
    } else {
        // has cut off
        const lastWord = previousContentWords[previousContentWords.length - 1];
        const lastWordIndexs = findAllIndexes(currentContentWords, lastWord);

        const additionalWords = getAdditionalWords(previousContentWords, currentContentWords, lastWordIndexs);
            console.log('additionalWords', additionalWords);
        return currentContent;
    }
};


export default updateRecordedContents;
