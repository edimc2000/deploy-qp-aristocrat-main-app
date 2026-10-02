self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  const isPrintRelay = String(data.tag || '').startsWith('bbcafe-print-relay-')
  event.waitUntil((async () => {
    // Print relay jobs: nudge any open tab to fetch/print immediately, skip the notification
    // popup if a tab is already open and listening (still shown when nothing is open, so a
    // human can tap it to bring the app forward and pick up the job).
    if (isPrintRelay) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      windows.forEach(client => client.postMessage({ type: 'print-relay-job', jobId: data.jobId }))
      if (windows.length > 0) return
    }
    await self.registration.showNotification(data.title || 'New service order', {
      body: data.body || 'A new paid order is ready for preparation',
      icon: '/assets/png-logo.png',
      badge: '/assets/png-logo.png',
      tag: data.tag || 'bbcafe-service-display',
      renotify: true,
      requireInteraction: true,
      data: { url: data.url || '/service-displays' }
    })
  })())
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || '/service-displays', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existingWindow = windows.find(client => client.url.startsWith(self.location.origin))
    if (existingWindow) {
      await existingWindow.navigate(targetUrl)
      return existingWindow.focus()
    }
    return self.clients.openWindow(targetUrl)
  })())
})