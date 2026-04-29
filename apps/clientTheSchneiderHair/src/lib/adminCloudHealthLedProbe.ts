import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import type { DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { getContentDataSourceMode, getPortalFirebase } from 'artist-portal-sdk';

/**
 * Mirrors Artist Portal “all sources live” LED: Firebase is the active content mode
 * and every tracked collection has real cloud data (same rules as AdminDashboard fetch).
 */
export async function probeAdminCloudHealthAllSourcesLive(): Promise<boolean> {
  if (getContentDataSourceMode() !== 'firebase') {
    return false;
  }

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

  if (settled.some((r) => r.status === 'rejected')) {
    return false;
  }

  const reviewsSnap = (settled[0] as PromiseFulfilledResult<QuerySnapshot>).value;
  const faqSnap = (settled[1] as PromiseFulfilledResult<QuerySnapshot>).value;
  const servicesSnap = (settled[2] as PromiseFulfilledResult<QuerySnapshot>).value;
  const settingsSnap = (settled[3] as PromiseFulfilledResult<DocumentSnapshot>).value;
  const vlSnap = (settled[4] as PromiseFulfilledResult<DocumentSnapshot>).value;
  const gSnap = (settled[5] as PromiseFulfilledResult<DocumentSnapshot>).value;
  const artistsSnap = (settled[6] as PromiseFulfilledResult<QuerySnapshot>).value;
  const productsSnap = (settled[7] as PromiseFulfilledResult<QuerySnapshot>).value;

  return (
    !reviewsSnap.empty &&
    faqSnap.docs.length > 0 &&
    !servicesSnap.empty &&
    settingsSnap.exists() &&
    vlSnap.exists() &&
    gSnap.exists() &&
    !artistsSnap.empty &&
    !productsSnap.empty
  );
}
