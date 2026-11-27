from django.db import transaction
from django.utils import timezone

from properties.models import Property

from .models import Closing, CommissionEstimate


@transaction.atomic
def register_closing(*, data, actor):
    """Create one valid closing and withdraw its property from the catalogue atomically."""
    property = Property.objects.select_for_update().get(pk=data["property"].pk)
    if property.operation != data["operation"]:
        raise ValueError("La operación del cierre debe coincidir con la propiedad.")
    if property.status == Property.Status.CLOSED:
        raise ValueError("La propiedad ya está cerrada.")
    commission_data = data.pop("commission", {})
    closing = Closing.objects.create(**data)
    CommissionEstimate.objects.create(closing=closing, **commission_data)
    property.status = Property.Status.CLOSED
    property.is_public = False
    property.save(update_fields=("status", "is_public", "updated_at"))
    return closing


@transaction.atomic
def void_closing(*, closing, actor):
    closing = Closing.objects.select_for_update().get(pk=closing.pk)
    if closing.status == Closing.Status.VOID:
        return closing
    closing.status = Closing.Status.VOID
    closing.voided_at = timezone.now()
    closing.voided_by = actor
    closing.save(update_fields=("status", "voided_at", "voided_by", "updated_at"))
    # Deliberately do not reactivate a property or its publication.
    return closing
