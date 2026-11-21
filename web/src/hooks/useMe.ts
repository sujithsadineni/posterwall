import { useQuery } from "@apollo/client/react";
import { ME } from "@/graphql/operations";

export function useMe() {
  const { data, loading } = useQuery(ME);
  return { me: data?.me ?? null, loading };
}
