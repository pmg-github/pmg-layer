import type { BoPollViewListModel } from "models";

export interface SubmitPollOptions {
  pollId: number;
  answerIds: number[];
  orderLineNumber?: string | null;
  projectCode?: string | null;
}

export interface FetchPollsComposable {
  getPolls: (opts: {
    keyword?: string;
    limit?: number;
  }) => Promise<BoPollViewListModel[]>;
  getPollsData: (opts: { reference: string }) => Promise<BoPollViewListModel[]>;
  getPoll: (id: number | string) => Promise<any>;
  submit: (opts: SubmitPollOptions) => Promise<void>;
  deleteAnswer: (pollId: number) => Promise<void> | void;
}

export const useFetchPolls = (): FetchPollsComposable => {
  const notImplemented = (name: string) => (): never => {
    throw new Error(
      `❌ useFetchPolls.${name} is not implemented!\n\n` +
        "The consuming app must provide an implementation.\n" +
        "Create composables/useFetchPolls.ts in your app.",
    );
  };

  return {
    getPolls: notImplemented("getPolls"),
    getPollsData: notImplemented("getPollsData"),
    getPoll: notImplemented("getPoll"),
    submit: notImplemented("submit"),
    deleteAnswer: notImplemented("deleteAnswer"),
  };
};
