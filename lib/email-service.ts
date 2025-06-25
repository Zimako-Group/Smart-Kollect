import { EmailAttachment } from './redux/features/email/emailSlice';

/**
 * Converts a File object to a base64 string for SendGrid attachment
 */
export const fileToBase64 = (file: File): Promise<string> => {
  console.log('Converting file to base64:', file.name, file.type, file.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        console.log('File converted to base64 successfully:', file.name);
        resolve(base64);
      } else {
        console.error('Failed to convert file to base64:', file.name);
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => {
      console.error('Error in FileReader:', error);
      reject(error);
    };
  });
};

/**
 * Prepares email data for sending via API
 */
export const prepareEmailData = async (
  recipientEmail: string,
  recipientName: string,
  subject: string,
  message: string,
  ccEmails: string[] = [],
  attachments: EmailAttachment[] = [],
  accountNumber: string = 'N/A'
) => {
  console.log('=== PREPARING EMAIL DATA ===');
  console.log('Recipient:', recipientEmail, recipientName);
  console.log('Subject:', subject);
  console.log('CC Emails:', ccEmails);
  console.log('Account Number:', accountNumber);
  console.log('Attachments count:', attachments.length);
  
  if (attachments.length > 0) {
    console.log('Attachment details:', attachments.map(a => ({ name: a.name, type: a.type, size: a.size })));
  }
  
  // Process attachments if they exist
  const processedAttachments = await Promise.all(
    attachments.map(async (attachment, index) => {
      console.log(`Processing attachment ${index + 1}/${attachments.length}: ${attachment.name}`);
      if (attachment.content) {
        try {
          const base64Content = await fileToBase64(attachment.content);
          console.log(`Successfully processed attachment: ${attachment.name}`);
          return {
            name: attachment.name,
            type: attachment.type,
            content: base64Content,
            disposition: 'attachment'
          };
        } catch (error) {
          console.error(`Error processing attachment ${attachment.name}:`, error);
          return null;
        }
      }
      console.warn(`Attachment ${attachment.name} has no content`);
      return null;
    })
  );

  // Filter out null attachments
  const validAttachments = processedAttachments.filter(Boolean);
  console.log(`Valid attachments: ${validAttachments.length} of ${attachments.length}`);

  const emailData = {
    to: recipientEmail,
    recipientName,
    subject,
    message,
    cc: ccEmails.length > 0 ? ccEmails : undefined,
    attachments: validAttachments.length > 0 ? validAttachments : undefined,
    accountNumber
  };
  
  console.log('Email data prepared successfully');
  return emailData;
};

/**
 * Sends an email using the API
 */
export const sendEmailApi = async (emailData: any) => {
  console.log('=== SENDING EMAIL VIA API ===');
  console.log('Email data being sent:', { 
    to: emailData.to,
    subject: emailData.subject,
    cc: emailData.cc,
    hasAttachments: !!emailData.attachments,
    attachmentCount: emailData.attachments ? emailData.attachments.length : 0
  });
  
  try {
    console.log('Making API request to /api/email/send...');
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    console.log('API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('Email API returned error status:', response.status);
      let errorData;
      try {
        errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
        errorData = { error: 'Unknown error occurred' };
      }
      throw new Error(errorData.error || `Failed to send email: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('Email sent successfully. Response:', responseData);
    return responseData;
  } catch (error) {
    console.error('Exception during email sending:', error);
    throw error;
  }
};
