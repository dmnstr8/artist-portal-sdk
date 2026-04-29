import { collection, doc, getDoc, getDocs, type DocumentSnapshot, type QuerySnapshot } from 'firebase/firestore';
import { getContentDataSourceMode, getPortalFirebase } from '../index';

export async function probeAdminCloudHealthAllSourcesLive(): Promise<boolean> {
  if (getContentDataSourceMode() !== 'firebase') return false;

  const db = getPortalFirebase().db;
  const settled = await Promise.allSettled([
    getDocs(collection(db, 'reviews')),
    getDocs(collection(db, 'faq')),
    getDocs(collection(db, 'services')),
    getDoc(doc(db, 'settings', 'general')),
    getDoc(doc(db, 'videolinks', 'home')),
    getDoc(doc(db, 'gallery', 'home')),
    getDocs(collection(db, 'artistprofiles')),
    getDocs(collection(db, 'productcategories')),
  ]);

  if (settled.some((r) => r.status === 'rejected')) return false;

  const [reviews, faq, services, settings, vl, gallery, artists, products] =
    settled as PromiseFulfilledResult<QuerySnapshot | DocumentSnapshot>[];

  return (
    !(reviews.value as QuerySnapshot).empty &&
    (faq.value as QuerySnapshot).docs.length > 0 &&
    !(services.value as QuerySnapshot).empty &&
    (settings.value as DocumentSnapshot).exists() &&
    (vl.value as DocumentSnapshot).exists() &&
    (gallery.value as DocumentSnapshot).exists() &&
    !(artists.value as QuerySnapshot).empty &&
    !(products.value as QuerySnapshot).empty
  );
}
