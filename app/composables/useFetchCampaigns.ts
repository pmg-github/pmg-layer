import type { CampagneViewModel } from "models";

export function useFetchCampaigns() {
  const api = useApi();
  const { locale } = useI18n();

  const getCampaign = (
    id: number,
    lang?: string,
  ): Promise<CampagneViewModel> => {
    return api(`/api/campagnes/${id}/${lang ?? locale.value}`);
  };

  return { getCampaign };
}
