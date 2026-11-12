import type { ToolsArticleListView } from 'models';
import { useApi, useI18n } from '#imports';

export function useFetchModels3d() {
  const api = useApi();
  const { locale } = useI18n();
  const getModels = (
    options: { term?: string; toolId?: number },
    lang = locale.value,
  ): Promise<ToolsArticleListView[]> => {
    const params = new URLSearchParams();
    if (options.term) params.set('term', options.term);
    if (options.toolId !== undefined)
      params.set('toolId', String(options.toolId));
    params.set('limit', '20');
    return api(`/api/tools/search/${lang}?${params.toString()}`);
  };
  return { getModels };
}
