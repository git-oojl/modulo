from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from organizations.models import Organization

from .models import Property


class PublicCatalogueTests(TestCase):
    def setUp(self):
        Organization.objects.create(name="Modulo", public_catalogue_enabled=True)
        self.advisor = User.objects.create_user(username="asesor", role=User.Role.ADVISOR)
        self.property = Property.objects.create(title="Casa visible", type=Property.Type.HOUSE, operation=Property.Operation.SALE, status=Property.Status.ACTIVE, price=Decimal("1200000"), city="Tijuana", address="Privada 123", public_location="Centro, Tijuana", advisor=self.advisor, is_public=True)

    def test_catalogo_no_expone_direccion_ni_asesor(self):
        response = APIClient().get("/api/v1/public/properties/")

        self.assertEqual(response.status_code, 200)
        data = response.json()["results"][0]
        self.assertEqual(data["public_location"], "Centro, Tijuana")
        self.assertNotIn("address", data)
        self.assertNotIn("advisor", data)

    def test_consulta_publica_crea_contacto_sin_asesor(self):
        response = APIClient().post("/api/v1/public/inquiries/", {"property": str(self.property.id), "name": "Interesada", "phone": "5550000001", "email": "interesada@example.test", "message": "Quiero conocerla.", "privacy_accepted": True}, format="json")

        self.assertEqual(response.status_code, 201)
        from contacts.models import Contact, PropertyInterest

        contact = Contact.objects.get(id=response.json()["id"])
        self.assertIsNone(contact.advisor)
        self.assertEqual(contact.source.name, "sitio_web")
        self.assertTrue(PropertyInterest.objects.filter(contact=contact, property=self.property).exists())

    def test_inventario_no_puede_cerrar_sin_registrar_cierre(self):
        manager = User.objects.create_user(username="gerencia", role=User.Role.MANAGER)
        client = APIClient()
        client.force_authenticate(manager)

        response = client.patch(f"/api/v1/properties/{self.property.id}/", {"status": "cerrada"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.property.refresh_from_db()
        self.assertEqual(self.property.status, Property.Status.ACTIVE)
