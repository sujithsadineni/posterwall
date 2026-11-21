import { createApp } from "./app.ts";

const app = await createApp();
const port = Number(process.env.PORT ?? 4100);
app.listen(port, () => console.log(`PosterWall API on http://localhost:${port}/graphql`));
