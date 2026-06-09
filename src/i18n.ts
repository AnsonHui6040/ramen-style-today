import type {
  MenuItemDefinition,
  StoreDefinition,
} from './domain/catalog'
import type {
  BodyOption,
  ChoiceOption,
  FormOption,
  NoodleOption,
  QuestionDefinition,
  QuestionId,
  RankedStyle,
} from './domain/types'

export const locales = ['zh-TW', 'en', 'ja'] as const

export type Locale = (typeof locales)[number]

type QuestionCopy = {
  title: string
  description: string
  copyByForm?: Partial<Record<FormOption, { title: string; description: string }>>
}

type OptionCopy = {
  label: string
  description: string
  descriptionByForm?: Partial<Record<FormOption, string>>
}

type Dictionary = {
  localeLabel: string
  app: {
    headline: string
    lede: string
    pills: string[]
    introTitle: string
    introBody: string
    statSteps: string
    statSaved: string
    statWeight: string
    statWeightValue: string
    implementedTitle: string
    implemented: string[]
    start: string
    continue: string
    clear: string
  }
  questionUi: {
    step: (current: number, total: number) => string
    multipleMeta: (max: number, current: number) => string
    singleMeta: string
    back: string
    next: string
    results: string
  }
  results: {
    topMatch: string
    eatToday: (style: string) => string
    confidence: string
    descriptor: string
    lowConfidenceTitle: string
    lowConfidenceBody: string
    blockedTitle: string
    blockedBody: (style: string, blocked: string) => string
    adjust: string
    restart: string
    noResultsTitle: string
    noResultsBody: string
    catalogTitle: string
    officialPage: string
    catalogEmpty: string
    bonus: string
    penalty: string
    why: string
    answerPhrase: (answer: string) => string
    scoreLabel: (points: number) => string
    nearbyEyebrow: string
    nearbyTitle: string
    nearbyBody: string
    map: {
      title: string
      body: (style: string) => string
      region: string
      style: string
      search: string
      allStyles: string
      resultCount: (count: number) => string
      noShops: string
      loading: string
      mapUnavailable: string
      selectedStyle: (style: string) => string
      rating: string
      reviews: (count: number) => string
      price: string
      address: string
      openMap: string
      officialSite: string
      dataNote: (date: string) => string
    }
    tierNotes: Record<RankedStyle['breakdown'][number]['tier'], string>
  }
  questions: Record<QuestionId, QuestionCopy>
  options: Partial<Record<QuestionId, Record<string, OptionCopy>>>
  styles: Record<string, { label: string; summary: string }>
  bodyLabels: Record<BodyOption, string>
  noodleLabels: Record<NoodleOption, string>
  intensityLabels: Record<RankedStyle['coreType']['intensity'], string>
}

