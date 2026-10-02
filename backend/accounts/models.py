from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Base user kept custom from the first migration for future agent profiles."""

    pass

# Create your models here.
