export const googleMeetCaptionsClassName = '.uYs2ee';

// 翻译提示模板，根据目标语言生成提示
export const getTranslationPrompt = (targetLanguage: string): string => {
  const languageMap = {
    'zh': '请帮忙把后面的文字翻译成中文,不需要返回任何的解释性文字，直接回答:',
    'en': 'Please translate the following text into English. No explanatory text needed, just the translation:',
    'es': 'Por favor, traduce el siguiente texto al español. No es necesario incluir explicaciones, solo la traducción:',
    'fr': 'Veuillez traduire le texte suivant en français. Pas besoin d\'explications, juste la traduction:',
    'de': 'Bitte übersetzen Sie den folgenden Text ins Deutsche. Keine Erklärungen nötig, nur die Übersetzung:',
    'ja': '以下のテキストを日本語に翻訳してください。説明は不要です、翻訳だけをお願いします:',
    'ko': '다음 텍스트를 한국어로 번역해 주세요. 설명은 필요 없고 번역만 해주세요:',
    'ru': 'Пожалуйста, переведите следующий текст на русский язык. Пояснения не нужны, только перевод:',
    'pt': 'Por favor, traduza o seguinte texto para português. Não é necessário incluir explicações, apenas a tradução:',
    'it': 'Per favore, traduci il seguente testo in italiano. Non sono necessarie spiegazioni, solo la traduzione:',
    'ar': 'يرجى ترجمة النص التالي إلى اللغة العربية. لا حاجة لنص توضيحي، فقط الترجمة:',
    'hi': 'कृपया निम्नलिखित पाठ को हिंदी में अनुवाद करें। व्याख्यात्मक पाठ की आवश्यकता नहीं है, केवल अनुवाद:',
    'th': 'โปรดแปลข้อความต่อไปนี้เป็นภาษาไทย ไม่จำเป็นต้องมีข้อความอธิบาย เพียงแค่คำแปล:',
    'vi': 'Vui lòng dịch văn bản sau sang tiếng Việt. Không cần văn bản giải thích, chỉ cần bản dịch:',
    'fa': 'لطفاً متن زیر را به فارسی ترجمه کنید. نیازی به متن توضیحی نیست، فقط ترجمه:'
  };

  return languageMap[targetLanguage] || languageMap['zh']; // 默认使用中文
};

// 摘要提示模板，根据目标语言生成提示
export const getSummaryPrompt = (targetLanguage: string): string => {
  const languageMap = {
    'zh': '后面是一份会议内容的数据，请帮忙用中文总结一下这个会议说了什么:',
    'en': 'The following is meeting content data. Please summarize what was discussed in this meeting in English:',
    'es': 'A continuación hay datos de contenido de una reunión. Por favor, resume en español lo que se dijo en esta reunión:',
    'fr': 'Voici les données du contenu d\'une réunion. Veuillez résumer en français ce qui a été dit lors de cette réunion:',
    'de': 'Im Folgenden finden Sie Daten zum Inhalt eines Meetings. Bitte fassen Sie auf Deutsch zusammen, was in diesem Meeting besprochen wurde:',
    'ja': '以下は会議の内容データです。この会議で話されたことを日本語で要約してください:',
    'ko': '다음은 회의 내용 데이터입니다. 이 회의에서 무엇을 논의했는지 한국어로 요약해 주세요:',
    'ru': 'Ниже приведены данные содержания встречи. Пожалуйста, подведите итог на русском языке о том, что обсуждалось на этой встрече:',
    'pt': 'A seguir estão os dados do conteúdo de uma reunião. Por favor, resuma em português o que foi dito nesta reunião:',
    'it': 'Di seguito sono riportati i dati del contenuto di una riunione. Si prega di riassumere in italiano ciò che è stato detto in questa riunione:',
    'ar': 'فيما يلي بيانات محتوى الاجتماع. يرجى تلخيص ما تم مناقشته في هذا الاجتماع باللغة العربية:',
    'hi': 'निम्नलिखित एक बैठक सामग्री डेटा है। कृपया इस बैठक में क्या कहा गया था, इसका सारांश हिंदी में दें:',
    'th': 'ต่อไปนี้เป็นข้อมูลเนื้อหาการประชุม โปรดสรุปสิ่งที่พูดในการประชุมนี้เป็นภาษาไทย:',
    'vi': 'Sau đây là dữ liệu nội dung cuộc họp. Vui lòng tóm tắt những gì đã được thảo luận trong cuộc họp này bằng tiếng Việt:',
    'fa': 'در ادامه داده‌های محتوای جلسه آمده است. لطفاً آنچه در این جلسه مورد بحث قرار گرفته است را به فارسی خلاصه کنید:'
  };

  return languageMap[targetLanguage] || languageMap['zh']; // 默认使用中文
};

export const PROMPT = {
  TRANSLATE: getTranslationPrompt('zh'), // 默认中文，将在运行时更新
  POLISH: '请帮忙把后面的英文优化成通俗易懂的语句,不需要返回任何的解释性文字，直接回答:',
  ANALYSIS: '请检查后面的英文是否有语法或者单词使用上不正确的地方,请简单解释下，字数不要太长:',
  ASK: '{option} :',
  EXPLAIN: '在{option}领域里面，请简洁的解释一下这个名词:',
  DEFAULT: '',
};