export const dictionaries: Record<Locale, Dictionary> = {
  'zh-TW': {
    localeLabel: '繁中',
    app: {
      headline: '今天想吃哪一碗？',
      lede: '先選湯、沾或拌，再用口味、濃淡和麵感慢慢縮小範圍，最後給你一碗最像今天心情的選擇。',
      pills: ['先選形式', '避開不吃的', '看得懂理由'],
      introTitle: '不用想太多，照著今天的胃口選就好。',
      introBody: '想清爽、想濃、想要魚介、想要辣麻，答案會一路收斂到適合的拉麵、沾麵或拌麵。',
      statSteps: '題就有結果',
      statSaved: '已選答案',
      statWeight: '結果理由',
      statWeightValue: '可回看',
      implementedTitle: '這裡會幫你做的事',
      implemented: [
        '湯拉麵、沾麵、乾拌 / 油拌不混在一起推薦',
        '依你選的細分類刪掉不相關問題',
        '過敏或不吃的食材會先避開',
        '重新整理後還能接著選',
      ],
      start: '開始問卷',
      continue: '繼續作答',
      clear: '清除暫存',
    },
    questionUi: {
      step: (current, total) => `第 ${current} / ${total} 題`,
      multipleMeta: (max, current) => `可選 ${max} 個，目前 ${current} 個`,
      singleMeta: '單選題',
      back: '上一步',
      next: '下一題',
      results: '看結果',
    },
    results: {
      topMatch: '今天最像這碗',
      eatToday: (style) => `今天先吃 ${style}`,
      confidence: '信心分數',
      descriptor: '口味輪廓',
      lowConfidenceTitle: '這次有點像在兩種風格中間',
      lowConfidenceBody: '第一名和第二名距離不大，代表你的答案同時靠近兩條口味線。',
      blockedTitle: '有一碗本來很合，但被避開了',
      blockedBody: (style, blocked) =>
        `${style} 原本也很接近，但你標記了 ${blocked}，所以沒有放進正式推薦。`,
      adjust: '調整答案',
      restart: '重新開始',
      noResultsTitle: '沒有可顯示的結果',
      noResultsBody: '目前比較接近的風格都碰到你不吃的項目，可以回去調整過敏 / 不吃設定或其他口味選項。',
      catalogTitle: '推薦店家 / 品項',
      officialPage: '官方頁面',
      catalogEmpty: '這個結果已經有風格判斷，但目前還沒掛上對應店家資料。',
      bonus: '加分',
      penalty: '扣分',
      why: '為什麼會推這碗？',
      answerPhrase: (answer) => `你剛剛選了「${answer}」`,
      scoreLabel: (points) => `資料分 +${points}`,
      nearbyEyebrow: 'Nearby Styles',
      nearbyTitle: '相近替代',
      nearbyBody: '這些風格分數也接近，但形式和你一開始選的不同，所以不放進主推薦。',
      map: {
        title: '附近可以去哪吃',
        body: (style) => `先用「${style}」這套分類幫你縮小地圖範圍，也可以切回全部慢慢看。`,
        region: '縣市',
        style: '拉麵分類',
        search: '搜尋店名、地址或商圈',
        allStyles: '全部類型',
        resultCount: (count) => `${count} 間`,
        noShops: '目前沒有符合條件的店家。',
        loading: '地圖資料載入中',
        mapUnavailable: '測試環境不載入互動地圖，但店家列表仍可檢查。',
        selectedStyle: (style) => `目前分類：${style}`,
        rating: '評分',
        reviews: (count) => `${count.toLocaleString('zh-TW')} 則評論`,
        price: '價格',
        address: '地址',
        openMap: '開 Google Maps',
        officialSite: '官方網站',
        dataNote: (date) => `資料更新：${date}`,
      },
      tierNotes: {
        exact: '這個選擇很貼近這碗的個性。',
        adjacent: '方向是接近的，只是沒有那麼典型。',
        partial: '有一部分對上，所以給一點參考分。',
        miss: '這題和這碗比較不像，分數就保守一點。',
      },
    },
    questions: {} as Record<QuestionId, QuestionCopy>,
    options: {},
    styles: {},
    bodyLabels: {
      light: '清爽',
      balanced: '標準',
      rich: '濃厚',
      'backfat-heavy': '背脂重口',
      'ultra-heavy': '極濃爆量',
    },
    noodleLabels: {
      'thin-straight': '細直麵',
      'medium-thin-straight': '中細直麵',
      'medium-thick-straight': '中粗直麵',
      'medium-thick-wavy': '中粗捲麵',
      'extra-thick': '極粗麵',
    },
    intensityLabels: {
      clean: '清爽',
      standard: '標準',
      heavy: '重口',
    },
  },
  en: {
    localeLabel: 'EN',
    app: {
      headline: 'What bowl fits today?',
      lede: 'Pick soup, dipping, or mixed noodles first, then narrow by flavor, weight, and noodle feel.',
      pills: ['Pick a format', 'Avoid allergens', 'Readable reasons'],
      introTitle: 'Answer by appetite, not by ramen theory.',
      introBody: 'Clean, rich, gyokai, spicy-sesame, chewy, light: each answer narrows the bowl without mixing formats.',
      statSteps: 'questions',
      statSaved: 'saved answers',
      statWeight: 'result reasons',
      statWeightValue: 'reviewable',
      implementedTitle: 'What it does',
      implemented: [
        'Keeps ramen, tsukemen, and dry styles separate',
        'Removes irrelevant follow-up choices after subtype selection',
        'Avoids ingredients you cannot eat',
        'Saves progress across refreshes',
      ],
      start: 'Start',
      continue: 'Continue',
      clear: 'Clear saved answers',
    },
    questionUi: {
      step: (current, total) => `Step ${current} / ${total}`,
      multipleMeta: (max, current) => `Choose up to ${max}; selected ${current}`,
      singleMeta: 'Single choice',
      back: 'Back',
      next: 'Next',
      results: 'Show results',
    },
    results: {
      topMatch: 'Top Match',
      eatToday: (style) => `Try ${style} today`,
      confidence: 'Confidence',
      descriptor: 'Combination',
      lowConfidenceTitle: 'This result is exploratory',
      lowConfidenceBody: 'The leading styles are close together, so your answers cross more than one style line.',
      blockedTitle: 'A high-scoring style was filtered out',
      blockedBody: (style, blocked) =>
        `${style} also scored highly, but it was removed because you excluded ${blocked}.`,
      adjust: 'Adjust answers',
      restart: 'Restart',
      noResultsTitle: 'No visible result',
      noResultsBody: 'All high-scoring styles were blocked by hard filters. Adjust Q8 or other signals.',
      catalogTitle: 'Recommended shops / items',
      officialPage: 'Official page',
      catalogEmpty: 'This style has been classified, but no shop data is mapped yet.',
      bonus: 'Bonus',
      penalty: 'Penalty',
      why: 'Why this bowl',
      answerPhrase: (answer) => `You chose “${answer}”`,
      scoreLabel: (points) => `data score +${points}`,
      nearbyEyebrow: 'Nearby Styles',
      nearbyTitle: 'Nearby alternatives',
      nearbyBody: 'These styles also scored well, but their format differs from your first choice.',
      map: {
        title: 'Where to eat nearby',
        body: (style) => `The map starts from the current ${style} classification and keeps the shop data as-is.`,
        region: 'Region',
        style: 'Ramen style',
        search: 'Search name, address, or area',
        allStyles: 'All types',
        resultCount: (count) => `${count} shops`,
        noShops: 'No shops match these filters yet.',
        loading: 'Loading map data',
        mapUnavailable: 'Interactive maps are skipped in tests, but the shop list is still rendered.',
        selectedStyle: (style) => `Current style: ${style}`,
        rating: 'Rating',
        reviews: (count) => `${count.toLocaleString('en')} reviews`,
        price: 'Price',
        address: 'Address',
        openMap: 'Open Google Maps',
        officialSite: 'Official site',
        dataNote: (date) => `Updated: ${date}`,
      },
      tierNotes: {
        exact: 'Core signal matched.',
        adjacent: 'Close direction, but not the most typical fit.',
        partial: 'Only part of the signal matched.',
        miss: 'This answer is far from the style.',
      },
    },
    questions: {
      form: {
        title: 'Q1. What do you want today?',
        description: 'Choose the format first so soup ramen, tsukemen, and dry styles do not get mixed.',
      },
      archetype: {
        title: 'Q2. Which outline is closest?',
        description: 'Q2 changes according to the format you selected.',
      },
      tare: {
        title: 'Q3. Which seasoning direction do you want?',
        description: 'This identifies shoyu, shio, miso, spicy-sesame, or a less tare-forward direction.',
        copyByForm: {
          soup: {
            title: 'Q3. Which soup seasoning do you want?',
            description: 'Use this to separate shoyu, shio, miso, spicy-sesame, or a less tare-forward soup.',
          },
          tsukemen: {
            title: 'Q3. Which dipping-sauce seasoning do you want?',
            description: 'Use this to separate shoyu, shio, miso, spicy-sesame, or a less tare-forward dipping sauce.',
          },
          dry: {
            title: 'Q3. Which mixed-sauce seasoning do you want?',
            description: 'Use this to separate shoyu, shio, miso, spicy-sesame, or a less tare-forward dry sauce.',
          },
        },
      },
      source: {
        title: 'Q4. Which stock or main character should stand out?',
        description: 'Choose up to two. This separates pork, chicken, duck, gyokai, shellfish, and other main lines.',
        copyByForm: {
          soup: {
            title: 'Q4. Which stock or main character should stand out?',
            description: 'Choose up to two. This separates pork, chicken, duck, gyokai, shellfish, and other soup lines.',
          },
          tsukemen: {
            title: 'Q4. What should lead the dipping sauce or kombu water?',
            description: 'Choose up to two. This separates gyokai, kombu, pork, chicken paitan, and miso tsukemen lines.',
          },
          dry: {
            title: 'Q4. Which aroma or main character should stand out?',
            description: 'Choose up to two. This separates pork fat, minced pork, fish powder, spicy sesame, garlic, and lighter dry lines.',
          },
        },
      },
      body: {
        title: 'Q5. How heavy do you want it?',
        description: 'Use body, oil, and impact to tune the recommendation.',
        copyByForm: {
          soup: {
            title: 'Q5. How heavy should the soup be?',
            description: 'Use soup body, oil, and portion impact to tune the recommendation.',
          },
          tsukemen: {
            title: 'Q5. How rich and clingy should the dipping sauce be?',
            description: 'Use dipping-sauce thickness, oil, and noodle coating to tune the recommendation.',
          },
          dry: {
            title: 'Q5. How heavy should the oil and sauce feel?',
            description: 'Use sauce thickness, oil, and impact to tune the recommendation.',
          },
        },
      },
      noodle: {
        title: 'Q6. Which noodle shape is closest?',
        description: 'Noodle shape helps identify Hakata, Iekei, Sapporo, Jiro, tsukemen, and dry styles.',
        copyByForm: {
          soup: {
            title: 'Q6. Which noodle shape is closest?',
            description: 'Noodle shape is important for soup styles such as Hakata, Iekei, Sapporo, and Jiro.',
          },
          tsukemen: {
            title: 'Q6. Which tsukemen noodle shape is closest?',
            description: 'Tsukemen usually emphasizes chew, thickness, and sauce pickup.',
          },
          dry: {
            title: 'Q6. Which dry-noodle shape is closest?',
            description: 'Dry styles usually emphasize chew, sauce coating, and impact.',
          },
        },
      },
      signature: {
        title: 'Q7. Which signature cues do you want?',
        description: 'Choose up to two to tune Iekei, Sapporo, Jiro, gyokai, and citrus-leaning styles.',
      },
      exclusions: {
        title: 'Q8. Any allergies or strict no-go ingredients?',
        description: 'This only avoids ingredients you cannot eat; it does not add score to any style.',
      },
    },
    options: {},
    styles: {},
    bodyLabels: {
      light: 'Light',
      balanced: 'Balanced',
      rich: 'Rich',
      'backfat-heavy': 'Backfat-heavy',
      'ultra-heavy': 'Ultra-heavy',
    },
    noodleLabels: {
      'thin-straight': 'Thin straight noodles',
      'medium-thin-straight': 'Medium-thin straight noodles',
      'medium-thick-straight': 'Medium-thick straight noodles',
      'medium-thick-wavy': 'Medium-thick wavy noodles',
      'extra-thick': 'Extra-thick noodles',
    },
    intensityLabels: {
      clean: 'Clean',
      standard: 'Standard',
      heavy: 'Heavy',
    },
  },
  ja: {
    localeLabel: '日本語',
    app: {
      headline: '今日はどの一杯にする？',
      lede: '汁あり、つけ麺、汁なしを先に選び、味、濃さ、麺の感覚で今日の一杯に近づけます。',
      pills: ['形式から選ぶ', '苦手を避ける', '理由が読める'],
      introTitle: 'ラーメン知識より、今日の気分で選んでください。',
      introBody: 'あっさり、濃厚、魚介、辛味胡麻、もっちり麺など、回答に合わせて候補を絞ります。',
      statSteps: '質問',
      statSaved: '保存済み回答',
      statWeight: '結果理由',
      statWeightValue: '確認可',
      implementedTitle: 'できること',
      implemented: [
        '汁あり、つけ麺、汁なしを分けて推薦',
        '細分類に合わせて不要な選択肢を削除',
        '食べられない食材を避ける',
        '再読み込み後も続きから回答',
      ],
      start: '診断を始める',
      continue: '続きから回答',
      clear: '保存を削除',
    },
    questionUi: {
      step: (current, total) => `Step ${current} / ${total}`,
      multipleMeta: (max, current) => `${max}個まで選択可、現在${current}個`,
      singleMeta: '単一選択',
      back: '戻る',
      next: '次へ',
      results: '結果を見る',
    },
    results: {
      topMatch: 'Top Match',
      eatToday: (style) => `今日は ${style}`,
      confidence: '信頼度',
      descriptor: '組み合わせ',
      lowConfidenceTitle: '今回は探索寄りの結果です',
      lowConfidenceBody: '1位と2位の差が小さく、回答が複数のスタイルにまたがっています。',
      blockedTitle: '高得点のスタイルが除外されました',
      blockedBody: (style, blocked) =>
        `${style} も高得点でしたが、${blocked} を除外したため正式な推薦から外しました。`,
      adjust: '回答を調整',
      restart: '最初から',
      noResultsTitle: '表示できる結果がありません',
      noResultsBody: '高得点のスタイルがすべてハードフィルターで除外されています。Q8または他の回答を調整してください。',
      catalogTitle: 'おすすめ店舗 / メニュー',
      officialPage: '公式ページ',
      catalogEmpty: 'スタイル判定はできていますが、対応する店舗データはまだありません。',
      bonus: '加点',
      penalty: '減点',
      why: 'この一杯になる理由',
      answerPhrase: (answer) => `選んだ回答は「${answer}」`,
      scoreLabel: (points) => `データ点 +${points}`,
      nearbyEyebrow: 'Nearby Styles',
      nearbyTitle: '近い代替案',
      nearbyBody: 'これらも高得点ですが、最初に選んだ提供形式と異なるため主推薦には入れていません。',
      map: {
        title: '近くで食べるなら',
        body: (style) => `まず現在の「${style}」分類で地図を絞り込みます。店舗データはそのまま使います。`,
        region: '地域',
        style: 'ラーメン分類',
        search: '店名、住所、エリアを検索',
        allStyles: 'すべてのタイプ',
        resultCount: (count) => `${count} 件`,
        noShops: '条件に合う店舗はまだありません。',
        loading: '地図データを読み込み中',
        mapUnavailable: 'テスト環境ではインタラクティブ地図を読み込みませんが、店舗リストは確認できます。',
        selectedStyle: (style) => `現在の分類：${style}`,
        rating: '評価',
        reviews: (count) => `${count.toLocaleString('ja-JP')} 件の口コミ`,
        price: '価格',
        address: '住所',
        openMap: 'Google Maps を開く',
        officialSite: '公式サイト',
        dataNote: (date) => `データ更新：${date}`,
      },
      tierNotes: {
        exact: '主要なシグナルが一致。',
        adjacent: '方向性は近いが、最典型ではありません。',
        partial: '一部の手がかりだけ一致。',
        miss: 'この回答はスタイルから遠いです。',
      },
    },
    questions: {
      form: {
        title: 'Q1. 今日はどの形式が食べたいですか？',
        description: 'まず形式を分けて、汁ありラーメン、つけ麺、汁なしを混ぜないようにします。',
      },
      archetype: {
        title: 'Q2. どの輪郭に近いですか？',
        description: 'Q2の選択肢は、最初に選んだ形式に合わせて変わります。',
      },
      tare: {
        title: 'Q3. 主な味付けはどちら寄りですか？',
        description: '醤油、塩、味噌、辛味・胡麻、またはタレを強調しない方向を見分けます。',
        copyByForm: {
          soup: {
            title: 'Q3. スープの味付けはどちら寄りですか？',
            description: '醤油、塩、味噌、辛味・胡麻、またはタレを強調しないスープを見分けます。',
          },
          tsukemen: {
            title: 'Q3. つけ汁の味付けはどちら寄りですか？',
            description: '醤油、塩、味噌、辛味・胡麻、またはタレを強調しないつけ汁を見分けます。',
          },
          dry: {
            title: 'Q3. 和えダレの味付けはどちら寄りですか？',
            description: '醤油、塩、味噌、辛味・胡麻、またはタレを強調しない汁なしの味を見分けます。',
          },
        },
      },
      source: {
        title: 'Q4. どの出汁や主役を強く感じたいですか？',
        description: '2つまで選択できます。豚、鶏、鴨、魚介、貝などの主線を分けます。',
        copyByForm: {
          soup: {
            title: 'Q4. どの出汁や主役を強く感じたいですか？',
            description: '2つまで選択できます。豚、鶏、鴨、魚介、貝などのスープ主線を分けます。',
          },
          tsukemen: {
            title: 'Q4. つけ汁や昆布水では何を主役にしたいですか？',
            description: '2つまで選択できます。魚介、昆布、豚骨、鶏白湯、味噌などのつけ麺主線を分けます。',
          },
          dry: {
            title: 'Q4. どの香りや主役を強く感じたいですか？',
            description: '2つまで選択できます。豚脂、肉味噌、魚粉、辛味胡麻、ニンニク、軽めの汁なし主線を分けます。',
          },
        },
      },
      body: {
        title: 'Q5. どれくらい重めがいいですか？',
        description: '濃度、油脂感、インパクトで推薦を調整します。',
        copyByForm: {
          soup: {
            title: 'Q5. スープはどれくらい重めがいいですか？',
            description: 'スープの濃度、油脂感、量感で推薦を調整します。',
          },
          tsukemen: {
            title: 'Q5. つけ汁はどれくらい濃く、麺に絡むほうがいいですか？',
            description: 'つけ汁の濃度、油脂、絡み具合で推薦を調整します。',
          },
          dry: {
            title: 'Q5. 油感やタレ感はどれくらい重めがいいですか？',
            description: '和えダレの厚み、油脂感、インパクトで推薦を調整します。',
          },
        },
      },
      noodle: {
        title: 'Q6. 麺の形はどれに近いですか？',
        description: '麺の形は博多、家系、札幌、二郎、つけ麺、汁なしの判定に効きます。',
        copyByForm: {
          soup: {
            title: 'Q6. 麺の形はどれに近いですか？',
            description: '麺の形は博多、家系、札幌、二郎などの汁あり系で特に重要です。',
          },
          tsukemen: {
            title: 'Q6. つけ麺の麺はどれに近いですか？',
            description: 'つけ麺では噛み応え、太さ、つけ汁の絡みが重要です。',
          },
          dry: {
            title: 'Q6. 汁なしの麺はどれに近いですか？',
            description: '汁なしでは噛み応え、タレの絡み、インパクトが重要です。',
          },
        },
      },
      signature: {
        title: 'Q7. どの特徴的な要素がほしいですか？',
        description: '2つまで選択できます。家系、札幌、二郎、魚介、柑橘系を微調整します。',
      },
      exclusions: {
        title: 'Q8. アレルギーや絶対に避けたい食材はありますか？',
        description: '食べられない食材を避けるためだけに使い、どのスタイルにも加点しません。',
      },
    },
    options: {},
    styles: {},
    bodyLabels: {
      light: '淡麗',
      balanced: 'バランス型',
      rich: '濃厚',
      'backfat-heavy': '背脂重め',
      'ultra-heavy': '超濃厚・大盛り系',
    },
    noodleLabels: {
      'thin-straight': '細ストレート麺',
      'medium-thin-straight': '中細ストレート麺',
      'medium-thick-straight': '中太ストレート麺',
      'medium-thick-wavy': '中太ちぢれ麺',
      'extra-thick': '極太麺',
    },
    intensityLabels: {
      clean: '淡麗',
      standard: '標準',
      heavy: '重め',
    },
  },
}

