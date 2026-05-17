import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
  const user = await getSessionUser(context.cookies);
  context.locals.user = user
    ? { id: user.id, email: user.email }
    : null;
  return next();
});
