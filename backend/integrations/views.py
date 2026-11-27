from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from appointments.models import Appointment
from contacts.models import Contact
from core.permissions import scoped_appointment_queryset, scoped_contact_queryset, scoped_property_queryset
from properties.models import Property

from .services import csv_response


class ExportView(APIView):
    """Authorized CSV export; no external vendor owns the primary records."""

    def get(self, request, resource):
        if resource == "contacts":
            queryset = scoped_contact_queryset(Contact.objects.select_related("advisor", "source"), request.user)
            return csv_response(filename="contactos.csv", headers=("UUID", "Nombre", "Teléfono", "Correo", "Asesor", "Fuente", "Estado", "Creado"), rows=((item.id, item.name, item.phone, item.email, item.advisor.display_name if item.advisor else "", item.source.name if item.source else "", item.status, item.created_at.isoformat()) for item in queryset))
        if resource == "properties":
            queryset = scoped_property_queryset(Property.objects.select_related("advisor"), request.user)
            return csv_response(filename="propiedades.csv", headers=("UUID", "Título", "Tipo", "Operación", "Precio", "Moneda", "Estado", "Ciudad", "Asesor", "Pública"), rows=((item.id, item.title, item.type, item.operation, item.price, item.currency, item.status, item.city, item.advisor.display_name if item.advisor else "", item.is_public) for item in queryset))
        if resource == "appointments":
            queryset = scoped_appointment_queryset(Appointment.objects.select_related("contact", "property", "advisor"), request.user)
            return csv_response(filename="citas.csv", headers=("UUID", "Inicio", "Contacto", "Propiedad", "Asesor", "Propósito", "Estado", "Resultado"), rows=((item.id, item.starts_at.isoformat(), item.contact.name, item.property.title if item.property else "", item.advisor.display_name, item.purpose, item.status, item.result) for item in queryset))
        raise NotFound("No existe ese recurso exportable.")
