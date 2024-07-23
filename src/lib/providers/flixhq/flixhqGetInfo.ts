import axios from 'axios';
import {Info, EpisodeLink} from '../types';

export const flixhqGetInfo = async function (id: string): Promise<Info> {
  try {
    const url = 'https://consumet8.vercel.app/movies/flixhq/info?id=' + id;
    console.log(url);
    const res = await axios.get(url);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description.replace(/<[^>]*>?/gm, '').trim(),
      image: data.cover,
      cast: data.casts,
      rating: data.rating,
      tags: [data?.type, data?.duration, data.releaseDate.split('-')[0]],
      imdbId: '',
      type: data.episodes.length > 1 ? 'series' : 'movie',
    };

    const links: EpisodeLink[] = [];
    data.episodes.forEach((episode: any) => {
      const title = episode?.number
        ? 'Season-' + episode?.season + ' Ep-' + episode.number
        : episode.title;
      const link = episode.id + '*' + data.id;
      if (link && title) {
        links.push({
          title,
          link,
        });
      }
    });

    return {
      ...meta,
      linkList: [
        {
          episodesLink: '',
          movieLinks: '',
          quality: '',
          title: meta.title,
          directLinks: links,
        },
      ],
    };
  } catch (err) {
    console.error(err);
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: 'movie',
      linkList: [],
    };
  }
};