const optionTranslations = {
  en: {
    form: {
      soup: ['Soup ramen', 'A regular bowl of ramen with soup; Q2 separates chintan and paitan.'],
      tsukemen: ['Tsukemen', 'Noodles and dipping sauce are served separately; the sauce profile matters.'],
      dry: ['Dry / abura soba', 'Almost no soup; oil aroma, mixed sauce, and spicy-sesame cues matter.'],
    },
    archetype: {
      chintan: ['Chintan', 'Clear, clean soup with a layered stock profile.'],
      paitan: ['Paitan', 'Cloudy emulsified soup with more body and coating power.'],
      'konbusui-light': ['Light kombu-water', 'Noodles carry kombu water, with a clean and refreshing line.'],
      'gyokai-rich': ['Rich gyokai', 'Bonito, fish powder, and seafood dipping sauce stand out.'],
      'miso-rich': ['Rich miso', 'The dipping sauce leans miso-forward, thick, and roasted.'],
      'tsukemen-other': ['Other tsukemen', 'You want tsukemen but not one of the specific profiles above.'],
      aburasoba: ['Abura soba', 'Oil and soy-based sauce lead rather than spicy sesame.'],
      'taiwan-mazesoba': ['Taiwan mazesoba', 'Minced pork, garlic, spice, and a strong mixed-sauce feel.'],
      'soupless-tantan': ['Soupless tantanmen', 'Spicy, numbing, sesame-forward dry noodles.'],
      'dry-other': ['Other dry style', 'You want a dry style without locking into the listed categories.'],
    },
    tare: {
      shoyu: ['Shoyu', 'Clear soy-sauce aroma and savory saltiness.'],
      shio: ['Shio', 'Lets the stock, dipping sauce, or sauce base speak more directly.'],
      miso: ['Miso', 'Fermented depth with a round sweet-salty profile.'],
      'spicy-sesame': ['Spicy / sesame', 'For spicy, sesame, tantan, or Taiwan mazesoba directions.'],
      none: ['Plain / not tare-forward', 'Not bland; it lets the main base or ingredients lead.'],
    },
    source: {
      pork: ['Pork', 'Pork bone, chashu fat, pork fat, or minced pork depending on format.'],
      chicken: ['Chicken', 'Chicken stock, chicken oil, chicken paitan, or chicken aroma.'],
      duck: ['Duck', 'Duck oil, duck chintan, duck paitan, or duck as the main ingredient.'],
      beef: ['Beef', 'Beef bone or beef aroma as the main character.'],
      'fish-seafood': ['Gyokai', 'Dried fish, bonito, niboshi, fish powder, and seafood notes.'],
      shellfish: ['Shellfish', 'Clams, shijimi, scallops, and briny shellfish umami.'],
      'shrimp-crab': ['Shrimp / crab', 'Shellfish sweetness and concentrated crustacean aroma.'],
      vegetable: ['Vegetable', 'A cleaner plant-based or vegetable-sweetness direction.'],
      mixed: ['Mixed', 'You want complexity without choosing one main source.'],
      unsure: ['Not sure', 'Let the other answers decide first.'],
    },
    body: {
      light: ['Light', 'Clean lines and a crisp finish.'],
      balanced: ['Balanced', 'Layered but not heavy.'],
      rich: ['Rich', 'The soup, dipping sauce, or mixed sauce has more body.'],
      'backfat-heavy': ['Backfat-heavy', 'More oil, saltiness, and weight.'],
      'ultra-heavy': ['Ultra-heavy', 'A clear push toward maximum impact and volume.'],
    },
    noodle: {
      'thin-straight': ['Thin straight', 'Fast bite and direct soup pickup.'],
      'medium-thin-straight': ['Medium-thin straight', 'Clean but with a little more chew.'],
      'medium-thick-straight': ['Medium-thick straight', 'Can carry thick soup, dipping sauce, or mixed sauce.'],
      'medium-thick-wavy': ['Medium-thick wavy', 'Good sauce pickup; common in miso lines.'],
      'extra-thick': ['Extra-thick', 'Strong chew, volume, and dry-noodle impact.'],
    },
    signature: {
      'nori-spinach': ['Nori + spinach', 'A common Iekei recognition cue.'],
      'corn-butter': ['Corn + butter', 'A common Sapporo and miso-line marker.'],
      'bean-sprout-garlic-backfat': ['Bean sprouts + garlic + backfat', 'Clearly leans toward Jiro or high-impact styles.'],
      'fish-kombu': ['Fish powder / bonito / kombu', 'Important for gyokai and kombu-water lines.'],
      'yuzu-citrus': ['Yuzu / citrus', 'Often brightens chintan, duck, and shellfish styles.'],
      'no-preference': ['No preference', 'Do not let signature toppings decide the result yet.'],
    },
    exclusions: {
      pork: ['Pork', 'Exclude pork bone, pork fat, and pork-forward styles.'],
      chicken: ['Chicken', 'Exclude chicken stock, chicken paitan, and chicken fat.'],
      duck: ['Duck', 'Exclude duck chintan, duck paitan, and duck oil.'],
      beef: ['Beef', 'Exclude beef-bone and beef-forward styles.'],
      'fish-seafood': ['Fish / gyokai', 'Exclude dried fish, bonito, niboshi, fish powder, and gyokai stock.'],
      shellfish: ['Shellfish', 'Exclude clam, shijimi, and shellfish-dashi flavors.'],
      'shrimp-crab': ['Shrimp / crab', 'Exclude shrimp oil, crab notes, and crustacean flavors.'],
      dairy: ['Dairy', 'Exclude butter or dairy-based elements.'],
      none: ['None', 'No hard exclusion.'],
    },
  },
  ja: {
    form: {
      soup: ['汁ありラーメン', '一般的なスープ入りの一杯。後で清湯か白湯に分けます。'],
      tsukemen: ['つけ麺', '麺とつけ汁が分かれており、つけ汁の輪郭が重要です。'],
      dry: ['汁なし / 油そば', 'ほぼスープがなく、油の香り、和えダレ、辛味胡麻が重要です。'],
    },
    archetype: {
      chintan: ['清湯', '澄んだスープで、出汁の層がはっきりします。'],
      paitan: ['白湯', '乳化して白濁した、厚みと包み込みのあるスープ。'],
      'konbusui-light': ['昆布水あっさり', '麺が昆布水をまとい、すっきりした線で食べます。'],
      'gyokai-rich': ['濃厚魚介', '節、魚粉、魚介の濃いつけ汁感が強いタイプ。'],
      'miso-rich': ['濃厚味噌', '味噌、厚み、炒め香が前に出るつけ汁。'],
      'tsukemen-other': ['その他のつけ麺', 'つけ麺が食べたいが、上の輪郭には限定しない。'],
      aburasoba: ['油そば', '辛味胡麻より油の香りと醤油ダレが主役。'],
      'taiwan-mazesoba': ['台湾まぜそば', '肉味噌、ニンニク、スパイス、強い和え感が主役。'],
      'soupless-tantan': ['汁なし担々', '辛味、しびれ、胡麻が前に出る汁なし。'],
      'dry-other': ['その他の汁なし', '汁なしが食べたいが、既存分類に縛られたくない。'],
    },
    tare: {
      shoyu: ['醤油', '醤油の香りと塩味、旨味がはっきりします。'],
      shio: ['塩', '出汁、つけ汁、和えダレの輪郭をより直接感じます。'],
      miso: ['味噌', '発酵の厚みと甘じょっぱい味わいが明確です。'],
      'spicy-sesame': ['辛味 / 胡麻', '辛味、胡麻、担々、台湾まぜそば方向。'],
      none: ['素味 / 強調しない', '薄味ではなく、主役の素材やベースを前に出す方向。'],
    },
    source: {
      pork: ['豚', '豚骨、チャーシュー脂、豚脂、肉味噌など。'],
      chicken: ['鶏', '鶏スープ、鶏油、鶏白湯、鶏の香り。'],
      duck: ['鴨', '鴨油、鴨清湯、鴨白湯、鴨肉の主役感。'],
      beef: ['牛', '牛骨または牛肉の香りが主役。'],
      'fish-seafood': ['魚介', '煮干し、節、魚粉、海の旨味。'],
      shellfish: ['貝類', 'あさり、しじみ、帆立などの塩味と旨味。'],
      'shrimp-crab': ['海老 / 蟹', '甲殻類の甘味と濃縮した香り。'],
      vegetable: ['野菜', 'よりクリーンな植物系、または野菜の甘味。'],
      mixed: ['ミックス', '単一素材に絞らず複合感を求める。'],
      unsure: ['わからない', 'まず他の回答から結果を決めます。'],
    },
    body: {
      light: ['淡麗', '線がきれいで、後味がすっきり。'],
      balanced: ['バランス型', '層はあるが重すぎない。'],
      rich: ['濃厚', 'スープ、つけ汁、和えダレに明確な厚みがある。'],
      'backfat-heavy': ['背脂重め', '油脂、塩味、厚みをさらに強める。'],
      'ultra-heavy': ['超濃厚・大盛り系', '量感とインパクトをはっきり求める。'],
    },
    noodle: {
      'thin-straight': ['細ストレート', '口当たりが速く、スープを直接拾います。'],
      'medium-thin-straight': ['中細ストレート', 'すっきり感を残しつつ、少し噛み応えがあります。'],
      'medium-thick-straight': ['中太ストレート', '濃いスープ、つけ汁、和えダレを受け止めます。'],
      'medium-thick-wavy': ['中太ちぢれ', 'タレやスープを拾いやすく、味噌系にも多い形。'],
      'extra-thick': ['極太', '量感、噛み応え、汁なしのインパクトが強い。'],
    },
    signature: {
      'nori-spinach': ['海苔 + ほうれん草', '家系を見分ける代表的な手がかり。'],
      'corn-butter': ['コーン + バター', '味噌、札幌系でよく見る記号。'],
      'bean-sprout-garlic-backfat': ['もやし + ニンニク + 背脂', '二郎系や高インパクト系に寄る手がかり。'],
      'fish-kombu': ['魚粉 / 節 / 昆布', '魚介系や昆布水系の重要な手がかり。'],
      'yuzu-citrus': ['柚子 / 柑橘', '清湯、鴨、貝系を明るくする要素。'],
      'no-preference': ['特になし', '特徴的な具材で結果を決めすぎない。'],
    },
    exclusions: {
      pork: ['豚', '豚骨、豚脂、豚肉が強いスタイルを除外。'],
      chicken: ['鶏', '鶏スープ、鶏白湯、鶏脂を除外。'],
      duck: ['鴨', '鴨清湯、鴨白湯、鴨油を除外。'],
      beef: ['牛', '牛骨、牛の香りが強い系統を除外。'],
      'fish-seafood': ['魚 / 魚介', '煮干し、節、魚粉、魚介出汁を除外。'],
      shellfish: ['貝類', 'しじみ、あさり、貝出汁などを除外。'],
      'shrimp-crab': ['エビ / カニ', 'エビ油、カニ風味、甲殻類の旨味を除外。'],
      dairy: ['乳製品', 'バターや乳製品系の要素を除外。'],
      none: ['なし', 'ハードな除外はありません。'],
    },
  },
} satisfies Record<'en' | 'ja', Partial<Record<QuestionId, Record<string, [string, string]>>>>

