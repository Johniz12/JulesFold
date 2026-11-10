const sendBtn = document.getElementById('send-event-btn');
const notifyBtn = document.getElementById('notify-btn');
const msgInput = document.getElementById('msg-input');
const statusText = document.getElementById('status-text');

if (sendBtn && window.alfred && window.alfred.events) {
  sendBtn.addEventListener('click', async () => {
    const text = msgInput.value.trim() || 'Default payload';
    try {
      statusText.textContent = 'Publishing to host broker...';
      const result = await window.alfred.events.publish('demo.message', {
        text,
        sender: 'demo-vanilla',
        timestamp: new Date().toISOString(),
      });
      statusText.textContent = `Delivered to ${result.deliveredCount} subscriber(s)`;
    } catch (err) {
      statusText.textContent = `Error: ${err.message}`;
    }
  });
}

if (notifyBtn && window.alfred && window.alfred.notifications) {
  notifyBtn.addEventListener('click', async () => {
    try {
      await window.alfred.notifications.show({
        title: 'Vanilla Demo Alert',
        message: 'Notification triggered from Vanilla Demo module',
      });
      statusText.textContent = 'Notification dispatched to host';
    } catch (err) {
      statusText.textContent = `Notification error: ${err.message}`;
    }
  });
}
