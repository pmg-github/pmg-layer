import type { BoPollViewListModel } from "models";

export interface FetchPollsComposable {
  getPolls: (opts: {
    keyword?: string;
    limit?: number;
  }) => Promise<BoPollViewListModel[]>;
  getPollsData: (opts: { reference: string }) => Promise<BoPollViewListModel[]>;
  getPoll: (id: number) => Promise<any>;
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
  };
};
