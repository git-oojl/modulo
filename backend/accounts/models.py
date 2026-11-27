import uuid

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

# Create your models here.
