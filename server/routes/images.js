import { Router } from 'express';

const router = Router();
const IMAGE_IDS = new Set([
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
]);

router.get('/:imageId.jpg', async (req, res) => {
  const { imageId } = req.params;
  if (!IMAGE_IDS.has(imageId)) {
    return res.status(404).json({ error: 'Image not found' });
  }

  try {
    const imageUrl = `https://images.unsplash.com/${imageId}?fit=crop&w=800&q=80&fm=jpg`;
    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(12000) });
    if (!imageResponse.ok) {
      return res.status(502).json({ error: 'Image source unavailable' });
    }

    const image = Buffer.from(await imageResponse.arrayBuffer());
    res.set({
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800',
      'Content-Type': 'image/jpeg',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.status(200).send(image);
  } catch (error) {
    console.error(`Image proxy failed for ${imageId}:`, error);
    return res.status(502).json({ error: 'Image source unavailable' });
  }
});

export default router;
