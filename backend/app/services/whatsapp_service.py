import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("uvicorn")

async def send_whatsapp_template_message(
    template_name: str,
    recipient_phone: Optional[str] = None,
    parameters: Optional[list] = None
) -> bool:
    """
    Send official WhatsApp notification via Meta WhatsApp Cloud API.
    If WhatsApp is not configured in environment variables, log and continue smoothly.
    """
    if not (settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID):
        logger.info("[WHATSAPP] Credentials not configured. Skipping WhatsApp notification.")
        return True

    recipient = recipient_phone or settings.WHATSAPP_RECIPIENT_NUMBER
    # Clean phone number (e.g. 919100720137)
    clean_number = "".join(filter(str.isdigit, recipient))

    endpoint = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": clean_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": parameters or []
                }
            ]
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(endpoint, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                logger.info(f"WhatsApp notification sent successfully to {clean_number}")
                return True
            else:
                logger.warning(f"WhatsApp API response status {response.status_code}: {response.text}")
                return False
    except Exception as e:
        logger.error(f"WhatsApp notification dispatch error: {e}")
        return False

async def notify_site_visit_whatsapp(customer_name: str, phone: str, location: str):
    """Notify business owner of new site visit request on WhatsApp."""
    params = [
        {"type": "text", "text": customer_name},
        {"type": "text", "text": phone},
        {"type": "text", "text": location}
    ]
    # Uses official pre-approved Meta WhatsApp template name e.g. 'new_lead_alert'
    await send_whatsapp_template_message("new_lead_alert", parameters=params)
