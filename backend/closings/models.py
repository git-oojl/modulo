from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from core.models import UUIDTimeStampedModel


class Closing(UUIDTimeStampedModel):
    class Status(models.TextChoices):
        CURRENT = "vigente", "Vigente"
        VOID = "anulado", "Anulado"

    property = models.ForeignKey("properties.Property", on_delete=models.PROTECT, related_name="closings")
    contact = models.ForeignKey("contacts.Contact", on_delete=models.PROTECT, related_name="closings")
    advisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="closings")
    operation = models.CharField(max_length=10, choices=(("venta", "Venta"), ("renta", "Renta")))
    closed_on = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="MXN")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.CURRENT)
    notes = models.TextField(blank=True)
    voided_at = models.DateTimeField(null=True, blank=True)
    voided_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="voided_closings")

    class Meta:
        ordering = ("-closed_on", "-created_at")
        indexes = [models.Index(fields=("advisor", "closed_on")), models.Index(fields=("status", "closed_on"))]


class CommissionEstimate(UUIDTimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pendiente", "Pendiente"
        REPORTED_PAID = "reportada_pagada", "Reportada/pagada"

    closing = models.OneToOneField(Closing, on_delete=models.CASCADE, related_name="commission")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(100)])
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    def save(self, *args, **kwargs):
        if self.percentage is None:
            self.amount = None
        else:
            self.amount = (self.closing.amount * self.percentage / 100).quantize(self.closing.amount)
        super().save(*args, **kwargs)
