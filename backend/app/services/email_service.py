import logging
import resend
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger("uvicorn")

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY
    logger.info("Resend email service configured.")
else:
    logger.warning("Resend API key not set in environment. Email service running in dry-run/logging mode.")

async def send_email_notification(
    subject: str,
    html_content: str,
    to_email: Optional[str] = None
) -> bool:
    """Send an email notification via Resend API."""
    recipient = to_email or settings.OWNER_EMAIL
    
    if not settings.RESEND_API_KEY:
        logger.info(f"[EMAIL DRY RUN] To: {recipient} | Subject: {subject}")
        return True
    
    try:
        params: resend.Emails.SendParams = {
            "from": f"Deccan Space Works <{settings.SENDER_EMAIL}>",
            "to": [recipient],
            "subject": subject,
            "html": html_content
        }
        res = resend.Emails.send(params)
        logger.info(f"Email sent successfully: ID {res.get('id', 'ok')} to {recipient}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")
        return False

async def send_new_site_visit_email(site_visit_data: dict, image_urls: List[str] = []):
    """Notify business owner of new Free Site Visit request."""
    images_html = "".join([f'<li><a href="{url}" target="_blank">{url}</a></li>' for url in image_urls])
    if not images_html:
        images_html = "<li>No images attached</li>"
        
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #06b6d4; margin-bottom: 8px;">NEW SITE VISIT REQUEST — Deccan Space Works</h2>
        <p style="color: #64748b; font-size: 14px;">A new measurement & site consultation request has been submitted.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Customer Name:</strong></td><td style="color: #0f172a;">{site_visit_data.get('name')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Phone Number:</strong></td><td style="color: #0f172a;"><a href="tel:{site_visit_data.get('phoneNumber')}">{site_visit_data.get('phoneNumber')}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>WhatsApp:</strong></td><td style="color: #0f172a;">{site_visit_data.get('whatsappNumber') or 'Same as phone'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td><td style="color: #0f172a;">{site_visit_data.get('email') or 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Location / Area:</strong></td><td style="color: #0f172a;">{site_visit_data.get('cityArea')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Property Type:</strong></td><td style="color: #0f172a;">{site_visit_data.get('propertyType')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Preferred Date:</strong></td><td style="color: #0f172a;">{site_visit_data.get('preferredVisitDate') or 'Earliest Available'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Preferred Time:</strong></td><td style="color: #0f172a;">{site_visit_data.get('preferredTime')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Requirement:</strong></td><td style="color: #0f172a;">{site_visit_data.get('requirementDetails') or 'Standard site evaluation'}</td></tr>
        </table>
        <h4 style="margin-top: 20px; color: #0f172a;">Uploaded Site Images:</h4>
        <ul>{images_html}</ul>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <p style="font-size: 12px; color: #94a3b8;">This is an automated notification from your Deccan Space Works Management Console.</p>
    </div>
    """
    await send_email_notification("New Free Site Visit Request: " + site_visit_data.get("name", "Customer"), html)

async def send_new_contact_email(contact_data: dict):
    """Notify business owner of new contact enquiry."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #06b6d4; margin-bottom: 8px;">NEW CONTACT ENQUIRY — Deccan Space Works</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Name:</strong></td><td style="color: #0f172a;">{contact_data.get('name')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Phone:</strong></td><td style="color: #0f172a;"><a href="tel:{contact_data.get('phone')}">{contact_data.get('phone')}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td><td style="color: #0f172a;">{contact_data.get('email')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Service:</strong></td><td style="color: #0f172a;">{contact_data.get('service') or 'General Enquiry'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>City:</strong></td><td style="color: #0f172a;">{contact_data.get('city') or 'Hyderabad'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;"><strong>Message:</strong></td><td style="color: #0f172a;">{contact_data.get('message')}</td></tr>
        </table>
    </div>
    """
    await send_email_notification("New Contact Enquiry: " + contact_data.get("name", "Customer"), html)

async def send_new_review_email(review_data: dict):
    """Notify business owner of new review submitted for approval."""
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #06b6d4; margin-bottom: 8px;">NEW CUSTOMER REVIEW SUBMITTED</h2>
        <p style="color: #64748b; font-size: 14px;">A new customer review requires admin approval in the portal.</p>
        <p><strong>Customer:</strong> {review_data.get('name')} ({review_data.get('city')})</p>
        <p><strong>Rating:</strong> {'★' * int(review_data.get('rating', 5))}</p>
        <blockquote style="font-style: italic; background: #f8fafc; padding: 12px; border-left: 4px solid #06b6d4;">"{review_data.get('review')}"</blockquote>
    </div>
    """
    await send_email_notification(f"New Review Pending Approval ({review_data.get('rating')} Stars)", html)
