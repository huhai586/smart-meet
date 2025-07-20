import { useEffect, useState } from "react";
import { fetchAvailableModels } from '~/components/options/ai-settings/utils/model-service';
import { type AIServiceType } from '~/components/options/ai-settings/utils/constants';

// Custom Hook for model fetching
export const useFetchModels = (service: AIServiceType, apiKey?: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      const { models, error } = await fetchAvailableModels(service, apiKey);
      setModels(models);
      setError(error || '');
      setLoading(false);
    };
    fetchModels();
  }, [service, apiKey]);

  return { models, loading, error };
};
