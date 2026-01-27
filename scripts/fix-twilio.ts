import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const devDomain = process.env.REPLIT_DEV_DOMAIN;
const publicDomain = process.env.EXPO_PUBLIC_DOMAIN;

const baseUrl = devDomain ? `https://${devDomain}` : (publicDomain ? `https://${publicDomain}` : null);

if (!accountSid || !authToken || !baseUrl) {
  console.error('Missing environment variables or domain');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function fixNumber() {
  try {
    const numbers = await client.incomingPhoneNumbers.list({ phoneNumber: '+12207990010' });
    if (numbers.length === 0) {
      console.log('Number not found in Twilio account');
      return;
    }

    const number = numbers[0];
    console.log(`Current Voice URL: ${number.voiceUrl}`);
    
    const targetVoiceUrl = `${baseUrl}/api/webhooks/voice`;
    const targetSmsUrl = `${baseUrl}/api/webhooks/sms`;

    if (number.voiceUrl !== targetVoiceUrl || number.smsUrl !== targetSmsUrl) {
      console.log(`Updating URLs to: ${targetVoiceUrl}`);
      await client.incomingPhoneNumbers(number.sid).update({
        voiceUrl: targetVoiceUrl,
        voiceMethod: 'POST',
        smsUrl: targetSmsUrl,
        smsMethod: 'POST'
      });
      console.log('Successfully updated Twilio webhooks');
    } else {
      console.log('Webhooks are already correctly configured');
    }
  } catch (error) {
    console.error('Error fixing number:', error);
  }
}

fixNumber();