for (const locale of ['en', 'ja'] as const) {
  dictionaries[locale].options = Object.fromEntries(
    Object.entries(optionTranslations[locale]).map(([questionId, options]) => [
      questionId,
      Object.fromEntries(
        Object.entries(options).map(([value, [label, description]]) => [
          value,
          { label, description },
        ]),
      ),
    ]),
  ) as Dictionary['options']
}

const styleTranslations = {
  en: {
    'shoyu-chintan': ['Shoyu chintan', 'A clear soup line where soy sauce and the main stock stay sharply defined.'],
    'shio-chintan': ['Shio chintan', 'Salt seasoning brings out the transparent quality of the clear stock.'],
    miso: ['Miso ramen', 'Miso aroma, body, and roasted depth support the bowl, often with thicker noodles.'],
    tonkotsu: ['Tonkotsu', 'A pork-bone style built around milky body, pork aroma, and direct richness.'],
    'chicken-chintan': ['Chicken chintan', 'A clean chicken-stock line with chicken aroma and clear umami.'],
    'chicken-paitan': ['Chicken paitan', 'Cloudy chicken soup with a round, coating body.'],
    'duck-chintan': ['Duck chintan', 'Clear duck stock and duck oil create a clean but distinctive profile.'],
    'duck-paitan': ['Duck paitan', 'A richer duck line with cloudy body and stronger coating power.'],
    gyokai: ['Gyokai', 'Fish, bonito, niboshi, and seafood notes define the main direction.'],
    'shellfish-dashi': ['Shellfish dashi', 'Shellfish umami such as clams, shijimi, or scallops leads the bowl.'],
    iekei: ['Iekei', 'Pork-bone shoyu, medium-thick straight noodles, nori, and spinach form the key identity.'],
    jiro: ['Jiro-style', 'A high-impact line built around volume, thick noodles, garlic, backfat, and bean sprouts.'],
    hakata: ['Hakata', 'Thin straight noodles and pork-bone soup define this fast, focused tonkotsu line.'],
    sapporo: ['Sapporo', 'Miso, wok-roasted depth, and medium-thick wavy noodles create the classic line.'],
    'konbusui-tsukemen': ['Kombu-water tsukemen', 'Kombu-water noodles and a lighter dipping sauce define this style.'],
    'gyokai-tsukemen': ['Rich gyokai tsukemen', 'A thick gyokai dipping sauce, bonito aroma, and sauce-holding noodles define this line.'],
    aburasoba: ['Abura soba', 'A dry style led by oil aroma, soy-based sauce, and mixed-noodle rhythm.'],
    'taiwan-mazesoba': ['Taiwan mazesoba / soupless tantan', 'Spicy-sesame, minced pork, garlic, and high-impact dry mixing lead this line.'],
  },
  ja: {
    'shoyu-chintan': ['醤油清湯', '澄んだ清湯の線で、醤油と主出汁の輪郭をはっきり保つスタイル。'],
    'shio-chintan': ['塩清湯', '塩味で清湯の透明感を引き出し、出汁そのものを感じやすいスタイル。'],
    miso: ['味噌ラーメン', '味噌の香り、厚み、炒め香で支える一杯。太めの麺とも相性がよい。'],
    tonkotsu: ['豚骨ラーメン', '白濁した豚骨の厚み、豚の香り、直接的な濃さが中心。'],
    'chicken-chintan': ['鶏清湯', '鶏出汁と鶏油の香りを澄んだ形で出す清湯系。'],
    'chicken-paitan': ['鶏白湯', '白濁した鶏スープで、丸みと包み込みのあるスタイル。'],
    'duck-chintan': ['鴨清湯', '鴨出汁と鴨油を澄んだ線で見せるスタイル。'],
    'duck-paitan': ['鴨白湯', '鴨の濃度と白湯の厚みを前に出すリッチな系統。'],
    gyokai: ['魚介', '節、煮干し、魚粉、海の旨味が主線になるスタイル。'],
    'shellfish-dashi': ['貝出汁', 'あさり、しじみ、帆立などの貝の旨味が主役。'],
    iekei: ['家系', '豚骨醤油、中太ストレート麺、海苔、ほうれん草が主要な識別要素。'],
    jiro: ['二郎系', '量、極太麺、ニンニク、背脂、もやしのインパクトで構成される系統。'],
    hakata: ['博多', '細ストレート麺と豚骨スープが中心の、速く食べる豚骨系。'],
    sapporo: ['札幌', '味噌、炒め香、中太ちぢれ麺で構成されるクラシックな系統。'],
    'konbusui-tsukemen': ['昆布水つけ麺', '昆布水をまとった麺と軽めのつけ汁で成立するスタイル。'],
    'gyokai-tsukemen': ['濃厚魚介つけ麺', '濃厚な魚介つけ汁、節の香り、つけ汁を拾う麺が中心。'],
    aburasoba: ['油そば', 'スープではなく、油の香り、醤油ダレ、和え麺のリズムで成立する汁なし。'],
    'taiwan-mazesoba': ['台湾まぜそば / 汁なし担々', '辛味胡麻、肉味噌、ニンニク、強い和え感が中心の汁なし系。'],
  },
} satisfies Record<'en' | 'ja', Record<string, [string, string]>>

