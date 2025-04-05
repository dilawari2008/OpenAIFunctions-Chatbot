import Context from "@/common/context";

type MergedContext = Context;
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context: MergedContext;
    }

    interface Response {
      sendOk: () => void;
      /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
      sendFormatted: (data: any, { meta, errorCode, message }?: { meta?: any; errorCode?: string; message?: string }) => void;
    }
  }
}