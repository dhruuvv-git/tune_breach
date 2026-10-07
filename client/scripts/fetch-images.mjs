import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDirectory = path.join(clientDirectory, 'public', 'images');
const imageIds = [
  'photo-1511671782779-c97d3d27a1d4',
  'photo-1520523839898-507125cd53c1',
  'photo-1598488035139-bdbb2231ce04',
  'photo-1525201548942-d8732f6617a0',
  'photo-1598653222000-6b7b7a552625',
  'photo-1514525253161-7a46d19cd819',
  'photo-1465847899084-d164df4dedc6',
  'photo-1550985616-10810253b84d',
  'photo-1510915361894-db8b60106cb1',
  'photo-1590602847861-f357a9332bbc',
];

await mkdir(imageDirectory, { recursive: true });

for (const imageId of imageIds) {
  const imageUrl = `https://images.unsplash.com/${imageId}?fit=crop&w=800&q=80&fm=jpg`;
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not download ${imageId}: ${response.status} ${response.statusText}`);
  }

  const image = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(imageDirectory, `${imageId}.jpg`), image);
}

console.log(`Downloaded ${imageIds.length} original photos into public/images.`);
