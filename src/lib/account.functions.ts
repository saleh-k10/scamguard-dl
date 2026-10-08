import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ confirmation: z.literal("DELETE") }).strict().parse(input))
  .handler(async () => {
    setResponseHeader("Cache-Control", "no-store");
    const { deleteOwnAccount } = await import("./account.server");
    return deleteOwnAccount(getRequestHeader("authorization"));
  });