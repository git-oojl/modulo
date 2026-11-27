from tempfile import TemporaryDirectory

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User
from closings.models import Closing
from contacts.models import Contact, ContactActivity
from properties.models import Property, PropertyMedia


class DemoSeedTests(TestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.settings_override = self.settings(MEDIA_ROOT=self.media_directory.name)
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.addCleanup(self.media_directory.cleanup)

    def test_seed_es_variada_e_idempotente(self):
        call_command("seed_demo", verbosity=0)
        call_command("seed_demo", verbosity=0)

        self.assertEqual(Property.objects.count(), 12)
        self.assertEqual(Contact.objects.count(), 12)
        self.assertEqual(PropertyMedia.objects.filter(is_cover=True).count(), 12)
        self.assertEqual(Closing.objects.count(), 2)
        self.assertEqual(Closing.objects.filter(status=Closing.Status.CURRENT).count(), 1)
        self.assertEqual(Property.objects.filter(status=Property.Status.CLOSED).count(), 2)


class DashboardScopeTests(TestCase):
    def test_asesor_recibe_dashboard_sin_filtrar_actividad_por_campo_inexistente(self):
        advisor = User.objects.create_user(username="asesor", role=User.Role.ADVISOR)
        contact = Contact.objects.create(name="Contacto", phone="5550000000", advisor=advisor)
        ContactActivity.objects.create(contact=contact, content="Nota", occurred_at=timezone.now(), created_by=advisor)
        client = APIClient()
        client.force_authenticate(advisor)

        response = client.get("/api/v1/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["recent_activity"][0]["contact"], "Contacto")
