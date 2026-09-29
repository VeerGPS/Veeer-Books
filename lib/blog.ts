// Blog articles. Add a new object to POSTS to publish an article —
// it appears on /blog, gets its own page, and is added to the sitemap.

export type Block =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { tip: string }
  | { quote: string };

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  category: "Habits & growth" | "Study" | "AI & tech" | "Parenting" | "Writing & publishing" | "Fiction";
  minutes: number;
  /** Book the article recommends (slug), or a page for author articles. */
  cta: { kind: "book"; slug: string; text: string } | { kind: "link"; href: string; label: string; text: string };
  body: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "how-to-build-habits-that-stick-1-percent-rule",
    title: "How to Build Habits That Actually Stick: The 1% Rule Explained",
    description: "Big resolutions fade in a week. Here’s how tiny daily improvements add up — and a simple 4-step plan to make them automatic.",
    date: "2026-09-20",
    category: "Habits & growth",
    minutes: 6,
    cta: { kind: "book", slug: "the-1-percent-rule", text: "Want the complete system, with worksheets and a 1% Life Plan? Read The 1% Rule." },
    body: [
      { p: "Most of us have tried to change everything at once. New gym plan, new diet, new study timetable — all starting Monday. By Thursday, life gets busy and the plan quietly disappears. The problem isn’t willpower. The plan was simply too big to survive a normal week." },
      { p: "The 1% Rule flips the approach: instead of chasing a huge change, you improve one small thing by about one percent, and you repeat it tomorrow. Each step is so small it feels almost silly — which is exactly why it works." },
      { h2: "Why tiny steps beat big goals" },
      { ul: [
        "Small actions are easy to start. Starting is the hardest part of any habit.",
        "They survive bad days. Two minutes of reading still happens when you’re tired.",
        "They build identity. Every repetition is a vote for “I’m someone who does this.”",
        "They compound. A little better each day quietly adds up over months.",
      ] },
      { quote: "You don’t need a new life. You need a slightly better today, repeated." },
      { h2: "A 4-step plan to start today" },
      { h3: "1. Pick one area" },
      { p: "Health, study, money, relationships, skills — choose just one for the next 30 days. Spreading effort across five areas is how plans collapse." },
      { h3: "2. Shrink the habit until it’s easy" },
      { p: "“Read more” becomes “read one page after dinner.” “Exercise” becomes “ten squats after brushing my teeth.” If you can’t do it on your worst day, make it smaller." },
      { h3: "3. Attach it to something you already do" },
      { p: "Link the new habit to an existing routine: after I make tea, I write one line in my journal. The old habit becomes the reminder, so you don’t rely on memory." },
      { h3: "4. Track it where you can see it" },
      { p: "A simple tick on a calendar is enough. Seeing a chain of ticks is motivating, and missing one makes you want to get back on track quickly." },
      { tip: "Never miss twice. Missing one day is normal; missing two in a row is the start of a new (bad) habit. If you slip, make tomorrow’s version extra small and just show up." },
      { h2: "What to do when progress feels slow" },
      { p: "In the first weeks, 1% improvements are almost invisible. That’s expected. Measure the process, not the outcome: did you show up today? After a month, compare yourself with where you started — not with other people." },
      { p: "Once a habit feels automatic, grow it by another small step, or add a second area. That’s the whole system: small, repeated, tracked, then grown." },
    ],
  },
  {
    slug: "simple-study-system-for-students",
    title: "A Simple Study System for Students: Plan, Focus, Review",
    description: "Stop studying for hours and forgetting it all. A three-part system — plan the week, focus in short blocks, review smartly — that fits real student life.",
    date: "2026-09-16",
    category: "Study",
    minutes: 7,
    cta: { kind: "book", slug: "the-student-success-system", text: "Get the full planner, focus routines and exam strategy in The Student Success System." },
    body: [
      { p: "Many students work hard but still feel behind. Long hours at the desk don’t guarantee results — what matters is what happens during those hours and what you do afterwards. A good study system turns effort into marks." },
      { h2: "Part 1: Plan the week in 15 minutes" },
      { p: "Every Sunday, spend a quarter of an hour looking at the week ahead." },
      { ol: [
        "List fixed commitments: classes, coaching, travel, family time.",
        "Write down every test, assignment and deadline.",
        "Choose three study priorities for the week — the subjects or chapters that matter most right now.",
        "Place short study blocks into the free gaps, starting with the priorities.",
      ] },
      { tip: "Plan less than you think you can do. A realistic plan you finish builds confidence; an ambitious plan you abandon builds guilt." },
      { h2: "Part 2: Focus in short blocks" },
      { p: "Attention is like a battery. Instead of forcing a three-hour session, work in focused blocks of 25–45 minutes with 5–10 minute breaks." },
      { ul: [
        "Put your phone in another room or switch on focus mode before you start.",
        "Write the exact goal of the block: “Solve 10 problems from Chapter 4,” not “study maths.”",
        "During breaks, stand up, stretch or drink water — not social media, which makes it harder to restart.",
      ] },
      { h2: "Part 3: Review so you don’t forget" },
      { p: "Reading notes again feels productive but isn’t very effective. Testing yourself is. After a topic, close the book and try to recall the key points, solve questions, or explain it aloud as if teaching a friend." },
      { p: "Then review the same topic again after a day, a few days later, and a week later. Each review is shorter than the last, and the material moves into long-term memory." },
      { h2: "Before exams" },
      { ul: [
        "Make a one-page summary per chapter — formulas, dates, definitions, key diagrams.",
        "Practise past papers under timed conditions at least a few times.",
        "Sleep properly the night before. Late-night cramming usually costs more than it gains.",
      ] },
      { p: "Start with one part of the system this week — even just the Sunday plan — and add the others as they become routine." },
    ],
  },
  {
    slug: "ai-prompting-for-beginners",
    title: "AI Prompting for Beginners: 7 Techniques That Get Better Answers",
    description: "Getting vague answers from AI chatbots? These seven simple prompting techniques help you get clear, useful and accurate results.",
    date: "2026-09-12",
    category: "AI & tech",
    minutes: 6,
    cta: { kind: "book", slug: "the-art-and-science-of-prompting", text: "Go deeper with templates and real examples in The Art & Science of Prompting." },
    body: [
      { p: "AI assistants can write, explain, summarise and brainstorm — but the quality of the answer depends heavily on the question. A good prompt is like a good brief to a talented colleague: clear, specific and with enough context." },
      { h2: "1. Say who it is for" },
      { p: "“Explain inflation” gives a generic answer. “Explain inflation to a Class 9 student using an example with prices at a local market” gives a useful one. Audience changes everything." },
      { h2: "2. Give context" },
      { p: "Share the background: what you’re working on, what you already know, and what you’ve tried. The model can’t read your mind — but it uses everything you tell it." },
      { h2: "3. Ask for a format" },
      { p: "Tell it how you want the answer: a table, five bullet points, a 100-word email, a step-by-step list. Format requests make answers easier to use immediately." },
      { h2: "4. Show an example" },
      { p: "If you want a particular style, paste a short example and say “write three more like this.” Examples communicate tone better than long descriptions." },
      { h2: "5. Break big tasks into steps" },
      { p: "Instead of “write my business plan,” start with “list the sections a small bookshop business plan needs,” then work through each section. Step-by-step work produces better results and is easier to check." },
      { h2: "6. Ask it to think before answering" },
      { p: "For reasoning tasks — maths, comparisons, decisions — ask the assistant to work through the problem step by step and then give its final answer. It helps catch mistakes." },
      { h2: "7. Iterate" },
      { p: "Treat the first answer as a draft. Follow up: “make it shorter,” “use simpler words,” “add an example from India,” “what did you assume?” The conversation is where the quality comes from." },
      { tip: "Always double-check facts, figures and references. AI can sound confident and still be wrong, especially about recent events or specific numbers." },
      { h2: "A reusable template" },
      { quote: "You are a [role]. I need [task] for [audience]. Context: [background]. Please give the answer as [format], in a [tone] tone. Ask me questions first if anything is unclear." },
    ],
  },
  {
    slug: "benefits-of-bedtime-stories-for-kids",
    title: "Why Bedtime Stories Matter: 6 Benefits of Reading Fairy Tales to Kids",
    description: "Ten minutes of stories before bed can do a lot for children — from vocabulary to empathy to a calmer bedtime. Here’s why, and how to make it a habit.",
    date: "2026-09-08",
    category: "Parenting",
    minutes: 5,
    cta: { kind: "book", slug: "fairy-tales-for-kids", text: "Looking for tonight’s story? Fairy Tales: For Kids has gentle, beautifully told tales to read together." },
    body: [
      { p: "In a day full of screens and schedules, a bedtime story is a small, quiet ritual. It doesn’t need to be long — ten minutes is plenty — but done regularly, it gives children far more than entertainment." },
      { h2: "1. A bigger vocabulary" },
      { p: "Stories use words children don’t hear in everyday conversation. Hearing them in context, again and again, is one of the most natural ways to learn language." },
      { h2: "2. Longer attention spans" },
      { p: "Following a story from beginning to end is practice in listening and concentration — skills that help later in the classroom." },
      { h2: "3. Empathy and values" },
      { p: "Fairy tales are full of characters making choices: kindness, honesty, courage, sharing. Talking about why a character acted a certain way helps children understand feelings — their own and others’." },
      { h2: "4. Imagination" },
      { p: "Without pictures on a screen, children build the castle, the forest and the talking animals in their own minds. That creative muscle matters." },
      { h2: "5. A calmer bedtime" },
      { p: "A predictable routine — bath, brush, story, sleep — signals that the day is ending. Many families find the story becomes the part children look forward to most." },
      { h2: "6. Time together" },
      { p: "Perhaps the biggest benefit is simply connection: undivided attention from a parent or grandparent, every day." },
      { h2: "Making it a habit" },
      { ul: [
        "Keep it short and consistent rather than long and occasional.",
        "Let your child choose the story sometimes — even the same one for the tenth time.",
        "Pause to ask, “What do you think happens next?”",
        "Use a warm screen setting (sepia or night mode) if you read from a phone or tablet.",
      ] },
    ],
  },
  {
    slug: "how-to-self-publish-an-ebook-in-india",
    title: "How to Self-Publish Your eBook in India: A Step-by-Step Guide",
    description: "From finished manuscript to a book readers can buy: formatting, cover, pricing, rights and royalties — explained simply for first-time Indian authors.",
    date: "2026-09-24",
    category: "Writing & publishing",
    minutes: 8,
    cta: { kind: "link", href: "/publish", label: "Start publishing — it’s free", text: "Publish on Veeer Sukhadiya Books: free to publish, keep 85% of every sale, and get paid on the last day of every month." },
    body: [
      { p: "Self-publishing means you control your book: the words, the cover, the price and your rights. For many first-time authors in India, an eBook is the fastest and cheapest way to get a book in front of readers. Here’s the process, step by step." },
      { h2: "1. Finish and polish the manuscript" },
      { p: "Finish the full draft first, then revise. Ask two or three honest readers for feedback, and proofread carefully — or pay an editor if you can. Typos and confusing passages are the most common reasons readers leave bad reviews." },
      { h2: "2. Format it cleanly" },
      { ul: [
        "Use one consistent style for chapter headings so a table of contents can be built.",
        "Include a title page, a copyright page and the chapters in order.",
        "Remove blank pages, printer’s marks and odd spacing.",
        "Save as DOCX for reflowable text, or PDF if the exact layout matters (for example picture books).",
      ] },
      { h2: "3. Get a cover that works at thumbnail size" },
      { p: "Readers first see your cover as a small image in a list. Use a large, readable title, strong contrast and one clear image. A tall rectangle around 1600 × 2560 pixels is a safe size. Only use images you have the rights to." },
      { h2: "4. Write a description that sells" },
      { p: "Open with a hook, say who the book is for, and what they’ll get from it. Keep paragraphs short. Choose categories and keywords that readers would actually search for." },
      { h2: "5. Choose a price" },
      { p: "For a first eBook, a lower price helps readers take a chance on a new author. Look at similar books in your genre. You can always raise the price once you have reviews." },
      { h2: "6. Understand rights and royalties" },
      { ul: [
        "Check whether the platform’s licence is exclusive or non-exclusive — non-exclusive lets you sell elsewhere too.",
        "Compare the royalty percentage you keep on each sale.",
        "Check when and how you’re paid, and whether there are upfront fees.",
      ] },
      { tip: "Be wary of any service that charges large upfront “publishing packages” and promises sales. Publishing an eBook shouldn’t require paying thousands before a single reader buys." },
      { h2: "7. Launch and promote" },
      { p: "Tell your network the day your book goes live. Share a short excerpt on Instagram or WhatsApp, offer a launch price for the first few days, and ask your first readers for honest reviews. Consistent small promotion beats one big announcement." },
      { h2: "Publishing on Veeer Sukhadiya Books" },
      { p: "Our Author Studio walks you through all of this in three steps — book details, manuscript and cover, and pricing — with live tips along the way. It’s free to publish, you keep 85% of every sale and your rights, and royalties are paid on the last day of every month." },
    ],
  },
  {
    slug: "why-we-love-fantasy-stories",
    title: "Why We Love Fantasy Stories (And Why Adults Should Read Them Too)",
    description: "Dragons and broken skies aren’t just for kids. Fantasy helps us think about courage, loss and hope — here’s why the genre is worth your time.",
    date: "2026-09-04",
    category: "Fiction",
    minutes: 4,
    cta: { kind: "link", href: "/free-book", label: "Get The Shattered Sky free", text: "Try a fantasy story tonight: The Shattered Sky is free — the complete book — when you join our reading list." },
    body: [
      { p: "Fantasy is sometimes dismissed as escapism. But the best fantasy stories aren’t running away from real life — they look at it from a new angle." },
      { h2: "It makes big ideas feel personal" },
      { p: "Courage, sacrifice, power, grief: in a realistic novel these can feel heavy. In a world with a shattered sky, they become an adventure you live alongside the characters — and the lessons stay with you." },
      { h2: "It stretches your imagination" },
      { p: "Building a new world in your mind — its rules, maps and magic — is a workout for creativity. Many readers find it refreshes their thinking in everyday work too." },
      { h2: "It offers hope" },
      { p: "Fantasy heroes usually start small and unsure. Watching them face impossible odds is a reminder that ordinary people can do extraordinary things." },
      { h2: "It’s a genuine break" },
      { p: "After a long day, a story set far from inbox and traffic is a real rest for the mind. A short fantasy novel is the perfect weekend read." },
      { p: "If you haven’t read fantasy since childhood, start with a shorter book — something you can finish in an evening or two." },
    ],
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function sortedPosts() {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
