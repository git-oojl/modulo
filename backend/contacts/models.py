from django.db import models

from django.conf import settings
from django.db import models

from core.models import UUIDTimeStampedModel


class Contact(UUIDTimeStampedModel):
    class Status(models.TextChoices):
        PROSPECT = "prospecto", "Prospecto"
        ACTIVE_CLIENT = "cliente_activo", "Cliente activo"
        CLOSED_CLIENT = "cliente_cerrado", "Cliente cerrado"
        LOST = "perdido", "Perdido"
        INACTIVE = "inactivo", "Inactivo"

    name = models.CharField(max_length=180)
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True)
    advisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="contacts", null=True, blank=True)
    source = models.ForeignKey("organizations.LeadSource", on_delete=models.SET_NULL, related_name="contacts", null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROSPECT)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [models.Index(fields=("advisor", "status")), models.Index(fields=("name",))]

    def __str__(self):
        return self.name


class PropertyInterest(UUIDTimeStampedModel):
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="interests")
    property = models.ForeignKey("properties.Property", on_delete=models.CASCADE, related_name="interested_contacts")
    note = models.TextField(blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("contact", "property"), name="unique_contact_property_interest")]


class ContactActivity(UUIDTimeStampedModel):
    class Type(models.TextChoices):
        NOTE = "nota", "Nota"
        CALL = "llamada", "Llamada"
        EMAIL = "correo", "Correo"
        STATUS_CHANGE = "cambio_estado", "Cambio de estado"
        APPOINTMENT = "cita", "Cita"
        OTHER = "otro", "Otro"

    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="activities")
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.NOTE)
    content = models.TextField()
    occurred_at = models.DateTimeField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_contact_activities")

    class Meta:
        ordering = ("-occurred_at", "-created_at")


class FollowUp(UUIDTimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pendiente", "Pendiente"
        COMPLETED = "completado", "Completado"

    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name="follow_ups")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="follow_ups")
    due_at = models.DateTimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    note = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="completed_follow_ups")

    class Meta:
        ordering = ("status", "due_at")
        indexes = [models.Index(fields=("assigned_to", "status", "due_at"))]
