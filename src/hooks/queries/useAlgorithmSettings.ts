import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAlgorithmSettings,
  getAlgorithmSettingsAudit,
  updateAlgorithmSettings,
  type UpdateAlgorithmSettingsInput,
} from "@/services/supabaseCollum/algorithmSettings";

export const useAlgorithmSettings = () => {
  return useQuery({
    queryKey: ["algorithmSettings"],
    queryFn: getAlgorithmSettings,
  });
};

export const useAlgorithmSettingsAudit = (limit = 15) => {
  return useQuery({
    queryKey: ["algorithmSettingsAudit", limit],
    queryFn: () => getAlgorithmSettingsAudit(limit),
  });
};

export const useUpdateAlgorithmSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAlgorithmSettingsInput) =>
      updateAlgorithmSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["algorithmSettings"] });
      queryClient.invalidateQueries({ queryKey: ["algorithmSettingsAudit"] });
    },
  });
};
