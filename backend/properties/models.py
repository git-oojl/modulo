from django.db import models

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from core.models import UUIDTimeStampedModel


class Property(UUIDTimeStampedModel):
    class Operation(models.TextChoices):
        SALE = "venta", "Venta"
        RENT = "renta", "Renta"

    class Status(models.TextChoices):
        DRAFT = "borrador", "Borrador"
        ACTIVE = "activa", "Activa"
        RESERVED = "reservada", "Reservada"
        CLOSED = "cerrada", "Cerrada"
        ARCHIVED = "archivada", "Archivada"

    class Type(models.TextChoices):
        HOUSE = "casa", "Casa"
        APARTMENT = "departamento", "Departamento"
        LAND = "terreno", "Terreno"
        OFFICE = "oficina", "Oficina"
        COMMERCIAL = "comercial", "Local comercial"
        OTHER = "otro", "Otro"

    title = models.CharField(max_length=220)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=Type.choices)
    operation = models.CharField(max_length=10, choices=Operation.choices)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    price = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default="MXN")
    country = models.CharField(max_length=80, default="México")
    state = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100)
    neighborhood = models.CharField(max_length=120, blank=True)
    address = models.CharField(max_length=255, blank=True)
    public_location = models.CharField(max_length=180, blank=True)
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    parking_spaces = models.PositiveSmallIntegerField(null=True, blank=True)
    area_m2 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    land_area_m2 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    features = models.JSONField(default=list, blank=True)
    advisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="properties", null=True, blank=True)
    is_public = models.BooleanField(default=False)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [models.Index(fields=("status", "operation")), models.Index(fields=("advisor", "status"))]

    @property
    def is_publicly_visible(self):
        return self.status == self.Status.ACTIVE and self.is_public

    def __str__(self):
        return self.title


class PropertyMedia(UUIDTimeStampedModel):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to="properties/%Y/%m/")
    alt_text = models.CharField(max_length=180, blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_cover = models.BooleanField(default=False)

    class Meta:
        ordering = ("sort_order", "created_at")

    def __str__(self):
        return f"{self.property}: {self.file.name}"
