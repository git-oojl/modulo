from django.db import transaction
from django.utils import timezone

from contacts.models import ContactActivity, FollowUp

from .models import Appointment


@transaction.atomic
def complete_appointment(*, appointment, result, actor, next_follow_up_at=None, follow_up_note=""):
    """Complete a visit and keep both its result and any follow-up in CRM history."""
    appointment = Appointment.objects.select_for_update().get(pk=appointment.pk)
    appointment.status = Appointment.Status.COMPLETED
    appointment.result = result
    appointment.full_clean()
    appointment.save(update_fields=("status", "result", "updated_at"))
    ContactActivity.objects.create(contact=appointment.contact, type=ContactActivity.Type.APPOINTMENT, content=result, occurred_at=timezone.now(), created_by=actor)
    if next_follow_up_at:
        FollowUp.objects.create(contact=appointment.contact, assigned_to=appointment.advisor, due_at=next_follow_up_at, note=follow_up_note)
    return appointment