for (const locale of ['en', 'ja'] as const) {
  dictionaries[locale].styles = Object.fromEntries(
    Object.entries(styleTranslations[locale]).map(([id, [label, summary]]) => [
      id,
      { label, summary },
    ]),
  )
}

const reasonTranslations: Record<'en' | 'ja', Record<string, string>> = {
  en: {
    清湯醬油主線完整: 'Complete shoyu chintan signal',
    清湯鹽味主線完整: 'Complete shio chintan signal',
    極濃爆量訊號壓過淡麗清湯: 'Ultra-heavy signal overrides delicate chintan',
    味噌厚湯輪廓完整: 'Complete rich miso profile',
    白濁豚骨輪廓明確: 'Clear cloudy tonkotsu profile',
    雞清湯主線完整: 'Complete chicken chintan signal',
    雞白湯輪廓完整: 'Complete chicken paitan profile',
    淡麗鴨清湯輪廓完整: 'Complete light duck chintan profile',
    淡麗鴨系與二郎訊號互斥: 'Light duck and Jiro signals conflict',
    鴨白湯輪廓完整: 'Complete duck paitan profile',
    魚介主線完整: 'Complete gyokai signal',
    貝出汁輪廓完整: 'Complete shellfish dashi signal',
    貝系淡麗與二郎訊號互斥: 'Light shellfish and Jiro signals conflict',
    家系標誌同時成立: 'Iekei signature cues align',
    家系若選細直麵會向博多偏移: 'Thin straight noodles pull Iekei toward Hakata',
    二郎標誌同時成立: 'Jiro signature cues align',
    柚子淡麗訊號應壓制二郎置信度: 'Yuzu and light cues should suppress Jiro confidence',
    鴨貝淡麗路徑不應推向二郎: 'Light duck-shellfish path should not push toward Jiro',
    博多細直豚骨成立: 'Hakata thin-straight tonkotsu signal aligns',
    札幌味噌訊號完整: 'Complete Sapporo miso signal',
    昆布水沾麵輪廓完整: 'Complete kombu-water tsukemen profile',
    濃厚魚介沾麵訊號完整: 'Complete rich gyokai tsukemen signal',
    油そば輪廓完整: 'Complete abura soba profile',
    '台灣まぜ或汁なし担々輪廓完整': 'Complete Taiwan mazesoba or soupless tantan profile',
    '台灣まぜ若完全不強調調味，置信度應下降': 'Taiwan mazesoba loses confidence when tare is not emphasized',
  },
  ja: {
    清湯醬油主線完整: '醤油清湯の主線が揃っている',
    清湯鹽味主線完整: '塩清湯の主線が揃っている',
    極濃爆量訊號壓過淡麗清湯: '超濃厚・大盛り系の信号が淡麗清湯を上回る',
    味噌厚湯輪廓完整: '濃厚味噌の輪郭が揃っている',
    白濁豚骨輪廓明確: '白濁豚骨の輪郭が明確',
    雞清湯主線完整: '鶏清湯の主線が揃っている',
    雞白湯輪廓完整: '鶏白湯の輪郭が揃っている',
    淡麗鴨清湯輪廓完整: '淡麗鴨清湯の輪郭が揃っている',
    淡麗鴨系與二郎訊號互斥: '淡麗鴨系と二郎系の信号は相反する',
    鴨白湯輪廓完整: '鴨白湯の輪郭が揃っている',
    魚介主線完整: '魚介の主線が揃っている',
    貝出汁輪廓完整: '貝出汁の輪郭が揃っている',
    貝系淡麗與二郎訊號互斥: '淡麗貝系と二郎系の信号は相反する',
    家系標誌同時成立: '家系の特徴が揃っている',
    家系若選細直麵會向博多偏移: '細ストレート麺は家系を博多寄りにずらす',
    二郎標誌同時成立: '二郎系の特徴が揃っている',
    柚子淡麗訊號應壓制二郎置信度: '柚子と淡麗の信号は二郎系の信頼度を下げる',
    鴨貝淡麗路徑不應推向二郎: '淡麗な鴨・貝の経路は二郎系に寄せない',
    博多細直豚骨成立: '博多の細ストレート豚骨が成立',
    札幌味噌訊號完整: '札幌味噌の信号が揃っている',
    昆布水沾麵輪廓完整: '昆布水つけ麺の輪郭が揃っている',
    濃厚魚介沾麵訊號完整: '濃厚魚介つけ麺の信号が揃っている',
    油そば輪廓完整: '油そばの輪郭が揃っている',
    '台灣まぜ或汁なし担々輪廓完整': '台湾まぜそばまたは汁なし担々の輪郭が揃っている',
    '台灣まぜ若完全不強調調味，置信度應下降': '台湾まぜそばはタレを強調しない場合、信頼度を下げる',
  },
}

