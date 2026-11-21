// Demo data shared by the database seed (seed.ts) and the in-browser GitHub Pages demo (web/src/demo).
// Real films, original opinions. Plain data only: no Node imports, so the browser can use it too.

export const people = [
  ["demo", "demo1234"],
  ["alex", "alex1234"],
  ["sam", "sam12345"],
  ["maya", "maya1234"],
] as const;

export type Lang = "english" | "uk" | "hindi" | "telugu" | "tamil";
export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const movies: [
  author: string,
  movie: string,
  year: number,
  language: Lang,
  rating: number,
  title: string,
  body: string,
  hours: number,
][] = [
  [
    "maya",
    "RRR",
    2022,
    "telugu",
    5,
    "Pure cinema energy",
    "Two friends, one dance number and three hours that never drag. Watch it on the biggest screen you can find.",
    2,
  ],
  [
    "sam",
    "Vikram",
    2022,
    "tamil",
    4,
    "An action film that keeps reloading",
    "Dense, loud and stylish. The last act is worth staying very alert for.",
    6,
  ],
  [
    "alex",
    "Paddington 2",
    2017,
    "uk",
    5,
    "The kindest film I've seen",
    "A marmalade-powered comedy that's genuinely warm. Hugh Grant is having the time of his life.",
    11,
  ],
  [
    "demo",
    "Interstellar",
    2014,
    "english",
    5,
    "Still thinking about the docking scene",
    "Big science-fiction ideas with a father and daughter at the centre. The score does half the work.",
    18,
  ],
  [
    "maya",
    "Dangal",
    2016,
    "hindi",
    5,
    "A sports film about a family",
    "The wrestling is great, but the father-daughter story is what stays with you.",
    26,
  ],
  [
    "alex",
    "Jai Bhim",
    2021,
    "tamil",
    5,
    "Hard to watch, impossible to forget",
    "A courtroom drama that's angry for good reason. Quietly powerful performances.",
    33,
  ],
  [
    "sam",
    "Skyfall",
    2012,
    "uk",
    4,
    "Bond, but personal",
    "Gorgeous to look at. The best of the modern Bond films for me.",
    41,
  ],
  [
    "demo",
    "Baahubali 2: The Conclusion",
    2017,
    "telugu",
    4,
    "Worth it for the scale alone",
    "Huge sets and bigger moments. Answering 'why' was satisfying after two years of waiting.",
    50,
  ],
  [
    "sam",
    "3 Idiots",
    2009,
    "hindi",
    5,
    "Rewatched it again this weekend",
    "Funny first, wise second. All izz well.",
    60,
  ],
  [
    "alex",
    "Oppenheimer",
    2023,
    "english",
    4,
    "Three hours that feel like a thriller",
    "Mostly people talking in rooms, and somehow it's gripping. Go for the sound design.",
    72,
  ],
];

export const commentData: [postIndex: number, author: string, body: string, hours: number][] = [
  [0, "alex", "Saw it twice in theatres. No regrets.", 1.5],
  [0, "sam", "That interval block!", 1],
  [1, "maya", "The background score carries every fight.", 5],
  [2, "demo", "Agreed. Best family film in years.", 10],
  [3, "maya", "The water planet scene still stresses me out.", 17],
  [3, "alex", "Watch it in IMAX if it ever comes back.", 16],
  [4, "sam", "Aamir Khan's transformation is unreal.", 25],
  [5, "demo", "Suriya at his best.", 30],
  [7, "maya", "The answer was worth the wait.", 48],
  [8, "alex", "Rancho forever.", 59],
];

export const likeData: [postIndex: number, users: string[]][] = [
  [0, ["alex", "sam", "demo"]],
  [1, ["demo", "maya"]],
  [2, ["demo", "sam", "maya"]],
  [3, ["alex", "maya"]],
  [4, ["demo", "sam"]],
  [5, ["maya", "sam", "demo"]],
  [6, ["alex"]],
  [7, ["sam", "alex"]],
  [8, ["maya", "demo", "alex"]],
  [9, ["sam"]],
];
