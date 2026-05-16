// Banyan Circle — Web Push helper
// VAPID public key — keep this, it matches your server private key
const VAPID_PUBLIC = 'BDVlzF6iGkbAkOUMUaodtLfP-hKkA8olhrA_XcTW3RAp8eC67-m4nG475xZzNrn2gXUYcjPDtffJ54FQsThGOK0';

// Register service worker
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('SW registered');
    return reg;
  } catch(e) { console.warn('SW failed', e); return null; }
}

// Subscribe to push notifications
export async function subscribePush(supabase, userId, role) {
  if (!('PushManager' in window)) return false;

  const reg = await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;

  try {
    // Check existing subscription
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      });
    }

    // Save subscription to Supabase
    const subJSON = sub.toJSON();
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      role,
      endpoint: subJSON.endpoint,
      p256dh: subJSON.keys?.p256dh,
      auth: subJSON.keys?.auth,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' });

    return true;
  } catch(e) { console.warn('Push subscribe failed', e); return false; }
}

// Show a local notification (for testing without server)
export async function showLocalNotification(title, body, url = '/index.html') {
  const reg = await navigator.serviceWorker.ready;
  reg.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    data: { url },
    vibrate: [200, 100, 200]
  });
}

// Send push via Supabase Edge Function (called from owner/staff app)
export async function sendPushNotification(supabase, { title, body, url, targetRole }) {
  // This calls a Supabase Edge Function that sends the actual push
  // Edge function handles VAPID signing and Web Push Protocol
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { title, body, url, targetRole }
  });
  if (error) console.warn('Push send failed', error);
  return !error;
}

// Real-time subscription for in-app notifications
export function subscribeToNotifications(supabase, userId, role, onNotification) {
  // Subscribe to relevant tables based on role
  const channels = [];

  if (role === 'staff' || role === 'owner') {
    // Staff sees new bookings, complaints, task updates
    channels.push(
      supabase.channel('staff-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guest_complaints' },
          payload => onNotification({ title: 'New complaint', body: `${payload.new.guest_name || 'Guest'}: ${payload.new.complaint?.slice(0,60)}`, url: '/index.html#guests' }))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' },
          payload => onNotification({ title: 'New booking', body: `${payload.new.guest_name} — ${payload.new.check_in}`, url: '/index.html#bookings' }))
        .subscribe()
    );
  }

  if (role === 'guest') {
    // Guest sees updates to their complaints only
    channels.push(
      supabase.channel('guest-notifications')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'guest_complaints',
          filter: `guest_name=eq.${userId}` },
          payload => onNotification({ title: 'Complaint update', body: `Your complaint is now: ${payload.new.status}`, url: '/guest.html' }))
        .subscribe()
    );
  }

  return () => channels.forEach(c => supabase.removeChannel(c));
}

// Utility: convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}
