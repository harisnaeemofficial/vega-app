import axios from 'axios';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const flixhqGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const urlRes = await getBaseUrl('consumet');
    const baseUrl = urlRes + '/movies/flixhq';
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/${filter.replace('searchQuery=', '')}?page=${page}`
      : `${baseUrl + filter}`;
    // console.log(url);
    const res = await axios.get(url, {signal});
    const data = res.data?.results || res.data;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.title;
      const link = element.id;
      const image = element.image;
      if (title && link && image) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });

    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('flixhq error ', err);
    return [];
  }
};