const catalogTranslations: Record<Locale, {
  matchReasons: Record<string, string>
  stores: Record<string, [string, string, string]>
  items: Record<string, [string, string]>
}> = {
  'zh-TW': {
    matchReasons: {
      '風格、核心型別與麵型都直接對上。': '風格、核心型別與麵型都直接對上。',
      '風格與核心型別吻合，適合直接落到實際品項。': '風格與核心型別吻合，適合直接落到實際品項。',
      '至少對上前台風格，可以當作探索起點。': '至少對上前台風格，可以當作探索起點。',
    },
    stores: {
      'ippudo-japan': ['一風堂', '日本全國展店', '以博多豚骨為主軸，提供白丸元味、赤丸新味與からか麺等豚骨系品項。'],
      'yamatoya-japan': ['横浜家系ラーメン大和家', '日本全國展店', '以豚骨醬油湯與中太麵為招牌，也提供 631 拉麵與魚介沾麵的家系連鎖店。'],
      'tokyo-aburagumi': ['東京油組総本店', '日本全國展店', '以老舖製麵所背景、自家製麵與秘傳醬汁為主打的油拌麵專門店。'],
      'menya-hanabi': ['麺屋はなび', '名古屋本店 / 海外展店', '台灣拌麵（台灣まぜそば）發祥店，以極太麵搭配台灣肉味噌的無湯乾拌麵為招牌。'],
      'chukasoba-tomita': ['中華蕎麦とみ田', '千葉縣松戶市', '以超濃厚豚骨魚介湯與自家製極太麵聞名的松戶沾麵名店。'],
    },
    items: {
      'ippudo-shiromaru': ['白丸元味', '延續創業當時味道的一碗，結合滑順豚骨湯、鹽味基底 kaeshi 與俐落細麵。'],
      'ippudo-akamaru': ['赤丸新味', '加入蒜香香油與特製辛味噌，呈現更有厚度與深度的豚骨拉麵。'],
      'yamatoya-631-ramen': ['631ラーメン 醤油', '凸顯豚骨醬油湯與中太麵的大和家招牌拉麵。'],
      'yamatoya-ramen-shoyu': ['ラーメン 醤油', '以豚骨醬油湯與中太麵為核心、較標準取向的家系拉麵。'],
      'yamatoya-tsukemen-gyokai': ['つけ麺 魚介', '以魚介風味沾汁食用的沾麵線，作為偏魚介沾麵的探索品項。'],
      'aburagumi-aburasoba': ['油拌麵（油そば）', '使用濃厚特製醬汁的東京油組総本店定番油拌麵。'],
      'aburagumi-karamiso-aburasoba': ['辛味噌油拌麵', '以微辣辛味拉出風味、整體更重口的油拌麵。'],
      'hanabi-taiwan-mazesoba': ['台灣拌麵（台湾まぜそば）', '將辣椒與大蒜風味的醬油台灣肉味噌鋪在極太麵上的元祖無湯乾拌麵。'],
      'tomita-tsukemen': ['つけ麺', '以超濃厚豚骨魚介湯與獨特自家製極太麵構成的とみ田代表品項。'],
    },
  },
  en: {
    matchReasons: {
      '風格、核心型別與麵型都直接對上。': 'Style, core type, and noodle subtype all match directly.',
      '風格與核心型別吻合，適合直接落到實際品項。': 'The style and core type match, so this is a practical menu-level fit.',
      '至少對上前台風格，可以當作探索起點。': 'At least the display style matches, so treat it as an exploration starting point.',
    },
    stores: {
      'ippudo-japan': ['Ippudo', 'Japan nationwide', 'A tonkotsu-focused chain built around Hakata ramen, including Shiromaru Motoaji, Akamaru Shinaji, and Karaka-men.'],
      'yamatoya-japan': ['Yokohama Iekei Ramen Yamatoya', 'Japan nationwide', 'An Iekei chain known for pork-bone shoyu soup and medium-thick noodles, with 631 Ramen and gyokai tsukemen lines.'],
      'tokyo-aburagumi': ['Tokyo Abura-gumi Sohonten', 'Japan nationwide', 'An abura soba specialist built around house-made noodles from a long-running noodle maker and a secret tare.'],
      'menya-hanabi': ['Menya Hanabi', 'Nagoya flagship / overseas', 'The birthplace of Taiwan mazesoba, known for soupless noodles topped with spicy minced pork on extra-thick noodles.'],
      'chukasoba-tomita': ['Chuka Soba Tomita', 'Matsudo, Chiba', 'A Matsudo tsukemen shop known for ultra-rich tonkotsu-gyokai soup and house-made extra-thick noodles.'],
    },
    items: {
      'ippudo-shiromaru': ['Shiromaru Motoaji', 'The original Ippudo bowl: smooth tonkotsu soup, shio-based kaeshi, and crisp thin noodles.'],
      'ippudo-akamaru': ['Akamaru Shinaji', 'A deeper tonkotsu ramen eaten while mixing in garlic aroma oil and special spicy miso.'],
      'yamatoya-631-ramen': ['631 Ramen Shoyu', 'Yamatoya’s signature ramen, centered on pork-bone shoyu soup and medium-thick noodles.'],
      'yamatoya-ramen-shoyu': ['Ramen Shoyu', 'A more standard Iekei ramen built around pork-bone shoyu soup and medium-thick noodles.'],
      'yamatoya-tsukemen-gyokai': ['Tsukemen Gyokai', 'A tsukemen line eaten with gyokai-flavored dipping sauce, useful as a gyokai-tsukemen exploration pick.'],
      'aburagumi-aburasoba': ['Abura soba', 'Tokyo Abura-gumi Sohonten’s standard abura soba with a rich special tare.'],
      'aburagumi-karamiso-aburasoba': ['Spicy miso abura soba', 'A heavier abura soba lifted by a sharp spicy-miso accent.'],
      'hanabi-taiwan-mazesoba': ['Taiwan mazesoba', 'The original soupless noodle bowl with soy-seasoned spicy minced pork, chili, and garlic on extra-thick noodles.'],
      'tomita-tsukemen': ['Tsukemen', 'Tomita’s signature line built around ultra-rich tonkotsu-gyokai soup and unique house-made extra-thick noodles.'],
    },
  },
  ja: {
    matchReasons: {
      '風格、核心型別與麵型都直接對上。': 'スタイル、核心タイプ、麺タイプがすべて直接一致しています。',
      '風格與核心型別吻合，適合直接落到實際品項。': 'スタイルと核心タイプが合っており、実際のメニューに落とし込みやすい候補です。',
      '至少對上前台風格，可以當作探索起點。': '少なくとも表示スタイルが一致しているため、探索の出発点として使えます。',
    },
    stores: {
      'ippudo-japan': ['一風堂', '日本・全国展開', '博多とんこつを軸に、白丸元味・赤丸新味・からか麺を展開する豚骨系チェーン。'],
      'yamatoya-japan': ['横浜家系ラーメン大和家', '日本・全国展開', '豚骨醤油スープと中太麺を看板に、631ラーメンや魚介つけ麺も展開する家系チェーン。'],
      'tokyo-aburagumi': ['東京油組総本店', '日本・全国展開', '老舗製麺所発祥の自家製麺と秘伝のタレを売りにする油そば専門店。'],
      'menya-hanabi': ['麺屋はなび', '名古屋本店 / 海外展開', '台湾まぜそば発祥店。台湾ミンチを極太麺にのせた汁無し麺を看板に展開。'],
      'chukasoba-tomita': ['中華蕎麦とみ田', '千葉県松戸市', '超濃厚豚骨魚介スープと自家製極太麺で知られる松戸のつけ麺店。'],
    },
    items: {
      'ippudo-shiromaru': ['白丸元味', '創業当時からの味を今に引き継ぐ一杯。なめらかなとんこつスープに塩ベースのかえし、歯切れのよい細麺を合わせる。'],
      'ippudo-akamaru': ['赤丸新味', 'にんにくの風味が効いた香油と特製辛味噌を溶かしながら食べる、コクと深みのある豚骨ラーメン。'],
      'yamatoya-631-ramen': ['631ラーメン 醤油', '豚骨醤油スープと中太麺を押し出した、大和家の看板ラーメン。'],
      'yamatoya-ramen-shoyu': ['ラーメン 醤油', '豚骨醤油スープと中太麺を軸にした、より標準寄りの家系ラーメン。'],
      'yamatoya-tsukemen-gyokai': ['つけ麺 魚介', '魚介味のつけ汁で食べるつけ麺ライン。家系より魚介つけ麺寄りの探索用。'],
      'aburagumi-aburasoba': ['油そば', 'コクのある特製タレを使用した、東京油組総本店の定番油そば。'],
      'aburagumi-karamiso-aburasoba': ['辛味噌油そば', 'ピリッとした辛味で味を引き立てる、より重めの油そば。'],
      'hanabi-taiwan-mazesoba': ['台湾まぜそば', '唐辛子とニンニクを効かせた醤油味の台湾ミンチを極太麺に乗せた、元祖の汁無し麺。'],
      'tomita-tsukemen': ['つけ麺', '超濃厚豚骨魚介スープと唯一無二の自家製極太麺で食べる、とみ田の代表線。'],
    },
  },
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}

