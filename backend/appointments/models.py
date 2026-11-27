from django.db import models

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from core.models import UUIDTimeStampedModel


class Appointment(UUIDTimeStampedModel):
    class Purpose(models.TextChoices):
        VISIT = "visita", "Visita"
        LISTING = "captacion", "Captación"
        CLOSING = "cierre", "Cierre"
        OTHER = "otro", "Otro"

    class Status(models.TextChoices):
        SCHEDULED = "programada", "Programada"
        CONFIRMED = "confirmada", "Confirmada"
        COMPLETED = "completada", "Completada"
        CANCELLED = "cancelada", "Cancelada"
        NO_SHOW = "no_asistio", "No asistió"

    contact = models.ForeignKey("contacts.Contact", on_delete=models.PROTECT, related_name="appointments")
    property = models.ForeignKey("properties.Property", on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments")
    advisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="appointments")
    source = models.ForeignKey("organizations.LeadSource", on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments")
    purpose = models.CharField(max_length=15, choices=Purpose.choices, default=Purpose.VISIT)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SCHEDULED)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    result = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_appointments")

    class Meta:
        ordering = ("starts_at",)
        indexes = [models.Index(fields=("advisor", "starts_at")), models.Index(fields=("status", "starts_at"))]

    def clean(self):
        if self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError({"ends_at": "Debe ser posterior al inicio."})
        if self.status == self.Status.COMPLETED and not self.result.strip():
            raise ValidationError({"result": "Completar una cita exige registrar un resultado."})
