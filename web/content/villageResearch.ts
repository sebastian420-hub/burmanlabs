/**
 * The Village research page: goals, where the project is, what it has found,
 * and how the simulation works. Every number here comes from a recorded run
 * in the digital_sim repo (runs/*.json); keep it that way when editing.
 * Burmese text: please have a native speaker check it.
 */
import type { Locale } from "@/lib/i18n";

type Card = { t: string; d: string };
type Stat = { n: string; t: string; d: string };
type Status = { tag: "built" | "testing" | "waiting" | "next"; t: string; d: string };

export interface VillageResearch {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; lead: string };
  goal: { eyebrow: string; title: string; body: string[]; questions: Card[]; split: { brain: Card; window: Card } };
  status: { eyebrow: string; title: string; intro: string; tags: Record<Status["tag"], string>; items: Status[]; cannot: { t: string; d: string[] } };
  findings: { eyebrow: string; title: string; society: string; minds: string; societyStats: Stat[]; mindStats: Stat[]; source: string };
  how: {
    eyebrow: string;
    title: string;
    intro: string;
    world: { t: string; facts: Card[] };
    loop: { t: string; d: string; steps: Card[] };
    actions: { t: string; d: string; list: string[] };
    mind: { t: string; items: Card[] };
    honest: { t: string; items: Card[] };
    cost: { t: string; stats: Stat[]; d: string };
    daily: { t: string; steps: string[] };
  };
  next: { eyebrow: string; title: string; items: { when: string; t: string; d: string }[] };
  cta: { watch: string };
}