export function localizeQuestion(
  question: QuestionDefinition,
  locale: Locale,
  form?: FormOption,
): QuestionDefinition {
  const translated = dictionaries[locale].questions[question.id]
  const formCopy = form ? translated?.copyByForm?.[form] : undefined
  const fallbackFormCopy = form ? question.copyByForm?.[form] : undefined

  return {
    ...question,
    title: formCopy?.title ?? translated?.title ?? fallbackFormCopy?.title ?? question.title,
    description:
      formCopy?.description ??
      translated?.description ??
      fallbackFormCopy?.description ??
      question.description,
    copyByForm: undefined,
  }
}

export function localizeOption(
  questionId: QuestionId,
  option: ChoiceOption,
  locale: Locale,
  form?: FormOption,
): ChoiceOption {
  const translated = dictionaries[locale].options[questionId]?.[option.value]
  const formDescription = form ? translated?.descriptionByForm?.[form] : undefined
  const fallbackFormDescription = form ? option.descriptionByForm?.[form] : undefined

  return {
    ...option,
    label: translated?.label ?? option.label,
    description: formDescription ?? translated?.description ?? fallbackFormDescription ?? option.description,
    descriptionByForm: undefined,
  }
}

export function localizeOptionLabel(
  questionId: QuestionId,
  value: string,
  fallback: string,
  locale: Locale,
) {
  return dictionaries[locale].options[questionId]?.[value]?.label ?? fallback
}

