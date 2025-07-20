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

// Polish提示模板，根据检测到的语言生成提示
export const getPolishPrompt = (detectedLanguage: string): string => {
  const languageMap = {
    'zh': '请帮忙把后面的中文优化成通俗易懂的语句,不需要返回任何的解释性文字，直接回答:',
    'en': 'Please help polish the following English text to make it more clear and understandable. No explanatory text needed, just the polished version:',
    'es': 'Por favor, ayuda a pulir el siguiente texto en español para hacerlo más claro y comprensible. No es necesario incluir explicaciones, solo la versión pulida:',
    'fr': 'Veuillez aider à polir le texte français suivant pour le rendre plus clair et compréhensible. Pas besoin d\'explications, juste la version polie:',
    'de': 'Bitte helfen Sie dabei, den folgenden deutschen Text zu polieren, um ihn klarer und verständlicher zu machen. Keine Erklärungen nötig, nur die polierte Version:',
    'ja': '以下の日本語テキストをより明確で理解しやすくするために磨いてください。説明は不要です、磨かれたバージョンだけをお願いします:',
    'ko': '다음 한국어 텍스트를 더 명확하고 이해하기 쉽게 다듬어 주세요. 설명은 필요 없고 다듬어진 버전만 해주세요:',
    'ru': 'Пожалуйста, помогите отполировать следующий русский текст, чтобы сделать его более ясным и понятным. Пояснения не нужны, только отполированная версия:',
    'pt': 'Por favor, ajude a polir o seguinte texto em português para torná-lo mais claro e compreensível. Não é necessário incluir explicações, apenas a versão polida:',
    'it': 'Per favore, aiuta a rifinire il seguente testo italiano per renderlo più chiaro e comprensibile. Non sono necessarie spiegazioni, solo la versione rifinita:',
    'ar': 'يرجى المساعدة في تحسين النص العربي التالي لجعله أكثر وضوحاً وفهماً. لا حاجة لنص توضيحي، فقط النسخة المحسّنة:',
    'hi': 'कृपया निम्नलिखित हिंदी पाठ को अधिक स्पष्ट और समझने योग्य बनाने के लिए इसे परिष्कृत करने में सहायता करें। व्याख्यात्मक पाठ की आवश्यकता नहीं है, केवल परिष्कृत संस्करण:',
    'th': 'โปรดช่วยปรับปรุงข้อความภาษาไทยต่อไปนี้ให้ชัดเจนและเข้าใจง่ายขึ้น ไม่จำเป็นต้องมีข้อความอธิบาย เพียงแค่เวอร์ชันที่ปรับปรุงแล้ว:',
    'vi': 'Vui lòng giúp cải thiện văn bản tiếng Việt sau đây để làm cho nó rõ ràng và dễ hiểu hơn. Không cần văn bản giải thích, chỉ cần phiên bản được cải thiện:',
    'fa': 'لطفاً در بهبود متن فارسی زیر کمک کنید تا آن را واضح‌تر و قابل فهم‌تر کنید. نیازی به متن توضیحی نیست، فقط نسخه بهبود یافته:'
  };

  return languageMap[detectedLanguage] || languageMap['en']; // 默认使用英文
};

