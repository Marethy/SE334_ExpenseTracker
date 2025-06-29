import { toast } from "sonner";

import { InferResponseType } from "hono";
import { useMutation } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.subscriptions.checkout)["$post"],
  200
>;

export const useCheckoutSubscription = () => {
  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.subscriptions.checkout.$post();

      if (!response.ok) {
        throw Error("Failed to create checkout");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      if (data.type === "checkout") {
        window.location.href = (
          data as { type: string; url: string; checkoutId: string }
        ).url;
      } else {
        toast.success(
          (data as { type: string; message: string }).message ||
            "Already subscribed to premium!"
        );
      }
    },
    onError: () => {
      toast.error("Failed to create checkout");
    },
  });

  return mutation;
};