export function localizeAnswerLabel(
  questionId: QuestionId,
  values: readonly string[],
  fallback: string,
  locale: Locale,
) {
  const labels = values.map((value) =>
    dictionaries[locale].options[questionId]?.[value]?.label,
  )

  return labels.length && labels.every(Boolean)
    ? labels.join(' / ')
    : fallback
}

export function localizeStyle(
  result: RankedStyle,
  locale: Locale,
) {
  const translated = dictionaries[locale].styles[result.style.id]

  return {
    label: translated?.label ?? result.style.label,
    summary: translated?.summary ?? result.style.summary,
  }
}

export function formatCoreDescriptor(result: RankedStyle, locale: Locale) {
  const dictionary = dictionaries[locale]
  const style = localizeStyle(result, locale).label
  const intensity = dictionary.intensityLabels[result.coreType.intensity]
  const noodle = dictionary.noodleLabels[result.subtype.noodle]

  return `${style} / ${intensity} / ${noodle}`
}

export function localizeQuestionTitle(
  questionId: QuestionId,
  fallback: string,
  locale: Locale,
) {
  return dictionaries[locale].questions[questionId]?.title ?? fallback
}

export function localizeBodyLabel(value: BodyOption, locale: Locale) {
  return dictionaries[locale].bodyLabels[value]
}

export function localizeReason(reason: string, locale: Locale) {
  if (locale === 'zh-TW') {
    return reason
  }

  const match = reason.match(/^(.*) ([+-]\d+(?:\.\d+)?)$/)
  if (!match) {
    return reason
  }

  const [, label, points] = match
  const translated = reasonTranslations[locale][label]

  return translated ? `${translated} ${points}` : reason
}

export function localizeCatalogMatchReason(reason: string, locale: Locale) {
  return catalogTranslations[locale].matchReasons[reason] ?? reason
}

export function localizeStore(store: StoreDefinition, locale: Locale) {
  const translated = catalogTranslations[locale].stores[store.id]

  return translated
    ? {
      ...store,
      name: translated[0],
      location: translated[1],
      summary: translated[2],
    }
    : store
}

export function localizeMenuItem(item: MenuItemDefinition, locale: Locale) {
  const translated = catalogTranslations[locale].items[item.id]

  return translated
    ? {
      ...item,
      name: translated[0],
      summary: translated[1],
    }
    : item
}
