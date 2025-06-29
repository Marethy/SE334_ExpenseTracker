import { toast } from "sonner";

import { InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.subscriptions.cancel)["$post"],
  200
>;

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.subscriptions.cancel.$post();

      if (!response.ok) {
        throw Error("Failed to cancel subscription");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Subscription canceled successfully");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: () => {
      toast.error("Failed to cancel subscription");
    },
  });

  return mutation;
};
