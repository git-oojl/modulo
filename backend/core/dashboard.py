from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from closings.models import Closing
from contacts.models import ContactActivity, FollowUp
from properties.models import Property

from .permissions import scoped_appointment_queryset, scoped_closing_queryset, scoped_contact_queryset, scoped_property_queryset


class DashboardView(APIView):
    """Role-scoped operational snapshot, intentionally not a BI product."""

    def get(self, request):
        now = timezone.now()
        end = now + timedelta(days=min(max(int(request.query_params.get("days", 14)), 1), 90))
        appointments = scoped_appointment_queryset(Appointment.objects.select_related("contact", "property", "advisor"), request.user)
        contacts = scoped_contact_queryset(ContactActivity.objects.select_related("contact", "created_by"), request.user)
        follow_ups = FollowUp.objects.select_related("contact", "assigned_to")
        if not (request.user.is_superuser or request.user.role in {"gerencia", "administrador"}):
            follow_ups = follow_ups.filter(assigned_to=request.user)
        properties = scoped_property_queryset(Property.objects.all(), request.user)
        closings = scoped_closing_queryset(Closing.objects.all(), request.user)
        if date_from := request.query_params.get("from"):
            closings = closings.filter(closed_on__gte=date_from)
        if date_to := request.query_params.get("to"):
            closings = closings.filter(closed_on__lte=date_to)
        return Response({
            "upcoming_appointments": [{"id": str(item.id), "starts_at": item.starts_at, "contact": item.contact.name, "property": item.property.title if item.property else None, "status": item.status} for item in appointments.filter(starts_at__gte=now, starts_at__lte=end).order_by("starts_at")[:10]],
            "pending_follow_ups": [{"id": str(item.id), "due_at": item.due_at, "contact": item.contact.name, "assigned_to": item.assigned_to.display_name, "note": item.note} for item in follow_ups.filter(status=FollowUp.Status.PENDING).order_by("due_at")[:10]],
            "properties_by_status": list(properties.values("status").annotate(count=Count("id")).order_by("status")),
            "recent_activity": [{"id": str(item.id), "contact": item.contact.name, "type": item.type, "content": item.content, "occurred_at": item.occurred_at} for item in contacts.order_by("-occurred_at")[:10]],
            "closings": {"count": closings.filter(status=Closing.Status.CURRENT).count(), "amount": closings.filter(status=Closing.Status.CURRENT).aggregate(value=Sum("amount"))["value"] or Decimal("0.00")},
        })