const en: VillageResearch = {
  meta: {
    title: "The Village: the research",
    description: "What we are trying to learn from a village of AI agents, where the project stands, and how the simulation works.",
  },
  hero: {
    eyebrow: "The Village · Research",
    title: "Can AI agents build a civilisation nobody designed?",
    lead:
      "The Village is an open experiment. Its people are AI agents, and the only thing we give them is the truth about their world. Who trades, who teaches, who builds and who goes hungry is up to them. This page explains what we are after, where we are, and how it works underneath.",
  },
  goal: {
    eyebrow: "The goal",
    title: "A world where AI builds society from scratch",
    body: [
      "The long-term aim is a living world you can watch like a strategy game: people gathering, farming, building houses and markets, founding villages, forming families, trading between towns. The difference from a game is that nobody scripts any of it. Every choice is made by an AI agent that only knows what is true about its surroundings.",
      "A language model on its own is a brain in a jar: it can reason, but it has no body, no hunger, no neighbours and no tomorrow. The Village gives it a body and a world with consequences. If a society appears, it appears because the agents needed one.",
    ],
    questions: [
      {
        t: "The society",
        d: "Do trade, jobs, money, shared stores, inequality and settlements appear on their own? Under what conditions, and what makes them collapse?",
      },
      {
        t: "The minds",
        d: "What can AI agents really do when nobody steers them: remember people, keep promises, plan ahead, act on a single fact? Their failures are results too.",
      },
    ],
    split: {
      brain: {
        t: "Our logic: the brain",
        d: "The world's rules, the facts each agent sees, memory, ownership, births and every decision. Measured and tested. This is the part we are building now.",
      },
      window: {
        t: "The game: the window",
        d: "A view that shows what the brain decided: today the angled map on this site, later a 3D world. It draws the story; it never makes a choice.",
      },
    },
  },
  status: {
    eyebrow: "Where we are",
    title: "One village, one world that never resets",
    intro:
      "Twelve founders live on a 40 × 40 map. The world now runs as one continuous story: each episode continues from exactly where the last one stopped, and is published here with a replay and a written account. Until the first daily episode, the page shows a recorded 400-tick test run.",
    tags: { built: "Built", testing: "Testing", waiting: "Ready to run", next: "Next" },
    items: [
      { tag: "built", t: "One world, every day", d: "The world is saved after every episode and resumed the next day: 400 ticks (about 16 village days) per episode, a replay, and a story written only from what was recorded." },
      { tag: "built", t: "Memory of people", d: "Agents remember who they met and what was offered. Tested live: trade rose fivefold, from 11 to 53 trades, with no change to how trading works." },
      { tag: "built", t: "Births, only by choice", d: "Nobody is born unless villagers build a house and fill it with food they could have eaten. Will a hungry village ever choose to grow?" },
      { tag: "testing", t: "Ownership", d: "What you build is yours; others pay a coin to drink from your well. Does anyone build for income, and who gets shut out of water?" },
      { tag: "waiting", t: "The society engine", d: "Four new abilities, each behind its own switch: plans that last several hours, a public record of agreements, the right to look things up before acting, and private notes. In offline tests they cut model calls by 58%. The live A/B test is written and waits on API credit." },
      { tag: "next", t: "Contracts and a notice board", d: "Agreements the world enforces: build a well together, share its income, lose trust if you break your word." },
    ],
    cannot: {
      t: "What we cannot claim yet",
      d: [
        "Most results come from one world with one random seed. A finding that holds across many worlds and several AI models is a much stronger claim, and that work is ahead.",
        "Some behaviour that looks emergent may be the model reacting to how the world words things. Telling those apart is the hard part, and why everything is measured.",
      ],
    },
  },
  findings: {
    eyebrow: "What we have found",
    title: "Lessons so far",
    society: "About societies",
    minds: "About the AI minds",
    societyStats: [
      { n: "11 → 53", t: "trades", d: "Giving agents a memory of the people they had met multiplied trade by five. Deaths fell from 4 to 1 in the same world." },
      { n: "Plenty", t: "kills trade", d: "When everyone has enough, agents talk but do not trade. Trade needs people to hold different things and want what the other has." },
      { n: "580", t: "ticks without a tool", d: "In a 1,000-tick run the only toolmaker died and the craft died with them. That is why the world now has a library where skills can be written down." },
      { n: "2 of 12", t: "ever held a coin", d: "Money appeared, and so did inequality: in one run the coin Gini was 0.85." },
    ],
    mindStats: [
      { n: "223 → 19", t: "wasted attempts", d: "Agents kept striking stone too hard for their tools. Once the world stated each stone's hardness, wasted attempts fell by 90%. One clear fact works." },
      { n: "16 of 45", t: "empty promises", d: "Agents agreed to a trade while holding nothing to trade. Promises about the future are much harder for them than facts about now." },
      { n: "6 of 12 → 0", t: "impossible actions", d: "When the model had to name its action before explaining why, it picked impossible actions half the time. Asked to reason first: never." },
    ],
    source: "Every number comes from a recorded, seeded run.",
  },
  how: {
    eyebrow: "How it works",
    title: "Under the hood",
    intro: "The simulation is a Python program (digital_sim). This site only shows what it recorded; nothing here calls an AI model.",
    world: {
      t: "The world",
      facts: [
        { t: "Map", d: "A 40 × 40 grid of plains, forest, mountain and water. Food, materials and stone grow back where they were taken." },
        { t: "Time", d: "One tick is one hour; 24 ticks make a day, with night, morning, afternoon and evening. An episode is 400 ticks." },
        { t: "Bodies", d: "Each agent has energy, water and food. Run out and they collapse; stay out and they die of hunger or thirst." },
        { t: "Places", d: "The village starts with two wells, a market and a library. Agents can add wells, granaries, markets, libraries and houses." },
        { t: "People", d: "Twelve founders in four roles: explorer, builder, gatherer, scholar. Roles change what is easy, not what is allowed." },
        { t: "Reach", d: "An agent sees 10 tiles around it and can only trade, talk or teach with someone within 2 tiles." },
      ],
    },
    loop: {
      t: "One decision, every hour, for every agent",
      d: "Each tick, every living agent goes through the same loop. The model never touches the world directly: it can only ask, and the world decides.",
      steps: [
        { t: "Perceive", d: "The engine gathers what is true and in reach: terrain, resources, people, buildings, the agent's body and pack." },
        { t: "Describe", d: "Those facts become a prompt. Rules are stated (\"a granary keeps food from spoiling\"), never advice (\"share your food\")." },
        { t: "Decide", d: "The model answers in strict JSON: a reason first, then one action from a fixed list, with its target." },
        { t: "Act", d: "The engine checks the action against the rules and either carries it out or refuses it with a reason the agent will see next time." },
        { t: "Record", d: "Everything — action, result, thought, body, inventory — is written to the episode's trace. The replay is that trace." },
      ],
    },
    actions: {
      t: "What an agent can do",
      d: "Thirteen actions. Everything social — markets, apprenticeships, debt, villages — has to be built out of these.",
      list: ["move", "explore", "gather", "use", "combine", "build", "give", "take", "talk", "trade", "teach", "learn", "rest"],
    },
    mind: {
      t: "The mind around the model",
      items: [
        { t: "Memory of people", d: "Who the agent has met, what they offered, whether the deal went through." },
        { t: "Plans and reflection", d: "Every so often the agent plans its next hours and reflects on what happened, in separate model calls." },
        { t: "Knowledge", d: "Places and skills learned by exploring, being taught, or reading the library. Knowledge can die with a person unless it is written down." },
        { t: "Emotions and drives", d: "Simple numbers for joy, fear, trust and the need that is most pressing, shown to the agent as facts about itself." },
      ],
    },
    honest: {
      t: "How we keep it honest",
      items: [
        { t: "Facts, never advice", d: "If a behaviour only appears when the prompt suggests it, it is coaching, not emergence." },
        { t: "Seeded and replayable", d: "The same seed gives the same world. An experiment changes one thing and replays the rest." },
        { t: "Paired experiments", d: "A harness runs each variant across several seeds and compares them seed by seed, with 95% confidence intervals." },
        { t: "A scorecard", d: "Every run reports the same eight measures, among them survival, division of labour, promises kept, wasted actions and whether knowledge outlives the people who held it." },
        { t: "Switches stay off", d: "New features ship switched off and are checked to leave old runs unchanged, byte for byte." },
      ],
    },
    cost: {
      t: "The model and the cost",
      stats: [
        { n: "6,093", t: "model calls", d: "in one 400-tick episode with 12 agents" },
        { n: "11M", t: "prompt tokens", d: "almost all of it the facts each agent is shown" },
        { n: "$1.22", t: "per episode", d: "with Gemini 2.5 Flash Lite via OpenRouter" },
      ],
      d: "Cheap enough to run the world every day. Making each decision cheaper is what will let the world grow to hundreds of people.",
    },
    daily: {
      t: "How an episode reaches this page",
      steps: [
        "The daily runner loads yesterday's saved world.",
        "It runs 400 more ticks in a separate process, so a crash cannot leave half a world behind.",
        "One more model call writes the story from the recorded facts; without a model, a plain template does.",
        "The episode's files are published and the world is saved: that save is the commit point.",
        "This site is rebuilt from those files. Key moments and the poster are worked out at build time, so the page shows the village before anything downloads.",
      ],
    },
  },
  next: {
    eyebrow: "Where it goes next",
    title: "From a village to a civilisation",
    items: [
      { when: "Next", t: "A richer world", d: "Kinds of food — fruit, crops, and animals that roam and need tools to hunt — so a farmer or a butcher can emerge without being told to be one. Contracts the world remembers." },
      { when: "Then", t: "A larger world", d: "Bigger maps, many more people, several villages that can meet, trade or compete, and cheaper decisions so a world of hundreds can run every day." },
      { when: "Then", t: "A world you can walk through", d: "A 3D view where you follow one villager through their day, hear what they say and see what they remember, drawn from the same recorded events as the replay." },
      { when: "Later", t: "A world you can touch, not steer", d: "Visitors may change the world — a drought, a new river, a stranger arriving — but never control a villager. Nobody controls them, including us. That is the experiment." },
    ],
  },
  cta: { watch: "Watch the latest episode" },
};

