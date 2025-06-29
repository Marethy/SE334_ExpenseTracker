import { toast } from "sonner";

import { InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.subscriptions.upgrade)["$post"],
  200
>;

export const useUpgradeSubscription = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.subscriptions.upgrade.$post();

      if (!response.ok) {
        throw Error("Failed to upgrade subscription");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Successfully upgraded to Premium! 🎉");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: () => {
      toast.error("Failed to upgrade subscription");
    },
  });

  return mutation;
};
