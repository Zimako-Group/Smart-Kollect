import { NextResponse } from "next/server";
import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('SENDGRID_API_KEY is not set');
}

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { 
      to, 
      cc, 
      subject, 
      message, 
      attachments,
      accountNumber
    } = body;

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    let userId = '00000000-0000-0000-0000-000000000000'; // Default to system user
    let userEmail = process.env.DEFAULT_FROM_EMAIL || 'noreply@zimako.co.za';
    let userName = 'Zimako Collections';
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        userId = user.id;
        
        // Get user profile for email details
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          userEmail = profile.email || userEmail;
          userName = profile.full_name || userName;
        }
      }
    } catch (error) {
      console.error('Error getting user:', error);
      // Continue with system user
    }

    // Prepare email data
    const msg: MailDataRequired = {
      to,
      from: {
        email: userEmail,
        name: userName
      },
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    };

    // Add CC recipients if provided
    if (cc && cc.length > 0) {
      msg.cc = cc;
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      // Attachments should already be base64 encoded from the client
      msg.attachments = attachments.map((attachment: any) => ({
        content: attachment.content,
        filename: attachment.name,
        type: attachment.type,
        disposition: 'attachment'
      }));
    }

    // Send the email
    await sgMail.send(msg);

    // Record the email in the database
    const { error: dbError } = await supabase
      .from('EmailHistory')
      .insert({
        recipient_email: to,
        recipient_name: body.recipientName || '',
        subject,
        message,
        sender_id: userId,
        account_number: accountNumber || null,
        cc_emails: cc || [],
        attachment_count: attachments?.length || 0,
        status: 'sent'
      });

    if (dbError) {
      console.error('Error recording email in database:', dbError);
      // Continue anyway - sending was successful
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Handle SendGrid specific errors
    if (error.response) {
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: error.response.body 
        },
        { status: error.code || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send email', message: error.message },
      { status: 500 }
    );
  }
}
