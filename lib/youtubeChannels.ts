// lib/youtubeChannels.ts

// A simple shape for configured YouTube karaoke publishers
export type YTChannel = {
  label: string;            // human label
  handle?: string;          // YouTube handle WITHOUT the leading @
  channelId?: string;       // UC... id (preferred when known)
  active?: boolean;         // optional toggle for future admin UI
};

// Your current set (handles: no leading "@")
export const YT_CHANNELS: YTChannel[] = [
  { label: "Vocal Star", handle: "VocalStarKaraoke", channelId: "UCgTrJ_j4rlHyBUlAnU1cHYg", active: true },
  { label: "KaraFun", handle: "karafun", channelId: "UCbqcG1rdt9LMwOJN4PyGTKg", active: true },
  { label: "Zoom Karaoke", handle: "ZoomKaraokeOfficial", channelId: "UCrk8mp-ugqtAbjif6JARjlw", active: true },
  { label: "Sunfly", handle: "sunflykaraokeofficial", channelId: "UCcKX_cqJR4RwW5dxeqHbseQ", active: true },
  { label: "Mr Entertainer", handle: "MrEntertainerKaraokeChannel", channelId: "UC8saA2uSz4hIUAo31Y5cM2w", active: true },
  { label: "Cereal Killer", handle: "CerealKillerKaraoke", channelId: "UCJWpWgybng0gtBQgSUoaWWw", active: true },
  { label: "Sing King", handle: "singkingkaraoke", channelId: "UCwTRjvjVge51X-ILJ4i22ew", active: true },
  { label: "Musisi", handle: "MusisiKaraoke", channelId: "UCJw1qyMF4m3ZIBWdhogkcsw", active: true },
  { label: "Party Tyme", handle: "partytymekaraokechannel6967", channelId: "UCWLqO9ztz16a_Ko4YB9PnFQ", active: true },
  { label: "CC Karaoke", handle: "CCKaraoke", channelId: "UCTQHT1Gj_D_Bc7P1REuMoAg", active: true },
  { label: "The Karaoke Channel", handle: "TheKaraokeChannel", channelId: "UCsa0m6LKsY-jMD2jrabeluw", active: true },
  { label: "Stingray Karaoke", handle: "StingrayKaraoke", channelId: "UCYi9TC1HC_U2kaRAK6I4FSQ", active: true },
  { label: "Karaoke On VEVO", handle: "KaraokeOnVEVO", channelId: "UCjzHeG1KWoonmf9d5KBvSiw", active: true },
  { label: "Karaoke Channel", handle: "KaraokeChannelOfficial", channelId: "UCX7YkU9nEeaoZbkVLVajcMg", active: true },
  { label: "Karaoke Bliss", handle: "KaraokeBliss", channelId: "UCa6vGFO9ty8v5KZJXQxdhaw", active: true },
  { label: "Sing2Music", handle: "Sing2Music", channelId: "UCV3b1mI1p1H4r8fXw5jX9LA", active: true },

  // You can add more here later — just keep the same shape.
];

// Backward/forward-compatible exports that the route loader accepts
export const YTChannels = YT_CHANNELS;
export const channels = YT_CHANNELS;
export default YT_CHANNELS;
