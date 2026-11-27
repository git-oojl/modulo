import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADVISOR = "asesor", "Asesor"
        MANAGER = "gerencia", "Gerencia"
        ADMIN = "administrador", "Administrador"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADVISOR)

    @property
    def display_name(self):
        return self.get_full_name().strip() or self.username


class AdvisorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="advisor_profile")
    phone = models.CharField(max_length=32, blank=True)
    license_number = models.CharField(max_length=80, blank=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.user.display_name


class AccessRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pendiente", "Pendiente"
        APPROVED = "aprobada", "Aprobada"
        REJECTED = "rechazada", "Rechazada"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    name = models.CharField(max_length=180)
    email = models.EmailField()
    phone = models.CharField(max_length=32)
    requested_role = models.CharField(max_length=20, choices=User.Role.choices, default=User.Role.ADVISOR)
    comments = models.TextField(blank=True)
    privacy_accepted = models.BooleanField(default=False)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_access_requests")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} <{self.email}>"

# Create your models here.
