import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import prisma from "@/lib/db";

const YT_KEY = process.env.YOUTUBE_API_KEY!;
const CHANNELS = [
  { label: 'Sing King', handle: 'singkingkaraoke' },
  { label: 'Stingray', handle: 'StingrayKaraoke' },
  { label: 'KaraFun', handle: 'karafun' },
  { label: 'Party Tyme', handle: 'partytymekaraokechannel6967' },
  { label: 'Sunfly', handle: 'sunflykaraokeofficial' },
  { label: 'CC Karaoke', handle: 'CCKaraoke' },
  { label: 'ZZang Karaoke', handle: 'zzangkaraoke' },
  { label: 'Musisi Karaoke', handle: 'MusisiKaraoke' },
];

function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

async function getChannelId(handle: string) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YT_KEY}&part=snippet&type=channel&q=${encodeURIComponent(handle)}&maxResults=1`;
  const j = await (await fetch(url)).json();
  return j?.items?.[0]?.snippet?.channelId || j?.items?.[0]?.id?.channelId;
}

async function getUploadsPlaylistId(channelId: string) {
  const url = `https://www.googleapis.com/youtube/v3/channels?key=${YT_KEY}&id=${channelId}&part=contentDetails`;
  const j = await (await fetch(url)).json();
  return j?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
}

async function indexChannel(ch: { label: string; handle: string }) {
  const channelId = await getChannelId(ch.handle);
  const uploads = await getUploadsPlaylistId(channelId);
  if (!uploads) return;

  let pageToken = '';
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YT_KEY}&part=snippet&playlistId=${uploads}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const j = await (await fetch(url)).json();
    const items = j?.items || [];
    for (const it of items) {
      const sn = it.snippet;
      const vid = sn?.resourceId?.videoId;
      if (!vid) continue;

      const title = sn.title || '';
      await prisma.youtubeVideo.upsert({
        where: { videoId: vid },
        create: {
          videoId: vid,
          channelHandle: ch.handle,
          channelLabel: ch.label,
          title,
          titleNorm: norm(title),
          publishedAt: new Date(sn.publishedAt || Date.now()),
          thumbnail: sn?.thumbnails?.medium?.url || sn?.thumbnails?.default?.url || null,
        },
        update: {
          title,
          titleNorm: norm(title),
          thumbnail: sn?.thumbnails?.medium?.url || sn?.thumbnails?.default?.url || null,
          publishedAt: new Date(sn.publishedAt || Date.now()),
        },
      });
    }
    pageToken = j.nextPageToken || '';
  } while (pageToken);
}

(async () => {
  for (const ch of CHANNELS) {
    console.log('Indexing', ch.handle);
    await indexChannel(ch);
  }
  await prisma.youtubeMeta.upsert({
    where: { id: 1 },
    create: { id: 1, lastIndexed: new Date() },
    update: { lastIndexed: new Date() },
  });
  console.log('Done.');
  process.exit(0);
})();
