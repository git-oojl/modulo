from django.db import models

import uuid

from django.db import models


class UUIDTimeStampedModel(models.Model):
    """Base for externally-addressable operational records."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
