/** Ambient declaration for process.env — shared by all server-side modules. */
declare const process: {
  env: Record<string, string | undefined>;
  exit: (code?: number) => never;
};
