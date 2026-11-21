import { ApolloClient, InMemoryCache } from "@apollo/client";
import { link } from "@/lib/transport";
import type { FeedQuery } from "@/gql/graphql";

type FeedPage = FeedQuery["feed"];

export const client = new ApolloClient({
  // HTTP to the API, or (GitHub Pages demo) the schema running in this browser
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // "Load more" appends the next page instead of replacing the list
          feed: {
            keyArgs: ["language"], // each language filter keeps its own list
            merge(existing: FeedPage | undefined, incoming: FeedPage, { args }) {
              if (!args?.after || !existing) return incoming;
              return { ...incoming, nodes: [...existing.nodes, ...incoming.nodes] };
            },
          },
        },
      },
    },
  }),
});

// after creating / editing / deleting a post: lists refetch the next time they're shown
export function forgetLists() {
  client.cache.evict({ id: "ROOT_QUERY", fieldName: "feed" });
  client.cache.evict({ id: "ROOT_QUERY", fieldName: "user" });
  client.cache.gc();
}
