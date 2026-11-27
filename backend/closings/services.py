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


@transaction.atomic
def correct_closing(*, closing, data):
    """Correct a current closing without permitting a hidden inventory state change."""
    closing = Closing.objects.select_for_update().select_related("property").get(pk=closing.pk)
    if closing.status != Closing.Status.CURRENT:
        raise ValueError("Un cierre anulado no puede corregirse.")
    commission_data = data.pop("commission", None)
    target_property = data.get("property", closing.property)
    target_property = Property.objects.select_for_update().get(pk=target_property.pk)
    if data.get("operation", closing.operation) != target_property.operation:
        raise ValueError("La operación del cierre debe coincidir con la propiedad.")
    if target_property.pk != closing.property_id and target_property.status == Property.Status.CLOSED:
        raise ValueError("La propiedad seleccionada ya está cerrada.")
    for field, value in data.items():
        setattr(closing, field, value)
    closing.full_clean()
    closing.save()
    target_property.status = Property.Status.CLOSED
    target_property.is_public = False
    target_property.save(update_fields=("status", "is_public", "updated_at"))
    if commission_data is not None:
        commission = closing.commission
        for field, value in commission_data.items():
            setattr(commission, field, value)
        commission.save()
    elif closing.commission.percentage is not None:
        # Recalculate when correcting the negotiated closing amount.
        closing.commission.save()
    return closing
