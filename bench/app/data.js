// Fixed seed data — never random, so screenshots are comparable across branches.
// Byte-identical on bench/baseline and bench/styled.
//
// Edge cases are deliberate (see bench/SPEC.md § Seed data):
//   #2  76-char title            #7  48-char author
//   #4  zero tags                #9  six tags
//   #5  rating: null             #2  only item with status "reading"
//   #5  non-ASCII latin          #8  CJK
//   #12 unbroken 63-char string (no spaces to break on)

export const ITEMS = [
  {
    id: 1, title: 'The Shape of a Sentence', author: 'Maren Holt',
    status: 'done', tags: ['craft', 'language'], rating: 4, added: '2026-09-18',
    text: `Every sentence has a shape before it has a meaning. You can feel it in the mouth — the rise, the pause, the fall. Writers who ignore this produce prose that is technically correct and completely inert.

The fix is not ornament. It is attention to the joints: where a clause turns, where a breath lands, where a reader is allowed to rest.`,
  },
  {
    id: 2,
    title: 'On the Persistent Difficulty of Naming Things Well in Large Software Systems',
    author: 'D. Okonjo',
    status: 'reading', tags: ['software', 'naming', 'essays'], rating: 5, added: '2026-09-21',
    text: `A name is a compression of intent. When the intent is unclear, no name will save it; when the intent is clear, almost any name will do.

This is why renaming exercises so often fail. They treat the symptom — an awkward identifier — while leaving the muddled concept underneath entirely intact.`,
  },
  {
    id: 3, title: 'Quiet Interfaces', author: 'Lena Fors',
    status: 'unread', tags: ['design'], rating: 4, added: '2026-09-20',
    text: `The best tool I own makes almost no noise. It does not congratulate me. It does not animate when I am not looking at it.

Restraint reads as confidence. A product that needs to shout about every saved field does not trust its own work.`,
  },
  {
    id: 4, title: 'Notes From a Slow Migration', author: 'Ravi Chandrasekaran',
    status: 'done', tags: [], rating: 3, added: '2026-09-11',
    text: `Eighteen months, two teams, one database. What I learned is that the technical plan was never the hard part.

The hard part was that every shortcut taken in 2019 had a person attached to it, and that person was usually still in the room.`,
  },
  {
    id: 5, title: 'Søren og havet', author: 'Ingrid Dahl',
    status: 'unread', tags: ['fiction', 'translation'], rating: null, added: '2026-09-14',
    text: `Han gik ned til vandet hver morgen, også om vinteren, også når der ikke var noget at se.

The translator's note admits defeat in the first paragraph: there is no English word for the particular grey this book is about.`,
  },
  {
    id: 6, title: 'Cost Models Nobody Reads', author: 'P. Alvarez',
    status: 'done', tags: ['infra', 'money'], rating: 2, added: '2026-08-30',
    text: `The spreadsheet was correct. It was also nine tabs deep and named "final_v3_REAL".

No one read it, the project shipped, and the bill arrived in March.`,
  },
  {
    id: 7, title: 'Small Tools, Sharp Edges',
    author: 'Wilhelmina Featherstonehaugh-Brandt-Okonkwo Esq.',
    status: 'unread', tags: ['tools', 'unix'], rating: 5, added: '2026-09-22',
    text: `A tool that does one thing will eventually be composed into something its author never imagined. A tool that does nine things will be replaced.

This is not a moral claim. It is an observation about surface area.`,
  },
  {
    id: 8, title: '日本語の余白について', author: 'Aiko Mori',
    status: 'unread', tags: ['typography', 'design'], rating: 4, added: '2026-09-19',
    text: `余白は空白ではない。読み手が息をする場所である。

Western layout treats whitespace as what is left over. This essay argues the opposite: the space is the composition, and the marks are what interrupt it.`,
  },
  {
    id: 9, title: 'Everything Is a Queue', author: 'Tomas Blix',
    status: 'done',
    tags: ['systems', 'queues', 'latency', 'theory', 'ops', 'performance'],
    rating: 4, added: '2026-09-02',
    text: `Once you see it you cannot unsee it. The checkout line, the thread pool, the hospital, the inbox.

Little's Law does not care what the items are.`,
  },
  {
    id: 10, title: 'Against Dashboards', author: 'Ruth Nakamura',
    status: 'unread', tags: ['data', 'design'], rating: 3, added: '2026-09-07',
    text: `A dashboard is an admission that no one knows which number matters.

Twelve charts, updated hourly, watched by nobody. The alternative is harder and less impressive: pick one number and defend it.`,
  },
  {
    id: 11, title: 'The Margin Is the Argument', author: 'J. Halloway',
    status: 'done', tags: ['reading', 'craft'], rating: 5, added: '2026-09-16',
    text: `Secondhand books are worth more to me when someone has written in them. The disagreements are the best part.

A clean book has not been read. It has been processed.`,
  },
  {
    id: 12,
    title: 'Rindfleischetikettierungsuberwachungsaufgabenubertragungsgesetz',
    author: 'A. Pemberton',
    status: 'unread', tags: ['language'], rating: 1, added: '2026-08-24',
    text: `A word long enough to break a layout is a useful test case and a bad title. This one is a real statute, repealed in 2013.

Any container that cannot survive it is a container with an untested assumption.`,
  },
];

export const STATUSES = ['unread', 'reading', 'done'];
