import { Hono } from "hono/tiny";
import { getPageHtml } from "./page.js";

const app = new Hono();

app.get("/", (c) => {
  return c.html(getPageHtml());
});

app.onError((e, c) => {
  console.error(`${e}`);
  return c.text(`${e}`, 500);
});

export default app;
