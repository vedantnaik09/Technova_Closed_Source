// services/integrationService.js
const axios = require('axios');

class IntegrationService {
  async syncGoogleCalendar(userId, accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { 
          Authorization: `Bearer ${accessToken}` 
        }
      });

      // Process and sync events
      return response.data.items;
    } catch (error) {
      console.error('Google Calendar Sync Error:', error);
      throw error;
    }
  }

  async sendSlackNotification(webhookUrl, message) {
    try {
      await axios.post(webhookUrl, { text: message });
    } catch (error) {
      console.error('Slack Notification Error:', error);
    }
  }
}

module.exports = new IntegrationService();