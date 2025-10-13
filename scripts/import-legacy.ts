// scripts/import-legacy.ts
import prisma from "@/lib/prisma";

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Line = { artist: string; title: string; discId: string };

const seed: Line[] = [
  // --- George Strait sample (you can add more later) ---
  { artist: "George Strait", title: "Ace In The Hole", discId: "SC8168-04" },
  { artist: "George Strait", title: "Ace In The Hole", discId: "SC8703-03" },
  { artist: "George Strait", title: "Ace In The Hole", discId: "KV410-24" },
  { artist: "George Strait", title: "Adalida", discId: "SC8163-11" },
  { artist: "George Strait", title: "Adalida", discId: "SFWS196-02" },
  { artist: "George Strait", title: "All My Ex's Live In Texas", discId: "SC8183-06" },
  { artist: "George Strait", title: "All My Ex's Live In Texas", discId: "CB90018-02" },
  { artist: "George Strait", title: "All My Ex's Live In Texas", discId: "PI203-18" },
  { artist: "George Strait", title: "Amarillo By Morning", discId: "SC10088-03" },
  { artist: "George Strait", title: "Amarillo By Morning", discId: "CB90017-01" },
  { artist: "George Strait", title: "Amarillo By Morning", discId: "LG178-02" },
  // add more freely from your list as you like
];

function splitDisc(discId: string) {
  // try to extract label prefix (e.g., SC, CB, PI, etc.)
  const m = discId.match(/^([A-Z]+)[\w-]*/i);
  return { label: m ? m[1].toUpperCase() : "UNK" };
}

async function run() {
  let added = 0, updated = 0;

  for (const row of seed) {
    const artist = row.artist.trim();
    const title = row.title.trim();
    const discId = row.discId.trim();
    const { label } = splitDisc(discId);
    const artistNorm = norm(artist);
    const titleNorm = norm(title);

    // Upsert by exact artist/title/discId combo
    const existing = await prisma.legacyTrack.findFirst({
      where: { artistNorm, titleNorm, discId },
      select: { id: true }
    });

    if (existing) {
      await prisma.legacyTrack.update({
        where: { id: existing.id },
        data: { labelCode: label }
      });
      updated++;
    } else {
      await prisma.legacyTrack.create({
        data: {
          artist, title, discId,
          labelCode: label, trackNo: null, notes: null,
          artistNorm, titleNorm
        }
      });
      added++;
    }
  }

  console.log(JSON.stringify({ ok: true, added, updated }));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
