from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import AdvisorProfile, User
from appointments.models import Appointment
from contacts.models import Contact, FollowUp, PropertyInterest
from organizations.models import LeadSource, Organization
from properties.models import Property


class Command(BaseCommand):
    help = "Crea datos sintéticos mínimos para recorrer Modulo en desarrollo local."

    def handle(self, *args, **options):
        organization, _ = Organization.objects.get_or_create(
            name="Inmobiliaria Modulo",
            defaults={"legal_name": "Inmobiliaria Modulo", "public_catalogue_enabled": True},
        )
        sources = {}
        for order, name in enumerate(("guardia", "contacto_personal", "sitio_web", "recomendacion", "redes_sociales", "portales")):
            sources[name], _ = LeadSource.objects.get_or_create(name=name, defaults={"sort_order": order})
        manager, created = User.objects.get_or_create(username="gerencia.demo", defaults={"first_name": "María", "last_name": "Gerente", "email": "gerencia@example.test", "role": User.Role.MANAGER, "is_staff": True})
        if created:
            manager.set_password("DemoPassword123!")
            manager.save()
        advisor, created = User.objects.get_or_create(username="asesor.demo", defaults={"first_name": "Luis", "last_name": "Asesor", "email": "asesor@example.test", "role": User.Role.ADVISOR})
        if created:
            advisor.set_password("DemoPassword123!")
            advisor.save()
        AdvisorProfile.objects.get_or_create(user=advisor, defaults={"phone": "+52 664 000 0000"})
        property, _ = Property.objects.get_or_create(
            title="Casa demo en zona céntrica",
            defaults={"type": Property.Type.HOUSE, "operation": Property.Operation.SALE, "status": Property.Status.ACTIVE, "price": Decimal("3250000.00"), "city": "Tijuana", "neighborhood": "Centro", "public_location": "Centro, Tijuana", "bedrooms": 3, "bathrooms": 2, "area_m2": Decimal("145"), "advisor": advisor, "is_public": True},
        )
        contact, _ = Contact.objects.get_or_create(name="Andrea Prospecto", phone="+52 664 000 0001", defaults={"email": "andrea@example.test", "advisor": advisor, "source": sources["sitio_web"]})
        PropertyInterest.objects.get_or_create(contact=contact, property=property)
        Appointment.objects.get_or_create(contact=contact, property=property, advisor=advisor, starts_at=timezone.now() + timedelta(days=1), defaults={"purpose": Appointment.Purpose.VISIT, "source": sources["sitio_web"], "created_by": manager})
        FollowUp.objects.get_or_create(contact=contact, assigned_to=advisor, due_at=timezone.now() + timedelta(days=2), defaults={"note": "Confirmar visita."})
        self.stdout.write(self.style.SUCCESS(f"Datos demo preparados para {organization.name}. Usuarios: gerencia.demo y asesor.demo."))
