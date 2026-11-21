# What I learned: v1 → PosterWall (v2)

> Draft written with Claude from the rebuild; to be reviewed and rewritten in my own words.

In 2025 I built the same idea twice: this repo's first version, **[`v1-rest-mysql`](https://github.com/sujithsadineni/posterwall/tree/v1-rest-mysql)**
(React + Express REST + MySQL, posts / likes / comments) and **[Myposts.com](https://github.com/sujithsadineni/Myposts.com)** (an
unfinished GraphQL + PostgreSQL backend). PosterWall finishes the idea, and the old code stays in history (tag `v1-rest-mysql`) and in the Myposts.com repo.

## At a glance

|                 | v1 (Full-Stack, 2025)                  | PosterWall (v2)                                                              |
| --------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| API             | Express REST routes                    | GraphQL: Apollo Server 5 on Express 5, one schema file                       |
| Database        | MySQL, Sequelize `sync()`              | PostgreSQL, Drizzle ORM, versioned SQL migrations                            |
| IDs             | auto-increment integers                | UUIDs                                                                        |
| Passwords       | bcrypt (native package)                | Node's built-in `scrypt`, constant-time compare                              |
| Session         | JWT in `localStorage` (`jsonwebtoken`) | JWT in an httpOnly, SameSite cookie (`jose`)                                 |
| Input checks    | none                                   | zod, the same rules on the server and in the forms                           |
| Front end build | Create React App                       | Vite                                                                         |
| UI              | Ant Design 5 + custom CSS              | Tailwind v4 + shadcn/ui (Radix), light and dark                              |
| Data in the UI  | axios in `useEffect`                   | Apollo Client 4 cache, types generated from the schema                       |
| Tests           | none                                   | 30 API tests (node:test) + 15 browser scenarios × desktop/phone (Playwright) |

## The lessons

1. **Let the database enforce the rules.** A like is a row whose primary key is (post, person), so a double like is
   impossible even when two requests race. Usernames are unique on `lower(username)`, so "Demo" and "demo" can't both
   exist. Deleting a post cascades to its comments and likes. In v1 these were checks in code, or missing.
2. **GraphQL invites N+1 queries; DataLoader fixes it.** A naive resolver asks for each post's author, like count and
   comment count one post at a time. With per-request DataLoaders a feed page takes **5 SQL queries whatever its
   size**, and a test fails if that number changes.
3. **Cursor pagination needs exact cursors.** Postgres keeps microseconds and a JavaScript `Date` keeps milliseconds,
   so a cursor built from a `Date` can skip or repeat posts. The cursor carries the timestamp as Postgres text.
4. **Security is mostly small, boring decisions.** Every write checks who's asking (v1 let anyone create a post). The
   login error is the same for a wrong password and an unknown user, and both take about as long. No password field
   exists in the API (Myposts.com exposed one). The token lives where page scripts can't read it. Secrets live in a
   git-ignored `.env` (v1 committed a database password). `?next=` redirects only go to paths on this site.
5. **One source of truth for types.** The web app's TypeScript types are generated from the API's schema file, so a
   schema change becomes compile errors in exactly the pages that need updating.
6. **Optimistic UI makes it feel instant.** A like changes the heart and the count before the server answers, and
   Apollo rolls it back if the server says no.
7. **Dependencies age.** v1 no longer runs on current Node: an old package under `jsonwebtoken` uses an API that Node
   removed. v2 has no native packages, runs its TypeScript directly on Node (no build step for the API), and
   `npm audit` reports 0 known vulnerabilities in production dependencies (one was fixed with an `overrides` pin).
8. **Write the tests first.** Each step started with failing tests that described the behaviour. The browser tests
   caught two real bugs before a person did: logging out raced the page change and surfaced as an unhandled error,
   and a theme package rendered a `<script>` inside React (replaced with a 25-line hook).
9. **Ship less JavaScript.** Splitting each page into its own file took the first load from about 280 KB to about
   237 KB gzipped; forms and validation load only when someone opens a form.
10. **Never trust an upload's name or type.** A poster is accepted only if its first bytes say PNG, JPEG or WebP (an
    SVG or a text file renamed `.png` is refused), it's stored under a random name, it's served with `nosniff` and a
    locked-down Content-Security-Policy, and its path is checked against the files that exist before a post may use it.
11. **One map, two names.** GraphQL says `TELUGU`, the database says `telugu`. Apollo converts both ways from one map,
    so the resolvers only ever see the database value (my first version converted twice and refused valid input).
12. **Adding a required column needs a plan for existing rows.** The movie migration adds `movie_title NOT NULL`,
    which only works on an empty table. Fine for a fresh project; with real data it would need a default or a backfill
    step first.
13. **Demo data can't borrow other people's art.** Real posters are copyrighted, so the demo posters are drawn by code:
    a palette per language, shapes placed from a hash of the title, and a label saying it's original art.