// Analysis提示模板，根据检测到的语言和翻译语言生成提示
export const getAnalysisPrompt = (detectedLanguage: string, translationLanguage: string): string => {
  const languageNames = {
    'zh': '中文',
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'ja': '日本語',
    'ko': '한국어',
    'ru': 'Русский',
    'pt': 'Português',
    'it': 'Italiano',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'fa': 'فارسی'
  };

  const detectedLangName = languageNames[detectedLanguage] || 'English';
  const translationLangName = languageNames[translationLanguage] || '中文';
  
  const analysisPrompts = {
    'zh': `检测后面文字的语言，并用${translationLangName}精炼地分析语法要点。如果发现语法错误，请着重指出并给出正确形式，保持简洁:`,
    'en': `Detect the language of the following text and provide a concise grammar analysis in ${translationLangName}. If there are grammar errors, emphasize them and provide correct forms, keep it brief:`,
    'es': `Detecta el idioma del siguiente texto y proporciona un análisis gramatical conciso en ${translationLangName}. Si hay errores gramaticales, enfatízalos y proporciona las formas correctas, mantén la brevedad:`,
    'fr': `Détectez la langue du texte suivant et fournissez une analyse grammaticale concise en ${translationLangName}. S'il y a des erreurs grammaticales, mettez-les en évidence et fournissez les formes correctes, restez bref:`,
    'de': `Erkennen Sie die Sprache des folgenden Textes und geben Sie eine prägnante grammatische Analyse in ${translationLangName}. Bei grammatischen Fehlern betonen Sie diese und geben Sie korrekte Formen an, bleiben Sie kurz:`,
    'ja': `以下のテキストの言語を検出し、${translationLangName}で簡潔な文法分析を提供してください。文法エラーがある場合は、それを強調し、正しい形を提供してください、簡潔に:`,
    'ko': `다음 텍스트의 언어를 감지하고 ${translationLangName}로 간결한 문법 분석을 제공해 주세요. 문법 오류가 있다면 강조하고 올바른 형태를 제공해 주세요, 간단히:`,
    'ru': `Определите язык следующего текста и предоставьте краткий грамматический анализ на ${translationLangName}. При наличии грамматических ошибок подчеркните их и предоставьте правильные формы, будьте лаконичны:`,
    'pt': `Detecte o idioma do seguinte texto e forneça uma análise gramatical concisa em ${translationLangName}. Se houver erros gramaticais, enfatize-os e forneça as formas corretas, seja breve:`,
    'it': `Rileva la lingua del seguente testo e fornisci un'analisi grammaticale concisa in ${translationLangName}. Se ci sono errori grammaticali, enfatizzali e fornisci le forme corrette, sii breve:`,
    'ar': `اكتشف لغة النص التالي وقدم تحليلاً نحوياً موجزاً باللغة ${translationLangName}. إذا كانت هناك أخطاء نحوية، أكد عليها وقدم الأشكال الصحيحة، كن مختصراً:`,
    'hi': `निम्नलिखित पाठ की भाषा का पता लगाएं और ${translationLangName} में संक्षिप्त व्याकरण विश्लेषण प्रदान करें। यदि व्याकरण त्रुटियां हैं, तो उन्हें जोर दें और सही रूप प्रदान करें, संक्षिप्त रखें:`,
    'th': `ตรวจจับภาษาของข้อความต่อไปนี้และให้การวิเคราะห์ไวยากรณ์ที่กระชับเป็น${translationLangName}. หากมีข้อผิดพลาดทางไวยากรณ์ ให้เน้นและให้รูปแบบที่ถูกต้อง, ให้สั้นๆ:`,
    'vi': `Phát hiện ngôn ngữ của văn bản sau và cung cấp phân tích ngữ pháp ngắn gọn bằng ${translationLangName}. Nếu có lỗi ngữ pháp, hãy nhấn mạnh và cung cấp dạng đúng, giữ ngắn gọn:`,
    'fa': `زبان متن زیر را تشخیص دهید و تحلیل دستوری مختصر به ${translationLangName} ارائه دهید. اگر اشتباهات دستوری وجود دارد، آنها را تأکید کنید و اشکال صحیح را ارائه دهید، مختصر باشید:`
  };

  return analysisPrompts[translationLanguage] || analysisPrompts['zh']; // 默认使用中文
};

export const PROMPT = {
  TRANSLATE: getTranslationPrompt('zh'), // 默认中文，将在运行时更新
  POLISH: '请帮忙把后面的英文优化成通俗易懂的语句,不需要返回任何的解释性文字，直接回答:', // 默认值，将在运行时更新
  ANALYSIS: '请检查后面的英文是否有语法或者单词使用上不正确的地方,请简单解释下，字数不要太长:', // 默认值，将在运行时更新
  ASK: '{option} :',
  EXPLAIN: '在{option}领域里面，请简洁的解释一下这个名词:',
  DEFAULT: '',
};

