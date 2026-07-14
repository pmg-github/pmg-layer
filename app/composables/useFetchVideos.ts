import type {
  BoVideoListViewModel,
  BoVideoViewModelWitCursorAndContent,
  BoVideoDetailViewModel,
  FetchOpts,
} from 'models';

export function useFetchVideos() {
  const { locale } = useI18n();
  const api = useApi();
  const getProjects = (
    options: {
      keyword?: string;
      limit?: number;
      cursor?: string;
      producerCodes?: string[];
      ownerCodes?: string[];
    },
    fetchOpts?: FetchOpts,
  ): Promise<BoVideoViewModelWitCursorAndContent> => {
    const params = new URLSearchParams();
    const appendParam = (key: string, value?: string | number) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    };
    const appendArray = (key: string, values?: (string | number)[]) => {
      if (values?.length) {
        const normalArray = [...values]; // cast to "normal" array => Proxy object give error on forEach method!
        normalArray.forEach((value) => params.append(key, value.toString()));
      }
    };
    appendParam('keyword', options.keyword);
    appendParam('limit', options.limit);
    appendParam('cursor', options.cursor);
    appendArray('producerCodes', options.producerCodes);
    appendArray('ownerCodes', options.ownerCodes);
    return api(`/api/bo/videos/project/search?${params.toString()}`, {
      signal: fetchOpts?.signal,
    });
  };
  const getProjectDetail = (jobNr: string): Promise<BoVideoDetailViewModel> => {
    return api(`/api/bo/videos/project/detail/${jobNr}`);
  };
  const getVideos = (jobNr: string): Promise<BoVideoListViewModel[]> => {
    return api(`/api/bo/videos/search/${jobNr}`);
  };
  const putVideoStatus = (
    id: number,
    statusId: number,
  ): Promise<BoVideoListViewModel[]> => {
    return api(`/api/bo/videos/status/${id}`, {
      method: 'PUT',
      body: { statusId },
    });
  };
  const deleteVideo = (id: number): Promise<BoVideoListViewModel[]> => {
    return api(`/api/bo/videos/${id}`, {
      method: 'DELETE',
    });
  };
  const getVision = (id: number): Promise<string> => {
    return api(`/api/bo/videos/vision/${id}`);
  };
  const getJobCodeFromArticle = (reference: string): Promise<string> => {
    return api(`/api/bo/videos/job-code/`, {
      method: 'POST',
      body: { reference },
    });
  };
  const getVideo = async (jobCode: string, language?: string) => {
    language = language ?? locale.value;
    return api(`/api/videos/detail/${jobCode}/${language}`);
  };

  return {
    getVideos,
    getProjects,
    getProjectDetail,
    putVideoStatus,
    getVision,
    getJobCodeFromArticle,
    deleteVideo,
    getVideo,
  };
}
