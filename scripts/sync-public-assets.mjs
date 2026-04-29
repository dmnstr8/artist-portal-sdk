import { access, cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const contentDir = resolve(root, 'content');
const publicDir = resolve(root, 'public');
const publicMediaDir = resolve(publicDir, 'media');
const publicGalleryDir = resolve(publicMediaDir, 'gallery');
const publicArtistDir = resolve(publicMediaDir, 'artist');
const publicProductsDir = resolve(publicMediaDir, 'products');
const publicBrandsDir = resolve(publicMediaDir, 'brands');
const publicOtherDir = resolve(publicMediaDir, 'other');
const publicDataDir = resolve(publicDir, 'data');

await mkdir(publicDir, { recursive: true });
await mkdir(publicMediaDir, { recursive: true });
await mkdir(publicGalleryDir, { recursive: true });
await mkdir(publicArtistDir, { recursive: true });
await mkdir(publicProductsDir, { recursive: true });
await mkdir(publicBrandsDir, { recursive: true });
await mkdir(publicOtherDir, { recursive: true });
await mkdir(publicDataDir, { recursive: true });

const galleryAssets = [
  'portfolio-1.jpeg',
  'portfolio-2.jpeg',
  'portfolio-3.jpeg',
  'portfolio-4.jpeg',
  'portfolio-5.jpeg',
  'portfolio-6.jpeg',
];

const artistAssets = ['artist-hero.png', 'artist-secondary.png', 'artist-transparent.png'];
const productAssets = ['moroccanoil.jpg', 'evo.jpg', 'damgerjones.jpg', 'contentcreation.jpg', 'Olaplex.jpg'];
const otherAssets = ['ebook.jpeg', 'masterclass-image.jpeg', 'cookie-consent-fab.png'];

for (const file of galleryAssets) {
  await cp(resolve(distDir, file), resolve(publicGalleryDir, file), { force: true });
}

for (const file of artistAssets) {
  const inMediaArtist = resolve(publicArtistDir, file);
  const fromPublic = resolve(publicDir, file);
  const fromDist = resolve(distDir, file);
  try {
    await access(inMediaArtist);
  } catch {
    try {
      await cp(fromPublic, inMediaArtist, { force: true });
    } catch {
      await cp(fromDist, inMediaArtist, { force: true });
    }
  }
}

for (const file of productAssets) {
  await cp(resolve(distDir, 'brands', file), resolve(publicProductsDir, file), { force: true });
  await cp(resolve(distDir, 'brands', file), resolve(publicBrandsDir, file), { force: true });
}

for (const file of otherAssets) {
  const fromPublic = resolve(publicDir, file);
  const fromDist = resolve(distDir, file);
  try {
    await cp(fromPublic, resolve(publicOtherDir, file), { force: true });
  } catch {
    await cp(fromDist, resolve(publicOtherDir, file), { force: true });
  }
}

await cp(resolve(contentDir, 'site-copy.en.json'), resolve(publicDataDir, 'site-copy.en.json'), {
  force: true,
});
console.log('Synced local backup media into public/media/{gallery,artist,products,brands,other}.');
console.log('Synced marketing site copy from content/ to public/data/site-copy.en.json.');
