import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAlgorithmSettings,
  updateAlgorithmSettings,
  type UpdateAlgorithmSettingsInput,
} from "@/services/supabaseCollum/algorithmSettings";

export const useAlgorithmSettings = () => {
  return useQuery({
    queryKey: ["algorithmSettings"],
    queryFn: getAlgorithmSettings,
  });
};

export const useUpdateAlgorithmSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAlgorithmSettingsInput) =>
      updateAlgorithmSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmSettings"] });
    },
  });
};
