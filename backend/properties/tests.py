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
