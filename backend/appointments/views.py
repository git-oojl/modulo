from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import is_manager, scoped_appointment_queryset

from .models import Appointment
from .serializers import AppointmentSerializer, CompleteAppointmentSerializer
from .services import complete_appointment


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    lookup_field = "id"

    def get_queryset(self):
        queryset = scoped_appointment_queryset(Appointment.objects.select_related("contact", "property", "advisor", "source"), self.request.user)
        for key in ("status", "purpose", "source"):
            if value := self.request.query_params.get(key):
                queryset = queryset.filter(**{key: value})
        if value := self.request.query_params.get("advisor"):
            queryset = queryset.filter(advisor__public_id=value)
        if date_from := self.request.query_params.get("from"):
            queryset = queryset.filter(starts_at__date__gte=date_from)
        if date_to := self.request.query_params.get("to"):
            queryset = queryset.filter(starts_at__date__lte=date_to)
        return queryset

    def perform_create(self, serializer):
        contact = serializer.validated_data["contact"]
        if not is_manager(self.request.user) and contact.advisor_id != self.request.user.id:
            self.permission_denied(self.request)
        serializer.save(advisor=serializer.validated_data.get("advisor") if is_manager(self.request.user) else self.request.user, created_by=self.request.user)

    def perform_update(self, serializer):
        if not is_manager(self.request.user) and self.get_object().advisor_id != self.request.user.id:
            self.permission_denied(self.request)
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        appointment = self.get_object()
        if not is_manager(request.user) and appointment.advisor_id != request.user.id:
            self.permission_denied(request)
        appointment.status = Appointment.Status.CANCELLED
        appointment.save(update_fields=("status", "updated_at"))
        return Response(status=204)

    @action(detail=True, methods=["post"])
    def complete(self, request, id=None):
        appointment = self.get_object()
        serializer = CompleteAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = complete_appointment(appointment=appointment, actor=request.user, **serializer.validated_data)
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=["get"])
    def ics(self, request, id=None):
        appointment = self.get_object()
        end = appointment.ends_at or appointment.starts_at + timedelta(hours=1)
        def stamp(value):
            return value.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        summary = f"Modulo: {appointment.purpose} — {appointment.contact.name}".replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;")
        lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Modulo//ES", "BEGIN:VEVENT", f"UID:{appointment.id}@modulo", f"DTSTAMP:{stamp(timezone.now())}", f"DTSTART:{stamp(appointment.starts_at)}", f"DTEND:{stamp(end)}", f"SUMMARY:{summary}", "END:VEVENT", "END:VCALENDAR", ""]
        response = Response("\r\n".join(lines), content_type="text/calendar")
        response["Content-Disposition"] = f'attachment; filename="cita-{appointment.id}.ics"'
        return response
