from django.db import models

from django.core.exceptions import ValidationError
from django.db import models

from core.models import UUIDTimeStampedModel


class Organization(UUIDTimeStampedModel):
    """Modulo currently has one organization; keeping it explicit preserves portability."""

    name = models.CharField(max_length=180)
    legal_name = models.CharField(max_length=180, blank=True)
    logo = models.ImageField(upload_to="organization/", blank=True)
    timezone = models.CharField(max_length=64, default="America/Mexico_City")
    default_language = models.CharField(max_length=12, default="es-MX")
    currency = models.CharField(max_length=3, default="MXN")
    public_catalogue_enabled = models.BooleanField(default=False)

    class Meta:
        verbose_name = "organización"
        verbose_name_plural = "organizaciones"

    def clean(self):
        if not self.pk and Organization.objects.exists():
            raise ValidationError("Modulo admite una sola organización inicial.")

    def __str__(self):
        return self.name


class LeadSource(UUIDTimeStampedModel):
    name = models.CharField(max_length=80, unique=True)
    active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("sort_order", "name")
        verbose_name = "fuente"
        verbose_name_plural = "fuentes"

    def __str__(self):
        return self.name