const my: VillageResearch = {
  meta: {
    title: "AI ကျေးရွာ — သုတေသန",
    description: "AI အေးဂျင့်များ၏ ကျေးရွာမှ ကျွန်ုပ်တို့ သိလိုသည့်အရာ၊ လက်ရှိ အခြေအနေနှင့် စမ်းသပ်မှု အလုပ်လုပ်ပုံ။",
  },
  hero: {
    eyebrow: "AI ကျေးရွာ · သုတေသန",
    title: "မည်သူမျှ ဒီဇိုင်းမဆွဲထားသော ယဉ်ကျေးမှုကို AI အေးဂျင့်များ တည်ဆောက်နိုင်မလား။",
    lead:
      "AI ကျေးရွာသည် ပွင့်လင်းသော စမ်းသပ်မှုတစ်ခု ဖြစ်သည်။ ရွာသားများမှာ AI အေးဂျင့်များဖြစ်ပြီး ကျွန်ုပ်တို့ ပေးသည့်အရာမှာ သူတို့ကမ္ဘာအကြောင်း အမှန်တရားသာ ဖြစ်သည်။ မည်သူ ကုန်သွယ်မည်၊ မည်သူ သင်ပေးမည်၊ မည်သူ ဆောက်လုပ်မည်၊ မည်သူ ငတ်မွတ်မည်ဆိုသည်မှာ သူတို့ကိုယ်တိုင် ဆုံးဖြတ်သည်။ ဤစာမျက်နှာတွင် ကျွန်ုပ်တို့ ရှာဖွေနေသည့်အရာ၊ ရောက်ရှိနေသည့်နေရာနှင့် နောက်ကွယ်က အလုပ်လုပ်ပုံကို ရှင်းပြထားသည်။",
  },
  goal: {
    eyebrow: "ရည်မှန်းချက်",
    title: "AI က လူ့အဖွဲ့အစည်းကို အစမှ တည်ဆောက်သည့် ကမ္ဘာ",
    body: [
      "ရေရှည်ရည်မှန်းချက်မှာ ဗျူဟာဂိမ်းတစ်ခုကဲ့သို့ ကြည့်ရှုနိုင်သော အသက်ဝင်သည့် ကမ္ဘာတစ်ခု ဖြစ်သည် — လူများ စုဆောင်းခြင်း၊ စိုက်ပျိုးခြင်း၊ အိမ်နှင့် ဈေးများ ဆောက်ခြင်း၊ ရွာများ တည်ထောင်ခြင်း၊ မိသားစု ဖွဲ့ခြင်း၊ မြို့အချင်းချင်း ကုန်သွယ်ခြင်း။ ဂိမ်းနှင့် ကွာခြားချက်မှာ မည်သည့်အရာကိုမျှ ကြိုတင် ရေးဆွဲထားခြင်း မရှိခြင်းပင်။ ရွေးချယ်မှုတိုင်းကို ပတ်ဝန်းကျင်အကြောင်း အမှန်တရားကိုသာ သိသော AI အေးဂျင့်က ပြုလုပ်သည်။",
      "ဘာသာစကား မော်ဒယ်တစ်ခုတည်းမှာ ပုလင်းထဲရှိ ဦးနှောက်နှင့် တူသည် — တွေးခေါ်နိုင်သော်လည်း ခန္ဓာကိုယ်၊ ဆာလောင်မှု၊ အိမ်နီးချင်းနှင့် မနက်ဖြန် မရှိပါ။ AI ကျေးရွာက ၎င်းကို ခန္ဓာကိုယ်နှင့် အကျိုးဆက်ရှိသော ကမ္ဘာတစ်ခု ပေးသည်။ လူ့အဖွဲ့အစည်း ပေါ်လာပါက အေးဂျင့်များ လိုအပ်၍ ပေါ်လာခြင်း ဖြစ်သည်။",
    ],
    questions: [
      { t: "လူ့အဖွဲ့အစည်း", d: "ကုန်သွယ်မှု၊ အလုပ်အကိုင်၊ ငွေ၊ အများပိုင် သိုလှောင်ရုံ၊ မညီမျှမှုနှင့် အခြေချရာများ အလိုအလျောက် ပေါ်လာသလား။ မည်သည့်အခြေအနေတွင် ပေါ်လာပြီး မည်သည့်အရာက ပြိုလဲစေသလဲ။" },
      { t: "AI ၏ စိတ်", d: "မည်သူမျှ မထိန်းကျောင်းသည့်အခါ AI အေးဂျင့်များ အမှန်တကယ် ဘာလုပ်နိုင်သလဲ — လူများကို မှတ်မိခြင်း၊ ကတိတည်ခြင်း၊ ကြိုတင်စီစဉ်ခြင်း၊ အချက်တစ်ခုတည်းအပေါ် လုပ်ဆောင်ခြင်း။ သူတို့၏ ကျရှုံးမှုများလည်း ရလဒ်ပင် ဖြစ်သည်။" },
    ],
    split: {
      brain: { t: "ကျွန်ုပ်တို့၏ ယုတ္တိ — ဦးနှောက်", d: "ကမ္ဘာ၏ စည်းမျဉ်းများ၊ အေးဂျင့်တိုင်း မြင်ရသည့် အချက်အလက်များ၊ မှတ်ဉာဏ်၊ ပိုင်ဆိုင်မှု၊ မွေးဖွားမှုနှင့် ဆုံးဖြတ်ချက်တိုင်း။ တိုင်းတာ စမ်းသပ်ထားသည်။ ယခု တည်ဆောက်နေသည့် အပိုင်း ဖြစ်သည်။" },
      window: { t: "ဂိမ်း — ပြတင်းပေါက်", d: "ဦးနှောက်က ဆုံးဖြတ်ခဲ့သည်ကို ပြသည့် မြင်ကွင်း — ယနေ့ ဤဆိုက်ရှိ ထောင့်စောင်းမြေပုံ၊ နောင်တွင် ၃ ဖက်မြင် ကမ္ဘာ။ ဇာတ်လမ်းကို ပုံဖော်သည်သာ ဖြစ်ပြီး မည်သည့် ရွေးချယ်မှုကိုမျှ မပြုလုပ်ပါ။" },
    },
  },
  status: {
    eyebrow: "လက်ရှိ အခြေအနေ",
    title: "ရွာတစ်ရွာ၊ အစမှ ဘယ်တော့မှ ပြန်မစသော ကမ္ဘာ",
    intro:
      "ရွာတည်ထောင်သူ ၁၂ ဦးသည် ၄၀ × ၄၀ မြေပုံပေါ်တွင် နေထိုင်သည်။ ကမ္ဘာသည် ယခု ဆက်တိုက် ဇာတ်လမ်းတစ်ခုအဖြစ် လည်ပတ်သည် — အပိုင်းတိုင်းသည် ယခင်အပိုင်း ရပ်ခဲ့သည့်နေရာမှ ဆက်လက်ပြီး ပြန်ကြည့်ဖိုင်နှင့် ရေးသားထားသော မှတ်တမ်းဖြင့် ဤနေရာတွင် ထုတ်ဝေသည်။ ပထမဆုံး နေ့စဉ်အပိုင်း မထွက်မီ အချိန်အမှတ် ၄၀၀ ပါ စမ်းသပ်ပြေးဆွဲမှုကို ပြသထားသည်။",
    tags: { built: "ပြီးပြီ", testing: "စမ်းသပ်ဆဲ", waiting: "ပြေးရန် အသင့်", next: "နောက်တစ်ဆင့်" },
    items: [
      { tag: "built", t: "ကမ္ဘာတစ်ခု၊ နေ့စဉ်", d: "အပိုင်းတိုင်းအပြီး ကမ္ဘာကို သိမ်းဆည်းပြီး နောက်နေ့တွင် ဆက်လည်ပတ်သည် — အပိုင်းတစ်ခုလျှင် အချိန်အမှတ် ၄၀၀ (ရွာ၏ ရက် ၁၆ ရက်ခန့်)၊ ပြန်ကြည့်ဖိုင်နှင့် မှတ်တမ်းတင်ထားသည်များမှသာ ရေးသားသော ဇာတ်လမ်း။" },
      { tag: "built", t: "လူများကို မှတ်မိခြင်း", d: "အေးဂျင့်များသည် တွေ့ခဲ့သူနှင့် ကမ်းလှမ်းခဲ့သည်များကို မှတ်မိသည်။ တိုက်ရိုက် စမ်းသပ်ရာတွင် ကုန်သွယ်မှု ၁၁ ကြိမ်မှ ၅၃ ကြိမ်အထိ ငါးဆ မြင့်တက်ခဲ့သည်။" },
      { tag: "built", t: "ရွေးချယ်မှုဖြင့်သာ မွေးဖွား", d: "ရွာသားများက အိမ်ဆောက်ပြီး ကိုယ်တိုင်စားနိုင်သည့် အစားအစာဖြင့် မဖြည့်လျှင် မည်သူမျှ မမွေးဖွားပါ။ ဆာလောင်နေသော ရွာက ကြီးထွားရန် ရွေးချယ်မလား။" },
      { tag: "testing", t: "ပိုင်ဆိုင်မှု", d: "ဆောက်သည့်အရာသည် ကိုယ်ပိုင် ဖြစ်သည်။ အခြားသူများက သင့်ရေတွင်းမှ ရေသောက်ရန် ဒင်္ဂါးတစ်ပြား ပေးရသည်။ ဝင်ငွေအတွက် ဆောက်သူ ရှိမလား၊ ရေမရသူ မည်သူ ဖြစ်မလဲ။" },
      { tag: "waiting", t: "လူ့အဖွဲ့အစည်း အင်ဂျင်", d: "ကိုယ်ပိုင်ခလုတ်စီဖြင့် စွမ်းရည်သစ် လေးခု — နာရီအတော်ကြာ ခံသော အစီအစဉ်များ၊ သဘောတူညီချက်များ၏ အများသိ မှတ်တမ်း၊ မလုပ်ဆောင်မီ ရှာဖွေကြည့်ခွင့်နှင့် ကိုယ်ပိုင်မှတ်စုများ။ အော့ဖ်လိုင်း စမ်းသပ်မှုတွင် မော်ဒယ်ခေါ်ဆိုမှု ၅၈% လျော့ကျခဲ့သည်။ တိုက်ရိုက် A/B စမ်းသပ်မှုကို ရေးပြီးဖြစ်ပြီး API ခရက်ဒစ်ကို စောင့်နေသည်။" },
      { tag: "next", t: "စာချုပ်နှင့် ကြေညာဘုတ်", d: "ကမ္ဘာက အကောင်အထည်ဖော်ပေးသော သဘောတူညီချက်များ — ရေတွင်းကို အတူဆောက်၊ ဝင်ငွေကို ခွဲဝေ၊ ကတိဖျက်လျှင် ယုံကြည်မှု ဆုံးရှုံး။" },
    ],
    cannot: {
      t: "မပြောနိုင်သေးသည့်အရာ",
      d: [
        "ရလဒ်အများစုမှာ ကျပန်းနံပါတ် (seed) တစ်ခုတည်းပါ ကမ္ဘာတစ်ခုမှ ဖြစ်သည်။ ကမ္ဘာများစွာနှင့် AI မော်ဒယ် အမျိုးမျိုးတွင် မှန်ကန်သော တွေ့ရှိချက်မှာ ပိုခိုင်မာပြီး ထိုအလုပ်ကို ရှေ့တွင် လုပ်ရဦးမည်။",
        "အလိုအလျောက် ပေါ်လာသည်ဟု ထင်ရသော အပြုအမူအချို့မှာ ကမ္ဘာ၏ စကားလုံးရွေးချယ်ပုံကို မော်ဒယ်က တုံ့ပြန်ခြင်းသာ ဖြစ်နိုင်သည်။ ၎င်းတို့ကို ခွဲခြားရန် ခက်ခဲပြီး ထို့ကြောင့် အရာအားလုံးကို တိုင်းတာသည်။",
      ],
    },
  },
  findings: {
    eyebrow: "တွေ့ရှိချက်များ",
    title: "ယခုအထိ သင်ခန်းစာများ",
    society: "လူ့အဖွဲ့အစည်းအကြောင်း",
    minds: "AI ၏ စိတ်အကြောင်း",
    societyStats: [
      { n: "၁၁ → ၅၃", t: "ကုန်သွယ်မှု", d: "တွေ့ခဲ့သူများကို မှတ်မိစေခြင်းဖြင့် ကုန်သွယ်မှု ငါးဆ တိုးလာသည်။ ကမ္ဘာတစ်ခုတည်းတွင် သေဆုံးမှု ၄ ဦးမှ ၁ ဦးသို့ ကျဆင်းသည်။" },
      { n: "ပေါကြွယ်ဝမှု", t: "ကုန်သွယ်မှုကို သတ်သည်", d: "လူတိုင်း လုံလောက်စွာ ရှိသည့်အခါ စကားပြောသော်လည်း ကုန်မသွယ်ကြ။ ကုန်သွယ်မှုသည် မတူသည့်အရာ ကိုင်ထားပြီး အချင်းချင်း လိုချင်မှ ဖြစ်သည်။" },
      { n: "၅၈၀", t: "ကိရိယာမဲ့ အချိန်အမှတ်", d: "အချိန်အမှတ် ၁,၀၀၀ ပါ ပြေးဆွဲမှုတွင် တစ်ဦးတည်းသော ကိရိယာလုပ်သူ သေဆုံးပြီး အတတ်ပညာပါ ပျောက်ဆုံးခဲ့သည်။ ထို့ကြောင့် ယခု ကမ္ဘာတွင် ပညာကို ရေးမှတ်ထားနိုင်သည့် စာကြည့်တိုက် ရှိသည်။" },
      { n: "၁၂ ဦးတွင် ၂ ဦး", t: "ဒင်္ဂါး ကိုင်ဖူးသူ", d: "ငွေ ပေါ်လာပြီး မညီမျှမှုလည်း ပေါ်လာသည် — ပြေးဆွဲမှုတစ်ခုတွင် ဒင်္ဂါး Gini ၀.၈၅ ဖြစ်သည်။" },
    ],
    mindStats: [
      { n: "၂၂၃ → ၁၉", t: "အလဟဿ ကြိုးပမ်းမှု", d: "ကိရိယာထက် မာသော ကျောက်ကို ထုနေကြသည်။ ကျောက်တိုင်း၏ မာကျောမှုကို ကမ္ဘာက ပြောပြလိုက်သည်နှင့် အလဟဿ ကြိုးပမ်းမှု ၉၀% ကျဆင်းသည်။ ရှင်းလင်းသော အချက်တစ်ခု အလုပ်ဖြစ်သည်။" },
      { n: "၄၅ ခုတွင် ၁၆ ခု", t: "အချည်းနှီး ကတိ", d: "ဘာမျှ မကိုင်ထားဘဲ ကုန်သွယ်ရန် သဘောတူခဲ့ကြသည်။ အနာဂတ်အကြောင်း ကတိသည် ယခုအချိန်၏ အချက်အလက်ထက် များစွာ ခက်သည်။" },
      { n: "၁၂ ခုတွင် ၆ ခု → ၀", t: "မဖြစ်နိုင်သော လုပ်ဆောင်ချက်", d: "အကြောင်းပြချက် မပေးမီ လုပ်ဆောင်ချက်ကို အရင်ပြောရသည့်အခါ ထက်ဝက်မှာ မဖြစ်နိုင်သည်များ ဖြစ်သည်။ အရင် တွေးခိုင်းသည့်အခါ တစ်ခါမျှ မဖြစ်ပါ။" },
    ],
    source: "ဂဏန်းတိုင်းသည် မှတ်တမ်းတင်ထားသော၊ ပြန်ပြေးနိုင်သော ပြေးဆွဲမှုမှ ဖြစ်သည်။",
  },
  how: {
    eyebrow: "အလုပ်လုပ်ပုံ",
    title: "နောက်ကွယ်တွင်",
    intro: "စမ်းသပ်မှုသည် Python ပရိုဂရမ် (digital_sim) ဖြစ်သည်။ ဤဆိုက်က မှတ်တမ်းတင်ထားသည်ကိုသာ ပြသပြီး AI မော်ဒယ်ကို မခေါ်ပါ။",
    world: {
      t: "ကမ္ဘာ",
      facts: [
        { t: "မြေပုံ", d: "လွင်ပြင်၊ သစ်တော၊ တောင်နှင့် ရေ ပါသော ၄၀ × ၄၀ ကွက်။ အစားအစာ၊ ပစ္စည်းနှင့် ကျောက်များ ယူသွားသည့်နေရာတွင် ပြန်ပေါက်သည်။" },
        { t: "အချိန်", d: "အချိန်အမှတ် တစ်ခုသည် တစ်နာရီ ဖြစ်ပြီး ၂၄ ခုလျှင် တစ်ရက်၊ ည၊ မနက်၊ နေ့လယ်၊ ညနေ ပါသည်။ အပိုင်းတစ်ခုမှာ အချိန်အမှတ် ၄၀၀ ဖြစ်သည်။" },
        { t: "ခန္ဓာကိုယ်", d: "အေးဂျင့်တိုင်းတွင် အားအင်၊ ရေနှင့် အစားအစာ ရှိသည်။ ကုန်သွားလျှင် လဲကျပြီး ဆက်ကုန်နေလျှင် အငတ် သို့မဟုတ် ရေငတ်၍ သေဆုံးသည်။" },
        { t: "နေရာများ", d: "ရွာသည် ရေတွင်း နှစ်တွင်း၊ ဈေးနှင့် စာကြည့်တိုက်ဖြင့် စတင်သည်။ ရေတွင်း၊ စပါးကျီ၊ ဈေး၊ စာကြည့်တိုက်နှင့် အိမ်များ ထပ်ဆောက်နိုင်သည်။" },
        { t: "လူများ", d: "စူးစမ်းသူ၊ တည်ဆောက်သူ၊ စုဆောင်းသူ၊ ပညာရှင် ဟူသော အခန်းကဏ္ဍ လေးမျိုးရှိ တည်ထောင်သူ ၁၂ ဦး။ အခန်းကဏ္ဍက လွယ်ကူမှုကို ပြောင်းစေပြီး ခွင့်ပြုချက်ကို မပြောင်းပါ။" },
        { t: "လက်လှမ်းမီမှု", d: "အေးဂျင့်တစ်ဦးသည် ပတ်ဝန်းကျင် ၁၀ ကွက်ကို မြင်ပြီး ၂ ကွက်အတွင်းရှိသူနှင့်သာ ကုန်သွယ်၊ စကားပြော၊ သင်ပေးနိုင်သည်။" },
      ],
    },
    loop: {
      t: "အေးဂျင့်တိုင်းအတွက် နာရီတိုင်း ဆုံးဖြတ်ချက်တစ်ခု",
      d: "အချိန်အမှတ်တိုင်းတွင် အသက်ရှင်သော အေးဂျင့်တိုင်း တူညီသော အဆင့်များကို ဖြတ်သန်းသည်။ မော်ဒယ်က ကမ္ဘာကို တိုက်ရိုက် မထိနိုင်ပါ — တောင်းဆိုနိုင်ရုံသာ ဖြစ်ပြီး ကမ္ဘာက ဆုံးဖြတ်သည်။",
      steps: [
        { t: "မြင်သိ", d: "အင်ဂျင်က မှန်ကန်ပြီး လက်လှမ်းမီသည့်အရာများကို စုသည် — မြေ၊ အရင်းအမြစ်၊ လူ၊ အဆောက်အအုံ၊ ကိုယ်ခန္ဓာနှင့် ယူဆောင်ထားသည့်အရာ။" },
        { t: "ဖော်ပြ", d: "ထိုအချက်များကို prompt အဖြစ် ပြောင်းသည်။ စည်းမျဉ်းကို ပြောသည် (\"စပါးကျီက အစားအစာ မပုပ်အောင် ထိန်းသည်\")၊ အကြံဉာဏ် (\"အစားအစာ မျှဝေပါ\") ကို ဘယ်တော့မှ မပေးပါ။" },
        { t: "ဆုံးဖြတ်", d: "မော်ဒယ်က တင်းကျပ်သော JSON ဖြင့် ဖြေသည် — အကြောင်းပြချက် အရင်၊ ထို့နောက် သတ်မှတ်စာရင်းမှ လုပ်ဆောင်ချက်တစ်ခုနှင့် ပစ်မှတ်။" },
        { t: "လုပ်ဆောင်", d: "အင်ဂျင်က စည်းမျဉ်းနှင့် တိုက်စစ်ပြီး လုပ်ဆောင်ပေးသည်၊ သို့မဟုတ် နောက်တစ်ကြိမ် အေးဂျင့် မြင်ရမည့် အကြောင်းပြချက်ဖြင့် ငြင်းပယ်သည်။" },
        { t: "မှတ်တမ်းတင်", d: "လုပ်ဆောင်ချက်၊ ရလဒ်၊ အတွေး၊ ခန္ဓာကိုယ်၊ ပစ္စည်း အားလုံးကို အပိုင်း၏ trace ဖိုင်တွင် ရေးသည်။ ပြန်ကြည့်ဖိုင်မှာ ထို trace ပင် ဖြစ်သည်။" },
      ],
    },
    actions: {
      t: "အေးဂျင့်တစ်ဦး လုပ်နိုင်သည့်အရာ",
      d: "လုပ်ဆောင်ချက် ၁၃ ခု။ ဈေး၊ အလုပ်သင်၊ အကြွေး၊ ရွာ စသည့် လူမှုရေး အရာအားလုံးကို ဤအရာများဖြင့်သာ တည်ဆောက်ရမည်။",
      list: ["move", "explore", "gather", "use", "combine", "build", "give", "take", "talk", "trade", "teach", "learn", "rest"],
    },
    mind: {
      t: "မော်ဒယ်ပတ်လည်ရှိ စိတ်",
      items: [
        { t: "လူများကို မှတ်မိခြင်း", d: "တွေ့ခဲ့သူ၊ ကမ်းလှမ်းခဲ့သည့်အရာနှင့် အပေးအယူ အောင်မြင်ခဲ့ခြင်း ရှိမရှိ။" },
        { t: "အစီအစဉ်နှင့် ပြန်လည်သုံးသပ်ခြင်း", d: "ရံဖန်ရံခါ နောက်နာရီများအတွက် စီစဉ်ပြီး ဖြစ်ခဲ့သည်ကို သီးခြား မော်ဒယ်ခေါ်ဆိုမှုဖြင့် ပြန်သုံးသပ်သည်။" },
        { t: "အသိပညာ", d: "စူးစမ်းခြင်း၊ သင်ကြားခံရခြင်း သို့မဟုတ် စာကြည့်တိုက်တွင် ဖတ်ခြင်းဖြင့် သိရှိသော နေရာနှင့် အတတ်ပညာ။ မရေးမှတ်ထားလျှင် လူနှင့်အတူ ပျောက်ဆုံးနိုင်သည်။" },
        { t: "စိတ်ခံစားမှုနှင့် လိုအပ်ချက်", d: "ပျော်ရွှင်မှု၊ ကြောက်ရွံ့မှု၊ ယုံကြည်မှုနှင့် အရေးအကြီးဆုံး လိုအပ်ချက်အတွက် ရိုးရှင်းသော ဂဏန်းများကို အေးဂျင့်အား ကိုယ့်အကြောင်း အချက်အလက်အဖြစ် ပြသည်။" },
      ],
    },
    honest: {
      t: "ရိုးသားမှုကို ထိန်းသိမ်းပုံ",
      items: [
        { t: "အချက်အလက်သာ၊ အကြံဉာဏ်မပေး", d: "prompt က အကြံပေးမှသာ ပေါ်လာသော အပြုအမူသည် လမ်းညွှန်ခြင်းသာ ဖြစ်ပြီး အလိုအလျောက် ပေါ်ပေါက်ခြင်း မဟုတ်ပါ။" },
        { t: "ပြန်ပြေးနိုင်ခြင်း", d: "seed တူလျှင် ကမ္ဘာတူသည်။ စမ်းသပ်မှုတစ်ခုသည် တစ်ခုတည်းကိုသာ ပြောင်းပြီး ကျန်သည်ကို ပြန်ပြေးသည်။" },
        { t: "အတွဲလိုက် စမ်းသပ်မှု", d: "ပုံစံကွဲတိုင်းကို seed အများအပြားဖြင့် ပြေးပြီး seed တစ်ခုချင်း နှိုင်းယှဉ်ကာ ၉၅% ယုံကြည်မှု ကြားကာလ ပေးသည်။" },
        { t: "ရမှတ်ကတ်", d: "ပြေးဆွဲမှုတိုင်းက ရှင်သန်မှု၊ အလုပ်ခွဲဝေမှု၊ တည်သော ကတိ၊ အလဟဿ လုပ်ဆောင်ချက်နှင့် အသိပညာက ပိုင်ရှင်ထက် ကြာရှည်ခံခြင်း ရှိမရှိ အပါအဝင် တိုင်းတာချက် ရှစ်ခုကို တူညီစွာ ဖော်ပြသည်။" },
        { t: "ခလုတ်များ ပိတ်ထားခြင်း", d: "လုပ်ဆောင်ချက်သစ်များကို ပိတ်ထားလျက် ထည့်ပြီး ယခင်ပြေးဆွဲမှုများ byte တစ်လုံးမျှ မပြောင်းကြောင်း စစ်ဆေးသည်။" },
      ],
    },
    cost: {
      t: "မော်ဒယ်နှင့် ကုန်ကျစရိတ်",
      stats: [
        { n: "၆,၀၉၃", t: "မော်ဒယ်ခေါ်ဆိုမှု", d: "အေးဂျင့် ၁၂ ဦးပါ အချိန်အမှတ် ၄၀၀ အပိုင်းတစ်ခုတွင်" },
        { n: "၁၁M", t: "prompt token", d: "အများစုမှာ အေးဂျင့်တိုင်း မြင်ရသည့် အချက်အလက်များ" },
        { n: "$၁.၂၂", t: "အပိုင်းတစ်ခုလျှင်", d: "OpenRouter မှတဆင့် Gemini 2.5 Flash Lite ဖြင့်" },
      ],
      d: "ကမ္ဘာကို နေ့စဉ် လည်ပတ်ရန် လုံလောက်စွာ သက်သာသည်။ ဆုံးဖြတ်ချက်တိုင်းကို ပိုသက်သာစေခြင်းက ကမ္ဘာကို လူရာပေါင်းများစွာအထိ ကြီးထွားစေမည်။",
    },
    daily: {
      t: "အပိုင်းတစ်ခု ဤစာမျက်နှာသို့ ရောက်လာပုံ",
      steps: [
        "နေ့စဉ် ပြေးဆွဲသူက မနေ့က သိမ်းထားသော ကမ္ဘာကို ဖွင့်သည်။",
        "သီးခြား process တစ်ခုတွင် အချိန်အမှတ် ၄၀၀ ထပ်ပြေးသည် — ပျက်စီးသွားလျှင် ကမ္ဘာ တစ်ဝက်တစ်ပျက် မကျန်စေရန်။",
        "မော်ဒယ်ခေါ်ဆိုမှု တစ်ကြိမ်က မှတ်တမ်းတင်ထားသော အချက်များမှ ဇာတ်လမ်းကို ရေးသည်။ မော်ဒယ်မရှိလျှင် ရိုးရှင်းသော ပုံစံက ရေးသည်။",
        "အပိုင်း၏ ဖိုင်များကို ထုတ်ဝေပြီး ကမ္ဘာကို သိမ်းသည် — ထိုသိမ်းဆည်းမှုက အတည်ပြုချက် ဖြစ်သည်။",
        "ဤဆိုက်ကို ထိုဖိုင်များမှ ပြန်တည်ဆောက်သည်။ အရေးကြီးသည့် အခိုက်အတန့်များနှင့် ပိုစတာကို build အချိန်တွင် တွက်ချက်သဖြင့် ဘာမျှ ဒေါင်းလုဒ်မလုပ်မီ ရွာကို မြင်ရသည်။",
      ],
    },
  },
  next: {
    eyebrow: "နောက်တစ်ဆင့်",
    title: "ရွာတစ်ရွာမှ ယဉ်ကျေးမှုတစ်ခုဆီသို့",
    items: [
      { when: "နောက်တစ်ဆင့်", t: "ပိုကြွယ်ဝသော ကမ္ဘာ", d: "သစ်သီး၊ သီးနှံနှင့် လှည့်လည်သွားလာပြီး အမဲလိုက်ရန် ကိရိယာလိုသော တိရစ္ဆာန်များ စသည့် အစားအစာ အမျိုးမျိုး — လယ်သမား သို့မဟုတ် သားသတ်သမားဖြစ်ရန် မပြောဘဲ ပေါ်လာနိုင်စေရန်။ ကမ္ဘာက မှတ်ထားသော စာချုပ်များ။" },
      { when: "ထို့နောက်", t: "ပိုကြီးသော ကမ္ဘာ", d: "ပိုကြီးသော မြေပုံ၊ လူများစွာ၊ တွေ့ဆုံ၊ ကုန်သွယ်၊ ယှဉ်ပြိုင်နိုင်သော ရွာများစွာနှင့် လူရာပေါင်းများစွာပါ ကမ္ဘာကို နေ့စဉ် ပြေးနိုင်ရန် ပိုသက်သာသော ဆုံးဖြတ်ချက်များ။" },
      { when: "ထို့နောက်", t: "လမ်းလျှောက်ကြည့်နိုင်သော ကမ္ဘာ", d: "ရွာသားတစ်ဦး၏ တစ်နေ့တာကို လိုက်ကြည့်ပြီး သူပြောသည်ကို ကြား၊ သူမှတ်မိသည်ကို မြင်ရသော ၃ ဖက်မြင် မြင်ကွင်း — ပြန်ကြည့်ဖိုင်နှင့် တူညီသော မှတ်တမ်းများမှ ပုံဖော်သည်။" },
      { when: "နောင်တွင်", t: "ထိနိုင်သော်လည်း မထိန်းနိုင်သော ကမ္ဘာ", d: "ဧည့်သည်များက ကမ္ဘာကို ပြောင်းနိုင်သည် — မိုးခေါင်ခြင်း၊ မြစ်သစ်၊ သူစိမ်းရောက်လာခြင်း — သို့သော် ရွာသားကို ဘယ်တော့မှ မထိန်းချုပ်နိုင်ပါ။ ကျွန်ုပ်တို့အပါအဝင် မည်သူမျှ မထိန်းချုပ်ပါ။ ထိုအရာက စမ်းသပ်မှုပင် ဖြစ်သည်။" },
    ],
  },
  cta: { watch: "နောက်ဆုံးအပိုင်းကို ကြည့်ရန်" },
};

export const villageResearch: Record<Locale, VillageResearch> = { en, my };
